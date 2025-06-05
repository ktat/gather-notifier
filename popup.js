document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const clearBtn = document.getElementById('clearBtn');
  const goToGatherBtn = document.getElementById('goToGatherBtn');
  
  // 現在の通知状態を取得して表示
  function updateStatus() {
    chrome.storage.local.get(['hasNotification'], (result) => {
      const hasNotification = result.hasNotification || false;
      
      if (hasNotification) {
        statusDiv.className = 'status has-notification';
        statusDiv.textContent = '新しいWave通知があります！';
      } else {
        statusDiv.className = 'status no-notification';
        statusDiv.textContent = '通知はありません';
      }
    });
  }
  
  // 通知をクリアする
  clearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ hasNotification: false });
    chrome.action.setBadgeText({ text: '' });
    
    // バックグラウンドスクリプトに音声停止を伝える
    chrome.runtime.sendMessage({ action: 'stopSound' });
    
    updateStatus();
  });
  
  // Gather.townタブに移動
  goToGatherBtn.addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const gatherTab = tabs.find(tab => 
        tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
      );
      
      if (gatherTab) {
        await chrome.tabs.update(gatherTab.id, { active: true });
        await chrome.windows.update(gatherTab.windowId, { focused: true });
        
        // 通知もクリア
        chrome.storage.local.set({ hasNotification: false });
        chrome.action.setBadgeText({ text: '' });
        
        // バックグラウンドスクリプトに音声停止を伝える
        chrome.runtime.sendMessage({ action: 'stopSound' });
        
        // ポップアップを閉じる
        window.close();
      } else {
        alert('Gather.townのタブが見つかりません');
      }
    } catch (error) {
      console.error('Error focusing gather.town tab:', error);
      alert('エラーが発生しました');
    }
  });
  
  // 初期状態を更新
  updateStatus();
  
  // ストレージの変更を監視
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.hasNotification) {
      updateStatus();
    }
  });
});