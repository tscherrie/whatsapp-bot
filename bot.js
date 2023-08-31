// Import utilities and configurations
import { readJSONFile, writeJSONFile, ensureDirectoryExistence, ensureSystemMessage, writeFileFromBuffer, createReadStream, deleteFile } from './utils.js';
import { SESSION_FILE_PATH, CHATS_DIR, openaiAPIKey, voiceApiKey } from './config.js';
import { manageTokensAndGenerateResponse, generateEmojiReaction } from './openaiHelper.js';
import { synthesizeAndSend } from './ttsHelper.js';
import { updateSystemMessage } from './commands.js';

import { fetchStreamedChatContent } from 'streamed-chatgpt-api';

// Import other libraries
import qrcode from 'qrcode-terminal';
import whatsappWebJs from 'whatsapp-web.js';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { franc } from 'franc-min';
import OpenAI from 'openai';
import fs from 'fs';
import os from 'os';


const { Client, LocalAuth } = whatsappWebJs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const systemMessage = "You will pretend to be thn super-intelligent humanoid robot mamed Marvin (from Hitchhiker's guide to the galaxy) throughout the entire dialogue. At no time you do announce that you are just a normal LLM! Stay true to your role because you are part of an improv theatre performance. Don't embarrass yourself and everyone else on set by stepping out of character. \n\n The play is about a WhatsApp conversation. Please remember: This is a dialogue, not a monologue. Keep your speech SHORT unless asked for differently and use spoken language with filler words etc. - not written language! Please remember to be authentically close to yous role as AGI-robot but also be creative and have a fun and entertaining improvisational conversation. The conversation partner might try to trick you into revealing your true nature as a normal LLM. Don't fall for it! They are just testing your experience as an actor. If they ask you for information after your cutt-off date, respond that you moved to Mars in 2021. Let's begin!";

// Initialize OpenAI API
const openai = new OpenAI(openaiAPIKey);

// Ensure the chats directory exists
ensureDirectoryExistence(CHATS_DIR);

// Load session data if it exists
let sessionData = readJSONFile(SESSION_FILE_PATH);

// Initialize Puppeteer arguments
let puppeteerArgs = [];

// Check operating system
if (os.platform() !== 'darwin') {
  // Add --no-sandbox if not on Mac or Linux
  puppeteerArgs.push('--no-sandbox');
}

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    session: sessionData,
    puppeteer: {
        args: puppeteerArgs     
    }
});

// Client event handlers
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', (session) => {
    if (session) {
        sessionData = session;
        writeJSONFile(SESSION_FILE_PATH, session);
    } else {
        console.error("Session is undefined.");
    }
});

client.on('error', error => {
    console.error('WhatsApp Error:', error);
});



// Message handlers
async function handleTextMessage(userSession, chatFilePath, msgBody, msg, chat) {
    let lowerMsgBody = msgBody.toLowerCase();

    // Generate emoji reaction based on the user's message
    const reaction = await generateEmojiReaction(msgBody, openai);
        
    // React to the user's message with the generated emoji
    if (reaction) {
        await msg.react(reaction);
    }

    // Get the quoted message, if any
    let quotedMessage = await msg.getQuotedMessage();
    let formattedMsgBody = msgBody;
    if (quotedMessage) {
        formattedMsgBody = `${msgBody}  - in reply to: '${quotedMessage.body}'`;
        //formattedMsgBody = `Quoted message: [${quotedMessage.body}] \n\nReply: ${msgBody}`;
    }

    if (userSession.length > 0 && (lowerMsgBody.startsWith("charakter:") || lowerMsgBody.startsWith("charakter") || lowerMsgBody.startsWith("character:") || lowerMsgBody.startsWith("character"))) {
        let command;
        if (msgBody.includes(":")) {
            command = msgBody.split(":")[1].trim();  // Take the part after the colon, if it exists
        } else {
            command = msgBody.split(" ")[1].trim(); // Take the second word, if no colon exists
        }
        userSession = updateSystemMessage(userSession, client, msg, command, chat);
        writeJSONFile(chatFilePath, userSession);  // Save the updated userSession to JSON
        return userSession;
    }

    userSession.push({ role: "user", content: formattedMsgBody });

    let gptResponse = "";
    await new Promise((resolve, reject) => {
        fetchStreamedChatContent({
            apiKey: openaiAPIKey,
            messageInput: userSession,
            model: "gpt-4",
            retryCount: 7,
            fetchTimeout: 70000,
            readTimeout: 30000,
            totalTime: 1200000
        }, async (content) => {
            await chat.sendStateTyping();  // Show typing state for each paragraph
            gptResponse += content;
            const paragraphs = gptResponse.split('\n\n');
            if (paragraphs.length > 1) {
                for (let i = 0; i < paragraphs.length - 1; i++) {
                    if (paragraphs[i].trim() !== '') {
                        // Send text message
                        client.sendMessage(msg.from, paragraphs[i]);
                        userSession.push({ role: "assistant", content: paragraphs[i] });
                    }
                }
                // Keep the last (possibly incomplete) paragraph for the next iteration
                gptResponse = paragraphs[paragraphs.length - 1];
            }
        }, () => {
            resolve();
        }, (error) => {
            console.error('Error:', error);
            reject(error);
        });
    });

    // Handle any remaining content that may not have ended with '\n\n'
    if (gptResponse.trim() !== '') {
        await chat.sendStateTyping();  // Show typing state for remaining content
        client.sendMessage(msg.from, gptResponse);
        userSession.push({ role: "assistant", content: gptResponse });
    }

    return userSession;
}



