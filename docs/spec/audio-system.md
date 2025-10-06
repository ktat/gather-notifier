# 音声システム

## Offscreen Document方式
Chrome MV3のService Worker音声制限を回避するためoffscreenドキュメントを使用

## 実装構造
- **offscreen.html** - 音声再生専用のHTMLページ
- **offscreen.js** - Web Audio API使用の音声生成・再生
- **background.js** - offscreenドキュメント管理・メッセージ送信

## 音声仕様

### Wave通知
- **音色**: ベル音（800Hz → 400Hz、0.5秒減衰）
- **ループ**: より長い間隔で繰り返し
- **音量**: 0.3（30%）

### Chat通知
- **音色**: 明瞭で高音のベル音
- **ループ**: より静かで長い間隔
- **音量**: 0.3（30%）

### Call通知
- **音色**: ベル音（800Hz → 400Hz、0.5秒減衰）
- **ループ**: 2秒間隔で繰り返し
- **音量**: 0.3（30%）

## メッセージAPI
### playSound
```javascript
chrome.runtime.sendMessage({ action: 'playSound' });
```

### stopSound
```javascript
chrome.runtime.sendMessage({ action: 'stopSound' });
```

## 作成・削除
- **作成**: 初回音声再生時に自動作成
- **削除**: 拡張機能無効化時に自動削除
- **状態**: `offscreenCreated`フラグで管理
- **準備完了シグナル**: offscreenドキュメントは初期化完了時に`offscreenReady`メッセージを送信
  - backgroundは`offscreenReadyPromise`で準備完了を待機（1秒タイムアウト）
  - 実際の存在確認: `chrome.offscreen.hasDocument()`で検証（利用可能な場合）
  - より確実な音声再生のためのライフサイクル管理

## エラーハンドリング
- AudioContext作成失敗時はコンソールにエラー出力
- メッセージ送信失敗時はcatch処理

## デバッグログ

### Background Script (debugMode有効時のみ)
- `[DEBUG] [BACKGROUND] Offscreen document already exists` - 既にoffscreenが存在
- `[DEBUG] [BACKGROUND] Creating new offscreen document` - 新しいoffscreenドキュメント作成中
- `[DEBUG] [BACKGROUND] Offscreen document created, waiting for ready signal` - 作成完了、準備完了シグナル待機中
- `[DEBUG] [BACKGROUND] Offscreen ready signal received` - 準備完了シグナル受信
- `[DEBUG] [BACKGROUND] Offscreen document ready` - offscreenドキュメント準備完了
- `[DEBUG] [BACKGROUND] playNotificationSound called, type: <type>` - 音声再生呼び出し
- `[DEBUG] [BACKGROUND] Sending playSound message to offscreen` - offscreenへメッセージ送信
- `[DEBUG] [BACKGROUND] playSound response: <response>` - offscreenからの応答
- `[DEBUG] [BACKGROUND] Stopping notification sound` - 音声停止中
- `[DEBUG] [BACKGROUND] Cannot stop sound - offscreen not created` - offscreen未作成で停止不可

### Offscreen Script (常時出力)
- `[OFFSCREEN] Offscreen document loaded` - offscreenドキュメント読み込み完了
- `[OFFSCREEN] Sending ready signal to background` - background scriptへ準備完了シグナル送信
- `[OFFSCREEN] Message received: <message>` - メッセージ受信
- `[OFFSCREEN] Playing sound, type: <type>` - 音声再生開始
- `[OFFSCREEN] Stopping sound` - 音声停止
- `[OFFSCREEN] playNotificationSound started, type: <type>` - 再生処理開始
- `[OFFSCREEN] Sound config: <config>` - 音声設定
- `[OFFSCREEN] Initial sound played` - 初回音声再生完了
- `[OFFSCREEN] Playing loop sound` - ループ音声再生
- `[OFFSCREEN] Audio player interval set: <interval> ms` - インターバル設定完了
- `[OFFSCREEN] playSingleSound called with config: <config>` - 単一音声再生呼び出し
- `[OFFSCREEN] Sound oscillator started and scheduled to stop` - オシレーター開始
- `[OFFSCREEN] Clearing audio player interval` - インターバルクリア
- `[OFFSCREEN] No audio player to stop` - 停止する音声なし

### トラブルシューティング用途
これらのログは音声が再生されない問題の診断に使用：
1. offscreenドキュメントが正常に作成されているか
2. メッセージがoffscreenに到達しているか
3. 音声再生処理が開始されているか
4. オーディオパイプラインにエラーがないか