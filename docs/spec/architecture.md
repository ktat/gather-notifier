# Architecture

## 概要
gather.townでのwave通知を検出してデスクトップ通知とサウンド再生を行うChrome拡張機能

## コンポーネント構成

### Core Components
- **manifest.json** - 拡張機能の設定・権限定義
- **background.js** - メイン処理（通知管理・状態管理・UI制御）
- **content_main.js** - MAIN worldでconsoleログ監視
- **content.js** - ISOLATED worldでメッセージ中継・クリック検出
- **offscreen.js** - 音声再生処理
- **popup.js** - 設定メニュー表示

### 実行環境
- **Service Worker** (background.js) - バックグラウンド処理
- **MAIN World** (content_main.js) - ページのconsoleを直接操作
- **ISOLATED World** (content.js) - Chrome APIアクセス
- **Offscreen Document** (offscreen.js) - 音声再生専用

## データフロー

### 通知検出フロー
1. gather.townページでconsole.log実行
2. content_main.js がログを傍受・検査
3. wave/chat/call関連ログ検出時にCustomEvent発火
4. content.js がイベント受信してbackground.jsに通知
5. background.js が通知表示・音声再生・バッジ更新

### 通知クリアフロー
- 拡張機能ボタンクリック → 設定メニュー表示・通知クリア・gather.townタブ移動
- gather.townページ内クリック → content.js検出 → background.js通知クリア

## 通信フロー
```
Page Console → content_main.js → CustomEvent → content.js → chrome.runtime.sendMessage → background.js
                                                                                       ↓
                                                                            offscreen.js (音声)
```