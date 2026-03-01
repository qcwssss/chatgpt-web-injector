const MENU_ID = 'send-to-chatgpt';

function createContextMenu() {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Send to ChatGPT',
    contexts: ['selection', 'page'],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    createContextMenu();
    console.log('[ChatGPT Web Injector] Context menu initialized.');
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;

  const payload = {
    selectionText: info.selectionText || '',
    pageTitle: tab?.title || '',
    pageUrl: tab?.url || '',
    tabId: tab?.id ?? null,
    timestamp: new Date().toISOString(),
  };

  console.log('[ChatGPT Web Injector] Context menu clicked:', payload);
});
