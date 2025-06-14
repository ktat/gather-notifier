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

## 変更履歴

### v1.2 - メニュー簡素化とバッジ修正
- **メニュータイトル削除**: ポップアップから「Gather.town Wave Notifier」タイトルを削除
- **通知メッセージ削除**: 「通知はありません」メッセージを非表示に変更
- **バッジクリア修正**: 拡張機能ボタンクリック時にランチタイムバッジを保持するよう修正

### v1.1 - 設定メニューと機能統合
- **設定メニュー追加**: 通知種別の有効/無効切り替え機能
- **ランチタイムモード**: ランチボタンによる一時的な通知無効化
- **Ctrl+U制限対応**: ブラウザセキュリティ制限によりCtrl+U機能を削除
- **操作統合**: gather.townタブ移動ボタンをメニュー上部に追加

### v1.0 - 音声システム強化
- **通知種別対応**: Wave/Chat/Call通知の個別検出と音響設定
- **音声差別化**: Chat用の明瞭・高音ベル音、Wave用の長間隔音声
- **Call通知追加**: `Alerting Ring event`検出によるCall通知対応

### v0.9 - UI改善とクリック動作変更  
- **ポップアップ削除**: 拡張機能ボタンクリックで直接アクション実行
- **クリック検出追加**: gather.townページ内クリックで通知クリア
- **操作簡素化**: ボタンを削除し、よりシンプルな操作に変更