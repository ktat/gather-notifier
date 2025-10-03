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
      
      // デバッグ: すべてのログメッセージを表示（デバッグモード制御は外側で行う）
      if (window.debugModeEnabled) {
        originalMethods.log(PREFIX + ' [DEBUG] Intercepted ' + type + ':', message.substring(0, 200));
      }
      
      // wave関連のメッセージを検出（V1とV2の両方に対応）
      let shouldNotify = false;
      // V1のメッセージパターン
      if (message.includes('Alerting Wave event') || message.includes('Skipping ChatV2 notification')) {
        shouldNotify = true;
      }
      // V2のメッセージパターン
      // Note: V2 wave and calendar detection use DOM-based detection only (see MutationObserver below)
      // V2 Wave detection disabled - using DOM detection instead
      // message.includes('[Violation] Forced reflow while executing JavaScript took')
      // V2 Calendar detection disabled - using DOM detection instead
      // message.includes('User calendar events updated')
      // V2 Chat/Wave detection temporarily disabled
      // (message.includes('Tried to flush send metric for message') && message.includes('but no pending metric found'))

      if (shouldNotify) {
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

// デバッグモードの状態を設定
chrome.storage.local.get(['debugMode'], (result) => {
  window.debugModeEnabled = result.debugMode || false;
});

// スクリプトをページのheadに注入
(document.head || document.documentElement).appendChild(script);

// カスタムイベントをリッスン（MAIN worldからのイベント）
window.addEventListener('waveDetectedMain', function(event) {
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode) {
      console.log('[WAVE-NOTIFIER-ISOLATED] [DEBUG] Wave event received from main world:', event.detail);
    }
  });
  
  // デバッグモード時のみログ出力
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode) {
      console.log('[DEBUG] [WAVE-NOTIFIER-ISOLATED] Wave event received from main world:', event.detail);
    }
  });
  
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
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode) {
      console.log('[WAVE-NOTIFIER-ISOLATED] [DEBUG] Wave event received (legacy):', event.detail);
    }
  });
  
  // デバッグモード時のみログ出力
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode) {
      console.log('[DEBUG] [WAVE-NOTIFIER-ISOLATED] Wave event received (legacy):', event.detail);
    }
  });
  
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

// デバッグモード時のみログ出力
chrome.storage.local.get(['debugMode'], (result) => {
  if (result.debugMode) {
    console.log('[DEBUG] Gather.town Wave Notifier: Content script initialized');
  }
});

// デバッグモードの状態変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.debugMode) {
    window.debugModeEnabled = changes.debugMode.newValue || false;
    console.log('[WAVE-NOTIFIER-CONTENT] Debug mode changed to:', window.debugModeEnabled);
  }
});

// 応答可能にするボタンの状態を監視して自動的に応答不可モードを制御
function checkResponseButton() {
  // V1: "応答可能にする" button
  const responseButton = Array.from(document.querySelectorAll('button')).find(button =>
    button.innerHTML.trim() === "応答可能にする" || button.textContent.trim() === "応答可能にする"
  );

  // V2: "Enter office" div
  const enterOfficeDiv = Array.from(document.querySelectorAll('div')).find(div =>
    div.textContent.trim() === "Enter office"
  );

  // 現在の状態を取得
  chrome.storage.local.get(['isConcentrationMode'], (result) => {
    const currentConcentrationMode = result.isConcentrationMode || false;
    const shouldBeInConcentrationMode = !!(responseButton || enterOfficeDiv);

    // 状態が変わった場合のみ更新
    if (currentConcentrationMode !== shouldBeInConcentrationMode) {
      // デバッグモード時のみログ出力
      chrome.storage.local.get(['debugMode'], (result) => {
        if (result.debugMode) {
          console.log('[DEBUG] [WAVE-NOTIFIER] Auto-toggling concentration mode:', shouldBeInConcentrationMode,
                      'V1 button:', !!responseButton, 'V2 div:', !!enterOfficeDiv);
        }
      });
      chrome.storage.local.set({ isConcentrationMode: shouldBeInConcentrationMode });
      chrome.runtime.sendMessage({
        action: 'toggleConcentrationMode',
        isConcentrationMode: shouldBeInConcentrationMode
      }).catch(error => {
        console.error('Error sending auto-toggle message:', error);
      });
    }
  });
}

// 5秒ごとに応答可能にするボタンの状態をチェック
setInterval(checkResponseButton, 5000);

// デバッグ用: テストログを定期的に出力（デバッグモード時のみ）
setInterval(() => {
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode) {
      console.log('[WAVE-NOTIFIER-CONTENT] Monitoring active at', new Date().toLocaleTimeString());
    }
  });
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

