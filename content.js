// コンソールログを傍受するためのスクリプト
// より確実にログを捕捉するために、script要素としてページに注入

// ページに直接注入するスクリプトを作成
const script = document.createElement('script');
script.textContent = `
(function() {
  const PREFIX = '[WAVE-NOTIFIER]';
  
  // より確実にconsoleを取得
  const consoleObj = window.console || console;
  
  // 元のconsole関数を保存（Object.getOwnPropertyDescriptorを使用）
  const originalMethods = {};
  ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
    const descriptor = Object.getOwnPropertyDescriptor(consoleObj, method);
    if (descriptor && descriptor.value) {
      originalMethods[method] = descriptor.value.bind(consoleObj);
    } else {
      originalMethods[method] = consoleObj[method].bind(consoleObj);
    }
  });
  
  originalMethods.log(PREFIX + ' Script injected, original methods saved');
  
  // ログチェック関数
  function checkForWaveEvents(args, type) {
    try {
      // argsを文字列に変換
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      // プレフィックスがついたメッセージは無視（無限ループ防止）
      if (message.includes(PREFIX)) {
        return;
      }
      
      // デバッグ: すべてのログメッセージを表示
      originalMethods.log(PREFIX + ' Intercepted ' + type + ':', message.substring(0, 200));
      
      // wave関連のメッセージを検出
      if (message.includes('Alerting Wave event') || message.includes('Skipping ChatV2 notification')) {
        originalMethods.log(PREFIX + ' 🌊 Wave event detected:', message);
        
        // カスタムイベントを発火してcontent scriptに通知
        window.dispatchEvent(new CustomEvent('waveDetected', {
          detail: { message: message, type: type }
        }));
      }
    } catch (error) {
      originalMethods.error(PREFIX + ' Error checking wave events:', error);
    }
  }
  
  // console関数を上書き（definePropertyを使用）
  function overrideConsoleMethod(methodName) {
    const original = originalMethods[methodName];
    Object.defineProperty(consoleObj, methodName, {
      value: function(...args) {
        checkForWaveEvents(args, methodName);
        return original.apply(this, args);
      },
      writable: true,
      configurable: true
    });
  }
  
  // 各メソッドを上書き
  ['log', 'warn', 'error', 'info', 'debug'].forEach(overrideConsoleMethod);
  
  originalMethods.log(PREFIX + ' Console methods overridden successfully');
  
  // テスト用の関数を追加
  window.testConsoleOverride = function() {
    console.log('Test message for console override');
    console.warn('Test warning for console override');
    console.error('Test error for console override');
  };
  
  originalMethods.log(PREFIX + ' Test function added: window.testConsoleOverride()');
})();
`;

// スクリプトをページのheadに注入
(document.head || document.documentElement).appendChild(script);

// カスタムイベントをリッスン（MAIN worldからのイベント）
window.addEventListener('waveDetectedMain', function(event) {
  console.log('[WAVE-NOTIFIER-ISOLATED] Wave event received from main world:', event.detail);
  
  // バックグラウンドスクリプトに通知を送信
  chrome.runtime.sendMessage({
    action: 'waveDetected',
    message: event.detail.message,
    type: event.detail.type,
    notificationType: event.detail.notificationType
  }).catch(error => {
    console.error('Error sending wave detection message:', error);
  });
});

// 従来のカスタムイベントもリッスン
window.addEventListener('waveDetected', function(event) {
  console.log('[WAVE-NOTIFIER-ISOLATED] Wave event received (legacy):', event.detail);
  
  // バックグラウンドスクリプトに通知を送信
  chrome.runtime.sendMessage({
    action: 'waveDetected',
    message: event.detail.message,
    type: event.detail.type
  }).catch(error => {
    console.error('Error sending wave detection message:', error);
  });
});

// 注入後にスクリプト要素を削除
script.remove();

console.log('Gather.town Wave Notifier: Content script initialized');

// デバッグ用: テストログを定期的に出力
setInterval(() => {
  console.log('[WAVE-NOTIFIER-CONTENT] Monitoring active at', new Date().toLocaleTimeString());
}, 30000); // 30秒ごと

// デバッグ用: 手動テスト関数をウィンドウに追加
window.testWaveNotifier = function() {
  console.log('Alerting Wave event - MANUAL TEST');
  console.log('This should trigger a wave notification');
};

// デバッグ用: ChatV2テスト関数も追加
window.testChatV2Notifier = function() {
  console.log('Skipping ChatV2 notification - MANUAL TEST');
  console.log('This should trigger a ChatV2 notification');
};

// gather.townページでのクリック検出
document.addEventListener('click', function() {
  // gather.townのページでクリックされた場合、通知をクリア
  chrome.runtime.sendMessage({
    action: 'clearNotificationOnClick'
  }).catch(error => {
    console.error('Error sending clear notification message:', error);
  });
});

// Note: Ctrl+U functionality removed due to browser security restrictions
// Chrome extensions cannot programmatically trigger browser keyboard shortcuts