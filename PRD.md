# PRD v1.0 — ChatGPT Web Injector (Local-only)

## 1. Product Overview

### 1.1 Definition
A Chrome extension that lets users select text on any webpage, apply a preset prompt template, and open a new LLM web page with composed content.

No API usage, no backend, no database, no SaaS dependencies.

### 1.2 Core Value
- Remove repetitive copy/switch/paste workflows
- Reuse prompt templates consistently
- Enable quick context transfer from webpage to LLM chat

### 1.3 Non-goals
- No model API integration
- No cloud sync/account system
- No server-side processing

---

## 2. Target Users
- Heavy ChatGPT users
- Researchers / product / technical users reading many webpages
- Users who need structured analysis from selected content

---

## 3. Scope (v0.1)

### In Scope
1. Context-menu trigger from selected text
2. Single editable default template (Options page)
3. Variables:
   - `{{selection}}`
   - `{{title}}`
   - `{{url}}`
4. Open LLM target in **new tab**
5. Default target: ChatGPT; architecture reserves future Gemini/Claude targets
6. Local storage via `chrome.storage.sync`

### Out of Scope
- Multi-template management
- Keyboard shortcuts
- Full multi-model target routing UI
- Cloud settings sync/account

---

## 4. User Flow
1. User highlights text on a webpage (or not, allowed by spec)
2. Right-click -> `Send to ChatGPT`
3. Extension reads current template and fills variables
4. Extension opens a **new tab** to target model page
5. Extension attempts inject + auto-send flow
6. If injection fails: show manual copy modal (no automatic clipboard fallback by default)

---

## 5. Functional Requirements

### 5.1 Context Menu Action
- Add context menu item: `Send to ChatGPT`
- Available on normal webpage context

### 5.2 Template Engine (local)
- One default template
- Supports variable replacement:
  - `{{selection}}`: selected text or empty string
  - `{{title}}`: current page title
  - `{{url}}`: current page URL

### 5.3 Options Page
- Edit and save default template
- Persist to `chrome.storage.sync`

### 5.4 Conversation Strategy
- Open a **new tab** for each send
- Auto-send enabled by default (decision #1A)

### 5.5 Empty Selection Behavior
- If no selected text, still proceed (`{{selection}}` becomes empty)

### 5.6 Failure Fallback
- On injection/send failure, show manual copy dialog with full composed prompt for user to copy

---

## 6. Acceptance Criteria

### Scenario A — Normal Selected Text
- Given selected text exists
- When user clicks `Send to ChatGPT`
- Then a new tab opens and composed prompt is injected and auto-sent

### Scenario B — No Selected Text
- Given no selected text
- When user clicks `Send to ChatGPT`
- Then a new tab still opens and composed prompt is generated with empty `{{selection}}`

### Scenario C — Invalid/Empty Template
- Given template is invalid or blank
- When send action is triggered
- Then extension falls back to built-in default template

### Scenario D — Injection Failure
- Given target page structure changed or injection failed
- When send flow runs
- Then extension displays manual copy modal containing full prompt content

---

## 7. Non-functional Requirements
- Local-only architecture
- No outbound calls except opening target webpage
- Fast interaction (<1.5s from click to navigation under normal conditions)
- Chrome MV3 compatible

---

## 8. Risks
1. LLM target DOM changes can break auto-send logic
2. Browser permission concerns may reduce install trust
3. Different model sites may require different injection handlers

---

## 9. Version Plan

### v0.1 (current)
- Single template
- Context menu trigger
- New-tab open
- Inject + auto-send
- Manual copy modal fallback

### v0.2
- Multi-template support
- Optional keyboard shortcut
- Optional "inject only" mode
- Multiple target selectors (ChatGPT/Gemini/Claude)

### v0.3
- Extended variables
- Better model-target abstraction
- Publish-grade UX polish

---

## 10. Launch Strategy
- GitHub-first open-source release (Decision #8A)
- Document setup and limitations clearly in README