// DOM-based wave and calendar detection using MutationObserver
// This provides more accurate detection by watching for DOM changes
function setupDOMObserver() {
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode) {
      console.log('[WAVE-NOTIFIER-CONTENT] [DEBUG] Setting up DOM observer');
    }
  });

  const notificationObserver = new MutationObserver((mutations) => {
    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode) {
        console.log('[WAVE-NOTIFIER-CONTENT] [DEBUG] DOM mutations detected:', mutations.length);
      }
    });

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          // Check if the node or its children contain notification text
          if (node.nodeType === Node.ELEMENT_NODE) {
            const textContent = node.textContent || '';

            // Debug: log all text content changes (only in debug mode)
            chrome.storage.local.get(['debugMode'], (result) => {
              if (result.debugMode && textContent.trim().length > 0 && textContent.trim().length < 200) {
                console.log('[WAVE-NOTIFIER-CONTENT] [DEBUG] DOM text added:', textContent.substring(0, 100));
              }
            });

            // Wave detection - extract name from "$name waved to you" pattern
            if (textContent.includes(' waved to you')) {
              console.log('[WAVE-NOTIFIER-CONTENT] DOM-based wave detection:', textContent.substring(0, 100));

              // Extract the name before " waved to you"
              let userName = null;
              const match = textContent.match(/(.+?)\s+waved to you/);
              if (match && match[1]) {
                userName = match[1].trim();
                console.log('[WAVE-NOTIFIER-CONTENT] Extracted user name:', userName);
              }

              // Send wave notification to background
              chrome.runtime.sendMessage({
                action: 'waveDetected',
                message: textContent,
                type: 'dom',
                notificationType: 'wave',
                userName: userName
              }).catch(error => {
                console.error('[WAVE-NOTIFIER-CONTENT] Error sending DOM-based wave detection message:', error);
              });
            }

            // Calendar detection - check for "in $n minutes" pattern
            const calendarMatch = textContent.match(/in (\d+) minutes?/);
            if (calendarMatch) {
              console.log('[WAVE-NOTIFIER-CONTENT] DOM-based calendar detection:', textContent.substring(0, 100));

              // Send calendar notification to background
              chrome.runtime.sendMessage({
                action: 'waveDetected',
                message: textContent,
                type: 'dom',
                notificationType: 'calendar'
              }).catch(error => {
                console.error('[WAVE-NOTIFIER-CONTENT] Error sending DOM-based calendar detection message:', error);
              });
            }

            // Chat detection - check for "$name sent a message" pattern
            if (textContent.includes(' sent a message')) {
              console.log('[WAVE-NOTIFIER-CONTENT] DOM-based chat detection:', textContent.substring(0, 100));

              // Extract the name before " sent a message"
              let userName = null;
              const chatMatch = textContent.match(/(.+?)\s+sent a message/);
              if (chatMatch && chatMatch[1]) {
                userName = chatMatch[1].trim();
                console.log('[WAVE-NOTIFIER-CONTENT] Extracted user name from chat:', userName);
              }

              // Send chat notification to background
              chrome.runtime.sendMessage({
                action: 'waveDetected',
                message: textContent,
                type: 'dom',
                notificationType: 'chat',
                userName: userName
              }).catch(error => {
                console.error('[WAVE-NOTIFIER-CONTENT] Error sending DOM-based chat detection message:', error);
              });
            }
          }
        });
      }
    }
  });

  // Wait for body to be available
  if (document.body) {
    notificationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('[WAVE-NOTIFIER-CONTENT] DOM-based notification observer initialized and observing');
  } else {
    console.log('[WAVE-NOTIFIER-CONTENT] document.body not ready, waiting...');
    // Wait for DOM to be ready
    const checkBody = setInterval(() => {
      if (document.body) {
        clearInterval(checkBody);
        notificationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        console.log('[WAVE-NOTIFIER-CONTENT] DOM-based notification observer initialized and observing (delayed)');
      }
    }, 100);
  }
}

// Initialize DOM observer
setupDOMObserver();

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

// メッセージリスナー: バックグラウンドスクリプトからの指示を受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startConcentrationMode") {
        const event = new KeyboardEvent(type, {
        key: key,
        code: key, // 多くの場合、keyと同じか、より具体的な値
        ctrlKey: ctrlKey,
        shiftKey: shiftKey,
        altKey: altKey,
        metaKey: metaKey,
        bubbles: true, // イベントがDOMツリーをバブリングするようにする
        cancelable: true // イベントがキャンセル可能であるようにする
    });
    document.dispatchEvent(event);
  }
  else if (message.action === 'clickResponseButton') {
    // ボタンを探してクリックする関数
    function findAndClickButton(retryCount = 0) {
      const buttons = document.querySelectorAll("button");
      
      let buttonFound = false;
      buttons.forEach((button) => {
        if (button.innerHTML.trim() === "応答可能にする" || button.textContent.trim() === "応答可能にする") {
          button.click();
          // デバッグモード時のみログ出力
          chrome.storage.local.get(['debugMode'], (result) => {
            if (result.debugMode) {
              console.log('[DEBUG] [WAVE-NOTIFIER] Successfully clicked 応答可能にする button');
            }
          });
          buttonFound = true;
        }
      });
      
      if (!buttonFound && retryCount < 3) {
        setTimeout(() => findAndClickButton(retryCount + 1), 1000);
      }
    }
    
    findAndClickButton();
    sendResponse({ success: true });
  }
});
