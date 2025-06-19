let gatherTabs = new Set();
let hasNotification = false;
let offscreenCreated = false;
let previousConcentrationMode = false;

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
function handleWaveDetection(message, notificationType = 'wave') {
  console.log('Notification detected from console:', message, 'Type:', notificationType);
  
  // 設定を確認して通知が有効かチェック
  chrome.storage.local.get(['enableWave', 'enableChat', 'enableCall', 'isConcentrationMode', 'debugMode'], (result) => {
    const debugMode = result.debugMode || false;
    
    if (debugMode) {
      console.log('[DEBUG] handleWaveDetection called with:', {
        message: message,
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
      console.log('Concentration mode active, skipping notification');
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
      case 'wave':
      default:
        isNotificationEnabled = result.enableWave !== false; // デフォルトtrue
        break;
    }
    
    if (!isNotificationEnabled) {
      if (debugMode) {
        console.log(`[DEBUG] ${notificationType} notifications are disabled`);
      }
      console.log(`${notificationType} notifications are disabled`);
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
        break;
      case 'call':
        title = chrome.i18n.getMessage('callNotificationTitle');
        notificationMessage = chrome.i18n.getMessage('callNotificationMessage');
        break;
      case 'wave':
      default:
        title = chrome.i18n.getMessage('waveNotificationTitle');
        notificationMessage = chrome.i18n.getMessage('waveNotificationMessage');
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
  if (offscreenCreated) return;
  
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play notification sound when wave is detected'
    });
    offscreenCreated = true;
  } catch (error) {
    console.error('Error creating offscreen document:', error);
  }
}

// 音声再生関数
async function playNotificationSound(notificationType = 'wave') {
  try {
    await createOffscreen();
    chrome.runtime.sendMessage({ action: 'playSound', notificationType: notificationType });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

async function stopNotificationSound() {
  try {
    if (offscreenCreated) {
      chrome.runtime.sendMessage({ action: 'stopSound' });
    }
  } catch (error) {
    console.error('Error stopping notification sound:', error);
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
  if (message.action === 'stopSound') {
    stopNotificationSound();
  } else if (message.action === 'waveDetected') {
    // content scriptからのwave検出メッセージ
    handleWaveDetection(message.message, message.notificationType);
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
      console.log('[BACKGROUND] Concentration mode ended, sending message to gather tabs');
      
      // 全てのgather.townタブに「応答可能にする」ボタンクリック指示を送信
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'clickResponseButton'
            }).catch(error => {
              console.log('[BACKGROUND] Failed to send message to tab', tab.id, ':', error.message);
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
chrome.runtime.onInstalled.addListener(() => {
  hasNotification = false;
  updateBadge();
  chrome.storage.local.set({ 
    hasNotification: false,
    enableWave: true,
    enableChat: true,
    enableCall: true,
    isConcentrationMode: false,
    debugMode: false
  });
  
  // 初期状態を設定
  chrome.storage.local.get(['isConcentrationMode'], (result) => {
    previousConcentrationMode = result.isConcentrationMode || false;
  });
});
