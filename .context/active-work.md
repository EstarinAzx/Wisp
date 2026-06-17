---
type: active-work
project: wisp
updated: 2026-06-17
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-17 by Opus 4.8 (auto)_
_On branch `feat/inline-chat-pivot`; slice #4 (issue #4) just committed._

## Current focus
**Slice #4 DONE — Inquire is now an inline-chat editor.** `wisp.inquire` no longer emits ghost
text: it takes a typed instruction, rewrites the target span (add **and** delete), and shows the
diff via VS Code's native refactor-preview for accept/reject. **Completion still runs, untouched**
(its removal is the next slice). Next: **slice #5 — remove Completion**.

## State
- **In flight:** nothing.
- **Done this session (slice #4 / issue #4, B1):**
  - `src/catalog.ts`: added `extractEditText` + `buildEditPrompt` (+ `EditMessage` type,
    `EDIT_SYSTEM_PROMPT`); **moved `stripThink`/`stripFences` here** (vscode-free) so `extractEditText`
    composes them. `extension.ts` now imports the strippers (Completion still uses them).
  - `src/catalog.test.ts`: **+8 Vitest cases** (fenced/bare/`<think>`/unterminated reply; system+user
    shape, 4 inputs in user msg, empty span). `npm test` **21/21**.
  - `src/extension.ts`: rewired `wisp.inquire` → `showInputBox`(instruction) → `buildEditPrompt`
    (whole-file context) → Active-Provider client (non-streaming, cancellable `withProgress`, Activity
    ping) → `extractEditText` → `WorkspaceEdit` replace over span (selection, or current line if none)
    with `needsConfirmation` → native refactor-preview accept/reject. Dropped now-orphaned
    `INQUIRE_SYSTEM_PROMPT`, `buildInquiryPrompt`, the local strippers.
  - `package.json`: `Ctrl+Shift+I` keybinding (rebindable, `mac: cmd+shift+i`) + `editor/context`
    `when` → `editorTextFocus` (Inquire now works with no selection).
  - **Verification:** `npm test` 21/21 · `npm run compile` clean · **F5 eyeball PASSED** (input box →
    refactor preview → Apply mutated the buffer; user screenshots 2026-06-17).
- **Blocked:** nothing.

## Pick up here
**Slice #5 — issue #5 (remove Completion).** `gh issue view 5 --comments`. Now **unblocked** (#4 gave
Inquire its own surface). Rip, in `src/extension.ts` unless noted:
- The `InlineCompletionItemProvider` object + its `registerInlineCompletionItemProvider` registration.
- The **enabled toggle**: `wisp.toggle`/`setEnabled`, the status-bar `disabled`/`ready`-vs-enabled
  logic, the panel enabled-checkbox/Muted dressing (`sidePanelProvider.ts` + `webview/app.tsx`).
- Debounce/cache/gating; the **now-inert** `pendingInquiry` stash + the provider early-return that
  reads it (left inert by #4 — nothing sets it).
- Completion-only helpers: `buildContext`, `buildUserPrompt`, `stripPrefixOverlap`,
  `relocateAfterComment`, `SYSTEM_PROMPT`, the `LINE_COMMENT` map.
- Completion-only settings in `package.json`: `enabled`, `debounceMs`, `maxPrefixChars`,
  `maxSuffixChars`.
- In `src/catalog.ts`: `buildInquiryContent` + `INQUIRE_CONTEXT_LIMIT` **and their tests** — dead since
  #4 swapped Inquire to `buildEditPrompt`.
- Prune `getState`/webview state shape. Update `CONTEXT.md` (retire **Completion**/**Suggestion**/
  **enabled**/**Muted**/**selection-as-prompt**, redefine **Inquire**) and `.context/overview.md` +
  `api.md` (**Wisp = Inquire-only**). `npm test` green, `npm run compile` clean, F5.

Then **#6** (inline diff B2 — `diffLines` pure + TDD, decorations + CodeLens). **#7** deferred (Option A
gating check first).

## Skills for next session
- `superpowers:executing-plans` — slices in order.
- `superpowers:test-driven-development` — `diffLines` for #6 into `catalog.ts`.

## Open questions
- **Slice #7 (Option A) gating** — BYOK / LM-chat-provider may need Copilot Business/Enterprise (Apr
  2026) vs docs saying no Copilot plan needed. Resolve before #7 (non-blocking for #5/#6).

## Recent context
- Inquire's review UX is **B1** (native refactor-preview via `needsConfirmation`); **B2** (in-editor
  decorations + CodeLens) is slice #6.
- Pure, unit-testable logic lives **vscode-free in `catalog.ts`** — `stripThink`/`stripFences` moved
  there this slice. `extension.ts` reads VS Code state and delegates. See [[gotchas]].
- The `EditMessage` type is a **union of two single-role object types**, not one object with a
  `'system'|'user'` role — that's what keeps it assignable to the OpenAI SDK's message-param array
  without a cast (encoded in a `catalog.ts` comment).
- **Uncommitted, NOT mine:** `CLAUDE.md` has a pre-existing edit (adds guideline sections 5–7) from
  before this session — left unstaged; commit it separately if wanted.

## Related
- [[overview]]
- [[api]] — Inquire is now an inline editor; provider/Inquire surface changes
- [[decisions]] — the pivot decision + API-path research
- [[gotchas]] — `pendingInquiry` (now inert), two tsconfigs, bare model-id
