# chatgpt_chat

- ChatGPTのAPIを利用した、ごく簡単なチャットサンプル
- OpenAIのAPIキーが必要です


## 使い方

- ファイル群を、Webサーバーに配置
- js/config.templete.js を、js/config.js　にコピー
  - API_KEYの値を、発行したAPIキーに書き換え
- ブラウザーからアクセス
  - サーバーのURL/chat.html


## ライセンス/Lisence

- MIT


## ToDo

- [ ] メッセージの圧縮(_messageCompaction)のアルゴリズム改善
 - [x] シンプル。先頭から除去
 - [ ] system ロールは保持
 - [ ] systemロール、初回の一往復を保持
 - [ ] 情報量が多いやり取りを保持？ 
  - [ ] 情報量の判定方法を考える
- [ ] 最初のテキストが巨大すぎる場合の対処
- [ ] userメッセージの送信後にエラーが返ってきた場合
  - [x] 一律なエラーメッセージ表示（ネットワークエラー）
  - [ ] 適切情報を利用者に伝える
  - [ ] userメッセージとassistantの返答とペアで、メッセージ保持から除外する

