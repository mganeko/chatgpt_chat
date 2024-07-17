//
// ChatGPT API wrapper
//

// ======= inner variable =========
const _debugMode = true; // true / false
//const _debugMode = false; // true / false

// ---- GPT-3.5 ----
const _DEFAULT_CHAT_MODEL = "gpt-3.5-turbo";
const _DEFAULT_TOKEN_LIMIT = 3900;
const _MAX_TOKEN_LIMIT = _DEFAULT_TOKEN_LIMIT - 1000;
//const _TOKEN_LIMIT = 1000; // for debug, cause ERROR

// ---- GPT-4 ----
//const _CHAT_MODEL = "gpt-4";
//const _TOKEN_LIMIT = 7900;

// ---- API URL ---
const _DEFAULT_CHATAPI_URL = "https://api.openai.com/v1/chat/completions";


// --- initial message ---
const _DEFAULT_SYSTEM_MESSAGE = {
  role: 'system',
  content: 'あなたは親切なアシスタントです',
};

// ============== public function ==============

/*
 * Chatを初期化する
 */
/**
* Chatを初期化し、GPTコンテキストを返す
* @description Chatを初期化、GPTコンテキストを返す
* @param {string} apiKey - OpenAI APIのキー
* @param {object} options - オプション, nullもOK. 例) { model: 'gpt-3.5-turbo', url: 'https://api.openai.com/v1/chat/completions', systemMessage: "Reply in English.", sendTokenLimit: 3900, apiMode: "ollama" } // apiMode: "openai"(default) | "ollama"
* @returns {object} GPTコンテキスト
* @example initChat('xxxxxxxxxx', { model: 'xxxxx'}); // returns gptContext
*/
function initChat(apiKey, options = null) {
  const gptCtx = _initGptContext(apiKey, options);
  return gptCtx;
}

/*
 * チャットの履歴をクリアする
 */
/**
* GPTコンテキストのチャット履歴をクリアする
* @description GPTコンテキストのチャット履歴をクリアする。system メッセージは残す
* @param {object} ctx - GPTコンテキスト
* @returns  void
* @example clearChatHistory(ctx); // returns nothing
*/
function clearChatHistory(ctx) {
  if ((!ctx) || (!ctx.chat_messages) || (ctx.chat_messages.length === 0))
    return;

  if (ctx.chat_messages[0].role === 'system') {
    // system は残す
    ctx.chat_messages.splice(1);
  }
  else {
    // 全て削除する
    ctx.chat_messages.splice(0);
  }
}

/*
 * チャットの履歴を追加する
 */
