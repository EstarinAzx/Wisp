# Issues — wisp

Local issue tracker. Tracer-bullet vertical slices.
Vocabulary per `CONTEXT.md`.

---

## Issue 1 — Side-panel activity indicator (Thinking / Idle)

**Type:** AFK
**Blocked by:** None — can start immediately.
**User stories:** #32 (panel analogue of #14, per `PRD.md`).

### What to build

A live activity indicator in the side panel, end-to-end through all layers. The
extension already tracks in-flight completion requests for the status bar
(`inFlight`); surface that same **Activity** in the webview as a top status row.

- Extension posts a lightweight `activity` message — `{ type: 'activity', thinking }` —
  on every in-flight transition **and** on the webview's `ready` message (so a
  request already in flight when the panel reopens shows correctly).
- Kept **separate** from the heavyweight `state` message — no async `getState`,
  no model-refetch path on the high-frequency activity ping.
- The webview holds `thinking` as its own state and renders a **top status row**
  (above API Key) with a **pulse dot**: "Thinking…" while in flight, "Idle"
  otherwise. The row is **muted** (`opacity-50`) when autocomplete is disabled
  (`state.enabled` false) — muting is a dressing of Idle, not a third Activity value.
- **Status bar is untouched** (still `ready / thinking / disabled / error`).

### Files

- `src/extension.ts` — `enterInFlight`/`exitInFlight` also call `panel?.postActivity(...)`.
- `src/sidePanelProvider.ts` — `postActivity(thinking)` method (mirrors `postState`'s
  disposed-view guard); `ready` handler also pushes current activity.
- `webview/app.tsx` — `activity` added to `InMsg`; `thinking` state; top status row + pulse dot.
- `CONTEXT.md`, `PRD.md` — already updated.

### Acceptance criteria

- [X] `enterInFlight`/`exitInFlight` call `panel?.postActivity(true/false)` in addition to `renderStatus()`.
- [X] `postActivity` posts `{ type: 'activity', thinking }` only when a view exists (no-op when hidden), mirroring `postState`.
- [X] The `ready` handler pushes the current activity (`inFlight > 0`) alongside the first `postState`.
- [X] Webview keeps `thinking` separate from `state`; renders a top row above API Key: pulse dot + "Thinking…" / "Idle".
- [X] Row is muted (`opacity-50`) when `state.enabled` is false; un-mutes when re-enabled — live.
- [X] No new term leaks: panel reads "Thinking…" / "Idle"; status bar wording unchanged.
- [X] `tsc -p ./` and `tsc -p webview` clean; `vite build` clean.
- [X] Manual verify in the Extension Development Host (F5): typing fires a request → dot pulses "Thinking…", settles to "Idle"; toggle off → row greys.

---

## Issue 2 — Inquire: on-demand whole-file code generation

**Type:** Interactive — starts with a throwaway spike to de-risk the manual ghost-text trigger (step 0
below); build the rest only once the spike proves the surface works.
**Blocked by:** None — can start immediately.
**User stories:** #33–#39 (per `PRD.md`).
**Vocabulary** per `CONTEXT.md`: **Inquire**, **Suggestion**, **Selection-as-prompt**, **Completion**.

### What to build

A manual **Inquire** action: select lines → right-click → **OpenCode: Inquire** → the extension sends
the **whole file** as context with the **selection as the prompt** and returns insertable code as
ghost text on a fresh line **after** the selection (append-only, never replace), accepted with Tab.
Works even when Completion is disabled. Inquire returns **code only, never prose**.

- **New command** `opencodeAutocomplete.inquire` (title "OpenCode: Inquire"), contributed to the
  **editor right-click menu** (`editor/context`, `when: editorHasSelection`) **and** the command palette.
- **Manual ghost-text trigger.** The command captures the selection text + whole-file context, fetches
  a non-streaming completion, stashes the result as a module-level `pendingInquiry` keyed to the
  document + collapsed caret (end of selection), then fires `editor.action.inlineSuggest.trigger`. The
  inline provider, at the **top** of `provideInlineCompletionItems` (before the enabled / selection /
  debounce / cache gates), returns the stashed result when it matches the current position, then clears it.
