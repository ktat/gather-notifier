// 言語リソースキャッシュ
let languageCache = {};

// Initialize i18n
async function initializeI18n(selectedLanguage = null) {
  const elements = document.querySelectorAll('[data-i18n]');
  
  for (let element of elements) {
    const messageKey = element.getAttribute('data-i18n');
    let message;
    
    if (selectedLanguage && selectedLanguage !== 'auto') {
      // カスタム言語が選択されている場合、該当する言語リソースを使用
      message = await getCustomMessage(messageKey, selectedLanguage);
    } else {
      // 自動またはデフォルトの場合はChrome標準のi18nを使用
      message = chrome.i18n.getMessage(messageKey);
    }
    
    if (message) {
      element.textContent = message;
    }
  }
}

// カスタム言語メッセージ取得
async function getCustomMessage(messageKey, language) {
  try {
    // キャッシュチェック
    if (!languageCache[language]) {
      const response = await fetch(`/_locales/${language}/messages.json`);
      languageCache[language] = await response.json();
    }
    
    return languageCache[language][messageKey] && languageCache[language][messageKey].message;
  } catch (error) {
    console.error('Error loading custom language:', error);
    return chrome.i18n.getMessage(messageKey); // フォールバック
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Get saved language preference and initialize i18n
  const result = await chrome.storage.local.get(['language']);
  const savedLanguage = result.language || 'auto';
  await initializeI18n(savedLanguage);
  const statusDiv = document.getElementById('status');
  const goToGatherBtn = document.getElementById('goToGatherBtn');
  const concentrationBtn = document.getElementById('concentrationBtn');
  const enableWaveCheckbox = document.getElementById('enableWave');
  const enableChatCheckbox = document.getElementById('enableChat');
  const enableCallCheckbox = document.getElementById('enableCall');
  const languageSelect = document.getElementById('languageSelect');
  const debugModeCheckbox = document.getElementById('debugMode');
  
  // ポップアップが開かれた時に自動的に通知をクリア
  // (improvement/done/1.md の要求に従い、ただしimprovement/5.mdで自動移動は削除)
  async function autoClear() {
    try {
      // 通知をクリア
      chrome.storage.local.set({ hasNotification: false });
      
      // 応答不可モード中の場合はバッジをクリアしない
      const result = await chrome.storage.local.get(['isConcentrationMode']);
      const isConcentrationMode = result.isConcentrationMode || false;
      
      if (!isConcentrationMode) {
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
    chrome.storage.local.get(['hasNotification', 'isConcentrationMode'], (result) => {
      const hasNotification = result.hasNotification || false;
      const isConcentrationMode = result.isConcentrationMode || false;
      
      if (isConcentrationMode) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status concentration-mode';
        statusDiv.textContent = chrome.i18n.getMessage('concentrationModeActive');
      } else if (hasNotification) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status has-notification';
        statusDiv.textContent = chrome.i18n.getMessage('newNotificationAvailable');
      } else {
        statusDiv.style.display = 'none';
      }
    });
  }
  
  // 設定を読み込み
  async function loadSettings() {
    const result = await chrome.storage.local.get(['enableWave', 'enableChat', 'enableCall', 'isConcentrationMode', 'language', 'debugMode']);
    
    enableWaveCheckbox.checked = result.enableWave !== false; // デフォルトtrue
    enableChatCheckbox.checked = result.enableChat !== false; // デフォルトtrue
    enableCallCheckbox.checked = result.enableCall !== false; // デフォルトtrue
    debugModeCheckbox.checked = result.debugMode || false; // デフォルトfalse
    
    // 言語設定を読み込み
    languageSelect.value = result.language || 'auto'; // デフォルトは自動
    
    const isConcentrationMode = result.isConcentrationMode || false;
    const savedLanguage = result.language || 'auto';
    
    if (isConcentrationMode) {
      const endConcentrationMessage = savedLanguage !== 'auto'
        ? await getCustomMessage('endConcentrationMode', savedLanguage)
        : chrome.i18n.getMessage('endConcentrationMode');
      
      if (endConcentrationMessage) {
        concentrationBtn.textContent = endConcentrationMessage;
      }
      concentrationBtn.classList.add('active');
      concentrationBtn.style.display = 'block';
    } else {
      concentrationBtn.style.display = 'none';
      concentrationBtn.classList.remove('active');
    }
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
        // gather.townタブが見つからない場合、新しいタブで開く
        const newTab = await chrome.tabs.create({
          url: 'https://app.gather.town/',
          active: true
        });
        
        // ポップアップを閉じる
        window.close();
      }
    } catch (error) {
      console.error('Error focusing gather.town tab:', error);
      alert(chrome.i18n.getMessage('errorOccurred'));
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
  
  debugModeCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ debugMode: debugModeCheckbox.checked });
  });
  
  languageSelect.addEventListener('change', async () => {
    const selectedLanguage = languageSelect.value;
    chrome.storage.local.set({ language: selectedLanguage });
    
    // 言語変更後にUIを再初期化
    await initializeI18n(selectedLanguage);
    
    // 応答不可モードボタンのテキストも更新
    const result = await chrome.storage.local.get(['isConcentrationMode']);
    const isConcentrationMode = result.isConcentrationMode || false;
    if (isConcentrationMode) {
      const endConcentrationMessage = selectedLanguage && selectedLanguage !== 'auto'
        ? await getCustomMessage('endConcentrationMode', selectedLanguage)
        : chrome.i18n.getMessage('endConcentrationMode');
      if (endConcentrationMessage) {
        concentrationBtn.textContent = endConcentrationMessage;
      }
    }
  });
  
  // 応答不可モードボタンのイベントハンドラ
  concentrationBtn.addEventListener('click', async () => {
    try {
      const result = await chrome.storage.local.get(['isConcentrationMode']);
      const currentConcentrationMode = result.isConcentrationMode || false;
      const newConcentrationMode = !currentConcentrationMode;
      
      // 応答不可モード状態を切り替え
      chrome.storage.local.set({ isConcentrationMode: newConcentrationMode });
      chrome.runtime.sendMessage({ action: 'toggleConcentrationMode', isConcentrationMode: newConcentrationMode });
      
      if (newConcentrationMode) {
        // 応答不可モード開始: gather.townタブをアクティブにする
        const tabs = await chrome.tabs.query({});
        const gatherTab = tabs.find(tab => 
          tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
        );
        
        if (gatherTab) {
          await chrome.tabs.update(gatherTab.id, { active: true });
          await chrome.windows.update(gatherTab.windowId, { focused: true });
          
          // Note: Ctrl+U cannot be programmatically triggered due to browser security restrictions
          // The concentration mode will only show the badge indicator and disable notifications
        } else {
          alert(chrome.i18n.getMessage('gatherTabNotFound'));
          return;
        }
        
        concentrationBtn.textContent = chrome.i18n.getMessage('endConcentrationMode');
        concentrationBtn.classList.add('active');
      } else {
        // 応答不可モード終了: gather.townタブをアクティブにする
        const tabs = await chrome.tabs.query({});
        const gatherTab = tabs.find(tab => 
          tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
        );
        
        if (gatherTab) {
          await chrome.tabs.update(gatherTab.id, { active: true });
          await chrome.windows.update(gatherTab.windowId, { focused: true });
        }
        
        concentrationBtn.style.display = 'none';
        concentrationBtn.classList.remove('active');
      }
      
      updateStatus();
      
      // ポップアップを閉じる（少し遅延させてUI更新を確実に行う）
      setTimeout(() => {
        window.close();
      }, 100);
    } catch (error) {
      console.error('Error toggling concentration mode:', error);
      alert(chrome.i18n.getMessage('errorOccurred'));
    }
  });
  
  // 初期状態を更新
  updateStatus();
  await loadSettings();
  
  // ストレージの変更を監視
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local') {
      if (changes.hasNotification || changes.isConcentrationMode) {
        updateStatus();
      }
      if (changes.isConcentrationMode) {
        await loadSettings();
      }
    }
  });
});