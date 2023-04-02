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
  - [x] system ロールは保持
  - [ ] systemロール、初回の一往復を保持
  - [ ] 情報量が多いやり取りを保持？ 
  - [ ] 情報量の判定方法を考える
- [x] 最初(userの最新のテキスト)が巨大すぎる場合の対処
  - [x] 全部除外するのではなく、文字列を切る
- [ ] userメッセージの送信後にエラーが返ってきた場合
  - [x] 一律なエラーメッセージ表示（ネットワークエラー）
  - [x] エラーはassistantでなく、errorロールを作成
  - [x] サーバーのエラーメッセージを伝える
  - [ ] 適切な情報を分かりやすく利用者に伝える 
  - [x] userメッセージとassistantの返答とペアで、メッセージ保持から除外する
- [ ] GPT-contextの導入
  - [ ] system ロールの別保持
  - [ ] user-important ロールを用意
  - [ ] comcationアルゴリズムで、 systemロールとuser-importantロールをキープ