- **Whole-file context + size guard.** Send the entire file with the selection marked as the
  instruction. Above ~32k chars, fall back to a large window around the selection (reuse `buildContext`
  with larger limits) and toast "file too big — used nearby context."
- **New `INQUIRE_SYSTEM_PROMPT`.** "Here is the full file; the user selected these lines as an
  instruction; return ONLY code to insert after the selection; implement what the selection asks; match
  the file's indentation; no prose, no markdown fences." Reuse `stripThink` / `stripFences`; reuse
  `relocateAfterComment` (the caret sits at the selection's last line — when that line is a comment it
  forces the code onto its own line).
- **Independent of `enabled`.** The pending-Inquiry return path runs before the provider's enabled and
  selection gates; Inquire bypasses the `lastResult` completion cache (neither reads nor writes it).
- **Feedback.** A cancellable `vscode.window.withProgress` notification ("OpenCode: inquiring…", Cancel
  wired to the `AbortController`) + the existing status-bar / panel Activity via
  `enterInFlight` / `exitInFlight`.
- **Edge cases.** No selection → only reachable via the palette → toast "Select the lines to inquire
  about." No key → toast "Set your OpenCode API key first" (as `listModels` does). Neither fires a request.

### Files

- `package.json` — `contributes.commands` (`opencodeAutocomplete.inquire`) + `contributes.menus`
  (`editor/context`, `when: editorHasSelection`); version bump 0.0.3 → 0.0.4.
- `src/extension.ts` — `inquire` command handler; module-level `pendingInquiry`; provider early-return
  for a matching pending result (before all gates); `INQUIRE_SYSTEM_PROMPT`; whole-file + size-guard
  context builder; `withProgress` wrapper; register the command in `activate`.
- _No webview change_ — Inquire reuses the ghost-text surface; the status-bar / panel Activity is
  already wired.

### Acceptance criteria

- [X] **Step 0 — spike:** confirm `editor.action.inlineSuggest.trigger` + a stashed pending result
  renders ghost text at a collapsed caret right after a selection. If it does **not**, stop and revisit
  the answer-surface decision before building the rest.
- [X] `opencodeAutocomplete.inquire` registered; shows in the editor right-click menu **only** with a
  selection, and in the command palette.
- [X] Select a comment + Inquire → implementing code appears as ghost text on a new line **after** the
  comment; Tab inserts it; the selected comment is preserved (append, never replace).
- [X] The request includes the **whole file** as context (verify via the output log); over the size
  threshold it falls back to a windowed context with the "file too big" toast.
- [X] Inquire works with `enabled: false` (autocomplete off) — still returns a suggestion.
- [X] A cancellable progress notification shows while running; Cancel aborts the HTTP request; status
  bar + panel show "Thinking…" during, "Idle" after.
- [X] No selection (palette) → "Select the lines to inquire about." No key → "Set your OpenCode API key
  first." Neither path fires a request.
- [X] Inquire neither reads nor writes the `lastResult` completion cache.
- [X] `relocateAfterComment` / `stripThink` / `stripFences` reused — no doubled `<think>` or fences in
  inserted code.
- [X] `tsc -p ./` clean (`tsc -p webview` unaffected); `vite build` clean; repackaged `.vsix`.
- [X] Manual verify in the Extension Development Host (F5).

---

## Issue 3 — Rebrand the product to **Wisp** (provider/product split)

**Type:** Chore — mechanical rename, **no behavior change**. Breaking: changes the setting
namespace and the SecretStorage key, so the existing stored API key is orphaned (re-enter once).
**Blocked by:** None — can start immediately.
**User stories:** N/A — project rebrand. Gives the product its own identity, separate from any one
provider, so additional providers can be added later (future issue). Vocabulary: **Wisp** = the
product; **OpenCode Zen** = the (current, first) provider.

### What to build

A pure rename. Everything that names the **product** moves from `opencodeAutocomplete` / "OpenCode
(Zen) Autocomplete" to **Wisp** / `wisp`. Everything that names the **provider** ("OpenCode Zen")
stays. No feature, no logic, no behavior changes — only identifiers and user-facing strings.

