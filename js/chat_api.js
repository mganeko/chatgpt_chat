//
// ChatGPT API wrapper
//

const chatapi_messages = [{
  role: 'system',
  content: 'あなたは親切なアシスタントです',
}];

async function postText(text, apiKey) {
  const message = {
    role: 'user',
    content: text,
  };
  chatapi_messages.push(message);

  // -- compaction --
  messageCompaction(chatapi_messages);

  const response = await chatCompletion(chatapi_messages, apiKey);
  //console.log(response);
  chatapi_messages.push(response);

  return response;
}


async function chatCompletion(messages, apiKey) {
  //const apiKey = API_KEY;
  const body = JSON.stringify({
    messages,
    model: "gpt-3.5-turbo",
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });
  const data = await res.json();
  //console.log(data);
  //console.log(data.usage);

  const choice = 0;
  return data.choices[choice].message;
};

function messageCompaction(messages) {
  const TOKEN_LIMIT = 3900;
  let size = calcTokenSize(messages);
  //console.log("total token sise:", size);
  while (size > TOKEN_LIMIT) {
    //console.log("Size %d over Limit %d", size, TOKEN_LIMIT);
    removeMessage(messages);
    size = calcTokenSize(messages)
  }
}

function removeMessage(messages) {
  const first = messages.shift();
  //console.log('remove:', first);
}


function calcTokenSize(messages) {
  let totalSize = 0;
  messages.forEach(message => {
    totalSize += calcSingleMessageToken(message);
  });
  return totalSize;
}

function calcSingleMessageToken(message) {
  return message.content.length;
}

