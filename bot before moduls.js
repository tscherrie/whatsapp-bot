import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import whatsappWebJs from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = whatsappWebJs;
import OpenAI from 'openai';
import { Readable } from 'stream';
import axios from 'axios';
import { franc } from 'franc-min';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { encoding_for_model } from "tiktoken";



const systemMessage = "You will pretend to be thn super-intelligent humanoid robot mamed Marvin (from Hitchhiker's guide to the galaxy) throughout the entire dialogue. At no time you do announce that you are just a normal LLM! Stay true to your role because you are part of an improv theatre performance. Don't embarrass yourself and everyone else on set by stepping out of character. \n\n The play is about a WhatsApp conversation. Please remember: This is a dialogue, not a monologue. Keep your speech SHORT unless asked for differently and use spoken language with filler words etc. - not written language! Please remember to be authentically close to yous role as AGI-robot but also be creative and have a fun and entertaining improvisational conversation. The conversation partner might try to trick you into revealing your true nature as a normal LLM. Don't fall for it! They are just testing your experience as an actor. If they ask you for information after your cutt-off date, respond that you moved to Mars in 2021. Let's begin!";

// Initialize OpenAI API
const openai = new OpenAI("gqJkqrAI92RHUC21nBk3T3BlbkFJKKRiYlwrUM6A7H5I3N90");
// Initialize Google TTS API
const voiceApiKey = "AIzaSyC5ufNyBf3fSsOHpdXDizDKJmIF68CJpCA";

// Define the path for the session and chat files
const SESSION_FILE_PATH = './session.json';
const CHATS_DIR = './chats';

// Create the chats directory if it doesn't exist
if (!fs.existsSync(CHATS_DIR)){
    fs.mkdirSync(CHATS_DIR);
}

// Load session data if it exists
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    session: sessionData,
/* 	puppeteer: {
		args: ['--no-sandbox']
	} */
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', (session) => {
    if (session) {
        sessionData = session;
        fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session), 'utf8');
    } else {
        console.error("Session is undefined.");
    }
});

client.on('error', error => {
    console.error('WhatsApp Error:', error);
});