- **Product → Wisp** (rename): package `name`/`displayName`/`description`, the `wisp.*` namespace
  for all command IDs *and* setting keys, the SecretStorage key (`opencodeAutocomplete.apiKey` →
  `wisp.apiKey`), activity-bar container + webview view IDs/titles, the `OpenCodePanelProvider`
  class, status-bar text, output-channel name, all `Wisp: …` toast/progress strings, README, and
  the icon asset.
- **Provider → OpenCode Zen** (unchanged): `DEFAULT_BASE_URL` = `https://opencode.ai/zen/go/v1`,
  the `OPENCODE_API_KEY` environment-variable fallback, and the "OpenCode Zen provider" wording in
  the `baseUrl` setting description. The product *has* a provider; the provider keeps its name.
- **Out of scope:** any multi-provider architecture, provider-switching UI, or logo redesign —
  the `media` glyph is reused, only its filename changes. Those are future issues.

### Files

- `package.json` — `name` `opencode-autocomplete`→`wisp`; `displayName` "OpenCode Zen
  Autocomplete"→"Wisp"; `description` reworded (Wisp, backed by the OpenCode Zen provider);
  `version` 0.0.4→0.0.5; viewsContainer `id`/`title`/`icon` (`opencodeAutocomplete`/"OpenCode"/
  `media/opencode.svg` → `wisp`/"Wisp"/`media/wisp.svg`); views key + `id` + `name`
  (`opencodeAutocomplete`, `opencodeAutocomplete.panel`, "OpenCode" → `wisp`, `wisp.panel`,
  "Wisp"); the 4 command `command` ids + `title`s (`opencodeAutocomplete.*`→`wisp.*`, "OpenCode:
  …"→"Wisp: …"); the `editor/context` menu `command`; configuration `title`; the 8 setting keys
  `opencodeAutocomplete.*`→`wisp.*` (enabled, baseUrl, model, debounceMs, maxTokens, temperature,
  maxPrefixChars, maxSuffixChars).
- `src/extension.ts` — `CONFIG_NS = 'opencodeAutocomplete'`→`'wisp'`; `SECRET_KEY =
  'opencodeAutocomplete.apiKey'`→`'wisp.apiKey'`; status-bar text + tooltips (4 states, "OpenCode"
  →"Wisp"); output-channel name "OpenCode Autocomplete"→"Wisp" (both spots); the `Wisp: …` rewrite
  of the toast/progress strings ("Set API Key", "API key saved", "model set to", "file too big",
  "inquiring…", "inquire failed", "nothing to insert"); the 4 `registerCommand` ids; the 2
  `affectsConfiguration('opencodeAutocomplete.…')` literals; the file-header comment. **Leave
  unchanged:** `DEFAULT_BASE_URL`, the `OPENCODE_API_KEY` env read in `resolveApiKey`.
- `src/sidePanelProvider.ts` — class `OpenCodePanelProvider`→`WispPanelProvider`; `viewId =
  'opencodeAutocomplete.panel'`→`'wisp.panel'`; `<title>OpenCode</title>`→`Wisp`; file header.
  Update the import + `registerWebviewViewProvider(OpenCodePanelProvider.viewId, …)` site in
  `src/extension.ts` to the new class name.
- `webview/app.tsx` — input placeholder "Paste OpenCode API key"→"Paste API key". **Leave
  unchanged:** the "Using OPENCODE_API_KEY from environment" line (provider env var).
- `README.md` — title; intro reframed (Wisp, currently backed by the OpenCode Zen provider);
  settings section header `opencodeAutocomplete.*`→`wisp.*`; command names "OpenCode: …"→"Wisp: …";
  status-bar glyph `✨ OpenCode`→`✨ Wisp`; output-channel name. Drive-by doc fixes while the table
  is open: `model` default `opencode/minimax-m3`→`minimax-m3`, `maxTokens` default `64`→`0` (both
  already stale vs `package.json`). Keep the "How it works" OpenCode-Zen/FIM explanation (provider).
- `media/opencode.svg` → rename to `media/wisp.svg` (same glyph); update the `package.json` icon
  ref. (Logo redesign is a separate future issue.)
- `issues.md` — header line 1 `# Issues — opencode-autocomplete`→`# Issues — wisp`.
- `.context/*`, `CONTEXT.md`, `PRD.md` — product-name references → Wisp; add a short decision note
  recording the rebrand and the **Wisp (product) / OpenCode Zen (provider)** split.

### Acceptance criteria

- [X] `package.json`: `name` `wisp`, `displayName` "Wisp", `version` 0.0.5; every
  `opencodeAutocomplete.*` id/key → `wisp.*`; container/view/config titles read "Wisp"; icon
  `media/wisp.svg`.
- [X] `src/extension.ts`: `CONFIG_NS = 'wisp'`, `SECRET_KEY = 'wisp.apiKey'`; 4 `registerCommand`
  ids + both `affectsConfiguration` literals use `wisp.*`.
- [X] `src/sidePanelProvider.ts`: class `WispPanelProvider`, `viewId = 'wisp.panel'`, `<title>`
  Wisp; the `extension.ts` import + registration use the new class name.
- [X] All user-facing chrome reads "Wisp": status bar (disabled/thinking/error/ready), output
  channel, command-palette titles ("Wisp: …"), activity-bar container, panel title, toasts,
  progress notification.
- [X] Provider plumbing untouched: `DEFAULT_BASE_URL` still `https://opencode.ai/zen/go/v1`; the
  `OPENCODE_API_KEY` env fallback still resolves a key; the `baseUrl` setting description still
  names the "OpenCode Zen provider"; the webview env line still reads `OPENCODE_API_KEY`.
- [X] `README.md` retitled; settings table uses `wisp.*`; stale `opencode/minimax-m3`→`minimax-m3`
  and `maxTokens` default corrected.
- [X] `media/opencode.svg` renamed to `media/wisp.svg`; `package.json` icon ref updated; no
  dangling asset reference.
- [X] Docs synced: `issues.md` header reads `wisp`; `CONTEXT.md`/`PRD.md`/`.context/*` product
  names updated; a decision note records the Wisp/OpenCode-Zen product/provider split.
- [X] `tsc -p ./` clean; `tsc -p webview` clean; `vite build` clean.
- [X] Grep guard: `grep -ri opencodeautocomplete` → nothing (only the issue tracker + the rebrand ADR
  document the old name); `grep -ri "opencode"` → only
  provider-scoped hits (base URL, `OPENCODE_API_KEY`, "OpenCode Zen provider", the README provider
  explanation).
- [ ] Manual verify (F5 Extension Development Host): extension loads as "Wisp"; activity-bar shows
  Wisp; all four commands appear as "Wisp: …"; settings appear under `wisp.*`. The previously
  stored key is orphaned (expected) — run **Wisp: Set API Key**, then confirm autocomplete **and**
  Inquire still work end-to-end.

---

## Issue 4 — Active-Provider plumbing + silent key migration (tracer bullet)

**Type:** AFK — foundational plumbing, no behavior change for the default user.
**Blocked by:** None — builds on the rebrand (Issue 3).
**User stories:** N/A — foundation for multi-provider (PRD "Multi-provider" section).
**Vocabulary** per `CONTEXT.md`: **Provider**, **Active Provider**, **Provider catalog**, **Built-in
Provider**, **OpenCode Zen**. Decision: `decisions.md` 2026-06-15 multi-provider ADR.

### What to build

The **thinnest end-to-end** proof of the hard-to-reverse plumbing — make the **Active Provider** the
source of truth, with a real backend switch driving a real **Completion** (and **Inquire**) against a
real per-Provider key, **before** any catalog breadth or dropdown UI. Provider selection is via
`settings.json` only in this slice (no panel UI).

- **Two-row catalog.** A code constant `PROVIDERS` with two **built-in** rows — `opencode-zen`
  (default) + one second (e.g. `groq`) — each `{ id, label, baseUrl, defaultModel, apiKeyEnv }` with
  the **base URL hardcoded in code** (never read from settings).
- **`wisp.provider` setting** — `"scope": "machine"` (key-redirect security; same rationale as
  `baseUrl`), default `opencode-zen`; an unknown value falls back to the default row.
- **Active-Provider-scoped key/model.** Rework `resolveApiKey`/`getClient`/`storeApiKey`/`clearApiKey`/
  `getState`: key resolves **`wisp.apiKey.<activeId>`** (SecretStorage) → the active row's
  `apiKeyEnv` env fallback → none. Active **model** comes from a `context.globalState`
  `{ providerId: model }` map (else the row's `defaultModel`); `wisp.model` mirrors the active model.
  **No model-id transform** (Zen stays bare `minimax-m3`).
- **Client rebuild on switch.** `cachedClient` is built from the active row's resolved
  `{ baseUrl, key, model }` and invalidated when `wisp.provider`, its key, or its model changes (extend
  the `onDidChangeConfiguration` handler).
- **Silent one-time migration.** On activate: if `wisp.apiKey` exists and `wisp.apiKey.opencode-zen`
  does not, copy the key into the Zen slot, copy `wisp.model` into Zen's globalState record, delete the
  legacy `wisp.apiKey` slot. Runs **once** (no-op if the Zen slot exists). No key loss.

### Files

- `package.json` — add machine-scoped `wisp.provider` (default `opencode-zen`, description noting
  machine-scope = key-redirect security); version bump 0.0.5 → 0.0.6.
- `src/extension.ts` — `PROVIDERS` (2 rows) + `activeProvider()` resolver; capture
  `context.globalState`; active-Provider-scoped `resolveApiKey`/`getClient`/`storeApiKey`/`clearApiKey`;
  globalState model map + `wisp.model` mirror; `cachedClient` invalidation on `wisp.provider` change;
  one-time `migrateLegacyKey()` called from `activate`; `getState` reports the active Provider's
  `keySource`.
- `src/sidePanelProvider.ts` — no UI render change; `PanelState` may carry the active provider id for
  `getState` symmetry only.

### Acceptance criteria

- [ ] `PROVIDERS` is a code constant with **hardcoded** base URLs; two rows (`opencode-zen` + one
  second built-in). No built-in base URL is read from settings.
- [ ] `wisp.provider` is `"scope": "machine"`, default `opencode-zen`; an unknown value falls back to
  the default row.
- [ ] Keys read/write `wisp.apiKey.<activeId>`; env fallback uses the **active row's** `apiKeyEnv`;
  active model comes from globalState (or the row default) and `wisp.model` mirrors it.
- [ ] `getClient` builds from the active row's resolved `{ baseUrl, key, model }` and rebuilds when the
  active Provider / its key / its model changes.
- [ ] **Migration:** a pre-existing `wisp.apiKey` is copied to `wisp.apiKey.opencode-zen`, `wisp.model`
  into Zen's globalState record, and the legacy slot deleted; runs **once** (no-op if the Zen slot
  exists); no key loss.
- [ ] End-to-end: set `wisp.provider` to the second built-in + store its key → a **Completion** hits
  that Provider's base URL with its own key + native default model (output log); switch back to
  `opencode-zen` → Completion hits Zen again.
- [ ] **Inquire spot-check:** Inquire routes through the same active Provider (shares `getClient`) —
  verify it on the second built-in, not just Completion.
- [ ] Status-bar wording unchanged; no provider name leaks into the status bar.
- [ ] `tsc -p ./` clean; `tsc -p webview` clean; `vite build` clean; manual F5 verify.

---

## Issue 5 — Provider dropdown + switch UX in the side panel

**Type:** Interactive.
**Blocked by:** Issue 4 (catalog shape + active-Provider resolution). **Not** blocked by Issue 6 — the
dropdown auto-lists whatever rows exist, so it ships against Issue 4's 2 rows and grows for free.
**User stories:** "switch Provider from the panel" (PRD multi-provider section).
**Vocabulary** per `CONTEXT.md`: **Active Provider**, **Provider catalog**.

### What to build

Surface the **Active Provider** as a `<select>` at the very **top** of the side panel (above API Key),
driven by the catalog.

- Extend `PanelState` with the catalog (`providers: {id,label}[]`) + active id (+ an `isCustom` flag
  for forward-compat). Add an outbound `selectProvider{value}` message → host `setProvider(id)` (writes
  machine-scoped `wisp.provider`, clears `cachedClient`; the existing config listener `postState`s).
- **On switch to X:** (1) the API Key field reflects **X's** `keySource` (`stored`/`env`/`none`);
  (2) the existing `modelsOrigin` effect re-keys on provider change so the model picker **refetches**
  `/models` from X and shows X's remembered or default model; (3) base URL is derived (hidden for
  built-ins; the footer keeps showing it).
