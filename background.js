let gatherTabs = new Set();
let hasNotification = false;
let offscreenCreated = false;
let previousConcentrationMode = false;
let offscreenReadyResolver = null;
let offscreenReadyPromise = null;

// タブの更新を監視してgather.townのタブを追跡
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))) {
    gatherTabs.add(tabId);
  }
});

// タブがアクティブになったときの処理
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))) {
      // gather.townタブがアクティブになったら通知をクリア
      if (hasNotification) {
        hasNotification = false;
        updateBadge();
        stopNotificationSound();
        chrome.storage.local.set({ hasNotification: false });
      }
    }
  } catch (error) {
    console.error('Error checking active tab:', error);
  }
});

// タブが閉じられたときの処理
chrome.tabs.onRemoved.addListener((tabId) => {
  gatherTabs.delete(tabId);
});

// wave検出時の処理
function handleWaveDetection(messageData, notificationType = 'wave') {
  // デバッグモード時のみログ出力
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode) {
      console.log('[DEBUG] Notification detected from console:', messageData, 'Type:', notificationType);
    }
  });
  
  // 設定を確認して通知が有効かチェック
  chrome.storage.local.get(['enableWave', 'enableChat', 'enableCall', 'enableCalendar', 'isConcentrationMode', 'debugMode'], (result) => {
    const debugMode = result.debugMode || false;

    if (debugMode) {
      console.log('[DEBUG] handleWaveDetection called with:', {
        messageData: messageData,
        notificationType: notificationType,
        settings: result,
        hasNotification: hasNotification,
        gatherTabs: Array.from(gatherTabs)
      });
    }
    const isConcentrationMode = result.isConcentrationMode || false;
    let isNotificationEnabled = false;

    // 応答不可モード中は通知しない
    if (isConcentrationMode) {
      if (debugMode) {
        console.log('[DEBUG] Concentration mode active, skipping notification');
      }
      return;
    }

    // 通知タイプごとの有効性をチェック
    switch(notificationType) {
      case 'chat':
        isNotificationEnabled = result.enableChat !== false; // デフォルトtrue
        break;
      case 'call':
        isNotificationEnabled = result.enableCall !== false; // デフォルトtrue
        break;
      case 'calendar':
        isNotificationEnabled = result.enableCalendar !== false; // デフォルトtrue
        break;
      case 'chat-or-wave':
        // Ambiguous notification - enabled if either chat or wave is enabled
        isNotificationEnabled = (result.enableChat !== false) || (result.enableWave !== false);
        break;
      case 'wave':
      default:
        isNotificationEnabled = result.enableWave !== false; // デフォルトtrue
        break;
    }
    
    if (!isNotificationEnabled) {
      if (debugMode) {
        console.log(`[DEBUG] ${notificationType} notifications are disabled`);
      }
      return;
    }
    
    if (debugMode) {
      console.log(`[DEBUG] Creating notification for ${notificationType}`);
    }
    
    // 通知タイプに応じたタイトルとメッセージ
    let title, notificationMessage;
    switch(notificationType) {
      case 'chat':
        title = chrome.i18n.getMessage('chatNotificationTitle');
        notificationMessage = chrome.i18n.getMessage('chatNotificationMessage');
        // Prepend userName or localized "Someone" to the message
        const chatUserName = (messageData && messageData.userName) ? messageData.userName : chrome.i18n.getMessage('someone');
        notificationMessage = chatUserName + ' ' + notificationMessage;
        break;
      case 'call':
        title = chrome.i18n.getMessage('callNotificationTitle');
        notificationMessage = chrome.i18n.getMessage('callNotificationMessage');
        break;
      case 'calendar':
        title = chrome.i18n.getMessage('calendarNotificationTitle');
        notificationMessage = chrome.i18n.getMessage('calendarNotificationMessage');
        break;
      case 'chat-or-wave':
        title = chrome.i18n.getMessage('chatOrWaveNotificationTitle');
        notificationMessage = chrome.i18n.getMessage('chatOrWaveNotificationMessage');
        break;
      case 'wave':
      default:
        title = chrome.i18n.getMessage('waveNotificationTitle');
        notificationMessage = chrome.i18n.getMessage('waveNotificationMessage');
        // Prepend userName or localized "Someone" to the message
        const waveUserName = (messageData && messageData.userName) ? messageData.userName : chrome.i18n.getMessage('someone');
        notificationMessage = waveUserName + ' ' + notificationMessage;
        break;
    }

    // デスクトップ通知を表示
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: title,
      message: notificationMessage
    });
    
    // 通知フラグを設定
    hasNotification = true;
    updateBadge();
    playNotificationSound(notificationType);
    
    // ストレージに保存
    chrome.storage.local.set({ hasNotification: true });
  });
}

