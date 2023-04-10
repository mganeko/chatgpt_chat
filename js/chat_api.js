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
* @returns {object} 応答 - { role: 'assistant' / 'error', content: 生成されたテキスト }
* @example postChatText('世界で一番高い山は？, 'xxxxxxxxxx'); // returns { role: 'assistant', content: 'エベレスト'}
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
  const response = await _chatCompletion(tempMessages, apiKey, _CHAT_MODEL);
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
    const line = Error().stack.split('\n')[2]; //.split(':')[1];
    console.log(line, ': ', ...args);
  }
}

// ============= inner function ============

// chat API を呼び出す
async function _chatCompletion(messages, apiKey, chatModel) {
  //const apiKey = API_KEY;
  const CHATAPI_URL = "https://api.openai.com/v1/chat/completions";

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
    return {
      role: 'error',
      content: 'Network ERROR, Plase try again.',
    };
  });

  // エラー判定
  if (!res.ok) {
    const responseText = await res.text();
    _debugLog(res, responseText);
    return {
      role: 'error',
      content: 'Server Error:' + res.status + '. ' + responseText,
    };
  }

  // 応答を解析
  const data = await res.json();
  _debugLog(data);
  //_debugLog(data.usage);

  const choiceIndex = 0;
  const choices = data?.choices;
  if (choices) {
    return choices[choiceIndex]?.message ?? { role: 'error', content: 'Response Empty' };
  }
  else {
    return {
      role: 'error',
      content: 'Sever Erorr, Plase try again.',
    };
  }
};

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
// function _shortenContent(content, tokenLimit) {
//   return content.substring(0, tokenLimit);
// }

function _shortenMessage(message, tokenLimit) {
  const content = message.content;
  message.content = content.substring(0, tokenLimit);
}