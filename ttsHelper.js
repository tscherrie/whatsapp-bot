// Import axios and other necessary libraries
import axios from 'axios';
import whatsappWebJs from 'whatsapp-web.js';
import { openaiAPIKey } from './config.js'; // Ensure this file exports your API key


const { MessageMedia } = whatsappWebJs;



// Define the character to voice mapping
const characters = {
    "Marvin": "onyx",
    "Marta": "nova"
};

// Helper function to remove unsupported characters (implement this according to your needs)
function removeUnsupportedCharacters(text) {
    // Define your logic to remove emojis or other characters
    // For simplicity, this example replaces anything that is not a letter, number, punctuation, or space
    return text.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '')
}

export async function synthesizeAndSend(text, msg, characterName) {
    // Use the voice mapping from the characters object
    const selectedVoice = characters[characterName] || characters["Marvin"]; // Fallback to "Marvin" if characterName is not recognized

    const cleanedText = removeUnsupportedCharacters(text);

    // Define the payload for the API request
    const payload = {
        model: "tts-1-hd", // You've mentioned "tts-1-hd" model here, which is higher quality than "tts-1"
        voice: selectedVoice,
        input: cleanedText
    };

    // The URL for the TTS endpoint
    const ttsApiUrl = `https://api.openai.com/v1/audio/speech`;

    try {
        const response = await axios.post(ttsApiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiAPIKey}` // Use the imported API key
            },
            responseType: 'arraybuffer' // This ensures that the response is treated as a binary file
        });
        // Convert the binary audio content to a base64 string
        const base64Audio = Buffer.from(response.data).toString('base64');
        // Create a MessageMedia object
        const media = new MessageMedia('audio/ogg; codecs=opus', base64Audio);
        // Reply with the media message
        await msg.reply(media); 
    } catch (error) {
        console.error("TTS Error:", error);
    }
}
