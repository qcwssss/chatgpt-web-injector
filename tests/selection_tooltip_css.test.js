import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tooltipCss = readFileSync(new URL('../src/selection_tooltip.css', import.meta.url), 'utf8');

test('selection tooltip uses a pure SVG icon instead of text', () => {
  assert.match(tooltipCss, /background-image:\s*url\("data:image\/svg\+xml/);
  assert.doesNotMatch(tooltipCss, /content:\s*'BOT'/);
  assert.doesNotMatch(tooltipCss, /content:\s*'Ask'/);
});
