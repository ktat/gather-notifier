// ページの多言語対応を適用
function applyI18n() {
  // data-i18n属性を持つすべての要素を取得
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.textContent = message;
    }
  });

  // バージョン情報を動的に更新
  const manifest = chrome.runtime.getManifest();
  const versionElement = document.querySelector('[data-i18n="welcomeVersion"]');
  if (versionElement) {
    versionElement.textContent = chrome.i18n.getMessage('welcomeVersion', [manifest.version]);
  }
}

// Gather.townを開くボタンのクリックイベント
document.getElementById('openGatherBtn').addEventListener('click', async () => {
  try {
    // 既存のGather.townタブを探す
    const tabs = await chrome.tabs.query({});
    const gatherTab = tabs.find(tab =>
      tab.url && (tab.url.includes('gather.town') || tab.url.includes('app.gather.town'))
    );

    if (gatherTab) {
      // 既存のタブをアクティブにする
      await chrome.tabs.update(gatherTab.id, { active: true });
      await chrome.windows.update(gatherTab.windowId, { focused: true });
    } else {
      // 保存されているGatherバージョンを取得
      const result = await chrome.storage.local.get(['gatherVersion']);
      const gatherVersion = result.gatherVersion || 'v1';

      // 新しいタブで開く
      const url = gatherVersion === 'v2'
        ? 'https://app.v2.gather.town/'
        : 'https://app.gather.town/';

      await chrome.tabs.create({
        url: url,
        active: true
      });
    }

    // ウェルカムページを閉じる
    window.close();
  } catch (error) {
    console.error('Error opening Gather.town:', error);
  }
});

// 閉じるボタンのクリックイベント
document.getElementById('closeBtn').addEventListener('click', () => {
  window.close();
});

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
});
