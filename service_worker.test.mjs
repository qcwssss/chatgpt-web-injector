import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadServiceWorker() {
  const source = await readFile(new URL('./src/service_worker.js', import.meta.url), 'utf8');
  const tabCreateCalls = [];

  const context = {
    chrome: {
      contextMenus: {
        create() {},
        removeAll(callback) {
          callback();
        },
        onClicked: {
          addListener(listener) {
            context.onContextMenuClicked = listener;
          },
        },
      },
      runtime: {
        onInstalled: {
          addListener(listener) {
            context.onInstalled = listener;
          },
        },
      },
      tabs: {
        create(details) {
          tabCreateCalls.push(details);
        },
      },
    },
    console: {
      log() {},
    },
    Date,
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  return {
    onContextMenuClicked: context.onContextMenuClicked,
    tabCreateCalls,
  };
}

test('opens ChatGPT in a new tab when the context menu item is clicked', async () => {
  const { onContextMenuClicked, tabCreateCalls } = await loadServiceWorker();

  onContextMenuClicked(
    {
      menuItemId: 'send-to-chatgpt',
      selectionText: 'hello world',
    },
    {
      id: 7,
      title: 'Example',
      url: 'https://example.com/article',
    },
  );

  assert.equal(tabCreateCalls.length, 1);
  assert.equal(tabCreateCalls[0].url, 'https://chatgpt.com/');
});
