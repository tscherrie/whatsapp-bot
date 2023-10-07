// Import utilities and configurations
import { voiceApiKey } from './config.js';
import axios from 'axios';
import { franc } from 'franc-min';
import whatsappWebJs from 'whatsapp-web.js';
import characters from './characterConfig.js';


const { MessageMedia } = whatsappWebJs;

function removeEmojis(text) {
  return text.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '')}

  export async function synthesizeAndSend(gptResponseText, msg, characterName, language) {
    const cleanedText = removeEmojis(gptResponseText);  // Remove emojis
    //const langCode = franc(cleanedText);
    const langCode = language;

    // Fetch the voice configuration for the current character and language
    const selectedVoice = characters[characterName].voiceMap[langCode] || characters[characterName].voiceMap[characters[characterName].defaultLanguage];
    //console.log("Selected voice:", selectedVoice);
    const payload = {
        input: {
            text: cleanedText
        },
        voice: selectedVoice,
        audioConfig: {
            audioEncoding: "OGG_OPUS",
            speakingRate: 1,
            pitch: 3
        }
    };

    const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${process.env.VOICE_API_KEY}`;
    
    try {
        const { data } = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
        const base64Audio = data.audioContent;

        const media = new MessageMedia('audio/ogg; codecs=opus', base64Audio);
        msg.reply(media);
    } catch (error) {
        console.error("TTS Error:", error);
    }
}
