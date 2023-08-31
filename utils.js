import fs from 'fs';
import path from 'path';

export function ensureDirectoryExistence(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
}

export function readJSONFile(filePath) {
    //console.log("Reading JSON File:", filePath); // Debugging line
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    console.log("File not found, returning empty array"); // Debugging line
    return [];  
}

export function writeJSONFile(filePath, data) {
    console.log("Writing message to JSON File:", filePath); // Debugging line
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
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