/**
* GPTコンテキストにチャット履歴を追加する
* @description GPTコンテキストにチャット履歴を追加する
* @param {object} ctx - GPTコンテキスト
* @param {string} role - ロール。'user' / 'assistant' のいずれか
* @param {string} text - テキスト
* @returns  void
* @example addChatHistory(ctx, 'user', 'よく眠れる方法は？'); // returns nothing
*/
function addChatHistory(ctx, role, text) {
  if ((!ctx) || (!ctx.chat_messages))
    return;

  ctx.chat_messages.push({ role: role, content: text });
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
async function postChatText(text, ctx, options) {
  const userMessage = {
    role: 'user',
    content: text,
  };

  // -- そのまま扱う場合 --
  //_chatapi_messages.push(userMessage);
  //_messageCompaction(_chatapi_messages);
  //const response = await _chatCompletion(_chatapi_messages, apiKey);

  // ==== 一時的メッセージ配列を作る ===
  const tempMessages = Array.from(ctx.chat_messages);
  tempMessages.push(userMessage);

  // -- compaction --
  _messageCompaction(tempMessages, ctx.sendTokenLimit);
  _debugLog('after compaction tempMessages:', tempMessages);

  // -- request --
  let response;
  if (ctx.apiMode === 'ollama') {
    response = await _ollamaChatCompletion(tempMessages, ctx.apiKey, ctx.model, ctx.url, options);
  }
  else {
    response = await _chatCompletion(tempMessages, ctx.apiKey, ctx.model, ctx.url, options);
  }
  _debugLog(response);

  // --- 結果が正常な場合に、userメッセージと合わせて保持する  --
  // パターン2: 圧縮後のメッセージ配列に置き換えて保持する場合
  if (response.role === 'assistant') {
    tempMessages.push(response);
    ctx.chat_messages = tempMessages; // コンテキストのチャット履歴を置き換える
  }

  _debugLog('after response, messages:', ctx.chat_messages);

  return response;
}

// ===== streaming function =====
/*
 * チャットメッセージを送信し、ストリーミングで応答を返す
 */
/**
* チャットメッセージを送信し、ストリーミングで応答を返す
* @description ctx.chat_messages に配列としてやりとりが蓄積される
* @param {string} text - ユーザーからのテキスト
* @param {object} ctx - GPTコンテキスト
* @param {function} chunkHander - ストリーミングでトークンを処理するハンドラ
* @param {object} options - オプション(null可)。{ temperature: xxx } のみ有効
* @returns {object} 応答 - { role: 'assistant' / 'error', content: 生成されたテキスト }
* @example streamChatText('世界で一番高い山は？, ctx, hunder); // returns { role: 'assistant', content: 'エベレスト'}
*/
async function streamChatText(text, ctx, chunkHander, options) {
  const userMessage = {
    role: 'user',
    content: text,
  };

  // ==== check API mode ===
  // if (ctx.apiMode === 'ollama') {
  //   _debugLog('streaming is not supported in ollama API mode.');
  //   return { role: 'error', content: 'streaming is not supported in ollama API mode.' };
  // }

  // ==== 一時的メッセージ配列を作る ===
  const tempMessages = Array.from(ctx.chat_messages);
  tempMessages.push(userMessage);

  // -- compaction --
  _messageCompaction(tempMessages, ctx.sendTokenLimit);
  _debugLog('after compaction tempMessages:', tempMessages);

  // -- request --
  // const response = await _chatCompletionStream(tempMessages, ctx.apiKey, ctx.model, ctx.url, chunkHander, options);
  // _debugLog(response);

  // -- request --
  let response;
  if (ctx.apiMode === 'ollama') {
    response = await _ollamaChatCompletionStream(tempMessages, ctx.apiKey, ctx.model, ctx.url, chunkHander, options);
  }
  else {
    response = await _chatCompletionStream(tempMessages, ctx.apiKey, ctx.model, ctx.url, chunkHander, options);
  }
  _debugLog(response);

  // --- 結果が正常な場合に、userメッセージと合わせて保持する  --
  // パターン2: 圧縮後のメッセージ配列に置き換えて保持する場合
  if (response.role === 'assistant') {
    tempMessages.push(response);
    ctx.chat_messages = tempMessages; // コンテキストのチャット履歴を置き換える
  }

  _debugLog('after response, messages:', ctx.chat_messages);

  return response;
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

// デバッグ用のエラーログ出力
function _debugError(...args) {
  if (_debugMode) {
    //console.log(...args);
    const STYLE = 'color:white; background-color:red; padding:2px 2px; border-radius:2px;'

    // 呼び出し元の情報を併せて出力する
    const stack = Error().stack.split('\n');
    const line = stack[2] ?? stack[1] ?? stack[0];

    console.log('%cERROR', STYLE, line, ': ', ...args);
  }
}

// デバッグ用のワーニングログ出力
function _debugWarn(...args) {
  if (_debugMode) {
    //console.log(...args);
    const STYLE = 'color:white; background-color:#FFCC33; padding:2px 2px; border-radius:2px;'

    // 呼び出し元の情報を併せて出力する
    const stack = Error().stack.split('\n');
    const line = stack[2] ?? stack[1] ?? stack[0];

    console.log('%cWARN', STYLE, line, ': ', ...args);
  }
}


// ============= inner function ============

// GPTコンテキストを初期化する
// options: { model: xxx, url: xxx, systemMessage: xxx, sendTokenLimit: xxx }
function _initGptContext(apiKey, options) {
  const defaultMessage = _getInitialMessage(options?.systemMessage);
  const gptCtx = {
    apiKey: apiKey,
    model: options?.model ?? _DEFAULT_CHAT_MODEL,
    url: options?.url ?? _DEFAULT_CHATAPI_URL,
    sendTokenLimit: options?.sendTokenLimit ?? _DEFAULT_TOKEN_LIMIT,
    apiMode: options?.apiMode ?? 'openai',
    // options: {
    //   model: options.model ?? _CHAT_MODEL,
    //   sendTokenLimit: options.sendTokenLimit ?? _TOKEN_LIMIT,
    //   //maxTokens: options.maxTokens ?? _TOKEN_LIMIT,
    //   url: options.url ?? _CHATAPI_URL,
    //   temperature: options.temperature ?? 0.7,
    // }
    chat_messages: defaultMessage,
  };

  return gptCtx;
}

// 初期値のメッセージ履歴を用意する
function _getInitialMessage(sytemMessage) {
  const messages = [];

  if (sytemMessage) {
    messages.push({
      role: 'system',
      content: sytemMessage,
    });
  }
  else {
    messages.push(_DEFAULT_SYSTEM_MESSAGE);
  }

  return messages;
}

// ヘッダーを組み立てる
function _buildHeaders(apiKey, url) {
  const useAzure = isOnAzure(url);

  if (useAzure) {
    const headers = {
      "Content-Type": "application/json",
      "api-key": `${apiKey}`,
    };
    return headers;
  }
  else {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    return headers;
  }
}

// bodyにオプションを反映する
function _mergeOptions(body, options) {
  // temperature
  if (options?.temperature) {
    body['temperature'] = options.temperature;
  }

  // max_tokens
  if (options?.max_tokens) {
    const max_tokens = options.max_tokens;
    if (max_tokens > _MAX_TOKEN_LIMIT) {
      throw (`max_tokens(${max_tokens}) is over the limit(${_MAX_TOKEN_LIMIT}).`);
    }
    body['max_tokens'] = options.max_tokens;
  }
}

// Azure OpenAI API かどうかを判定する
function isOnAzure(url) {
  return url.includes('openai.azure.com/openai/');
}

// chat API を呼び出す
async function _chatCompletion(messages, apiKey, chatModel, url, options) {
  // Chat APIにリクエストを送信する
  const streamFlag = false
  const packedMessage = await _sendRequestToChatAPI(messages, apiKey, chatModel, url, streamFlag, options);
  if (packedMessage.role === 'error') {
    return packedMessage;
  }
  const res = packedMessage.response;

  // 応答を解析
  const data = await res.json().catch(err => {
    _debugLog(err);
    return {
      role: 'error',
      content: 'Result Parse Erorr, Please try again.',
    };
  });
  _debugLog(data);
  //_debugLog(data.usage);

  // データ（JSON）から応答を組み立てる
  const message = _buildMessageFromChoice(data);
  return message;
};

// データ（JSON）から応答を組み立てる
function _buildMessageFromChoice(data) {
  const choiceIndex = 0;
  const choices = data?.choices;
  if (choices) {
    return choices[choiceIndex]?.message ?? { role: 'error', content: 'Response Empty' };
  }
  else {
    return {
      role: 'error',
      content: 'Sever Erorr, Please try again.',
    };
  }
}

// Chat APIにリクエストを送信する
async function _sendRequestToChatAPI(messages, apiKey, chatModel, url, streamFlag, options) {
  const bodyJson = {
    messages: messages,
    model: chatModel,
    stream: streamFlag ?? false,
  };
  _mergeOptions(bodyJson, options);

  const body = JSON.stringify(bodyJson);
  const headers = _buildHeaders(apiKey, url);

  const res = await fetch(url, {
    method: "POST",
    headers: headers,
    body,
  }).catch(e => {
    console.error(e);
    return {
      role: 'error',
      content: 'Network ERROR, Please try again.',
    };
  });
  if (res?.role === 'error') {
    return res;
  }

  // エラー判定
  if (!res.ok) {
    const responseText = await res.text();
    _debugLog(res, responseText);
    return {
      role: 'error',
      content: 'Server Error:' + res.status + '. ' + responseText,
    };
  }

  // 結果をパックして返す
  return {
    role: 'response',
    response: res,
  }
}

// Ollama形式のchat API を呼び出す
async function _ollamaChatCompletion(messages, apiKey, chatModel, url, options) {
  // Chat APIにリクエストを送信する
  const streamFlag = false
  const packedMessage = await _sendRequestToChatAPI(messages, apiKey, chatModel, url, streamFlag, options);
  if (packedMessage.role === 'error') {
    return packedMessage;
  }
  const res = packedMessage.response;

  // 複数の応答を解析
  const responseText = await res.text();
  const resultMessage = await _buildMessageFromMultiLineString(responseText);
  return resultMessage;
};

// Ollama形式の、複数業文字列から応答を組み立てる
function _buildMessageFromMultiLineString(text) {
  const lines = text.split('\n');
  _debugLog(lines);

  let contentText = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 0) {
      try {
        const json = JSON.parse(line);
        if (json?.message?.content) {
          contentText += json.message.content;
        }
        if (json?.done) {
          break;
        }
      }
      catch (err) {
        _debugError('line parse error:', err);
      }
    }
  };
  //_debugLog('contentText:', contentText);

  return {
    role: 'assistant',
    content: contentText,
  };
}

