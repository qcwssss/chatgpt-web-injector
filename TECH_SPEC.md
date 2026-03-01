# TECH_SPEC v1.0 — ChatGPT Web Injector

## 1. Architecture

Chrome Extension (Manifest V3)

Components:
- `service_worker.js` (background orchestration)
- `content_script.js` (target page injection)
- `options.html` + `options.js` (template management)
- `modal.css/js` (manual copy fallback UI in target tab)

Data:
- `chrome.storage.sync`
  - `defaultTemplate`
  - `targetModel` (reserved; default `chatgpt`)

---

## 2. Permissions (minimum)
- `contextMenus`
- `storage`
- `tabs`
- `scripting`
- `activeTab`
- Host permissions:
  - `https://chatgpt.com/*`
  - (reserved for v0.2)
    - `https://gemini.google.com/*`
    - `https://claude.ai/*`

---

## 3. Core Runtime Flow

1. User triggers context menu action
2. Service worker obtains:
   - selected text (`selectionText` from context menu event)
   - active tab title/url
3. Service worker loads template from storage
4. Render composed prompt by replacing variables
5. Open new target tab (ChatGPT URL)
6. Wait until tab complete
7. Inject content script / send message with composed prompt
8. Content script attempts:
   - find input area (selector fallback list)
   - set text
   - trigger input events
   - click send button
9. If any step fails, open modal fallback with full prompt text and copy button

---

## 4. Template Rendering Rules

Variables:
- `{{selection}}` -> selected text or empty string
- `{{title}}` -> source page title
- `{{url}}` -> source page URL

Fallback template (if saved template empty):

```text
You are a precise analysis assistant.

Source title: {{title}}
Source URL: {{url}}

Selected content:
{{selection}}

Please provide:
1) Key conclusion
2) Potential logic gaps
3) Confidence level
```

---

## 5. Error Handling

Failure classes:
1. Navigation/open tab failure
2. Content script injection failure
3. DOM selector miss (input/send button)
4. Send click failed

Fallback strategy (decision #7B):
- Show in-page modal with full prompt text
- User copies manually
- Modal includes: `Copy`, `Close`

---

## 6. DOM Strategy (ChatGPT)

Use selector fallback arrays and defensive checks:
- Input candidates (example):
  - `textarea`
  - `[contenteditable='true']`
  - `div[role='textbox']`
- Send candidates (example):
  - `button[data-testid*='send']`
  - `button[aria-label*='Send']`
  - nearest submit button in composer container

Trigger synthetic events after text set:
- `input`
- `change`
- optional keyboard event for enter behavior

---

## 7. Security & Privacy
- No external backend calls
- No telemetry in v0.1
- User data persists locally in browser sync storage only
- Avoid broad host permissions beyond required domains

---

## 8. File Structure (planned)

```text
chatgpt-web-injector/
  manifest.json
  src/
    service_worker.js
    content_script.js
    template.js
    selectors.js
    fallback_modal.js
  options/
    options.html
    options.js
    options.css
  assets/
    icon16.png
    icon48.png
    icon128.png
  PRD.md
  TECH_SPEC.md
  README.md
```

---

## 9. Test Checklist (v0.1)
- [ ] Selected text sends successfully
- [ ] Empty selection still generates prompt and opens target
- [ ] Template saved/reloaded from storage
- [ ] New tab opens every time
- [ ] Injection failure shows modal fallback
- [ ] Copy action in modal works
- [ ] Works on at least 3 source sites (news/blog/docs)

---

## 10. Next Milestones
- M1: Manifest + context menu + options page
- M2: End-to-end injection on ChatGPT
- M3: Fallback modal + UX polish
- M4: GitHub open-source release
