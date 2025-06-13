// MAIN worldで実行されるスクリプト
// より直接的にconsoleメソッドを上書き

(function() {
  const PREFIX = '[WAVE-NOTIFIER-MAIN]';
  
  console.log(PREFIX + ' Main world script starting');
  
  // 元のconsole関数を保存
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console)
  };
  
  originalConsole.log(PREFIX + ' Original console methods saved');
  
  // ログチェック関数
  function checkForWaveEvents(args, type) {
    try {
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
      
      // プレフィックスがついたメッセージは無視
      if (message.includes('[WAVE-NOTIFIER')) {
        return;
      }
      
      // デバッグ: すべてのログメッセージを表示
      // originalConsole.log(PREFIX + ' Intercepted ' + type + ':', message.substring(0, 200));
      
      // wave関連のメッセージを検出
      if (message.includes('Alerting Wave event') ||          // Wave
          message.includes('Skipping ChatV2 notification') || // Chat
          message.includes('Alerting Ring event')             // Call
      ) {
        originalConsole.log(PREFIX + ' 🌊 WAVE DETECTED:', message);
        
        // カスタムイベントを発火
        window.dispatchEvent(new CustomEvent('waveDetectedMain', {
          detail: { message: message, type: type }
        }));
      }
    } catch (error) {
      originalConsole.error(PREFIX + ' Error:', error);
    }
  }
  
  // console関数を直接上書き
  console.log = function(...args) {
    checkForWaveEvents(args, 'log');
    return originalConsole.log.apply(console, args);
  };
  
  console.warn = function(...args) {
    checkForWaveEvents(args, 'warn');
    return originalConsole.warn.apply(console, args);
  };
  
  console.error = function(...args) {
    checkForWaveEvents(args, 'error');
    return originalConsole.error.apply(console, args);
  };
  
  console.info = function(...args) {
    checkForWaveEvents(args, 'info');
    return originalConsole.info.apply(console, args);
  };
  
  console.debug = function(...args) {
    checkForWaveEvents(args, 'debug');
    return originalConsole.debug.apply(console, args);
  };
  
  originalConsole.log(PREFIX + ' Console override completed');
  
  // テスト関数
  window.testMainConsole = function() {
    console.log('Testing main world console override');
    console.log('Alerting Wave event - MAIN TEST');
    console.log('Skipping ChatV2 notification - MAIN TEST');
  };
  
  originalConsole.log(PREFIX + ' Test function: window.testMainConsole()');
})();
