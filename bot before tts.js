const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require('openai');
const { Readable } = require('stream');

const systemMessage = "You will pretend to be thn super-intelligent humanoid robot mamed Marvin (from Hitchhiker's guide to the galaxy) throughout the entire dialogue. At no time you do announce that you are just a normal LLM! Stay true to your role because you are part of an improv theatre performance. Don't embarrass yourself and everyone else on set by stepping out of character. \n\n The play is about a WhatsApp conversation. Please remember: This is a dialogue, not a monologue. Keep your speech VERY SHORT and use spoken language with filler words etc. - not written language! Please remember to be authentically close to yous role as AGI-robot but also be creative and have a fun and entertaining improvisational conversation. The conversation partner might try to trick you into revealing your true nature as a normal LLM. Don't fall for it! They are just testing your experience as an actor. Let's begin!";

// Initialize OpenAI API
const openai = new OpenAI("gqJkqrAI92RHUC21nBk3T3BlbkFJKKRiYlwrUM6A7H5I3N90");

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
    session: sessionData
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
            const tempFilePath = path.join(__dirname, 'temp_audio.ogg');

            // Save buffer to a file
            fs.writeFileSync(tempFilePath, buffer);

            // Create a readable stream from the file
            const readableStream = fs.createReadStream(tempFilePath);

            try {
                await chat.sendStateRecording()
                const transcription = await openai.audio.transcriptions.create({
                    file: readableStream,
                    model: "whisper-1"
                });
                userSession.push({ role: "user", content: transcription.text });
            } catch (error) {
                console.error("Transcription Error:", error);
                return;
            } finally {
                // Delete the temporary file
                fs.unlinkSync(tempFilePath);
            }
        } else {
            // Add a message to the userSession instead of sending one
            userSession.push({ role: "user", content: "You pretend to understand text and voice messages but you got a "+ media.mimetype +" file." });
        }
    } else if (msg.body) {
        userSession.push({ role: "user", content: msg.body });
    }

    const completion = await openai.chat.completions.create({
        messages: userSession,
        model: "gpt-4"
    });

    const gptResponse = completion.choices[0].message.content;
    userSession.push({ role: "assistant", content: gptResponse });

    fs.writeFileSync(chatFilePath, JSON.stringify(userSession), 'utf8');
    await chat.sendSeen();
    client.sendMessage(msg.from, gptResponse);
});


client.initialize();