// バッジの更新
function updateBadge() {
  chrome.storage.local.get(['isConcentrationMode'], (result) => {
    const isConcentrationMode = result.isConcentrationMode || false;
    
    if (isConcentrationMode) {
      chrome.action.setBadgeText({ text: 'C' });
      chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
    } else if (hasNotification) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

// 応答不可モードの切り替え処理
function toggleConcentrationMode(isConcentrationMode) {
  if (isConcentrationMode) {
    // 応答不可モード開始時は通知をクリア
    hasNotification = false;
    stopNotificationSound();
    chrome.storage.local.set({ hasNotification: false });
    chrome.runtime.sendMessage({ action: 'startConcentrationMode'});
  }
  updateBadge();
}

// 起動時に保存された通知状態を復元
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['hasNotification'], (result) => {
    hasNotification = result.hasNotification || false;
    updateBadge();
  });
});

// offscreenドキュメントを作成
async function createOffscreen() {
  // 実際に offscreen ドキュメントが存在するかチェック
  let offscreenExists = false;
  try {
    // Chrome 109+ では hasDocument() が使える
    if (chrome.offscreen && chrome.offscreen.hasDocument) {
      offscreenExists = await chrome.offscreen.hasDocument();
    }
  } catch (error) {
    // hasDocument が使えない場合や、エラーの場合は存在しないとみなす
    offscreenExists = false;
  }

  if (offscreenExists) {
    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode) {
        console.log('[DEBUG] [BACKGROUND] Offscreen document already exists');
      }
    });
    return;
  }

  // 存在しない場合はフラグをリセット
  offscreenCreated = false;

  try {
    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode) {
        console.log('[DEBUG] [BACKGROUND] Creating new offscreen document');
      }
    });

    // 準備完了を待つための Promise を作成
    offscreenReadyPromise = new Promise((resolve) => {
      offscreenReadyResolver = resolve;
    });

    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play notification sound when wave is detected'
    });

    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode) {
        console.log('[DEBUG] [BACKGROUND] Offscreen document created, waiting for ready signal');
      }
    });

    // offscreen からの準備完了メッセージを待つ（タイムアウト付き）
    await Promise.race([
      offscreenReadyPromise,
      new Promise((resolve) => setTimeout(resolve, 1000)) // 1秒タイムアウト
    ]);

    offscreenCreated = true;
    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode) {
        console.log('[DEBUG] [BACKGROUND] Offscreen document ready');
      }
    });
  } catch (error) {
    console.error('[BACKGROUND] Error creating offscreen document:', error);
    offscreenCreated = false;
  }
}

// 音声再生関数
async function playNotificationSound(notificationType = 'wave') {
  try {
    const settings = await chrome.storage.local.get(['debugMode', 'soundType']);
    const debugMode = settings.debugMode || false;
    const soundType = settings.soundType || 'short';

    if (debugMode) {
      console.log('[DEBUG] [BACKGROUND] playNotificationSound called, type:', notificationType, 'soundType:', soundType);
    }

    await createOffscreen();

    if (debugMode) {
      console.log('[DEBUG] [BACKGROUND] Sending playSound message to offscreen');
    }

    chrome.runtime.sendMessage({ action: 'playSound', notificationType: notificationType, soundType: soundType }, (response) => {
      if (debugMode) {
        console.log('[DEBUG] [BACKGROUND] playSound response:', response);
      }
    });
  } catch (error) {
    console.error('[BACKGROUND] Error playing notification sound:', error);
  }
}

