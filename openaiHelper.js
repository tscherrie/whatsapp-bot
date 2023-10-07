import { fetchStreamedChatContent } from 'streamed-chatgpt-api';
import { encoding_for_model } from "tiktoken";
import { MAX_TOKENS, openaiAPIKey } from './config.js';

export async function manageTokensAndGenerateResponse(openai, userSession, chat=null, callback) {
    if (!userSession) {
        console.error("userSession is undefined.");
        callback('An internal error occurred.'); // Notify through callback
        return;
    }

    let totalTokens = 0;
    let truncatedSession = [];
    const enc = encoding_for_model("gpt-4");

    for (let i = userSession.length - 1; i >= 0; i--) {
        const msg = userSession[i];
        const tokens = enc.encode(msg.content).length;

        if (tokens > MAX_TOKENS) {
            console.error(`A single message exceeded the maximum token limit: ${tokens} tokens`);
            callback('Sorry, your message is too long for me to process.'); // Notify through callback
            return;
        }

        if (totalTokens + tokens > MAX_TOKENS) {
            break;
        }

        truncatedSession.unshift(msg);
        totalTokens += tokens;
    }

    if (truncatedSession.length > 0 && truncatedSession[0].role !== "system" && userSession.length > 0 && userSession[0].role === "system") {
        truncatedSession.unshift(userSession[0]);
    }

    enc.free();
    let gptResponse = "";
    await new Promise((resolve, reject) => {
        fetchStreamedChatContent({
            apiKey: openaiAPIKey,
            messageInput: truncatedSession,
            model: "gpt-4",
            retryCount: 7,
            fetchTimeout: 70000,
            readTimeout: 30000,
            totalTime: 1200000
        }, async (content) => {
            if (chat !== null ) {
                await chat.sendStateTyping();  // Show typing state for each paragraph
            }
            gptResponse += content;
            const paragraphs = gptResponse.split('\n\n');
            if (paragraphs.length > 1) {
                for (let i = 0; i < paragraphs.length - 1; i++) {
                    if (paragraphs[i].trim() !== '') {
                        let messageToSend = paragraphs[i];
                        if (messageToSend.includes(']: ')) {
                            messageToSend = messageToSend.split(']: ')[1];
                        }
                        callback(messageToSend); // Handle each paragraph
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
    if (gptResponse && gptResponse.trim() !== '') {
        if (gptResponse.includes(']: ')) {
            gptResponse = gptResponse.split(']: ')[1];
        }
        callback(gptResponse); // Handle the remaining content
    }
    
}


export async function generateEmojiReaction(message, openai) {
    const prompt = `If the following message is emotional, what would be an appropriate emoji reaction? If the message isn't emotional, respond with "No Emoji". \nMessage: "${message}"`;
    const maxTokens = 10;

    const response = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "You are a helpful assistant that suggests emoji reactions or 'No Emoji' based on the emotional context of a message." },
            { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        model: "gpt-3.5-turbo"
    });

    const reaction = response.choices[0].message.content.trim();
    return reaction === "No Emoji" ? null : reaction;
}
  
  