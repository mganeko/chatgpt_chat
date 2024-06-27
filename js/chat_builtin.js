//
// Chrome builtin Gemini nano API wrapper
//

// ======= inner variable =========
const _debugMode = true; // true / false
//const _debugMode = false; // true / false

// ============== public function ==============

/*
 * Chatを初期化する
 */
/**
* Chatを初期化し、chatセッションを返す
* @description Chatを初期化、GPTコンテキストを返す
* @param {string} apiKey - OpenAI APIのキー
* @param {object} options - オプション, nullもOK. 例) { model: 'gpt-3.5-turbo', url: 'https://api.openai.com/v1/chat/completions', systemMessage: "Reply in English.", sendTokenLimit: 3900, apiMode: "ollama" } // apiMode: "openai"(default) | "ollama"
* @returns {object} GPTコンテキスト
* @example initChat('xxxxxxxxxx', { model: 'xxxxx'}); // returns gptContext
*/
async function initBuiltinChat() {
   const session = await _initGeminiContext();
   _debugLog("session", session);
   return session;
}

/*
 * チャットメッセージを送信する
 */
/**
* チャットメッセージを送信し、応答を返す
* @description ctx.chat_messages に配列としてやりとりが蓄積される
* @param {string} text - ユーザーからのテキスト
* @param {object} ctx - GPTコンテキスト
* @param {object} options - オプション(null可)。{ temperature: xxx } のみ有効
* @returns {object} 応答 - { role: 'assistant' / 'error', content: 生成されたテキスト }
* @example postChatText('世界で一番高い山は？, ctx); // returns { role: 'assistant', content: 'エベレスト'}
*/
async function postChatText(text, session) {
    _debugLog("before send promot:", text);
    const res = await session.prompt(text);
    _debugLog(res);
    return res;
}


// ============= helper function ============

// デバッグ用のログ出力
function _debugLog(...args) {
    if (_debugMode) {
      //console.log(...args);
  
      // 呼び出し元の情報を併せて出力する
      //const line = Error().stack.split('\n')[2]; //.split(':')[1];
      const stack = Error().stack.split('\n');
      const line = stack[2] ?? stack[1] ?? stack[0];
  
      console.log(line, ': ', ...args);
    }
  }
  


// ============= inner function ============

// chatコンテキストを初期化する
async function _initGeminiContext() {
    if (window.ai) {
        const canCreate = await window.ai.canCreateTextSession();
        if (canCreate) {
            const session = await window.ai.createTextSession();
            return session;
        }
    }

    return null;
}