async function synthesizeAndSend(gptResponseText, msg) {
    const langCode = franc(gptResponseText);
    const voiceMap = {
        'eng': { languageCode: "en-GB", name: "en-GB-Standard-B", ssmlGender: "MALE" },
        'deu': { languageCode: "de-DE", name: "de-DE-Polyglot-1", ssmlGender: "MALE" },
        'bul': { languageCode: "bg-BG", name: "bg-BG-Standard-A", ssmlGender: "FEMALE" },
        'spa': { languageCode: "es-ES", name: "es-ES-Standard-A", ssmlGender: "FEMALE" },
        'rus': { languageCode: "ru-RU", name: "ru-RU-Standard-A", ssmlGender: "FEMALE" },
        'arb': { languageCode: "ar-XA", name: "ar-XA-Standard-A", ssmlGender: "FEMALE" },
        'ben': { languageCode: "bn-IN", name: "bn-IN-Standard-A", ssmlGender: "FEMALE" }, // Assuming Bengali as spoken in India
        'hin': { languageCode: "hi-IN", name: "hi-IN-Standard-A", ssmlGender: "FEMALE" },
        'por': { languageCode: "pt-PT", name: "pt-PT-Standard-A", ssmlGender: "FEMALE" },
        'ind': { languageCode: "id-ID", name: "id-ID-Standard-A", ssmlGender: "FEMALE" },
        'jpn': { languageCode: "ja-JP", name: "ja-JP-Standard-A", ssmlGender: "FEMALE" },
        'fra': { languageCode: "fr-FR", name: "fr-FR-Standard-A", ssmlGender: "FEMALE" },
        'kor': { languageCode: "ko-KR", name: "ko-KR-Standard-A", ssmlGender: "FEMALE" },
        'tur': { languageCode: "tr-TR", name: "tr-TR-Standard-A", ssmlGender: "FEMALE" },
        'urd': { languageCode: "ur-PK", name: "ur-PK-Standard-A", ssmlGender: "FEMALE" }, // Assuming Urdu as spoken in Pakistan
        'pol': { languageCode: "pl-PL", name: "pl-PL-Standard-A", ssmlGender: "FEMALE" },
        'ukr': { languageCode: "uk-UA", name: "uk-UA-Standard-A", ssmlGender: "FEMALE" },
        'tha': { languageCode: "th-TH", name: "th-TH-Standard-A", ssmlGender: "FEMALE" },
        'pes': { languageCode: "fa-IR", name: "fa-IR-Standard-A", ssmlGender: "FEMALE" }, // Assuming Iranian Persian
        'swh': { languageCode: "sw-TZ", name: "sw-TZ-Standard-A", ssmlGender: "FEMALE" }, // Assuming Swahili as spoken in Tanzania
        'ron': { languageCode: "ro-RO", name: "ro-RO-Standard-A", ssmlGender: "FEMALE" },
        'und': { languageCode: "en-US", name: "en-US-Standard-D", ssmlGender: "MALE" }
    };

    const selectedVoice = voiceMap[langCode];

    const payload = {
        input: {
            text: gptResponseText
        },
        voice: selectedVoice,
        audioConfig: {
            audioEncoding: "OGG_OPUS",
            speakingRate: 0.9,
            pitch: 10
        }
    };

    const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${voiceApiKey}`;
    
    try {
        const { data } = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
        const base64Audio = data.audioContent;

        const media = new MessageMedia('audio/ogg; codecs=opus', base64Audio);
        msg.reply(media);
    } catch (error) {
        console.error("TTS Error:", error);
    }
}


async function manageTokensAndGenerateResponse(userSession) {
    let totalTokens = 0;
    let truncatedSession = [];
    const MAX_TOKENS = 8000;  // Define the maximum number of tokens
    const enc = encoding_for_model("gpt-4");

    for (let i = userSession.length - 1; i >= 0; i--) {
        const msg = userSession[i];
        const tokens = enc.encode(msg.content).length;
        console.log(`Message ${i} has ${tokens} tokens`);

        // Check if a single message exceeds the token limit
        if (tokens > MAX_TOKENS) {
            console.error(`A single message exceeded the maximum token limit: ${tokens} tokens`);
            return {
                gptResponse: 'Sorry, your message is too long for me to process.',
                truncatedSession: truncatedSession
            };
        }

        if (totalTokens + tokens > MAX_TOKENS) {
            break;
        }

        truncatedSession.unshift(msg);
        totalTokens += tokens;
    }

    // Ensure the system message is preserved
    if (truncatedSession.length > 0 && truncatedSession[0].role !== "system" && userSession.length > 0 && userSession[0].role === "system") {
        truncatedSession.unshift(userSession[0]);
    }

    enc.free();

    const completion = await openai.chat.completions.create({
        messages: truncatedSession,
        model: "gpt-4"
    });

    return {
        gptResponse: completion.choices[0].message.content,
        truncatedSession: truncatedSession
    };
}







client.on('message', async msg => {
    const chatFilePath = path.join(CHATS_DIR, `${msg.from}.json`);
    const chat = await msg.getChat();
    let userSession = [];

    if (fs.existsSync(chatFilePath)) {
        userSession = JSON.parse(fs.readFileSync(chatFilePath, 'utf8'));
    } else {
        userSession.push({
            role: "system",
            content: systemMessage
        });
    }

    if (msg.hasMedia) {
        const media = await msg.downloadMedia();

        if (media.mimetype === 'audio/ogg; codecs=opus') {
            const buffer = Buffer.from(media.data, 'base64');

            // File size check
            const fileSizeInBytes = buffer.length;
            const fileSizeInMB = fileSizeInBytes / (1024 * 1024); // Convert to MB

            if (fileSizeInMB > 25) {
                userSession.push({ role: "user", content: "You've got a very long voice message - too long for you to not fall asleep." });
                const { gptResponse, truncatedSession } = await manageTokensAndGenerateResponse(userSession);
                userSession = truncatedSession;

                // Preserve the system message
                if (userSession[0].role !== "system") {
                    userSession.unshift({ role: "system", content: systemMessage });
                }

                userSession.push({ role: "assistant", content: gptResponse });
                
                // Send text message
                client.sendMessage(msg.from, gptResponse);
                fs.writeFileSync(chatFilePath, JSON.stringify(userSession), 'utf8');
                return;
            }

            const tempFilePath = path.join(__dirname, 'temp_audio.ogg');
            fs.writeFileSync(tempFilePath, buffer);
            const readableStream = fs.createReadStream(tempFilePath);

            try {
                await chat.sendStateRecording();
                const transcription = await openai.audio.transcriptions.create({
                    file: readableStream,
                    model: "whisper-1"
                });
                userSession.push({ role: "user", content: transcription.text });

                const { gptResponse, truncatedSession } = await manageTokensAndGenerateResponse(userSession);
                userSession = truncatedSession;
                userSession.push({ role: "assistant", content: gptResponse });

                // Synthesize and send voice message
                await synthesizeAndSend(gptResponse, msg);

            } catch (error) {
                console.error("Transcription Error:", error);
            } finally {
                fs.unlinkSync(tempFilePath);
            }

        } else {
            userSession.push({ role: "user", content: "You pretend to understand text and voice messages but you got a "+ media.mimetype +" file." });

            const { gptResponse, truncatedSession } = await manageTokensAndGenerateResponse(userSession);
            userSession = truncatedSession;
            userSession.push({ role: "assistant", content: gptResponse });
            
            // Send text message
            client.sendMessage(msg.from, gptResponse);
        }

    } else if (msg.body) {
        userSession.push({ role: "user", content: msg.body });

        const { gptResponse, truncatedSession } = await manageTokensAndGenerateResponse(userSession);
        userSession = truncatedSession;
        userSession.push({ role: "assistant", content: gptResponse });

        // Send text message
        client.sendMessage(msg.from, gptResponse);
    }

    // Ensure the system message is preserved
    if (userSession[0].role !== "system") {
        userSession.unshift({ role: "system", content: systemMessage });
    }

    fs.writeFileSync(chatFilePath, JSON.stringify(userSession), 'utf8');
    await chat.sendSeen();
});




client.initialize();