async function stopNotificationSound() {
  try {
    if (offscreenCreated) {
      chrome.storage.local.get(['debugMode'], (result) => {
        if (result.debugMode) {
          console.log('[DEBUG] [BACKGROUND] Stopping notification sound');
        }
      });
      chrome.runtime.sendMessage({ action: 'stopSound' });
    } else {
      chrome.storage.local.get(['debugMode'], (result) => {
        if (result.debugMode) {
          console.log('[DEBUG] [BACKGROUND] Cannot stop sound - offscreen not created');
        }
      });
    }
  } catch (error) {
    console.error('[BACKGROUND] Error stopping notification sound:', error);
  }
}

// 通知クリック時の処理
chrome.notifications.onClicked.addListener(async (notificationId) => {
  try {
    // gather.townタブを探して活性化
    const tabs = await chrome.tabs.query({});
    const gatherTab = tabs.find(tab => 
      tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
    );
    
    if (gatherTab) {
      // 既存のgather.townタブをアクティブにする
      await chrome.tabs.update(gatherTab.id, { active: true });
      await chrome.windows.update(gatherTab.windowId, { focused: true });
    } else {
      // gather.townタブが見つからない場合、新しいタブで開く
      await chrome.tabs.create({
        url: 'https://app.gather.town/',
        active: true
      });
    }
    
    // 通知をクリア
    chrome.notifications.clear(notificationId);
    hasNotification = false;
    updateBadge();
    stopNotificationSound();
    chrome.storage.local.set({ hasNotification: false });
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
});

// ポップアップとcontent scriptからのメッセージを処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'offscreenReady') {
    // offscreen ドキュメントの準備完了
    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode) {
        console.log('[DEBUG] [BACKGROUND] Offscreen ready signal received');
      }
    });
    if (offscreenReadyResolver) {
      offscreenReadyResolver();
      offscreenReadyResolver = null;
    }
  } else if (message.action === 'stopSound') {
    stopNotificationSound();
  } else if (message.action === 'waveDetected') {
    // content scriptからのwave検出メッセージ
    handleWaveDetection(message, message.notificationType);
  } else if (message.action === 'toggleConcentrationMode') {
    // 応答不可モード切り替え
    toggleConcentrationMode(message.isConcentrationMode);
  } else if (message.action === 'playSound' || message.action === 'stopSound') {
    // offscreenドキュメントからのメッセージは無視
    return;
  }
});

// 応答不可モードの状態を定期的にチェック
function checkConcentrationModeStatus() {
  chrome.storage.local.get(['isConcentrationMode'], (result) => {
    const currentConcentrationMode = result.isConcentrationMode || false;
    
    // 応答不可モードが終了した場合（true -> false）
    if (previousConcentrationMode && !currentConcentrationMode) {
      // デバッグモード時のみログ出力
      chrome.storage.local.get(['debugMode'], (result) => {
        if (result.debugMode) {
          console.log('[DEBUG] [BACKGROUND] Concentration mode ended, sending message to gather tabs');
        }
      });
      
      // 全てのgather.townタブに「応答可能にする」ボタンクリック指示を送信
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'clickResponseButton'
            }).catch(error => {
              // デバッグモード時のみログ出力
              chrome.storage.local.get(['debugMode'], (result) => {
                if (result.debugMode) {
                  console.log('[DEBUG] [BACKGROUND] Failed to send message to tab', tab.id, ':', error.message);
                }
              });
            });
          }
        });
      });
    }
    
    previousConcentrationMode = currentConcentrationMode;
  });
}

// 1秒ごとに応答不可モードの状態をチェック
setInterval(checkConcentrationModeStatus, 1000);

// インストール時の初期化
chrome.runtime.onInstalled.addListener((details) => {
  hasNotification = false;
  updateBadge();

  // デフォルト設定（既存の設定は上書きしない）
  const defaults = {
    hasNotification: false,
    enableWave: true,
    enableChat: true,
    enableCall: true,
    enableCalendar: true,
    calendarNotificationTiming: 5,
    gatherVersion: 'v1',
    isConcentrationMode: false,
    debugMode: false,
    soundType: 'short'
  };

  chrome.storage.local.get(Object.keys(defaults), (result) => {
    const toSet = {};
    for (const [key, value] of Object.entries(defaults)) {
      if (result[key] === undefined) {
        toSet[key] = value;
      }
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }

    previousConcentrationMode = result.isConcentrationMode || false;
  });

  // インストールまたは更新時にウェルカムページを表示
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html'),
      active: true
    });
  }
});
