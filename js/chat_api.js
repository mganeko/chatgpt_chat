//
// ChatGPT API wrapper
//

// ======= inner variable =========
const _debugMode = true; // true / false
//const _debugMode = false; // true / false

// ---- GPT-3.5 ----
const _CHAT_MODEL = "gpt-3.5-turbo";
const _TOKEN_LIMIT = 3900;
//const _TOKEN_LIMIT = 1000; // for debug, cause ERROR

// ---- GPT-4 ----
//const _CHAT_MODEL = "gpt-4";
//const _TOKEN_LIMIT = 7900;


// --- initial message ---
const _chatapi_messages = [{
  role: 'system',
  content: 'あなたは親切なアシスタントです',
}];

// ============== public function ==============

/*
 * チャットメッセージを送信する
 */
/**
* チャットメッセージを送信し、応答を返す
* @description _chatapi_messages に配列としてやりとりが蓄積される
* @param {string} text - ユーザーからのテキスト
* @param {string} apiKey - OpenAI APIのキー
* @returns {object} 応答 - { message: { role: 'assistant' / 'error', content: 生成されたテキスト }, usage: { completion_tokens: 17, prompt_tokens: 38, total_tokens: 55} }
* @example postChatText('世界で一番高い山は？, 'xxxxxxxxxx'); // returns { message: { role: 'assistant', content: 'エベレスト'}, usage: { completion_tokens: num, prompt_tokens: num, total_tokens: num} }
*/
async function postChatText(text, apiKey) {
  const userMessage = {
    role: 'user',
    content: text,
  };

  // -- そのまま扱う場合 --
  //_chatapi_messages.push(userMessage);
  //_messageCompaction(_chatapi_messages);
  //const response = await _chatCompletion(_chatapi_messages, apiKey);

  // ==== 一時的メッセージ配列を作る ===
  const tempMessages = Array.from(_chatapi_messages);
  tempMessages.push(userMessage);

  // -- compaction --
  _messageCompaction(tempMessages, _TOKEN_LIMIT);
  _debugLog('after compaction tempMessages:', tempMessages);

  // -- request --
  const {message, usage} = await _chatCompletion(tempMessages, apiKey, _CHAT_MODEL);
  _debugLog(message, usage);

  // --- 結果が正常な場合に、userメッセージと合わせて保持する  --
  // パターン1: 圧縮前のメッセージ配列を保持する場合
  // if (response.role === 'assistant') {
  //   _chatapi_messages.push(userMessage);
  //   _chatapi_messages.push(response);
  // }

  // パターン2: 圧縮後のメッセージ配列に置き換えて保持する場合
  if (message.role === 'assistant') {
    tempMessages.push(message);
    _chatapi_messages.splice(0, _chatapi_messages.length); // 空にする
    tempMessages.forEach((m) => _chatapi_messages.push(m)); // 代入する
  }

  _debugLog('after response, messages:', _chatapi_messages);

  return {message: message, usage: usage};
}

// ===== streaming function =====
/*
 * チャットメッセージを送信し、ストリーミングで応答を返す
 */
/**
* チャットメッセージを送信し、ストリーミングで応答を返す
* @description _chatapi_messages に配列としてやりとりが蓄積される
* @param {string} text - ユーザーからのテキスト
* @param {string} apiKey - OpenAI APIのキー
* @returns {object} 応答 - { role: 'assistant' / 'error', content: 生成されたテキスト }
* @example postChatText('世界で一番高い山は？, 'xxxxxxxxxx'); // returns { role: 'assistant', content: 'エベレスト'}
*/
async function streamChatText(text, apiKey, chunkHander) {
  const userMessage = {
    role: 'user',
    content: text,
  };

  // ==== 一時的メッセージ配列を作る ===
  const tempMessages = Array.from(_chatapi_messages);
  tempMessages.push(userMessage);

  // -- compaction --
  _messageCompaction(tempMessages, _TOKEN_LIMIT);
  _debugLog('after compaction tempMessages:', tempMessages);

  // -- request --
  const response = await _chatCompletionStream(tempMessages, apiKey, _CHAT_MODEL, chunkHander);
  _debugLog(response);

  // --- 結果が正常な場合に、userメッセージと合わせて保持する  --
  // パターン1: 圧縮前のメッセージ配列を保持する場合
  // if (response.role === 'assistant') {
  //   _chatapi_messages.push(userMessage);
  //   _chatapi_messages.push(response);
  // }

  // パターン2: 圧縮後のメッセージ配列に置き換えて保持する場合
  if (response.role === 'assistant') {
    tempMessages.push(response);
    _chatapi_messages.splice(0, _chatapi_messages.length); // 空にする
    tempMessages.forEach((m) => _chatapi_messages.push(m)); // 代入する
  }

  _debugLog('after response, messages:', _chatapi_messages);

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

// ============= inner function ============

// chat API を呼び出す
// return {
//   message: { role: 'assistant', content: 'こんにちは' },
//   usage: { completion_tokens: 17, prompt_tokens: 38, total_tokens: 55}
// }
async function _chatCompletion(messages, apiKey, chatModel) {
  //const apiKey = API_KEY;
  const CHATAPI_URL = "https://api.openai.com/v1/chat/completions";
  const USAGE_FOR_ERROR = { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0};

  const body = JSON.stringify({
    messages,
    model: chatModel,
  });

  const res = await fetch(CHATAPI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  }).catch(e => {
    console.error(e);
    const message = {
      role: 'error',
      content: 'Network ERROR, Plase try again.',
    };
    const usage = USAGE_FOR_ERROR;
    return { message: message, usage: usage };

    // return {
    //   role: 'error',
    //   content: 'Network ERROR, Plase try again.',
    // };
  });

  // エラー判定
  if (!res.ok) {
    const responseText = await res.text();
    _debugLog(res, responseText);
    const message = {
      role: 'error',
      content: 'Server Error:' + res.status + '. ' + responseText,
    };
    const usage = USAGE_FOR_ERROR;
    return { message: message, usage: usage };
    // return {
    //   role: 'error',
    //   content: 'Server Error:' + res.status + '. ' + responseText,
    // };
  }

  // 応答を解析
  const data = await res.json();
  _debugLog(data);
  //_debugLog(data.usage);

  const choiceIndex = 0;
  const choices = data?.choices;
  if (choices) {
    const message = choices[choiceIndex]?.message ?? { role: 'error', content: 'Response Empty' };
    const usage = data.usage ?? USAGE_FOR_ERROR;
    return { message: message, usage: usage };
    //return choices[choiceIndex]?.message ?? { role: 'error', content: 'Response Empty' };
  }
  else {
    const message = {
      role: 'error',
      content: 'Sever Erorr, Plase try again.',
    };
    const usage = USAGE_FOR_ERROR;
    return { message: message, usage: usage };
    // return {
    //   role: 'error',
    //   content: 'Sever Erorr, Plase try again.',
    // };
  }
};