// Ollama形式のchat API を呼び出し、ストリーミングで応答を返す
// 参考: https://zenn.dev/himanushi/articles/99579cf407c30b
async function _ollamaChatCompletionStream(messages, apiKey, chatModel, url, chunkHander, options) {
  // -- Chat APIにリクエストを送信する --
  const streamFlag = true;
  const packedMessage = await _sendRequestToChatAPI(messages, apiKey, chatModel, url, streamFlag, options);
  if (packedMessage.role === 'error') {
    return packedMessage;
  }
  const res = packedMessage.response;

  // ReadableStream として使用する
  const reader = res.body?.getReader();
  if (!reader) {
    _debugError('ERROR to get streaming');
    return {
      role: 'error',
      content: 'Server Error: No Streaming response',
    };
  }

  let resultText = '';
  const decoder = new TextDecoder('utf-8');
  try {
    // この read で再起的にメッセージを待機して取得します
    const read = async () => {
      const { done, value } = await reader.read();
      if (done) return reader.releaseLock();

      const chunk = decoder.decode(value, { stream: true });
      _debugLog('chunk:', chunk);
      const text = _handleSingleStreamString(chunk);
      resultText += text;

      if (chunkHander && typeof chunkHander === 'function') {
        chunkHander(text);
      }

      return read();
    };
    await read();
  } catch (e) {
    console.error(e);
    return { role: 'error', content: e.message };
  }
  finally {
    // 例外が発生しても、最後は必ず解放する
    console.log('finally releaseLock');
    reader.releaseLock();
  }

  // 最終結果を返す
  return { role: 'assistant', content: resultText };
};

