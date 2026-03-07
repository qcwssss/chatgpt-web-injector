import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import { tryInjectAndSend } from '../src/chatgpt_content.js';

test('tryInjectAndSend inserts prompt and clicks send button', () => {
  const dom = new JSDOM(`
    <html>
      <body>
        <textarea id="composer"></textarea>
        <button data-testid="send-button">Send</button>
      </body>
    </html>
  `);

  const { document, Event } = dom.window;
  const textarea = document.querySelector('#composer');
  const send = document.querySelector('[data-testid="send-button"]');

  let inputFired = false;
  let clicked = false;

  textarea.addEventListener('input', () => {
    inputFired = true;
  });

  send.addEventListener('click', (event) => {
    event.preventDefault();
    clicked = true;
  });

  const result = tryInjectAndSend(document, Event, 'hello world');

  assert.equal(result.ok, true);
  assert.equal(textarea.value, 'hello world');
  assert.equal(inputFired, true);
  assert.equal(clicked, true);
});

test('tryInjectAndSend returns fallback when no send control exists', () => {
  const dom = new JSDOM(`
    <html>
      <body>
        <textarea id="composer"></textarea>
      </body>
    </html>
  `);

  const { document, Event } = dom.window;
  const result = tryInjectAndSend(document, Event, 'hello world');

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'send_not_found');
});
