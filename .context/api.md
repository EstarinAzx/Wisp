---
type: api
project: wisp
updated: 2026-06-18
tags: [context, api, vscode]
---

# Surface

The project's surface is a VS Code extension: the Inquire command, other commands, settings, and a webview side panel. It consumes one external API.

## Inquire (the one feature)
- **Slice #5 (2026-06-17) removed Completion**: no `InlineCompletionItemProvider`, no `registerInlineCompletionItemProvider`, no ghost text, no `enabled` toggle. Wisp is **Inquire-only**.
- Inquire is the `wisp.inquire` command (see the table below): instruction from an input box → rewrite the target span (selection, or current line if none) over whole-file context → confirmable `WorkspaceEdit` replace → native refactor-preview accept/reject. Pure cores `buildEditPrompt`/`extractEditText` live in `src/catalog.ts`. See [[decisions]] (2026-06-17).

## Commands
| Command id | Title | What it does |
|---|---|---|
| `wisp.setApiKey` | Wisp: Set API Key | Prompt + store key in SecretStorage; invalidate cached client. |
| `wisp.listModels` | Wisp: List / Choose Model | `GET /models` → quick-pick → write `model` setting. |
| `wisp.inquire` | Wisp: Inquire | **Inline-chat edit (slice #4).** `showInputBox` instruction → target span = selection (or current line if none), whole file = context → `buildEditPrompt`/`extractEditText` → `WorkspaceEdit` replace over the span (add **and** delete) with `needsConfirmation` → native refactor-preview accept/reject. Cancellable `withProgress`. Keybinding **`Ctrl+Shift+I`** (rebindable; `Ctrl+I` is Copilot's). In the `editor/context` menu (`when: editorTextFocus`) + palette. |

## Settings (`wisp.*`)
`provider` (str, default `opencode-go`, **`scope: machine`** — the Active Provider id; selecting one selects where the bearer key is sent, so it must not be workspace-overridable; unknown → falls back to `opencode-go`), `baseUrl` (str, default `https://opencode.ai/zen/go/v1`, **`scope: machine`** — used **only** when the Active Provider is `custom`; built-ins ignore it and use their hardcoded catalog URL), `model` (str, default **bare** `minimax-m3` — the prefixed form is rejected, see [[gotchas]]; now a **mirror** of the Active Provider's model, sourced from globalState), `maxTokens` (0 = uncapped), `temperature` (0.1). No `apiKey` setting — key is SecretStorage/env only. **Completion-only settings (`enabled`/`debounceMs`/`maxPrefixChars`/`maxSuffixChars`) were removed in slice #5.** Panel and commands write to the scope that already defines the value (`targetFor()`), not blindly Global.

### Provider catalog (multi-provider, Issues 4–7; Zen/Go split #12)
- `PROVIDERS` is a code constant in `src/extension.ts`: 10 built-in rows `{id,label,baseUrl,defaultModel,apiKeyEnv,catalogKey?,keyId?}` (base URLs **hardcoded**, never from settings) + a `custom` row whose base URL is the user-supplied machine-scoped `wisp.baseUrl`. The **Active Provider** (`activeProvider()`) is the source of truth; an unknown `wisp.provider` falls back to row 0 (**`opencode-go`**, default). **OpenCode Go** (`/zen/go/v1`, budget) and **OpenCode Zen** (`/zen/v1`, premium Claude/GPT/Gemini) are two endpoints of one account.
- **Per-Provider key:** SecretStorage slot `wisp.apiKey.<keyId ?? id>` → the row's env var (`apiKeyEnv`: `OPENCODE_API_KEY`/`OPENAI_API_KEY`/`GROQ_API_KEY`/`MISTRAL_API_KEY`/`OPENROUTER_API_KEY`/`OLLAMA_API_KEY`/`KILOCODE_API_KEY`/`CLINE_API_KEY`; local-`ollama` + `custom` have none) → none. **`keyId`** lets a row borrow a sibling's slot: `opencode-zen` sets `keyId: 'opencode-go'`, so both OpenCode endpoints share one stored key (`resolveKeyId`/`keySlotFor` route every get/store/delete/display). A keyless row is hidden from the chat picker — see [[gotchas]].
- **Per-Provider model memory:** extension `globalState` map `wisp.models` (`{providerId: model}`) → row `defaultModel`; `wisp.model` mirrors the active one. **No model-id transform** — each `defaultModel` is the Provider's native (bare) form.
- **Client** (`getClient`) is built from the active row's resolved `{baseUrl, key}` (`activeBaseUrl()`) and rebuilt when the Active Provider, its key, or its model changes.
- **Two silent one-time migrations, run in order on activate:** (1) `migrateZenToGo` — moves any key + remembered model from the old `opencode-zen` slot to **`opencode-go`** and **deletes** the old zen slot (it held a Go key; leaving it would 401 the new `/zen/v1` row); (2) `migrateLegacyKey` — pre-catalog `wisp.apiKey` → `wisp.apiKey.opencode-go` (+ `wisp.model` → Go's globalState record), then deletes the legacy slot. Both no-op once the go slot exists; zen→go runs first so the rare both-present case can't orphan a Go key. Pure planners `planZenToGoMigration`/`planLegacyMigration` in `catalog.ts`.
- ⚠ `ollama`/`ollama-cloud`/`kilocode`/`cline` `defaultModel`s are **best-effort presets** — not yet verified against each `GET /models` (no keys at build); the panel model picker is the correction path.

## External API consumed — OpenCode (`go` + `zen`)
- Two endpoints of the same OpenCode account (one Bearer key): **Go** `https://opencode.ai/zen/go/v1` (budget) and **Zen** `https://opencode.ai/zen/v1` (premium). Both OpenAI-compatible.
- `POST /chat/completions` — standard OpenAI body; `model` must be the **bare** id (`minimax-m3` on Go; `claude-opus-4-8`/`gpt-5.5`/… on Zen) — the `opencode/`-prefixed form returns `401 … not supported`. No fill-in-middle route exists.
- `GET /models` — `{ data: [{ id }] }` for discovery; **public** (no auth) on both, returns bare ids. The panel auto-fetches it once a key is set. Go served 18 ids as of 2026-06-10 (minimax/kimi/glm/deepseek/qwen/mimo + `hy3-preview`); Zen serves the **premium** set (Claude/GPT/Gemini families) as of 2026-06-18.
- Auth: `Authorization: Bearer <key>` (handled by the OpenAI SDK). Nothing else required — no `anthropic-version`, no `x-api-key`, no routing headers.
- Reference implementations studied: the user's `llm-provider` (OpenAI SDK → this exact base URL) and the `codebuff` repo's server handlers (raw fetch, same wire contract).

## Side-panel webview
- Activity-bar view container `wisp` (icon `media/wisp.svg`) + a single `type: webview` view `wisp.panel`. Registered with `registerWebviewViewProvider` in `src/extension.ts`; provider is `WispPanelProvider` in `src/sidePanelProvider.ts`.
- The provider serves an HTML shell (strict CSP + script nonce, `asWebviewUri` for assets) loading the Vite bundle (`dist/webview/main.js` + `main.css`).
- The panel calls the same shared actions as the commands (`storeApiKey`/`clearApiKey`/`fetchModelIds`/`setModel`/`setProvider`/`setBaseUrl`/`getState`), injected as a `PanelHost` — panel and commands never drift.

### Message protocol
- **webview → ext:** `ready` · `setApiKey{value}` · `clearApiKey` · `selectModel{value}` · `selectProvider{value}` · `setBaseUrl{value}` · `refreshModels`.
- **ext → webview:** `state{state}` where `state = {keyIsSet, keySource: 'stored'|'env'|'none', keyEnv, model, baseUrl, providerId, providers: {id,label}[], isCustom}` · `models{ids}` · `modelsError{message}` · `activity{thinking}`.
- **Key is write-only across the boundary** — the value is never sent back (only presence + source), and error text is `sanitizeError`'d so a server 401 body can't leak key fragments. See [[gotchas]].
- State is pushed on `ready`, on `onDidChangeConfiguration` (any `wisp.*`), and on `secrets.onDidChange` (covers this window's key writes and changes from other windows).
- **Activity** (`activity{thinking}`) is the live Thinking/Idle signal, pushed separately from `state` on every in-flight transition (`enter/exitInFlight`) **and** on `ready` (via `PanelHost.getActivity`), so it never drags the async `getState`/model-refetch path. The panel renders it as a top status row (pulse dot); the status bar shows the same Activity as `ready`/`thinking`/`error`. See [[decisions]].

## Related
- [[overview]]
- [[stack]]
- [[decisions]]
- [[gotchas]]