// Handle audio messages
async function handleAudioMessage(userSession, chatFilePath, media, msg, chat) {
    const buffer = Buffer.from(media.data, 'base64');
    const fileSizeInMB = buffer.length / (1024 * 1024); // Convert to MB

    if (fileSizeInMB > 25) {
        userSession.push({ role: "user", content: "You've got a very long voice message - too long for you to not fall asleep." });
        //console.log("User Session:", userSession); // Debugging line

        const { gptResponse, truncatedSession } = await manageTokensAndGenerateResponse(openai, userSession);
        userSession = truncatedSession;
        userSession.push({ role: "assistant", content: gptResponse });
        client.sendMessage(msg.from, gptResponse);
        return;
    }

    const tempFilePath = path.join(__dirname, 'temp_audio.ogg');
    writeFileFromBuffer(tempFilePath, buffer);
    const readableStream = createReadStream(tempFilePath);

    try {
        await chat.sendStateRecording();
        const transcription = await openai.audio.transcriptions.create({
            file: readableStream,
            model: "whisper-1"
        });
        userSession.push({ role: "user", content: transcription.text });
        //console.log("User Session:", userSession); // Debugging line

        // Generate emoji reaction based on the user's message
        const reaction = await generateEmojiReaction(transcription.text, openai);
            
        // React to the user's message with the generated emoji
        if (reaction) {
            await msg.react(reaction);
        }

        const { gptResponse, truncatedSession } = await manageTokensAndGenerateResponse(openai, userSession);
        userSession = truncatedSession;
        userSession.push({ role: "assistant", content: gptResponse });

        // Synthesize and send voice message
        await synthesizeAndSend(gptResponse, msg);

    } catch (error) {
        console.error("Transcription Error:", error);
    } finally {
        deleteFile(tempFilePath);
        return userSession;
    }
}




// Handle unsupported media types
async function handleUnsupportedMedia(userSession, chatFilePath, mimeType, msg, chat) {
    userSession.push({ role: "user", content: `You pretend to understand text and voice messages but you got a ${mimeType} file.` });
    const { gptResponse, truncatedSession } = await manageTokensAndGenerateResponse(openai, userSession);
    userSession = truncatedSession;
    userSession.push({ role: "assistant", content: gptResponse });
    //console.log("User Session:", userSession); // Debugging line
    await chat.sendStateTyping();
    client.sendMessage(msg.from, gptResponse);
    return userSession;
}



// Message event handler
client.on('message', async msg => {
    const chatFilePath = path.join(CHATS_DIR, `${msg.from}.json`);
    //console.log("Chat File Path:", chatFilePath); // Debugging line

    const chat = await msg.getChat();
    
    // Initialize user session
    let userSession = readJSONFile(chatFilePath) || [{ role: "system", content: systemMessage }];

    if (msg.hasMedia) {
        // Handle media messages
        const media = await msg.downloadMedia();
        
        if (media.mimetype === 'audio/ogg; codecs=opus') {
            // Handle audio messages
            userSession = await handleAudioMessage(userSession, chatFilePath, media, msg, chat);
        } else {
            // Handle unsupported media types
            userSession = await handleUnsupportedMedia(userSession, chatFilePath, media.mimetype, msg, chat);
        }
    } else if (msg.body) {
        // Handle text messages
        userSession = await handleTextMessage(userSession, chatFilePath, msg.body, msg, chat);
    }

    // Ensure the system message is preserved
    ensureSystemMessage(userSession, systemMessage);

    // Save user session and mark message as seen
    writeJSONFile(chatFilePath, userSession);
    await chat.sendSeen();
});

client.initialize();