# 検出ロジック

## 検出対象
gather.townページのコンソールログで以下の文字列を検出：
- `Alerting Wave event` - Wave通知
- `Skipping ChatV2 notification` - Chat通知  
- `Alerting Ring event` - Call通知

## システム構成図

```plantuml
@startuml
participant "Gather.town Page" as page
participant "content_main.js\n(MAIN World)" as main
participant "content.js\n(ISOLATED World)" as isolated
participant "Background Script" as bg
participant "Notification System" as notif

note over page, notif: Console Override Initialization
page -> main: Load script
main -> main: Save original console methods
main -> main: Override console.log/warn/error/info/debug
main -> page: Console methods replaced

page -> isolated: Load script
isolated -> page: Inject legacy console override
isolated -> isolated: Setup event listeners
@enduml
```

## 検出方法

### MAIN World Console Override
- `content_main.js`（MAIN world）でページの`console.log/warn/error/info/debug`をオーバーライド
- 元の関数を保存してから新しい関数で置き換え
- 無限ループ防止のため`[WAVE-NOTIFIER]`プレフィックスのメッセージを無視
- ページのJavaScriptと同じ実行環境でより確実にログを捕捉

### 二重検出システム
- `content.js`（ISOLATED world）でも従来方式の検出を継続
- `content_main.js`からのCustomEventを優先的に処理
- フォールバック機能として両方式を並行実行

## イベント検出フロー

```plantuml
@startuml
participant "Gather.town JS" as js
participant "Overridden Console" as console
participant "content_main.js" as main
participant "content.js" as isolated
participant "Background Script" as bg
participant "Chrome Notification" as notif

js -> console: console.log("Alerting Wave event")
console -> main: checkForWaveEvents(args, 'log')
main -> main: Convert args to string
main -> main: Check for WAVE-NOTIFIER prefix
alt Message contains target string
    main -> main: Detect notification type\n(wave/chat/call)
    main -> main: Log detection
    main -> window: dispatchEvent('waveDetectedMain')
    window -> isolated: waveDetectedMain event
    isolated -> bg: chrome.runtime.sendMessage(waveDetected)
    bg -> notif: chrome.notifications.create()
    notif -> user: Show notification
end
console -> js: Return original console.log result
@enduml
```

## 二重検出システムの相互作用

```plantuml
@startuml
participant "Gather.town Page" as page
participant "MAIN World\n(content_main.js)" as main
participant "ISOLATED World\n(content.js)" as isolated
participant "Background Script" as bg

note over page, bg: Dual Detection System

== Primary Detection (MAIN World) ==
page -> main: console.log("Alerting Wave event")
main -> main: checkForWaveEvents()
main -> main: Pattern matching
main -> page: dispatchEvent('waveDetectedMain')
page -> isolated: waveDetectedMain listener
isolated -> bg: chrome.runtime.sendMessage()

== Fallback Detection (ISOLATED World) ==
note over page, bg: Legacy detection for compatibility
page -> isolated: console.log() via injected script
isolated -> isolated: checkForWaveEvents()
isolated -> isolated: Pattern matching
isolated -> page: dispatchEvent('waveDetected')
page -> isolated: waveDetected listener
isolated -> bg: chrome.runtime.sendMessage()

== Background Processing ==
bg -> bg: Process notification request
bg -> user: Show notification
@enduml
```

## 状態管理とライフサイクル

```plantuml
@startuml
participant "Extension Load" as load
participant "content_main.js" as main
participant "content.js" as isolated
participant "Page Console" as console
participant "Background Script" as bg

== Initialization ==
load -> main: Execute MAIN world script
main -> main: Save original console methods
main -> console: Override console methods
main -> console: Log initialization complete

load -> isolated: Execute ISOLATED world script
isolated -> isolated: Create script element
isolated -> isolated: Inject console override
isolated -> isolated: Setup event listeners
isolated -> isolated: Remove script element

== Runtime Monitoring ==
loop Every 30 seconds
    isolated -> console: Log monitoring status
end

== Debug Functions ==
main -> window: Add testMainConsole()
isolated -> window: Add testWaveNotifier()
isolated -> window: Add testChatV2Notifier()

== Auto-Detection ==
loop Every 5 seconds
    isolated -> isolated: Check response button
    isolated -> bg: Auto-toggle concentration mode
end
@enduml
```

### 実装詳細
```javascript
// 元の関数保存
const originalConsole = {
  log: console.log.bind(console),
  // ...
};

// オーバーライド
console.log = function(...args) {
  checkForWaveEvents(args, 'log');
  return originalConsole.log.apply(console, args);
};
```

## 通知トリガー
1. ログメッセージの文字列変換
2. 対象文字列の包含チェック
3. プレフィックスチェック（無限ループ防止）
4. 検出時CustomEvent発火

## デバッグ機能
- `testMainConsole()` - 手動テスト関数
- `[WAVE-NOTIFIER-MAIN] Intercepted` - 全ログ監視状況表示
- 30秒ごとの生存確認ログ

