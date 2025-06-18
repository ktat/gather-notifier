# Gather.town Notification Notifier

※ このコードは、Claude Code によって書かれました。

gather.townでwave、chat、callの通知を受信したときにデスクトップ通知を表示するChrome拡張機能です。

[Chrome Web Store](https://chromewebstore.google.com/detail/gathertown-wavechat-notif/ipilclmmmipimknhiklcnpidkcdjooad?authuser=0)

## 特徴

- **高度な通知検出**: MAIN worldとISOLATED worldの両方を使用した確実なログ監視
- **音声通知**: 通知タイプに応じた音響フィードバック
- **応答不可モード**: 集中したい時の通知一時停止機能
- **自動タブ管理**: Gather.townタブの自動作成と管理
- **設定可能**: 通知タイプ別の有効/無効設定
- **多言語対応**: 日本語、英語、ドイツ語、フランス語に対応（ブラウザ言語設定に基づく自動選択）

## 機能

1. **通知検出**: gather.townのコンソールログを監視してwave、chat、call通知を検出
2. **デスクトップ通知**: 通知が検出されたときにデスクトップ通知を表示
3. **バッジ表示**: 拡張機能アイコンにバッジで通知状態を表示
4. **タブ管理**: アイコンクリックで通知をクリアしてgather.townタブをアクティブ化
5. **自動クリア**: gather.townタブがアクティブになると自動的に通知をクリア
6. **音声通知**: 通知中に音楽をループ再生（通知クリア時に停止）
7. **集中モード**: 一定時間通知を無効化する応答不可モード機能
8. **設定管理**: 通知種別の個別有効/無効切り替え
9. **自動タブ作成**: Gather.townタブが見つからない場合の自動タブ作成
10. **言語選択**: ポップアップでの手動言語選択ドロップダウン（自動/英語/日本語/ドイツ語/フランス語）
11. **国際化対応**: ブラウザの言語設定または手動選択に基づいて自動的に適切な言語でメッセージを表示

## インストール方法

1. Chromeで `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このフォルダを選択

## 使用方法

1. 拡張機能をインストールしてGather.townページを開く
2. Wave、Chat、Call通知が自動的に検出されてデスクトップ通知が表示される
3. 拡張機能アイコンをクリックしてポップアップから設定を変更
4. 応答不可モードで一時的に通知を無効化
5. 「Gather.townに移動」ボタンでタブを自動作成・切り替え
6. ポップアップ右下のドロップダウンから使用言語を選択

## アイコンの作成

`create-icons.html` をブラウザで開いて各サイズのアイコンをダウンロードしてください。

## ファイル構成

### 主要ファイル
- `manifest.json` - 拡張機能の設定とパーミッション定義
- `background.js` - バックグラウンドスクリプト（通知処理・状態管理）
- `content.js` - ISOLATED worldコンテンツスクリプト（イベント受信）
- `content_main.js` - MAIN worldコンテンツスクリプト（コンソールログ監視）
- `popup.html` - ポップアップUI
- `popup.js` - ポップアップの動作とイベント処理
- `offscreen.html` - オフスクリーンドキュメント（音声再生用）
- `offscreen.js` - Web Audio APIによる音声再生処理

### アセットファイル
- `icon*.png` - 拡張機能のアイコン（16px, 32px, 48px, 128px）
- `create-icons.html` - アイコン作成用HTMLファイル

### 国際化ファイル
- `_locales/en/messages.json` - 英語リソース
- `_locales/ja/messages.json` - 日本語リソース
- `_locales/de/messages.json` - ドイツ語リソース
- `_locales/fr/messages.json` - フランス語リソース

### ドキュメント
- `docs/spec/` - 技術仕様書とアーキテクチャドキュメント
- `CLAUDE.md` - 開発ワークフロー指示書
