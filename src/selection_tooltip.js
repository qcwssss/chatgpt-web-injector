const TOOLTIP_ID = 'chatgpt-web-injector-tooltip';
const SHOW_DELAY_MS = 100;
const TOOLTIP_MOUSE_OFFSET = 12;
const VIEWPORT_PADDING = 40;
const DEBUG = false;

let showTimer = null;
let lastPointerPosition = null;

function log(...args) {
  if (DEBUG) {
    console.log('[ChatGPT Web Injector - Tooltip]', ...args);
  }
}

function getSelectedText() {
  const activeElement = document.activeElement;
  const canReadInputSelection = activeElement &&
    (activeElement instanceof HTMLTextAreaElement ||
      (activeElement instanceof HTMLInputElement && typeof activeElement.selectionStart === 'number'));

  if (canReadInputSelection) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    if (start !== null && end !== null && end > start) {
      return activeElement.value.slice(start, end).trim();
    }
  }

  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

function removeTooltip() {
  const existing = document.getElementById(TOOLTIP_ID);
  if (existing) {
    log('Removing existing tooltip');
    existing.remove();
  }
}

function createTooltip(x, y) {
  log(`Creating tooltip at (${x}, ${y})`);
  removeTooltip();

  const btn = document.createElement('button');
  btn.id = TOOLTIP_ID;
  btn.title = 'Send to ChatGPT';
  btn.setAttribute('aria-label', 'Send to ChatGPT');
  btn.className = 'chatgpt-web-injector-tooltip-btn';

  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;

  log('Button created with styles:', {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    width: '40px',
    height: '40px',
    id: TOOLTIP_ID,
    class: btn.className,
  });

  btn.addEventListener('mousedown', (e) => {
    // Prevent the click from clearing the selection before we read it
    e.preventDefault();
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    const selection = window.getSelection();
    const selectionText = selection ? selection.toString().trim() : '';

    removeTooltip();

    if (!selectionText) {
      return;
    }

    chrome.runtime.sendMessage({
      type: 'SELECTION_SEND',
      payload: {
        selectionText,
        pageTitle: document.title,
        pageUrl: window.location.href,
      },
    });
  });

  const appendResult = document.body?.appendChild(btn);
  if (appendResult) {
    log('Button successfully appended to DOM');
    const computedStyle = window.getComputedStyle(btn);
    log('Computed styles:', {
      display: computedStyle.display,
      position: computedStyle.position,
      zIndex: computedStyle.zIndex,
      backgroundColor: computedStyle.backgroundColor,
      width: computedStyle.width,
      height: computedStyle.height,
    });
  } else {
    log('WARNING: Failed to append button to DOM');
  }
}

function handleMouseDown(e) {
  // If the click is on the tooltip itself, do nothing (mousedown handler on btn handles it)
  const clickedInsideTooltip = e.target?.closest?.(`#${TOOLTIP_ID}`);
  if (clickedInsideTooltip) {
    return;
  }
  log('Mouse down detected, clearing pending tooltip');
  clearTimeout(showTimer);
  removeTooltip();
}

function handleMouseUp(e) {
  log('Mouse up detected at', { x: e.clientX, y: e.clientY });
  lastPointerPosition = { x: e.clientX, y: e.clientY };
  processSelection();
}

log('Content script loaded, registering event listeners');
document.addEventListener('mouseup', handleMouseUp, true);
document.addEventListener('selectionchange', processSelection, true);
document.addEventListener('mousedown', handleMouseDown, true);
document.addEventListener('keyup', () => {
  log('Key up detected');
  processSelection();
}, true);
log('Event listeners registered (with capture phase)');
