import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import { imgbbApiKey } from './config.js';

const apiKey = imgbbApiKey; 

export async function uploadImage(imagePath) {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    form.append('expiration', 5184000); //30 days

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: form
        });
        const result = await response.json();
        return result.data.url; // This URL can be used in your API calls
    } catch (error) {
        console.error('Error:', error);
    }
}
