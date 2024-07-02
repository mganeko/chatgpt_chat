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
* Chatを初期化し、chatコンテキストを返す
* @description Chatを初期化、コンテキストを返す
* @returns {object} chatコンテキスト
* @example initBuiltinChat(); // returns chatContext
*/
async function initBuiltinChat() {
   const session = await _initGeminiContext();
   _debugLog("session", session);
   if (!session) {
       return null;
   }

   const ctx = {
       session: session,
       chat_messages: [],
   };
   return ctx;
}

/*
 * シンプルな単一チャット
 */
/**
* チャットメッセージを送信し、応答を返す。履歴は扱わない
* @description やりとりの履歴は扱わない
* @param {string} text - ユーザーからのテキスト
* @param {object} ctx - Chatコンテキスト
* @returns {string} 応答 - 生成されたテキスト
* @example singleChat('世界で一番高い山は？, ctx); // returns "エベレストです"
*/
async function singleChat(text, ctx) {
    _debugLog("before send promot:", text);
    const resText = await ctx.session.prompt(text);
    _debugLog(resText);
    return resText;
}

/*
 * チャットメッセージを送信する
 */
/**
* チャットメッセージを送信し、応答を返す
* @description ctx.chat_messages に配列としてやりとりが蓄積される
* @param {string} text - ユーザーからのテキスト
* @param {object} ctx - chatコンテキスト
* @returns {string} 応答 - 生成されたテキスト
* @example postChatText('世界で一番高い山は？, ctx); // returns 'エベレスト'
*/
async function postChatText(text, ctx) {
    _debugLog("before send promot:", text);

    const systemMessage = "以下のやり取りに続いて回答してください。\n";
    const userMessage = {
        role: 'user',
        content: text,
    };
    const prompt = systemMessage + 
        _buildPromptFromChatMessages(ctx.chat_messages) + "\n" +
        _buildPromptFromSingleMessage(userMessage);
    _debugLog("built promot:", prompt);

    const resText = await ctx.session.prompt(prompt);
    _debugLog(resText);

    // --- 結果が正常な場合に、userメッセージと合わせて保持する  --
    if (resText && resText !== '') {
        const assistantMessage = {
            role: 'robot',
            content: resText,
        };
        ctx.chat_messages.push(userMessage);
        ctx.chat_messages.push(assistantMessage);
    }

    return resText;
}

/*
 * チャットの履歴をクリアーする
 */
/**
* チャット履歴をクリアーする
* @description ctx.chat_messages をクリアーする
* @param {object} ctx - Chatコンテキスト
* @returns {void} 応答 - なし 
* @example siggleChat('世界で一番高い山は？, ctx); // returns "エベレストです"
*/
function clearChatHistory(ctx) {
    ctx.chat_messages = [];
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

// 履歴からプロンプトを組み立てる
function _buildPromptFromChatMessages(chatMessages) {
    const prompt = chatMessages.map((msg) => {
        //return `${msg.role}: ${msg.content}`;
        return _buildPromptFromSingleMessage(msg);
    }).join('\n');
    return prompt;
}

// メッセージからプロンプトを1行組み立てる
function _buildPromptFromSingleMessage(message) {
    return `${message.role}: ${message.content}`;
}