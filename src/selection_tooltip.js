const TOOLTIP_ID = 'chatgpt-web-injector-tooltip';
const SHOW_DELAY_MS = 100;

let showTimer = null;

function removeTooltip() {
  const existing = document.getElementById(TOOLTIP_ID);
  if (existing) {
    existing.remove();
  }
}

function createTooltip(x, y) {
  removeTooltip();

  const btn = document.createElement('button');
  btn.id = TOOLTIP_ID;
  btn.title = 'Send to ChatGPT';
  btn.setAttribute('aria-label', 'Send to ChatGPT');

  btn.style.cssText = [
    'position:fixed',
    `left:${x}px`,
    `top:${y}px`,
    'z-index:2147483646',
    'width:32px',
    'height:32px',
    'border-radius:50%',
    'border:none',
    'background:#10a37f',
    'cursor:pointer',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'box-shadow:0 2px 8px rgba(0,0,0,0.25)',
    'padding:0',
    'transition:transform 0.1s ease,box-shadow 0.1s ease',
  ].join(';');

  // Simple "send" arrow SVG icon
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.1)';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
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

  document.body.appendChild(btn);
}

function getSelectionAnchorPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  // Position just below and to the right of the selection end
  const x = Math.min(rect.right + 6, window.innerWidth - 40);
  const y = Math.max(rect.bottom + 6, 6);

  return { x, y };
}

function handleMouseUp() {
  clearTimeout(showTimer);

  showTimer = setTimeout(() => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';

    if (!text) {
      removeTooltip();
      return;
    }

    const pos = getSelectionAnchorPosition();
    if (!pos) {
      removeTooltip();
      return;
    }

    createTooltip(pos.x, pos.y);
  }, SHOW_DELAY_MS);
}

function handleMouseDown(e) {
  // If the click is on the tooltip itself, do nothing (mousedown handler on btn handles it)
  if (e.target && e.target.id === TOOLTIP_ID) {
    return;
  }
  clearTimeout(showTimer);
  removeTooltip();
}

document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mousedown', handleMouseDown);
