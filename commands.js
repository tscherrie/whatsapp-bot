import { getMarvinMessage, getMartaMessage } from './config.js';

// Function to update the system message based on the user's command
export async function updateSystemMessage(userSession, client, msg, command, chat) {  // Added chat parameter
    command = command.toLowerCase().trim();
    const contact = await msg.getContact();
    const pushName = contact.pushname || "";  // Get the pushname from the contact object
    let newMessage;

    if (command.includes("marvin")) {
        newMessage = getMarvinMessage(pushName);
    } else if (command.includes("ohne") || command.includes("without") || command.includes("no") || command.includes("none") || command.includes("nein") || command.includes("kein") || command.includes("keiner") || command === "") {
        newMessage = "";  // No system message for 'Ohne'
    } else if (command.includes("sonnenschein") || command.includes("marta") || command.includes("sonne") || command.includes("sun") || command.includes("sunshine")) {
        newMessage = getMartaMessage(pushName);
    } else {
        client.sendMessage(msg.from, `Wrong command. System message not updated. Use "character: Marvin" or "character: Marta" or "character: Ohne"`);
        return userSession;  // Invalid command
    }

    // Reset userSession and update the system message
    userSession = [{
        role: "system",
        content: [
            { type: "text", text: newMessage }
        ]
    }];

    // Clear all messages in the chat
    await chat.clearMessages();  // Clear messages when system prompt gets reset

    client.sendMessage(msg.from, `System message updated`);
    return userSession;
}
