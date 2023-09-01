import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import { CHATS_DIR } from './config.js';
import crypto from 'crypto';

// Encryption & Decryption Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Set this to a 32-byte string
const IV_LENGTH = 16;


function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
}

export function readJSONFile(filePath) {
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        let decryptedData;
        try {
            // Try to decrypt the data
            decryptedData = decrypt(fileData);
        } catch (e) {
            console.log("Could not decrypt, assuming plain text");
            decryptedData = fileData;
        }
        return JSON.parse(decryptedData);
    }
    console.log("File not found, returning empty array");
    return [];
}


export function writeJSONFile(filePath, data) {
    const stringifiedData = JSON.stringify(data);
    const encryptedData = encrypt(stringifiedData);
    fs.writeFileSync(filePath, encryptedData, 'utf8');
}

export function ensureDirectoryExistence(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
}

export function ensureSystemMessage(userSession, systemMessage) {
    if (userSession[0].role !== "system") {
        userSession.unshift({ role: "system", content: systemMessage });
    }
}

export function writeFileFromBuffer(filePath, buffer) {
    fs.writeFileSync(filePath, buffer);
}

export function createReadStream(filePath) {
    return fs.createReadStream(filePath);
}

export function deleteFile(filePath) {
    fs.unlinkSync(filePath);
}

export function getAllChatIds() {
    const chatIds = [];
  
    // Read the directory
    const files = fs.readdirSync(CHATS_DIR);
  
    // Loop through each file and check if it's a .json file
    for (const file of files) {
      if (path.extname(file) === '.json') {
        // Remove the '.json' extension to get the chat ID
        const chatId = path.basename(file, '.json');
        chatIds.push(chatId);
      }
    }
  
    return chatIds;
  }

  // Function to delete old chat data (older than 30 days)
  function deleteOldChatData() {
    const files = fs.readdirSync(CHATS_DIR);
    const currentDate = new Date();
    files.forEach(file => {
        const filePath = path.join(CHATS_DIR, file);
        const stats = fs.statSync(filePath);
        const lastModified = new Date(stats.mtime);
        const ageInDays = (currentDate - lastModified) / (1000 * 60 * 60 * 24);
        if (ageInDays > 30) {
            fs.unlinkSync(filePath);
        }
    });
}

// Run the function every 24 hours
setInterval(deleteOldChatData, 24 * 60 * 60 * 1000);
