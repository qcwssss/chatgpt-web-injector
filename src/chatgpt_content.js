export function tryInjectAndSend(documentRef, EventCtor, prompt) {
  const inputSelectors = ['textarea', "[contenteditable='true']", "div[role='textbox']"];
  const sendSelectors = [
    "button[data-testid*='send']",
    "button[aria-label*='Send']",
    "button[aria-label*='send']",
    "button[type='submit']",
  ];

  let input = null;
  for (const selector of inputSelectors) {
    const candidate = documentRef.querySelector(selector);
    if (candidate) {
      input = candidate;
      break;
    }
  }

  if (!input) {
    return { ok: false, reason: 'input_not_found' };
  }

  if ('value' in input) {
    input.value = prompt;
  } else {
    input.textContent = prompt;
  }

  input.dispatchEvent(new EventCtor('input', { bubbles: true }));
  input.dispatchEvent(new EventCtor('change', { bubbles: true }));

  let sendButton = null;
  for (const selector of sendSelectors) {
    const candidate = documentRef.querySelector(selector);
    if (candidate) {
      sendButton = candidate;
      break;
    }
  }

  if (!sendButton) {
    return { ok: false, reason: 'send_not_found' };
  }

  sendButton.click();
  return { ok: true };
}
