import { renderTemplate } from './template.js';
import { loadEffectiveTemplate } from './storage.js';

const MENU_ID = 'send-to-chatgpt';
const CHATGPT_URL = 'https://chatgpt.com/';
const TAB_WAIT_TIMEOUT_MS = 15000;

function createContextMenu() {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Send to ChatGPT',
    contexts: ['selection', 'page'],
  });
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error('tab_load_timeout'));
    }, timeoutMs);

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) {
        return;
      }

      if (changeInfo.status === 'complete') {
        clearTimeout(timeoutId);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

function runInjectionInPage(prompt) {
  const MODAL_ID = 'chatgpt-web-injector-fallback';

  function showFallbackModal(text) {
    const existing = document.getElementById(MODAL_ID);
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '2147483647';
    overlay.style.background = 'rgba(0,0,0,0.45)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const panel = document.createElement('div');
    panel.style.width = 'min(860px, 92vw)';
    panel.style.maxHeight = '86vh';
    panel.style.padding = '16px';
    panel.style.background = '#fff';
    panel.style.borderRadius = '12px';
    panel.style.boxShadow = '0 12px 42px rgba(0,0,0,0.25)';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '12px';

    const title = document.createElement('h2');
    title.textContent = 'Automatic send failed';
    title.style.margin = '0';
    title.style.fontSize = '18px';

    const hint = document.createElement('p');
    hint.textContent = 'Copy the full prompt below and paste it into ChatGPT manually.';
    hint.style.margin = '0';
    hint.style.color = '#4b5563';

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.width = '100%';
    textarea.style.minHeight = '280px';
    textarea.style.resize = 'vertical';
    textarea.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.padding = '8px 14px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '8px 14px';

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
      } catch (_error) {
        textarea.select();
        document.execCommand('copy');
      }
    });

    closeButton.addEventListener('click', () => {
      overlay.remove();
    });

    actions.append(copyButton, closeButton);
    panel.append(title, hint, textarea, actions);
    overlay.append(panel);
    document.body.append(overlay);
  }

  const inputSelectors = ['textarea', "[contenteditable='true']", "div[role='textbox']"];
  const sendSelectors = [
    "button[data-testid*='send']",
    "button[aria-label*='Send']",
    "button[aria-label*='send']",
    "button[type='submit']",
  ];

  let input = null;
  for (const selector of inputSelectors) {
    const candidate = document.querySelector(selector);
    if (candidate) {
      input = candidate;
      break;
    }
  }

  if (!input) {
    showFallbackModal(prompt);
    return { ok: false, reason: 'input_not_found' };
  }

  if ('value' in input) {
    input.value = prompt;
  } else {
    input.textContent = prompt;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  let sendButton = null;
  for (const selector of sendSelectors) {
    const candidate = document.querySelector(selector);
    if (candidate) {
      sendButton = candidate;
      break;
    }
  }

  if (!sendButton) {
    showFallbackModal(prompt);
    return { ok: false, reason: 'send_not_found' };
  }

  sendButton.click();
  return { ok: true };
}

function showFallbackOnlyInPage(prompt) {
  const MODAL_ID = 'chatgpt-web-injector-fallback';
  const existing = document.getElementById(MODAL_ID);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483647';
  overlay.style.background = 'rgba(0,0,0,0.45)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  const panel = document.createElement('div');
  panel.style.width = 'min(860px, 92vw)';
  panel.style.maxHeight = '86vh';
  panel.style.padding = '16px';
  panel.style.background = '#fff';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 12px 42px rgba(0,0,0,0.25)';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.gap = '12px';

  const title = document.createElement('h2');
  title.textContent = 'Automatic send failed';
  title.style.margin = '0';
  title.style.fontSize = '18px';

  const hint = document.createElement('p');
  hint.textContent = 'Copy the full prompt below and paste it into ChatGPT manually.';
  hint.style.margin = '0';
  hint.style.color = '#4b5563';

  const textarea = document.createElement('textarea');
  textarea.value = prompt;
  textarea.style.width = '100%';
  textarea.style.minHeight = '280px';
  textarea.style.resize = 'vertical';
  textarea.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';

  const copyButton = document.createElement('button');
  copyButton.textContent = 'Copy';
  copyButton.style.padding = '8px 14px';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.padding = '8px 14px';

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
    } catch (_error) {
      textarea.select();
      document.execCommand('copy');
    }
  });

  closeButton.addEventListener('click', () => {
    overlay.remove();
  });

  actions.append(copyButton, closeButton);
  panel.append(title, hint, textarea, actions);
  overlay.append(panel);
  document.body.append(overlay);

  return { ok: false, reason: 'fallback_modal_shown' };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    createContextMenu();
    console.log('[ChatGPT Web Injector] Context menu initialized.');
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const payload = {
    selection: info.selectionText || '',
    title: tab?.title || '',
    url: tab?.url || '',
  };

  try {
    const template = await loadEffectiveTemplate();
    const prompt = renderTemplate(template, payload);
    const targetTab = await chrome.tabs.create({ url: CHATGPT_URL, active: true });
    await waitForTabComplete(targetTab.id, TAB_WAIT_TIMEOUT_MS);

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: runInjectionInPage,
      args: [prompt],
    });

    console.log('[ChatGPT Web Injector] Runtime send result:', result?.result || result);
  } catch (error) {
    console.error('[ChatGPT Web Injector] Send flow failed:', error);
    if (error && typeof error.message === 'string' && error.message.includes('No tab with id')) {
      return;
    }

    try {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTabId = activeTabs[0]?.id;
      if (typeof activeTabId === 'number') {
        await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: showFallbackOnlyInPage,
          args: [renderTemplate(await loadEffectiveTemplate(), payload)],
        });
      }
    } catch (fallbackError) {
      console.error('[ChatGPT Web Injector] Failed to show fallback modal:', fallbackError);
    }
  }
});
