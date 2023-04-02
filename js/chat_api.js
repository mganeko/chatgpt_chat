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
  const message = {
    role: 'user',
    content: text,
  };
  _chatapi_messages.push(message);

  // -- compaction --
  _messageCompaction(_chatapi_messages);

  const response = await _chatCompletion(_chatapi_messages, apiKey);
  _debugLog(response);
  _chatapi_messages.push(response);

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
  //return data.choices[choiceIndex].message;
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
    _removeMessage(messages);
    size = _calcTokenSize(messages)
  }
}

function _removeMessage(messages) {
  // --- remove 1st ---
  const first = messages.shift();
  _debugLog('remove message:', first);
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

