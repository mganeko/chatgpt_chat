//
// example.js
//
// usage:
//  $ sh to_cjs.sh
//  $ npm install node-fetch@2
//  $ export OPENAI_API_KEY='sk-xxxxx'
//  $ node example.js


const API_KEY=process.env.OPENAI_API_KEY;
const chatapi = require('./chat_api_cjs');

async function chat() {
  const ctx = chatapi.initChat(API_KEY);
  const result = await chatapi.postChatText("富士山の高さは？", ctx);
  const content = result.content;
  console.log(content);
}

chat();