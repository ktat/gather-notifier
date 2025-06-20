# 検出ロジック

## 検出対象
gather.townページのコンソールログで以下の文字列を検出：
- `Alerting Wave event` - Wave通知
- `Skipping ChatV2 notification` - Chat通知  
- `Alerting Ring event` - Call通知

## システム構成図

```mermaid
sequenceDiagram
    participant page as Gather.town Page
    participant main as content_main.js<br/>(MAIN World)
    participant isolated as content.js<br/>(ISOLATED World)
    participant bg as Background Script
    participant notif as Notification System

    Note over page,notif: Console Override Initialization
    page->>main: Load script
    main->>main: Save original console methods
    main->>main: Override console.log/warn/error/info/debug
    main->>page: Console methods replaced

    page->>isolated: Load script
    isolated->>page: Inject legacy console override
    isolated->>isolated: Setup event listeners
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

```mermaid
sequenceDiagram
    participant js as Gather.town JS
    participant console as Overridden Console
    participant main as content_main.js
    participant isolated as content.js
    participant bg as Background Script
    participant notif as Chrome Notification

    js->>console: console.log("Alerting Wave event")
    console->>main: checkForWaveEvents(args, 'log')
    main->>main: Convert args to string
    main->>main: Check for WAVE-NOTIFIER prefix
    alt Message contains target string
        main->>main: Detect notification type<br/>(wave/chat/call)
        main->>main: Log detection
        main->>window: dispatchEvent('waveDetectedMain')
        window->>isolated: waveDetectedMain event
        isolated->>bg: chrome.runtime.sendMessage(waveDetected)
        bg->>notif: chrome.notifications.create()
        notif->>user: Show notification
    end
    console->>js: Return original console.log result
```

## 二重検出システムの相互作用

```mermaid
sequenceDiagram
    participant page as Gather.town Page
    participant main as MAIN World<br/>(content_main.js)
    participant isolated as ISOLATED World<br/>(content.js)
    participant bg as Background Script

    Note over page,bg: Dual Detection System

    rect rgb(240, 248, 255)
        Note over page,bg: Primary Detection (MAIN World)
        page->>main: console.log("Alerting Wave event")
        main->>main: checkForWaveEvents()
        main->>main: Pattern matching
        main->>page: dispatchEvent('waveDetectedMain')
        page->>isolated: waveDetectedMain listener
        isolated->>bg: chrome.runtime.sendMessage()
    end

    rect rgb(255, 248, 240)
        Note over page,bg: Fallback Detection (ISOLATED World)
        Note over page,bg: Legacy detection for compatibility
        page->>isolated: console.log() via injected script
        isolated->>isolated: checkForWaveEvents()
        isolated->>isolated: Pattern matching
        isolated->>page: dispatchEvent('waveDetected')
        page->>isolated: waveDetected listener
        isolated->>bg: chrome.runtime.sendMessage()
    end

    rect rgb(248, 255, 248)
        Note over page,bg: Background Processing
        bg->>bg: Process notification request
        bg->>user: Show notification
    end
```

## 状態管理とライフサイクル

```mermaid
sequenceDiagram
    participant load as Extension Load
    participant main as content_main.js
    participant isolated as content.js
    participant console as Page Console
    participant bg as Background Script

    rect rgb(240, 248, 255)
        Note over load,bg: Initialization
        load->>main: Execute MAIN world script
        main->>main: Save original console methods
        main->>console: Override console methods
        main->>console: Log initialization complete

        load->>isolated: Execute ISOLATED world script
        isolated->>isolated: Create script element
        isolated->>isolated: Inject console override
        isolated->>isolated: Setup event listeners
        isolated->>isolated: Remove script element
    end

    rect rgb(255, 248, 240)
        Note over load,bg: Runtime Monitoring
        loop Every 30 seconds
            isolated->>console: Log monitoring status
        end
    end

    rect rgb(248, 255, 248)
        Note over load,bg: Debug Functions
        main->>window: Add testMainConsole()
        isolated->>window: Add testWaveNotifier()
        isolated->>window: Add testChatV2Notifier()
    end

    rect rgb(255, 240, 248)
        Note over load,bg: Auto-Detection
        loop Every 5 seconds
            isolated->>isolated: Check response button
            isolated->>bg: Auto-toggle concentration mode
        end
    end
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

状態管理の詳細は [state-management.md](state-management.md) を参照してください。

## ポップアップ-バックグラウンド間通信

通信フローの詳細は [architecture.md](architecture.md) を参照してください。

