# chatgpt_chat

- ChatGPTのAPIを利用した、ごく簡単なチャットサンプル
- OpenAIのAPIキーが必要です


## 使い方

- ファイル群を、Webサーバーに配置
- js/config.templete.js を、js/config.js　にコピー
  - API_KEYの値を、発行したAPIキーに書き換え
  - HEADER_ELEMENTの値を変更すると、ヘッダー部分の要素をカスタマイズ可能
- ブラウザーからアクセス
  - サーバーのURL/index.html （通常/ストリームモード両用）
- テスト
  - サーバーのURL/test/test_small.html （通信なしのテスト）
  - サーバーのURL/test/test_large.html （通信を含むテスト）

## APIラッパー (js/chat_api.js)
- const ctx = initChat(apiKey, options); // 初期化
- async function postChatText(text, ctx, options); // チャットメッセージを送信し、応答を返す
- async function streamChatText(text, ctx, chunkHander, options); // チャットメッセージを送信し、ストリーミングで応答を返す
  - chunkHander:  function (tokenText) => {}; 

## ライセンス/Lisence

- MIT


## ToDo

- [ ] メッセージの圧縮(_messageCompaction)のアルゴリズム改善
  - [x] シンプル。先頭から除去
  - [x] system ロールは保持
  - [ ] systemロール、初回の一往復を保持
  - [ ] 情報量が多いやり取りを保持？ 
  - [ ] 情報量の判定方法を考える
  - [ ] 過去のやりとりを要約して覚える
- [x] UI改善
  - [x] 一番上に、ヘッダー要素を表示
      - [x] config.js の内容を差し込む
  - [x] ボタンを日本語に（送信）... 指定抜きで、デフォルトに任せる
  - [x] multilineで、ctrl+enterで送信
  - [x] 最初(userの最新のテキスト)が巨大すぎる場合の対処
    - [x] 全部除外するのではなく、文字列を切る
  - [x] 改行が消えて繋がってしまう現象を修正
  - [x] AI回答があったときの、自動スクロール
  - [x] ストリーミング対応 (stream.html)
  - [x] preタグを試す(Not Good.不採用)
  - [ ] max_tokensを2段階に切り替える
- [ ] トークン数を返す、表示する
- [ ] バグ修正
  - [x] 1つの入力が長い（limit以上）の場合に短縮するロジックのバグを修正
  - [ ] token数の調整。生成結果(completion)の max_tokensと、元のメッセージの長さの合計が、上限以内にする必要がある
    - "This model's maximum context length is 4097 tokens. However, you requested 4620 tokens (620 in the messages, 4000 in the completion). Please reduce the length of the messages or completion.",
"type": "invalid_request_error",
- [ ] userメッセージの送信後にエラーが返ってきた場合
  - [x] 一律なエラーメッセージ表示（ネットワークエラー）
  - [x] エラーはassistantでなく、errorロールを作成
  - [x] サーバーのエラーメッセージを伝える
  - [ ] 適切な情報を分かりやすく利用者に伝える 
  - [x] userメッセージとassistantの返答とペアで、メッセージ保持から除外する
- [ ] リファクタリング
  - [x] コメントとをつける
  - [ ] jsdocに従ったコメントにする
    - [x] public 関数
    - [ ] 内部関数
  - [ ] _debugLog() 出力を、config.jsの値で切り替える
  - [x] chat_api.jsの内部関数でグローバル定数を参照するのをやめる
  - [x] initChat()関数を用意、モデルやトークン上限を指定できるようにする
    - [x] API_KEYを渡す (must)
    - [x] contextを返す
    - [x] URL (option)
    - [x] model (option)
    - [ ] model - gpt3.5-burbo-16k, config.js
    - [ ] URL config.js
    - [x] system message (option)
    - [x] send token limit (option)
    - [x] Azure (guess from url)
  - [x] postChatText() / streamChatText() でオプション指定
    - [x] max_tokens (max generated tokens) (option)
    - [x] temperature (option)
  - [x] GPT-contextの導入し、chat_api.jsのグローバル変数(_chatapi_messages)を無くす
    - [-] system ロールの別保持
    - [ ] user-important ロールを用意
    - [ ] compactionアルゴリズムで、 systemロールとuser-importantロールをキープ
    - [x] postChatText()にcontextを渡す
    - [x] streamChatText()にcontextを渡す
    - [ ] _chatCompletion()でcontextを使う
    - [ ] _chatCompletionStream()でcontextを使う
    - [x] 履歴をクリアする clearChatHistory()
    - [x] 履歴を追加する addChatHistory()
- [x] テスト
  - [x] ユニットテスト
    - [x] 同期関数テスト
    - [x] 非同期関数テスト
    - [x] ストリーミングテスト
  - [-] E2E テスト