- **No-key on switch = HINT only** — no auto-prompt, no input box. Status bar **untouched**.

### Files

- `webview/app.tsx` — Provider `<select>` at the top; `State` gains `providers` + active id
  (+ `isCustom`); `selectProvider` outbound message; `modelsOrigin` re-keys on provider change; no-key
  hint line (never an auto-prompt).
- `src/sidePanelProvider.ts` — `PanelState` gains catalog + active id (+ `isCustom`); route
  `selectProvider` → a new `setProvider` host helper; extend `PanelHost`.
- `src/extension.ts` — `setProvider(id)` host helper (writes machine-scoped `wisp.provider`);
  `getState` returns catalog list + active id (+ `isCustom`); inject into `WispPanelProvider`.

### Acceptance criteria

- [ ] A Provider dropdown renders at the **top** of the panel (above API Key), listing every catalog
  Provider by canonical name; its value tracks the Active Provider; selecting one sets `wisp.provider`.
- [ ] On switch to X: API Key field reflects **X's** `keySource`; the model picker **refetches**
  `/models` from X and shows X's remembered model or X's catalog default; base URL is derived (footer)
  and the field stays hidden for built-ins.
- [ ] Switching to a key-less Provider shows a **hint only** — no auto-prompt, no input box.
- [ ] `setModel` writes into the active Provider's globalState record and `wisp.model` mirrors it.
- [ ] Status bar is unchanged (no provider name; still `ready`/`thinking`/`disabled`/`error`).
- [ ] `tsc -p ./` clean; `tsc -p webview` clean; `vite build` clean.
- [ ] Manual F5: switch Providers → key field, model list, and base-URL visibility update; a Completion
  routes through the newly Active Provider.

