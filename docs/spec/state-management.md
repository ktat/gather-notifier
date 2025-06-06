# 状態管理

## 通知状態
- **hasNotification** (boolean) - 未読通知の有無
- **offscreenCreated** (boolean) - offscreenドキュメント作成状態

## 状態保存
- `chrome.storage.local` - ブラウザ再起動後も状態保持
- メモリ変数 - 即座なアクセス用

## 状態遷移

### 通知発生時
1. `hasNotification = true`
2. バッジ表示 (`!` マーク、赤背景)
3. 音声再生開始
4. ローカルストレージに保存

### 通知クリア条件
- 拡張機能アイコンクリック
- gather.townタブアクティベート
- ポップアップで手動クリア

### 通知クリア時
1. `hasNotification = false`
2. バッジ非表示
3. 音声停止
4. ローカルストレージ更新

## タブ管理
- **gatherTabs** (Set) - gather.townタブのID一覧
- タブ更新時に自動追加
- タブ閉鎖時に自動削除
- アクティブタブ変更監視

## 初期化
- 拡張機能インストール時: すべて初期化
- ブラウザ起動時: ローカルストレージから復元