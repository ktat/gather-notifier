# トラブルシューティング

## 音声が鳴らない
1. **権限確認**: manifest.jsonの`offscreen`権限
2. **ブラウザ設定**: サイトの音声許可設定
3. **デバッグ**: F12でoffscreen.jsのエラーログ確認
4. **再作成**: 拡張機能の再読み込み

### デバッグログの確認手順
1. **debugModeを有効化**: ポップアップでDebug Modeをオンにする
2. **Background Script確認**:
   - `chrome://extensions/` → 拡張機能の「service worker」リンクをクリック
   - `[DEBUG] [BACKGROUND]`で始まるログを確認
   - offscreen作成、メッセージ送信、応答受信のログを追跡
3. **Offscreen Script確認**:
   - 同じDevToolsで`[OFFSCREEN]`で始まるログを確認
   - メッセージ受信、音声設定、再生開始のログを追跡
4. **エラー確認**: 赤色のエラーログがないか確認

### 音声が鳴らない場合のチェックポイント
- `[BACKGROUND] Offscreen document created successfully` が出ているか
- `[OFFSCREEN] Message received: {action: "playSound", ...}` が出ているか
- `[OFFSCREEN] Sound oscillator started and scheduled to stop` が出ているか
- エラーログ（赤色）が出ていないか

## ログ検出されない
1. **スクリプト注入確認**: `[WAVE-NOTIFIER-MAIN]`ログの存在
2. **コンソール上書き確認**: `testMainConsole()`実行
3. **ターゲット文字列**: gather.town側の仕様変更可能性
4. **実行タイミング**: `document_start`で十分早く実行されているか

## 通知が表示されない
1. **ブラウザ通知許可**: Chrome設定の通知許可確認
2. **権限**: manifest.jsonの`notifications`権限
3. **フォーカス**: gather.townタブ以外がアクティブか
4. **状態**: `hasNotification`の値確認

## デバッグ方法
- **コンソール監視**: `[WAVE-NOTIFIER-*]`プレフィックスログ
- **手動テスト**: `testMainConsole()`、`testWaveNotifier()`
- **状態確認**: ポップアップUI、バッジ表示
- **ストレージ**: DevToolsのApplicationタブでlocalStorage確認

## 言語選択が機能しない
1. **ストレージ確認**: chrome.storage.localの`language`キー
2. **リソース読み込み**: `/_locales/*/messages.json`ファイルの存在
3. **ネットワーク**: DevToolsのNetworkタブでfetch失敗確認
4. **フォールバック**: Chrome標準i18nへの自動切り替え

## よくある問題
- **Chrome更新**: MV3仕様変更による動作不良
- **gather.town仕様変更**: ログメッセージの変更
- **権限不足**: manifest.jsonの権限不備
- **言語リソース**: _localesディレクトリの破損や不完全
- **タイミング問題**: スクリプト注入が遅すぎる