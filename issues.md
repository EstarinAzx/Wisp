# Issues — opencode-autocomplete

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
