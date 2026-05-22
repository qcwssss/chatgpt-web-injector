import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

test('Selection tooltip behavior based on showSelectionTooltip preference', async () => {
  const dom = new JSDOM('<html><body><div id="text">Hello World, this is a test text selection.</div></body></html>', {
    url: 'https://example.com'
  });

  const store = { showSelectionTooltip: true };
  const storageListeners = [];
  let currentSelectionText = '';

  const windowMock = new Proxy(dom.window, {
    get(target, prop) {
      if (prop === 'getSelection') {
        return () => ({
          toString() {
            return currentSelectionText;
          }
        });
      }
      const val = target[prop];
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
  });

  const context = {
    chrome: {
      runtime: { sendMessage() {} },
      storage: {
        sync: {
          get(keys, callback) {
            const res = {};
            for (const key of keys) {
              res[key] = store[key];
            }
            if (callback) callback(res);
            return Promise.resolve(res);
          },
          set(values) {
            Object.assign(store, values);
            return Promise.resolve();
          }
        },
        onChanged: {
          addListener(listener) {
            storageListeners.push(listener);
          }
        }
      }
    },
    console,
    document: dom.window.document,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    globalThis: null,
    setTimeout(callback, delay) {
      // 立即同步调用，消灭延迟方便测试
      callback();
      return 1;
    },
    clearTimeout() {},
    window: windowMock,
  };

  context.globalThis = context;

  // 读取并执行内容脚本
  const source = readFileSync(new URL('../src/selection_tooltip.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, context);

  // 辅助函数：触发划词事件
  function triggerSelection(text) {
    currentSelectionText = text;

    const mouseupEvent = new dom.window.MouseEvent('mouseup', { clientX: 100, clientY: 100 });
    dom.window.document.dispatchEvent(mouseupEvent);

    const selChangeEvent = new dom.window.Event('selectionchange');
    dom.window.document.dispatchEvent(selChangeEvent);
  }

  // 1. 默认情况下（开启），选中文本应出现悬浮按钮
  triggerSelection('selected text');
  let tooltipBtn = dom.window.document.getElementById('chatgpt-web-injector-tooltip');
  assert.ok(tooltipBtn, 'Tooltip button should appear when preference is enabled');

  // 2. 当在选项页关掉开关，触发 onChanged 时，已出现的按钮应当立刻被移除
  for (const listener of storageListeners) {
    listener({ showSelectionTooltip: { newValue: false } }, 'sync');
  }
  tooltipBtn = dom.window.document.getElementById('chatgpt-web-injector-tooltip');
  assert.equal(tooltipBtn, null, 'Tooltip button should be removed instantly when preference is disabled');

  // 3. 禁用情况下，选中文本不会出现悬浮按钮
  triggerSelection('another selected text');
  tooltipBtn = dom.window.document.getElementById('chatgpt-web-injector-tooltip');
  assert.equal(tooltipBtn, null, 'Tooltip button should not appear when preference is disabled');
});
