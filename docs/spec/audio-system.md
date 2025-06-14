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

## エラーハンドリング
- AudioContext作成失敗時はコンソールにエラー出力
- メッセージ送信失敗時はcatch処理