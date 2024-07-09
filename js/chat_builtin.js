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
 * シンプルな単一チャット、ストリーミングバージョン
 */
/**
* チャットメッセージを送信し、応答を返す。履歴は扱わない
* @description やりとりの履歴は扱わない
* @param {string} text - ユーザーからのテキスト
* @param {object} ctx - Chatコンテキスト
* @param {function} chunkHander - ストリーミングでトークンを処理するハンドラ
* @returns {string} 応答 - 生成されたテキスト
* @example singleChatStream('世界で一番高い山は？, ctx); // returns "エベレストです"
*/
async function singleChatStream(text, ctx, chunkHander) {
    _debugLog("before send promot:", text);
    const stream = await ctx.session.promptStreaming(text);
    let resText = '';
    for await (const chunk of stream) {
        _debugLog(chunk);
        chunkHander(chunk);
        resText += chunk;
    }

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
 * チャットメッセージを送信し、ストリーミングで応答を返す
 */
/**
* チャットメッセージを送信し、ストリーミングで応答を返す
* @description ctx.chat_messages に配列としてやりとりが蓄積される
* @param {string} text - ユーザーからのテキスト
* @param {object} ctx - chatコンテキスト
* @param {function} chunkHander - ストリーミングでトークンを処理するハンドラ
* @returns {string} 応答 - 生成されたテキスト
* @example postChatText('世界で一番高い山は？, ctx); // returns 'エベレスト'
*/
async function streamChatText(text, ctx, chunkHander) {
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

    const stream = await ctx.session.promptStreaming(text);
    let resText = '';
    for await (const chunk of stream) {
        _debugLog(chunk);
        chunkHander(chunk);
        resText = chunk;
    }
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

// 過去のやり取りを制限に収まるように圧縮する
function _messageCompaction(messages, tokenLimit) {
    let size = _calcTokenSize(messages);
    _debugLog("total token sise:", size);
    while (size > tokenLimit) {
      _debugLog("Message Token total Size %d, over Limit %d", size, tokenLimit);
      _removeMessage(messages, tokenLimit);
      size = _calcTokenSize(messages)
    }
  }
  
  // 過去のメッセージを取り除く
  function _removeMessage(messages, tokenLimit) {
    if (messages.length === 0) {
      // メッセージがない場合は、何もしない
      return;
    }
    else if (messages.length === 1) {
      // メッセージが1つの場合は、それを短くする
      const lastMessage = messages[0];
      _shortenMessage(lastMessage, tokenLimit);
      _debugLog('shorten last message:', lastMessage);
      return;
    }
  
    // ==== メッセージが2つ以上の場合 ===
    // systemロールをスキップ
    let removeIndex = 0;
    let tokenLimitWithSystem = tokenLimit;
    const firstMessage = messages[0];
    if (firstMessage.role === 'system') {
      removeIndex = 1;
      tokenLimitWithSystem = tokenLimit - _calcSingleMessageToken(firstMessage);
    }
  
    // --- 最後のメッセージの場合は短くする ---
    if (removeIndex === messages.length - 1) {
      const lastMessage = messages[removeIndex];
      _shortenMessage(lastMessage, tokenLimitWithSystem);
      _debugLog('shorten last message:', lastMessage);
    }
    else {
      // --- 最後でなければ、除去する ---
      const removedMessage = messages.splice(removeIndex, 1);
      _debugLog('remove message:', removedMessage);
    }
  }


// 過去のメッセージ全体のトークンサイズを計算する（文字数による近似）
function _calcTokenSize(messages) {
    let totalSize = 0;
    messages.forEach(message => {
      totalSize += _calcSingleMessageToken(message);
    });
    return totalSize;
}
  
// メッセージ単体のトークンサイズを計算する（文字数による近似）
function _calcSingleMessageToken(message) {
    // "role: content\n"
    return message.role.length + 2 + message.content.length + 1;
}

// メッセージ単体を短くする（文字数による近似）
function _shortenMessage(message, tokenLimit) {
    const adjustedLimit = tokenLimit - (message.role.length + 2 + 1);
    const content = message.content;
    message.content = content.substring(0, adjustedLimit);
}

/* ---- memo --

from:
  https://azukiazusa.dev/blog/try-chrome-internal-ai-gemini-nano/

AITextSession オブジェクトのインターフェース
prompt(text: string): Promise<string>：プロンプトを渡し、AI による回答を取得する
promptStreaming(text: string): AsyncIterable<string>：結果全体を待つのではなく、ストリーミング形式で結果を取得する
execute(text: string): Promise<string>：prompt と同じ
executeStreaming(text: string): AsyncIterable<string>：promptStreaming と同じ
destroy(): void：セッションを破棄する？
---*/