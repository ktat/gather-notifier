# Gather.town Wave Notifier - 技術仕様書

## ドキュメント一覧

### [architecture.md](./architecture.md)
システム全体のアーキテクチャ、コンポーネント構成、データフロー

### [detection-logic.md](./detection-logic.md)  
コンソールログ検出の仕組み、オーバーライド方法、検出ロジック

### [state-management.md](./state-management.md)
通知状態管理、タブ管理、ローカルストレージ操作

### [audio-system.md](./audio-system.md)
Offscreen Document方式の音声システム、Web Audio API使用法

### [troubleshooting.md](./troubleshooting.md)
よくある問題と解決方法、デバッグ手順

### [testing.md](./testing.md)
動作テスト手順、手動テスト関数の使用方法

## 開発時の注意事項

1. **Chrome MV3対応**: Service Workerの制限を理解して開発
2. **MAIN/ISOLATED World**: 実行環境の違いを意識
3. **無限ループ防止**: コンソールログ監視時のプレフィックス使用
4. **権限管理**: manifest.jsonの権限設定
5. **エラーハンドリング**: 各コンポーネントでのtry-catch実装

## 重要なファイル
- `manifest.json` - 権限・実行環境定義
- `content_main.js` - コンソール監視のコア機能
- `background.js` - 状態管理・通知制御
- `offscreen.js` - 音声再生処理