## 状態ストレージ管理

### Chrome Storage Local スキーマ

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

### ストレージライフサイクル

```plantuml
@startuml
participant "Extension Install" as install
participant "Chrome Storage" as storage
participant "Background Script" as bg
participant "Popup UI" as popup
participant "Content Script" as content

== 初期化 ==
install -> storage: 初期値設定\n{hasNotification: false,\n enableWave/Chat/Call: true,\n isConcentrationMode: false}
install -> bg: onInstalled イベント
bg -> bg: previousConcentrationMode = false

== 通知検出時 ==
content -> bg: chrome.runtime.sendMessage(waveDetected)
bg -> storage: hasNotification = true
bg -> bg: updateBadge() 実行

== ポップアップ開封時 ==
popup -> storage: hasNotification = false (自動クリア)
popup -> storage: 設定値読み込み
popup -> bg: chrome.runtime.sendMessage(stopSound)

== 設定変更時 ==
popup -> storage: enableWave/Chat/Call 更新
popup -> storage: isConcentrationMode 切り替え
popup -> bg: chrome.runtime.sendMessage(toggleConcentrationMode)

== タブアクティブ時 ==
bg -> storage: hasNotification = false (gather.townタブ時)
bg -> bg: updateBadge() 実行
@enduml
```

## ポップアップ-バックグラウンド間通信

### メッセージタイプ定義

```javascript
// ポップアップ → バックグラウンド
{
  action: 'toggleConcentrationMode',
  isConcentrationMode: boolean
}

{
  action: 'stopSound'
}

// コンテンツスクリプト → バックグラウンド  
{
  action: 'waveDetected',
  message: string,
  notificationType: 'wave'|'chat'|'call'
}

{
  action: 'clearNotificationOnClick'
}

// バックグラウンド → コンテンツスクリプト
{
  action: 'clickResponseButton'
}

{
  action: 'startConcentrationMode'
}

// バックグラウンド → オフスクリーン
{
  action: 'playSound',
  notificationType: 'wave'|'chat'|'call'
}

{
  action: 'stopSound'
}
```

### 通信フロー図

```plantuml
@startuml
participant "Popup UI" as popup
participant "Background Script" as bg  
participant "Content Script" as content
participant "Chrome Storage" as storage
participant "Offscreen Document" as offscreen

== 設定変更フロー ==
popup -> popup: ユーザーがチェックボックス変更
popup -> storage: chrome.storage.local.set({enableWave: value})
popup -> popup: chrome.storage.onChanged リスナーが反応
popup -> popup: UI状態更新

== 応答不可モード切り替えフロー ==
popup -> popup: concentrationBtn.click()
popup -> storage: chrome.storage.local.set({isConcentrationMode: newValue})
popup -> bg: chrome.runtime.sendMessage({action: 'toggleConcentrationMode'})
bg -> bg: toggleConcentrationMode() 実行
bg -> bg: updateBadge() でバッジ更新
bg -> storage: hasNotification = false (応答不可開始時)
bg -> offscreen: chrome.runtime.sendMessage({action: 'stopSound'})

== 自動状態同期フロー ==
bg -> bg: setInterval(checkConcentrationModeStatus, 1000)
bg -> storage: chrome.storage.local.get(['isConcentrationMode'])
alt 応答不可モード終了検出 (true → false)
  bg -> content: chrome.tabs.sendMessage({action: 'clickResponseButton'})
  content -> content: findAndClickButton() 実行
  content -> content: "応答可能にする"ボタンクリック
end

== 通知検出から表示まで ==
content -> bg: chrome.runtime.sendMessage({action: 'waveDetected'})
bg -> storage: chrome.storage.local.get(['enableWave', 'isConcentrationMode'])
alt 通知が有効 && 応答不可モードでない
  bg -> bg: chrome.notifications.create()
  bg -> storage: hasNotification = true
  bg -> bg: updateBadge()
  bg -> offscreen: chrome.runtime.sendMessage({action: 'playSound'})
else
  bg -> bg: 通知スキップ
end
@enduml
```

### ストレージ変更監視

```plantuml
@startuml
participant "Storage Change" as change
participant "Popup UI" as popup
participant "Background Script" as bg

== ポップアップでの監視 ==
change -> popup: chrome.storage.onChanged.addListener()
alt changes.hasNotification || changes.isConcentrationMode
  popup -> popup: updateStatus() 実行
end
alt changes.isConcentrationMode  
  popup -> popup: loadSettings() 実行
  popup -> popup: ボタンテキスト更新
end

== バックグラウンドでの監視 ==
change -> bg: setInterval(checkConcentrationModeStatus, 1000)
bg -> bg: 前回値と現在値を比較
alt 応答不可モード終了検出
  bg -> bg: gather.townタブに clickResponseButton メッセージ送信
end
@enduml
```