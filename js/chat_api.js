//
// ChatGPT API wrapper
//

// ======= innser variable =========
const _debugMode = false; // true / false
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
    model: "gpt-3.5-turbo",
  });

  const res = await fetch(CHATAPI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });
  const data = await res.json();
  //_debugLog(data);
  _debugLog(data.usage);

  const choice = 0;
  return data.choices[choice].message;
};

function _messageCompaction(messages) {
  const TOKEN_LIMIT = 3900;
  let size = _calcTokenSize(messages);
  _debugLog("total token sise:", size);
  while (size > TOKEN_LIMIT) {
    _debugLog("Size %d over Limit %d", size, TOKEN_LIMIT);
    _removeMessage(messages);
    size = _calcTokenSize(messages)
  }
}

function _removeMessage(messages) {
  const first = messages.shift();
  _debugLog('remove:', first);
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

