document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const goToGatherBtn = document.getElementById('goToGatherBtn');
  const lunchBtn = document.getElementById('lunchBtn');
  const enableWaveCheckbox = document.getElementById('enableWave');
  const enableChatCheckbox = document.getElementById('enableChat');
  const enableCallCheckbox = document.getElementById('enableCall');
  
  // ポップアップが開かれた時に自動的に通知をクリア
  // (improvement/done/1.md の要求に従い、ただしimprovement/5.mdで自動移動は削除)
  async function autoClear() {
    try {
      // 通知をクリア
      chrome.storage.local.set({ hasNotification: false });
      
      // ランチタイム中の場合はバッジをクリアしない
      const result = await chrome.storage.local.get(['isLunchTime']);
      const isLunchTime = result.isLunchTime || false;
      
      if (!isLunchTime) {
        chrome.action.setBadgeText({ text: '' });
      }
      
      chrome.runtime.sendMessage({ action: 'stopSound' });
    } catch (error) {
      console.error('Error in auto clear:', error);
    }
  }
  
  // ポップアップ開始時に自動実行
  autoClear();
  
  // 現在の通知状態を取得して表示
  function updateStatus() {
    chrome.storage.local.get(['hasNotification', 'isLunchTime'], (result) => {
      const hasNotification = result.hasNotification || false;
      const isLunchTime = result.isLunchTime || false;
      
      if (isLunchTime) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status lunch-mode';
        statusDiv.textContent = 'ランチタイム中です';
      } else if (hasNotification) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status has-notification';
        statusDiv.textContent = '新しい通知があります！';
      } else {
        statusDiv.style.display = 'none';
      }
    });
  }
  
  // 設定を読み込み
  function loadSettings() {
    chrome.storage.local.get(['enableWave', 'enableChat', 'enableCall', 'isLunchTime'], (result) => {
      enableWaveCheckbox.checked = result.enableWave !== false; // デフォルトtrue
      enableChatCheckbox.checked = result.enableChat !== false; // デフォルトtrue
      enableCallCheckbox.checked = result.enableCall !== false; // デフォルトtrue
      
      const isLunchTime = result.isLunchTime || false;
      if (isLunchTime) {
        lunchBtn.textContent = 'ランチタイム終了';
        lunchBtn.classList.add('active');
      } else {
        lunchBtn.textContent = 'ランチタイム開始';
        lunchBtn.classList.remove('active');
      }
    });
  }
  
  // Gather.townタブに移動ボタン
  goToGatherBtn.addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const gatherTab = tabs.find(tab => 
        tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
      );
      
      if (gatherTab) {
        await chrome.tabs.update(gatherTab.id, { active: true });
        await chrome.windows.update(gatherTab.windowId, { focused: true });
        
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
  
  // 設定変更のイベントハンドラ
  enableWaveCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ enableWave: enableWaveCheckbox.checked });
  });
  
  enableChatCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ enableChat: enableChatCheckbox.checked });
  });
  
  enableCallCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ enableCall: enableCallCheckbox.checked });
  });
  
  // ランチタイムボタンのイベントハンドラ
  lunchBtn.addEventListener('click', async () => {
    try {
      const result = await chrome.storage.local.get(['isLunchTime']);
      const currentLunchTime = result.isLunchTime || false;
      const newLunchTime = !currentLunchTime;
      
      // ランチタイム状態を切り替え
      chrome.storage.local.set({ isLunchTime: newLunchTime });
      chrome.runtime.sendMessage({ action: 'toggleLunchTime', isLunchTime: newLunchTime });
      
      if (newLunchTime) {
        // ランチタイム開始: gather.townタブをアクティブにしてCtrl+Uを送信
        const tabs = await chrome.tabs.query({});
        const gatherTab = tabs.find(tab => 
          tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
        );
        
        if (gatherTab) {
          await chrome.tabs.update(gatherTab.id, { active: true });
          await chrome.windows.update(gatherTab.windowId, { focused: true });
          
          // Note: Ctrl+U cannot be programmatically triggered due to browser security restrictions
          // The lunch mode will only show the badge indicator and disable notifications
        } else {
          alert('Gather.townのタブが見つかりません');
          return;
        }
        
        lunchBtn.textContent = 'ランチタイム終了';
        lunchBtn.classList.add('active');
      } else {
        // ランチタイム終了: gather.townタブをアクティブにして「応答可能にする」ボタンをクリック
        const tabs = await chrome.tabs.query({});
        const gatherTab = tabs.find(tab => 
          tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
        );
        
        if (gatherTab) {
          await chrome.tabs.update(gatherTab.id, { active: true });
          await chrome.windows.update(gatherTab.windowId, { focused: true });
          
          // コンテンツスクリプトに「応答可能にする」ボタンをクリックするよう指示
          chrome.tabs.sendMessage(gatherTab.id, {
            action: 'clickResponseButton'
          }).catch(error => {
            console.error('Error sending click response button message:', error);
          });
        }
        
        lunchBtn.textContent = 'ランチタイム開始';
        lunchBtn.classList.remove('active');
      }
      
      updateStatus();
      
      // ポップアップを閉じる
      window.close();
    } catch (error) {
      console.error('Error toggling lunch time:', error);
      alert('エラーが発生しました');
    }
  });
  
  // 初期状態を更新
  updateStatus();
  loadSettings();
  
  // ストレージの変更を監視
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.hasNotification || changes.isLunchTime) {
        updateStatus();
      }
      if (changes.isLunchTime) {
        loadSettings();
      }
    }
  });
});