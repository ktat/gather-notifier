let gatherTabs = new Set();
let hasNotification = false;
let offscreenCreated = false;

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
  
  // 通知タイプに応じたタイトルとメッセージ
  let title, notificationMessage;
  switch(notificationType) {
    case 'chat':
      title = 'Gather.town Chat!';
      notificationMessage = 'Someone sent you a chat message in gather.town!';
      break;
    case 'call':
      title = 'Gather.town Call!';
      notificationMessage = 'Someone is calling you in gather.town!';
      break;
    case 'wave':
    default:
      title = 'Gather.town Wave!';
      notificationMessage = 'Someone waved at you in gather.town!';
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
}

// バッジの更新
function updateBadge() {
  if (hasNotification) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// 拡張機能のアイコンがクリックされたときの処理
chrome.action.onClicked.addListener(async () => {
  // 通知をクリア
  hasNotification = false;
  updateBadge();
  stopNotificationSound();
  chrome.storage.local.set({ hasNotification: false });
  
  // gather.townのタブを探してアクティブにする
  try {
    const tabs = await chrome.tabs.query({});
    const gatherTab = tabs.find(tab => 
      tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
    );
    
    if (gatherTab) {
      await chrome.tabs.update(gatherTab.id, { active: true });
      await chrome.windows.update(gatherTab.windowId, { focused: true });
    }
  } catch (error) {
    console.error('Error focusing gather.town tab:', error);
  }
});

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

// ポップアップとcontent scriptからのメッセージを処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'stopSound') {
    stopNotificationSound();
  } else if (message.action === 'waveDetected') {
    // content scriptからのwave検出メッセージ
    handleWaveDetection(message.message, message.notificationType);
  } else if (message.action === 'playSound' || message.action === 'stopSound') {
    // offscreenドキュメントからのメッセージは無視
    return;
  }
});

// インストール時の初期化
chrome.runtime.onInstalled.addListener(() => {
  hasNotification = false;
  updateBadge();
  chrome.storage.local.set({ hasNotification: false });
});
