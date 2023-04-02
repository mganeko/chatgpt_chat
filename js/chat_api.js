//
// ChatGPT API wrapper
//

// ======= innser variable =========
const _debugMode = true; // true / false
//const _debugMode = false; // true / false

const _CHAT_MODEL = "gpt-3.5-turbo";
const _TOKEN_LIMIT = 3900;
//const _TOKEN_LIMIT = 100; // for debug, cause ERROR

//const _CHAT_MODEL = "gpt-4";
//const _TOKEN_LIMIT = 7900;


const _chatapi_messages = [{
  role: 'system',
  content: 'あなたは親切なアシスタントです',
}];

// ============== public function ==============
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
  _messageCompaction(tempMessages);
  _debugLog('tempMessages:', tempMessages);

  // -- request --
  const response = await _chatCompletion(tempMessages, apiKey);
  _debugLog(response);

  // 結果が正常な場合に、userメッセージと合わせて保持する
  if (response.role === 'assistant') {
    _chatapi_messages.push(userMessage);
    _chatapi_messages.push(response);
  }
  //_debugLog('messages:', _chatapi_messages);

  return response;
}

// ============= inner function ============

function _debugLog(...args) {
  if (_debugMode) {
    console.log(...args);
  }
}

async function _chatCompletion(messages, apiKey) {
  //const apiKey = API_KEY;
  const CHATAPI_URL = "https://api.openai.com/v1/chat/completions";

  const body = JSON.stringify({
    messages,
    model: _CHAT_MODEL,
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
    return choices[choiceIndex]?.message ?? { role: 'error', content : 'Response Empty'};
  }
  else {
    return {
      role: 'error',
      content: 'Sever Erorr, Plase try again.',
    };
  }
};

function _messageCompaction(messages) {
  let size = _calcTokenSize(messages);
  _debugLog("total token sise:", size);
  while (size > _TOKEN_LIMIT) {
    _debugLog("Message Token total Size %d, over Limit %d", size, _TOKEN_LIMIT);
    _removeMessage(messages, _TOKEN_LIMIT);
    size = _calcTokenSize(messages)
  }
}

function _removeMessage(messages, limitLength) {
  if(messages.length === 0) {
    // メッセージがない場合は、何もしない
    return;
  }
  else if (messages.length === 1) {
    // メッセージが1つの場合は、それを短くする
    const lastMessage = messages[0];
    lastMessage.content = _shortenContent(lastMessage.content, limitLength);
    _debugLog('shorten last message:', lastMessage);
    return;
  }

  // ==== メッセージが2つ以上の場合 ===
  // systemロールをスキップ
  let removeIndex = 0;
  if (messages[0].role === 'system') {
    removeIndex = 1;
  }

  // --- 最後のメッセージの場合は短くする ---
  if (removeIndex === messages.length - 1) {
    const lastMessage = messages[removeIndex];
    lastMessage.content = _shortenContent(lastMessage.content, limitLength);
    _debugLog('shorten last message:', lastMessage);
  }
  else {
    // --- 最後でなければ、除去する ---
    const removedMessage = messages.splice(removeIndex, 1);
    _debugLog('remove message:', removedMessage);
  }
}


function _calcTokenSize(messages) {
  let totalSize = 0;
  messages.forEach(message => {
    totalSize += _calcSingleMessageToken(message);
  });
  return totalSize;
}

function _calcSingleMessageToken(message) {
  return message.content.length;
}

function _shortenContent(content, limitLength) {
  content.substring(0, limitLength);
}