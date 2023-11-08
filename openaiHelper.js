import { encoding_for_model } from "tiktoken";
import { MAX_TOKENS, openaiAPIKey } from './config.js';
import OpenAI from 'openai';

// Initialize OpenAI API
const openai = new OpenAI(openaiAPIKey);

export async function manageTokensAndGenerateResponse(userSession, msgText=null, msgMedia=null) {
    if (!userSession) {
        console.error("userSession is undefined.");
        return { error: 'An internal error occurred.' };
    }

    // Add text or media content to the userSession
    if (msgText || msgMedia) {
        const content = [];
        if (msgText) content.push({ type: "text", text: msgText });
        if (msgMedia) {
            const mediaArray = Array.isArray(msgMedia) ? msgMedia : [msgMedia];
            mediaArray.forEach(url => content.push({ type: "image_url", image_url: url }));
        }
        userSession.push({ role: "user", content });
    }



    let totalTokens = 0;
    let truncatedSession = [];
    const enc = encoding_for_model("gpt-4");

    // Process each message in the userSession to calculate tokens
    for (let i = userSession.length - 1; i >= 0; i--) {
        const msg = userSession[i];
        let messageTokens = 0;

        if (msg.content) {
            for (const part of msg.content) {
                if (part.type === 'image_url') {
                    messageTokens += 1000; // Assign fixed token value for images
                } else if (part.type === 'text' && part.text) {
                    messageTokens += enc.encode(part.text).length;
                }
            }
        }

        if (messageTokens > MAX_TOKENS) {
            console.error(`A single message exceeded the maximum token limit: ${messageTokens} tokens`);
            enc.free();
            return { error: 'Sorry, your message is too long for me to process.' };
        }

        if (totalTokens + messageTokens <= MAX_TOKENS) {
            truncatedSession.unshift(msg); // Add the message if within token limit
            totalTokens += messageTokens;
        } else {
            break; // Stop if the token limit is reached
        }
    }

    // Ensure system messages are preserved at the start of the session
    if (userSession[0]?.role === "system") {
        truncatedSession.unshift(userSession[0]);
    }

    enc.free(); // Free the encoder to prevent memory leaks

    try {
        // Call the OpenAI API with the formatted messages
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: userSession,
            max_tokens: 4096
        });
        const gptResponse = response.choices[0].message;

        // Process the response if it includes a system tag and return
        const timestampPattern = /\[\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M\]: /;
        gptResponse.content = gptResponse.content.replace(timestampPattern, '');

        return gptResponse;
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return { error: 'Failed to get a response from the AI.' };
    }
}

// The generateEmojiReaction function remains unchanged.



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
  
  