// Ollama形式の、単一文字列からストリーミングテキストを抜き出す
function _handleSingleStreamString(str) {
  let tokenText = "";
  if (str && str.length > 0) {
    try {
      const json = JSON.parse(str);
      if (json?.message?.content) {
        tokenText += json.message.content;
      }
    }
    catch (err) {
      _debugError('string parse error:', err);
    }
  }
  else {
    _debugError('error: empty string');
  }

  return tokenText;
}

// chat API を呼び出し、ストリーミングで応答を返す
// 参考: https://zenn.dev/himanushi/articles/99579cf407c30b
async function _chatCompletionStream(messages, apiKey, chatModel, url, chunkHander, options) {
  // -- Chat APIにリクエストを送信する --
  const streamFlag = true;
  const packedMessage = await _sendRequestToChatAPI(messages, apiKey, chatModel, url, streamFlag, options);
  if (packedMessage.role === 'error') {
    return packedMessage;
  }
  const res = packedMessage.response;

  // ReadableStream として使用する
  const reader = res.body?.getReader();
  if (!reader) {
    _debugError('ERROR to get streaming');
    return {
      role: 'error',
      content: 'Server Error: No Streaming response',
    };
  }

  let resultText = '';
  let holdText = ''; // 中途半端なテキストを保持する
  const decoder = new TextDecoder('utf-8');
  try {
    // この read で再起的にメッセージを待機して取得します
    const read = async () => {
      const { done, value } = await reader.read();
      if (done) return reader.releaseLock();

      // 前回の中途半端なテキストが残っていたら、それも含めて処理する
      const chunk = holdText + decoder.decode(value, { stream: true });
      holdText = ''; // 一旦クリア
      // この chunk には以下のようなデータ格納されている。複数格納されることもある。
      // data: { ... }
      // これは Event stream format と呼ばれる形式
      // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
      //_debugLog(chunk);

      // ====※Ollamaの場合、chuckに複数行のテキスト（JSON）が格納されているため、それを解析する====
      // TODO: この部分を適切に解析して、最終的な結果を取得する
      // つまり、streaming にはなっていない


      const jsons = chunk
        .split('data:') // 複数格納されていることもあるため split する
        // data を json parse する
        // [DONE] は最後の行にくる
        .map((data) => {
          const trimData = data.trim();
          if (trimData === '') {
            //_debugLog('empty chunk data');
            return '';
          }
          if (trimData === '[DONE]') {
            //_debugLog('[DONE] chunk data');
            return '';
          }
          // trimDataが'}'で終わっていない場合は、中途半端なテキスト
          if (trimData[trimData.length - 1] !== '}') {
            holdText = trimData;
            _debugWarn('NOT complete chunk. holdText:', holdText);
            return '';
          }

          // --- parse JSON --- 
          try {
            jsonData = JSON.parse(trimData);
            return jsonData;
          }
          catch (e) {
            _debugError('=== JSON parse ERROR:', e);
            _debugError('=== chunk data:', data);
            return '';
          }
        })
        .filter((data) => data);

      // あとはこの jsons を好きに使用する
      //console.log('jsons::', jsons);
      const text = _buildSteamResult(jsons);
      resultText += text;
      if (chunkHander && typeof chunkHander === 'function') {
        chunkHander(text);
      }

      return read();
    };
    await read();
  } catch (e) {
    console.error(e);
    return { role: 'error', content: e.message };
  }
  finally {
    // 例外が発生しても、最後は必ず解放する
    console.log('finally releaseLock');
    reader.releaseLock();
  }

  // // ReadableStream を最後は解放する
  // reader.releaseLock();

  // 最終結果を返す
  return { role: 'assistant', content: resultText };
};

function _buildSteamResult(jsons) {
  let text = '';
  for (let i = 0; i < jsons.length; i++) {
    const json = jsons[i];
    if (json.choices) {
      const choice = json.choices[0];
      const content = choice?.delta?.content ?? '';
      text += content;
    }
  }
  return text;
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
    tokenLimitWithSystem = tokenLimit - firstMessage.content.length;
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
  return message.content.length;
}

// メッセージ単体を短くする（文字数による近似）
function _shortenMessage(message, tokenLimit) {
  const content = message.content;
  message.content = content.substring(0, tokenLimit);
}