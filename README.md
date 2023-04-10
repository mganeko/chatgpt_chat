# chatgpt_chat

- ChatGPTのAPIを利用した、ごく簡単なチャットサンプル
- OpenAIのAPIキーが必要です


## 使い方

- ファイル群を、Webサーバーに配置
- js/config.templete.js を、js/config.js　にコピー
  - API_KEYの値を、発行したAPIキーに書き換え
  - HEADER_ELEMENTの値を変更すると、ヘッダー部分の要素をカスタマイズ可能
- ブラウザーからアクセス
  - サーバーのURL/index.html 



## ライセンス/Lisence

- MIT


## ToDo

- [ ] メッセージの圧縮(_messageCompaction)のアルゴリズム改善
  - [x] シンプル。先頭から除去
  - [x] system ロールは保持
  - [ ] systemロール、初回の一往復を保持
  - [ ] 情報量が多いやり取りを保持？ 
  - [ ] 情報量の判定方法を考える
- [ ] UI改善
  - [x] 一番上に、ヘッダー要素を表示
      - [x] config.js の内容を差し込む
  - [x] ボタンを日本語に（送信）... 指定抜きで、デフォルトに任せる
  - [x] multilineで、ctrl+enterで送信
  - [x] 最初(userの最新のテキスト)が巨大すぎる場合の対処
    - [x] 全部除外するのではなく、文字列を切る
  - [x] 改行が消えて繋がってしまう現象を修正
  - [ ] AI回答が会ったときの、自動スクロール
  - [ ] ストリーミング対応
- [ ] バグ修正
  - [x] 1つの入力が長い（limit以上）の場合に短縮するロジックのバグを修正
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
  - [x] chat_api.jsの内部関数でグローバル定数を参照するのをやめる
  - [ ] init()関数を用意、モデルやトークン上限を指定できるようにする
  - [ ] GPT-contextの導入し、chat_api.jsのグローバル変数(_chatapi_messages)を無くす
    - [ ] system ロールの別保持
    - [ ] user-important ロールを用意
    - [ ] compactionアルゴリズムで、 systemロールとuser-importantロールをキープ


