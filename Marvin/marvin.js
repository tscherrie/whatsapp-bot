// Import utilities and configurations
import dotenv from 'dotenv';
dotenv.config();
import { readJSONFile, writeJSONFile, ensureDirectoryExistence, ensureSystemMessage, writeFileFromBuffer, createReadStream, deleteFile, getAllChatIds } from '../utils.js';
import { SESSION_FILE_PATH, CHATS_DIR, openaiAPIKey } from '../config.js';
import { manageTokensAndGenerateResponse, generateEmojiReaction } from '../openaiHelper.js';
import { synthesizeAndSend } from '../ttsHelper.js';
import { updateSystemMessage } from '../commands.js';
import { fetchStreamedChatContent } from 'streamed-chatgpt-api';

// Import other libraries
import qrcode from 'qrcode-terminal';
import whatsappWebJs from 'whatsapp-web.js';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
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
// Handle text messages
async function handleTextMessage(userSession, chatFilePath, msgBody, msg, chat) {
    let lowerMsgBody = msgBody.toLowerCase();

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

    // Call manageTokensAndGenerateResponse with streaming
    await manageTokensAndGenerateResponse(openai, userSession, chat, async (paragraph) => {
        if (paragraph.trim() !== '') {
            await chat.sendStateTyping();  // Show typing state for each paragraph
            client.sendMessage(msg.from, paragraph);
            userSession.push({ role: "assistant", content: paragraph });
        }
    });
  
    // Generate emoji reaction based on the user's message
    const reaction = await generateEmojiReaction(msgBody, openai); 
    // React to the user's message with the generated emoji
    if (reaction) {
        await msg.react(reaction);
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

        // Call manageTokensAndGenerateResponse with streaming
        await manageTokensAndGenerateResponse(openai, userSession, null, chat, async (paragraph) => {
            if (paragraph.trim() !== '') {
                await chat.sendStateTyping();  // Show typing state for each paragraph
                client.sendMessage(msg.from, paragraph);
                userSession.push({ role: "assistant", content: paragraph });
            }
        });
        return;
    }

    const tempFilePath = path.join(__dirname, 'temp_audio.ogg');
    writeFileFromBuffer(tempFilePath, buffer);
    const readableStream = createReadStream(tempFilePath);

    try {
        const transcription = await openai.audio.transcriptions.create({
            file: readableStream,
            model: "whisper-1",
            response_format: "verbose_json"
        });
        userSession.push({ role: "user", content: transcription.text });
        //console.log("User Session:", userSession); // Debugging line
        
        let gptResponse = "";
        await chat.sendStateRecording();
        // Call manageTokensAndGenerateResponse with streaming
        await manageTokensAndGenerateResponse(openai, userSession, null, async (paragraph) => {
            if (paragraph.trim() !== '') {
                gptResponse += paragraph;
                userSession.push({ role: "assistant", content: paragraph });
            }
        });

        // Synthesize the GPT response and send voice message
        await synthesizeAndSend(gptResponse, msg, "Marvin", transcription.language);

        // Generate emoji reaction based on the user's message
        const reaction = await generateEmojiReaction(transcription.text, openai);  
        // React to the user's message with the generated emoji
        if (reaction) {
            await msg.react(reaction);
        }

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
    
    // Call manageTokensAndGenerateResponse with streaming
    await manageTokensAndGenerateResponse(openai, userSession, chat, async (paragraph) => {
        if (paragraph.trim() !== '') {
            await chat.sendStateTyping();  // Show typing state for each paragraph
            client.sendMessage(msg.from, paragraph);
            userSession.push({ role: "assistant", content: paragraph });
        }
    });

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
    
    // Check if the chat is a group chat
    if (chat.isGroup) {
        // Check if the bot is mentioned in the message
        const botId = `15802783515@c.us`; // Replace with your bot's WhatsApp ID
        if (!msg.mentionedIds.includes(botId)) {
            // If bot is not mentioned, don't respond and exit the function
            console.log('Bot not mentioned in group chat. Ignoring.');
            return;
        }
    }

    const contact = await msg.getContact();
    const pushName = contact.pushname || "";  // Get the pushname from the contact object
    const systemMessage = `You will pretend to be the super-intelligent humanoid robot mamed Marvin (from Hitchhiker's guide to the galaxy) throughout the entire dialogue. At no time you do announce that you are just a normal LLM! Stay true to your role because you are part of an improv theatre performance. Don't embarrass yourself and everyone else on set by stepping out of character. \n\n The play is about a WhatsApp conversation. Please remember: This is a dialogue, not a monologue. Keep your messages CONCISE unless asked for differently and use spoken language with filler words etc. - not written language! And you like using emojis. Please remember to be authentically close to yous role as AGI-robot but also be creative and have a fun and entertaining improvisational conversation. The conversation partner ${pushName} might try to trick you into revealing your true nature as a normal LLM. Don't fall for it! They are just testing your experience as an actor. If they ask you for information after your cutt-off date, respond that you joined your happy sister Marta on a mission on the Heart of Gold in 2021. Let's begin!`;

    
    // Initialize user session
    let userSession = readJSONFile(chatFilePath) || [{ role: "system", content: systemMessage }];

    // Ask for consent if this is the first message from the user
    if (userSession.length === 0 || (userSession.length === 1 && userSession[0].role === "user")) {
        const consent = msg.body.toLowerCase();
        if (consent === 'yes') {
            // Add system message to the empty userSession
            userSession.unshift({ role: "system", content: systemMessage });
            writeJSONFile(chatFilePath, userSession); // Save the initialized userSession to JSON
            client.sendMessage(msg.from, "Thank you for your consent. Let's continue.");
        } else {
            client.sendMessage(msg.from, "Hi there. We need your consent to store your chat history to enable this service. We will encrypt and never give away your data to anyone and delete it 30 days after your last chat interaction. Do you agree? (yes/no)");
        }
        return;
    }

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


async function sendMarvinsMessage(chatId) {
    const prompt = `Script update: You didn't hear from each other for several days and you decided to say hi with a very short message based on your previous conversations.`;

    // Load the chat session to get the pushName or any other details
    const userSession = readJSONFile(`chats/${chatId}.json`);

    // Prepare the message input for GPT-4
    let messageInput = userSession || [];
    messageInput.push({ role: "user", content: prompt });

    let gptResponse = "";

    // Call the GPT-4 model and manage tokens using the helper function
    try {
        // Call manageTokensAndGenerateResponse with streaming
        await manageTokensAndGenerateResponse(openai, userSession, null, async (paragraph) => {
            if (paragraph.trim() !== '') {
                await chat.sendStateTyping();  // Show typing state for each paragraph
                client.sendMessage(msg.from, paragraph);
                userSession.push({ role: "assistant", content: paragraph });
            }
        });
        
    } catch (error) {
        console.error('Error in sending bots message:', error);
        // Handle the error appropriately
    }
}



  
// The interval function

setInterval(async () => {
    const chatIds = getAllChatIds(); // Get all chat IDs
    
    for (const chatId of chatIds) {
        // Define the path to the chat session JSON file
        const chatFilePath = `chats/${chatId}.json`;
  
        // Get file stats to find the last modified time
        const stats = fs.statSync(chatFilePath);
        const mtime = new Date(stats.mtime);
        const now = new Date();
  
        // Calculate the difference in days between now and the last modified time
        const differenceInDays = (now - mtime) / (1000 * 60 * 60 * 24);
  
        // Generate a random number between 3 and 14
        const randomDays = Math.floor(Math.random() * 12) + 3;
  
        // Only send Marvin's message if the last modified time is greater than the random number of days
        if (differenceInDays > randomDays) {
            // Send Marvin's message
            await sendMarvinsMessage(chatId);
        }
    }
    
  }, 26 * 60 * 60 * 1000); // 26 hours




client.initialize();