---

## Issue 6 — Full built-in catalog (9 providers): native defaults + env fallbacks

**Type:** AFK — pure data widening over Issue 4's shape.
**Blocked by:** Issue 4 (catalog row shape + resolution). **Independent of Issue 5** — can land before
or after the dropdown, which auto-lists the new rows.
**User stories:** "choose from many Providers" (PRD multi-provider section).
**Vocabulary** per `CONTEXT.md`: **Provider catalog**, **Built-in Provider**.

### What to build

Widen `PROVIDERS` from 2 rows to all **9 built-ins** — OpenCode Zen (default) · OpenAI · Groq ·
Mistral · OpenRouter · Ollama (local) · Ollama Cloud · KiloCode · Cline. Each new row ships a
**hardcoded** base URL, a **native-format** `defaultModel` (best-effort preset, verified against
`GET /models` at build), the canonical vendor name as `label`, and its `apiKeyEnv`. **Zero new
resolution code, no OAuth, no model-id transform.** Record the **dropped** providers (GitHub Copilot,
Cursor) + reasons. (The Cline ToS note + Custom row land in Issue 7.)

Reference values (verify model ids at build):

| id | baseUrl | apiKeyEnv | defaultModel |
|---|---|---|---|
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` | `gpt-4o-mini` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` | `codestral-latest` |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` | `openai/gpt-4o-mini` |
| `ollama` | `http://localhost:11434/v1` | *(none — local)* | *(user-discovered)* |
| `ollama-cloud` | `https://ollama.com/v1` | `OLLAMA_API_KEY` | *(cloud tag, e.g. `gpt-oss:120b`)* |
| `kilocode` | `https://api.kilo.ai/api/gateway` | `KILOCODE_API_KEY` | *(verify namespace via `/models`)* |
| `cline` | `https://api.cline.bot/api/v1` | `CLINE_API_KEY` | *(verify via `/models`)* |

