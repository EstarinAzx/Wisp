---
type: pick-up
project: wisp
updated: 2026-06-17
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last task finished (2026-06-17): slice #4 (issue #4) — Inquire is now an inline-chat editor.**
`wisp.inquire` takes a typed instruction (`showInputBox`), rewrites the **target span** (selection,
or current line if none) over whole-file context, and applies it as a `WorkspaceEdit` replace with
`needsConfirmation` → VS Code's native refactor-preview accept/reject (add **and** delete). Pure cores
`buildEditPrompt` + `extractEditText` TDD'd into `src/catalog.ts` (strippers moved there too); +8
Vitest cases. `Ctrl+Shift+I` keybinding added. `npm test` 21/21, `npm run compile` clean, **F5 passed**.
Committed on `feat/inline-chat-pivot`. **Completion still runs, untouched.**

**Next task: slice #5 — issue #5 (remove Completion).** `gh issue view 5 --comments`. Now unblocked.
Rip the `InlineCompletionItemProvider` + registration, the `enabled` toggle (`wisp.toggle`/`setEnabled`
+ status-bar/panel logic), debounce/cache/gating, the **now-inert** `pendingInquiry` stash + its
provider early-return, Completion-only helpers (`buildContext`/`buildUserPrompt`/`stripPrefixOverlap`/
`relocateAfterComment`/`SYSTEM_PROMPT`/`LINE_COMMENT`) and settings (`enabled`/`debounceMs`/
`maxPrefixChars`/`maxSuffixChars`), plus `buildInquiryContent` + `INQUIRE_CONTEXT_LIMIT` **and their
tests** in `catalog.ts` (dead since #4). Prune `getState`/webview shape (`sidePanelProvider.ts` +
`webview/app.tsx`). Update `CONTEXT.md` (retire Completion/Suggestion/enabled/Muted/
selection-as-prompt; redefine Inquire) and `.context/overview.md` + `api.md` → **Wisp = Inquire-only**.
Then #6 (inline diff B2, `diffLines` TDD), #7 deferred.

**Landmines:**
- **`pendingInquiry` is inert, not gone.** #4 stopped writing it but left the variable + provider
  early-return (Completion was kept untouched). #5 removes both — don't be surprised they exist.
- **Keep pure logic vscode-free in `catalog.ts`** (`stripThink`/`stripFences`/`extractEditText`/
  `buildEditPrompt` live there; `extension.ts` imports them). Don't fold new logic inline — tests
  can't import `extension.ts` (it imports `vscode`).
- **No model-id transform** — each Provider's `defaultModel` is its native form (`opencode/` prefix 401s Zen).
- **`EditMessage`** must stay a union of two single-role object types (not one object with a
  `'system'|'user'` role) or it stops assigning to the OpenAI SDK message-param array.
- **Uncommitted, NOT part of slice #4:** `CLAUDE.md` has a pre-existing edit (guideline sections 5–7)
  left unstaged — commit separately if wanted.

Full rolling state in [[active-work]]; pivot rationale + slice plan in [[decisions]] (2026-06-17);
domain language in `CONTEXT.md` (updated in #5).
