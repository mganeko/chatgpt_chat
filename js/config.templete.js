// Usege
// - copy to js/config.js 
// - modify API_KEY value
//
// 使い方
//  - このファイルを、js/config.js　にコピーしてください
//  - API_KEYの値を、発行したAPIキーに書き換えてください

// --- OpenAI Key ---
const API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// --- options ----
const API_URL = '';
const MODEL_NAME = ''; // gpt-3.5-turbo-16k';
const API_MODE = ''; // openai, azure, ollama
const SEND_TOKEN_LIMIT = 0; // 0:Use Default, // ex) 3900 for gpt3.5-turbo, 10000 for gpt3.5-turbo-16k

// --- header element ---
const HEADER_ELEMENT = 'Simple Chat using ChatGPT API<br />Type any text, and click [submit] button';
//const HEADER_ELEMENT = '';



// ---- for test ---
const TEST_CHECK_GPT4 = false;
const TEST_CHECK_AZURE = false;
const TEST_AZURE_API_KEY = "";
const TEST_AZURE_API_URL = "";

const TEST_CHECK_OLLAMA = false;
const TEST_OLLAMA_API_URL = "";
const TEST_OLLAMA_MDOEL_NAME = "";