⚠️ Ollama Cloud base URL is **`/v1`, not `/api/v1`** — the `/api` prefix is the native protocol and
breaks the OpenAI SDK (see `gotchas.md`).

### Files

- `src/extension.ts` — extend `PROVIDERS` to 9 built-ins; per-row `apiKeyEnv`.
- `package.json` — `wisp.provider` description/enum hint lists the catalog ids; version bump.

### Acceptance criteria

- [ ] `PROVIDERS` contains all **9 built-ins**, each with a hardcoded base URL, a native-format
  `defaultModel`, a canonical-name `label`, and an `apiKeyEnv`.
- [ ] Ollama Cloud uses `https://ollama.com/v1` (not `/api/v1`).
- [ ] No model-id transform anywhere; KiloCode keeps its own namespace; the `opencode/` prefix is not
  reintroduced for Zen.
- [ ] Each built-in's `apiKeyEnv` resolves a key when its env var is set (verify two: e.g.
  `GROQ_API_KEY`, `MISTRAL_API_KEY`).
- [ ] End-to-end: switch `wisp.provider` (or use the dropdown if Issue 5 has landed) across **at least
  two** new built-ins (with keys) → a **Completion** hits each Provider's base URL with its key +
  native default model (output log).
- [ ] No GitHub Copilot / Cursor row exists; their drop + reasons are recorded (`decisions.md` /
  `gotchas.md`).
