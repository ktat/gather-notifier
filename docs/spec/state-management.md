# 状態管理

## 通知状態
- **hasNotification** (boolean) - 未読通知の有無
- **offscreenCreated** (boolean) - offscreenドキュメント作成状態
- **isConcentrationMode** (boolean) - 応答不可モード状態
- **language** (string) - UI言語設定 ('auto', 'en', 'ja', 'de', 'fr')
- **notificationSettings** (object) - 通知種別設定
  - **wave** (boolean) - Wave通知の有効/無効
  - **chat** (boolean) - Chat通知の有効/無効  
  - **call** (boolean) - Call通知の有効/無効

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
- 拡張機能アイコンクリック（設定メニューと同時）
- gather.townページ内のクリック
- 応答不可モード時は通知自体が無効化

### 通知クリア時
1. `hasNotification = false`
2. バッジ非表示（応答不可モードバッジは保持）
3. 音声停止
4. ローカルストレージ更新

### 応答不可モード
- **開始時**: `isConcentrationMode = true`、バッジに「C」表示、gather.townタブ移動
- **終了時**: `isConcentrationMode = false`、応答不可モードバッジ削除
- **効果**: 全通知を無効化、音声再生なし

## タブ管理
- **gatherTabs** (Set) - gather.townタブのID一覧
- タブ更新時に自動追加
- タブ閉鎖時に自動削除
- アクティブタブ変更監視

## 初期化
- 拡張機能インストール時: すべて初期化
- ブラウザ起動時: ローカルストレージから復元

## Chrome Storage Local スキーマ

```javascript
{
  // 通知関連状態
  hasNotification: boolean,        // 未読通知の有無
  enableWave: boolean,            // Wave通知の有効性 (デフォルト: true)
  enableChat: boolean,            // Chat通知の有効性 (デフォルト: true)  
  enableCall: boolean,            // Call通知の有効性 (デフォルト: true)
  
  // 応答不可モード
  isConcentrationMode: boolean,   // 応答不可モードの状態 (デフォルト: false)
  
  // UI設定
  language: string               // UI言語設定 (デフォルト: 'auto')
}
```

## ストレージライフサイクル

```mermaid
sequenceDiagram
    participant install as Extension Install
    participant storage as Chrome Storage
    participant bg as Background Script
    participant popup as Popup UI
    participant content as Content Script

    rect rgb(240, 248, 255)
        Note over install,content: 初期化
        install->>storage: 初期値設定<br/>{hasNotification: false,<br/> enableWave/Chat/Call: true,<br/> isConcentrationMode: false}
        install->>bg: onInstalled イベント
        bg->>bg: previousConcentrationMode = false
    end

    rect rgb(255, 248, 240)
        Note over install,content: 通知検出時
        content->>bg: chrome.runtime.sendMessage(waveDetected)
        bg->>storage: hasNotification = true
        bg->>bg: updateBadge() 実行
    end

    rect rgb(248, 255, 248)
        Note over install,content: ポップアップ開封時
        popup->>storage: hasNotification = false (自動クリア)
        popup->>storage: 設定値読み込み
        popup->>bg: chrome.runtime.sendMessage(stopSound)
    end

    rect rgb(255, 240, 248)
        Note over install,content: 設定変更時
        popup->>storage: enableWave/Chat/Call 更新
        popup->>storage: isConcentrationMode 切り替え
        popup->>bg: chrome.runtime.sendMessage(toggleConcentrationMode)
    end

    rect rgb(248, 240, 255)
        Note over install,content: タブアクティブ時
        bg->>storage: hasNotification = false (gather.townタブ時)
        bg->>bg: updateBadge() 実行
    end
```

## ストレージ変更監視

```mermaid
sequenceDiagram
    participant change as Storage Change
    participant popup as Popup UI
    participant bg as Background Script

    rect rgb(240, 248, 255)
        Note over change,bg: ポップアップでの監視
        change->>popup: chrome.storage.onChanged.addListener()
        alt changes.hasNotification || changes.isConcentrationMode
            popup->>popup: updateStatus() 実行
        end
        alt changes.isConcentrationMode
            popup->>popup: loadSettings() 実行
            popup->>popup: ボタンテキスト更新
        end
    end

    rect rgb(255, 248, 240)
        Note over change,bg: バックグラウンドでの監視
        change->>bg: setInterval(checkConcentrationModeStatus, 1000)
        bg->>bg: 前回値と現在値を比較
        alt 応답불가モード終了検出
            bg->>bg: gather.townタブに clickResponseButton メッセージ送信
        end
    end
```