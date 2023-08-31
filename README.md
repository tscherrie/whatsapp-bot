# GPT-4 Marvin WhatsApp Bot

Welcome to the GPT-4 Marvin WhatsApp Bot! This bot leverages the power of OpenAI's GPT-4 model to provide advanced character prompts and responses. It's also integrated with Google's Text-to-Speech API for voice responses. 

## Features

- Advanced character prompts using GPT-4. Meet Marvin and Marta
- Voice responses using Google's Text-to-Speech API
- Easy to install and use

## Installation

Follow these steps to install and run the GPT-4 WhatsApp Bot:

1. Clone this repository:
    ```
    git clone https://github.com/tscherrie/whatsapp-bot.git
    ```
2. Navigate into the project directory:
    ```
    cd whatsapp-bot
    ```
3. Install the dependencies:
    ```
    npm install
    ```
4. Create a `.env` file in the root directory of the project and add your OpenAI and Google TTS API keys:
    ```
    OPENAI_API_KEY=your_openai_key
    GOOGLE_TTS_API_KEY=your_google_tts_key
    ```
    Replace `your_openai_key` and `your_google_tts_key` with your actual API keys.

5. Run the bot:
    ```
    node bot.js
    ```

## Usage

After running the bot, you can interact with it on WhatsApp. Send a message to the bot's number and it will respond with advanced character prompts using GPT-4 and voice responses using Google's Text-to-Speech API.

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

This project is licensed under the terms of the MIT license. See the [LICENSE](LICENSE.md) file for details.