- [ ] Each built-in's base URL is fixed in code, not editable in settings.
- [ ] `tsc -p ./` clean; `tsc -p webview` clean; `vite build` clean; manual F5 verify.

---

## Issue 7 — Custom Provider (user-supplied base URL + model) + Cline ToS note

**Type:** Interactive.
**Blocked by:** Issue 5 (the dropdown reveal logic) **and** Issue 6 (the Cline row must exist to carry
the note). Transitively Issue 4.
**User stories:** "reach any OpenAI-compatible endpoint" (PRD multi-provider section).
**Vocabulary** per `CONTEXT.md`: **Custom Provider**, **Built-in Provider**.

### What to build

Add the **Custom** entry — the always-works escape hatch and the **only** Provider exposing a
user-supplied base URL.

- Repurpose the existing machine-scoped `wisp.baseUrl` as **Custom's** base URL (built-ins ignore it).
  When the active provider is `custom`, the panel reveals editable **base URL** + **model** free
  fields; the resolved client uses `{ wisp.baseUrl, wisp.apiKey.custom (or env), typed model }`. For
  all built-ins the base URL stays hidden/derived (Issue 5 behavior unchanged).
- Custom carries its own `wisp.apiKey.custom` slot + globalState model memory like any catalog row.
- **Cline ToS note (§2.2):** when **Cline** is the Active Provider, surface a one-line in-panel note —
  "You are responsible for your own Cline ToS compliance" — and keep Cline **user-key only** (no
  shared/default key; this is already Wisp's default for every Provider).

### Files

- `webview/app.tsx` — Custom-only editable base-URL + model fields (revealed via `isCustom`); a
  `setBaseUrl` outbound message; the Cline one-line ToS note when Cline is active.
- `src/sidePanelProvider.ts` — route `setBaseUrl`; extend `PanelHost` with `setBaseUrl`.
- `src/extension.ts` — `custom` row whose base URL resolves from machine-scoped `wisp.baseUrl`;
  `setBaseUrl` host helper.
- `package.json` — `wisp.baseUrl` description reworded ("used **only** when the Active Provider is
  Custom"; still `"scope": "machine"`); version bump.

### Acceptance criteria

- [ ] Selecting **Custom** reveals editable **base URL** (machine-scoped `wisp.baseUrl`) + **model**
  free fields; switching to a built-in re-hides them and `wisp.baseUrl` is ignored by built-ins.
- [ ] Custom routes a real Completion to a user-supplied OpenAI-compatible endpoint with the Custom
  slot/env key + typed model (output log).
- [ ] Custom carries its own `wisp.apiKey.custom` slot + globalState model memory like any catalog row.
- [ ] `wisp.baseUrl` remains `"scope": "machine"` in `package.json` (no workspace key-redirect).
- [ ] Selecting **Cline** as Active Provider shows the one-line ToS-responsibility note; Cline accepts a
  user key only (no shared/default key).
- [ ] `tsc -p ./` clean; `tsc -p webview` clean; `vite build` clean.
- [ ] Manual F5: Custom reveal/hide works and routes a completion; the Cline note shows when active.