// chat API を呼び出し、ストリーミングで応答を返す
// 参考: https://zenn.dev/himanushi/articles/99579cf407c30b
async function _chatCompletionStream(messages, apiKey, chatModel, chunkHander) {
  const CHATAPI_URL = "https://api.openai.com/v1/chat/completions";
  const USAGE_FOR_ERROR = { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0};

  const body = JSON.stringify({
    messages,
    model: chatModel,
    stream: true // ここで stream を有効にする
  });

  const res = await fetch(CHATAPI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  }).catch(e => {
    console.error(e);
    const message = {
      role: 'error',
      content: 'Network ERROR, Plase try again.',
    };
    const usage = USAGE_FOR_ERROR;
    return { message: message, usage: usage };
  });

  // エラー判定
  if (!res.ok) {
    const responseText = await res.text();
    _debugLog(res, responseText);
    const message = {
      role: 'error',
      content: 'Server Error:' + res.status + '. ' + responseText,
    };
    const usage = USAGE_FOR_ERROR;
    return { message: message, usage: usage };
  }

  // ReadableStream として使用する
  const reader = res.body?.getReader();
  if (!reader) {
    _debugLog('ERROR to get streaming');
    const message = {
      role: 'error',
      content: 'Server Error: No Streaming response',
    };
    const usage = USAGE_FOR_ERROR;
    return { message: message, usage: usage };
  }

  let resultText = '';
  const decoder = new TextDecoder('utf-8');
  try {
    // この read で再起的にメッセージを待機して取得します
    const read = async () => {
      const { done, value } = await reader.read();
      if (done) return reader.releaseLock();
  
      const chunk = decoder.decode(value, { stream: true });
      // この chunk には以下のようなデータ格納されている。複数格納されることもある。
      // data: { ... }
      // これは Event stream format と呼ばれる形式
      // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
      console.log(chunk);
      
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
          return JSON.parse(data.trim());
        })
        .filter((data) => data);
  
      // あとはこの jsons を好きに使用する
      //console.log('jsons::', jsons);
      const text = _buildSteamResult(jsons);
      resultText += text;
      if(chunkHander && typeof chunkHander === 'function') {
        chunkHander(text);
      }

      return read();
    };
    await read();
  } catch (e) {
    console.error(e);
    const message = {role: 'error', content: e.message };
    const usage = USAGE_FOR_ERROR;
    return { message: message, usage: usage };
  }
  finally {
    // 例外が発生しても、最後は必ず解放する
    console.log('finally releaseLock');
    reader.releaseLock();
  }

  // // ReadableStream を最後は解放する
  // reader.releaseLock();

  // 最終結果を返す
  const message = {role: 'assistant', content: resultText};
  const usage = USAGE_FOR_ERROR;
  return { message: message, usage: usage };
};

function _buildSteamResult(jsons) {
  let text = '';
  for(let i = 0; i < jsons.length; i++) {
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

// 過去のメッセージ全体のトークンサイズを計算する
function _calcTokenSize(messages) {
  let totalSize = 0;
  messages.forEach(message => {
    totalSize += _calcSingleMessageToken(message);
  });
  return totalSize;
}

// メッセージ単体のトークンサイズを計算する
function _calcSingleMessageToken(message) {
  return message.content.length;
}

// メッセージ単体を短くする
function _shortenMessage(message, tokenLimit) {
  const content = message.content;
  message.content = content.substring(0, tokenLimit);
}