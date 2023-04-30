#!/bin/sh

# This script converts the chat_api.js (for browser) to Node.js CommonJS.

cat cjs_header.js > chat_api_cjs.js
cat ../js/chat_api.js >> chat_api_cjs.js

