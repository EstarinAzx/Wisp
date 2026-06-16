---
type: pick-up
project: wisp
updated: 2026-06-17
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last session (2026-06-17) — planning only, no code.** Shaped + locked the **scope pivot**:
deprecate **Completion** (always-on, `enabled`-gated ghost-text autocomplete) and evolve **Inquire**
into a VS Code inline-chat-style **editor** (instruction in a quick input box → AI rewrites the target
span, add **and** delete → accept/reject diff). Reuses the Provider catalog, client, keys, side panel.
Wrote + committed the **design spec** (`docs/superpowers/specs/2026-06-17-inline-chat-pivot-design.md`)
and filed GitHub issues: **PRD #3** + slices **#4** (evolve Inquire B1) · **#5** (remove Completion) ·
**#6** (inline diff B2) · **#7** (bonus LM-provider, deferred/HITL). On branch `feat/inline-chat-pivot`,
commit `79845b8` (+ this `.context` update). Nothing coded.

**Next task: implement slice 1 — issue #4.** `gh issue view 4 --comments`. Plan:
1. TDD pure cores into `src/catalog.ts` (`buildEditPrompt`, `extractEditText` composing existing
   `stripThink`/`stripFences`); add cases to `src/catalog.test.ts`; `npm test`.
2. Rewire `wisp.inquire` in `src/extension.ts`: `showInputBox` instruction; selection (or current line)
   = target span; whole file = context; `WorkspaceEdit` replace with `needsConfirmation: true` → native
   refactor-preview accept/reject. Add rebindable `Ctrl+Shift+I` keybinding.
3. Verify: `npm test` green, `npm run compile` clean, F5 eyeball.

**Landmines:**
- **Do #4 before #5.** Inquire today has no surface of its own — it stashes `pendingInquiry` that the
  Completion `InlineCompletionItemProvider` returns via an early-return. Give Inquire its own edit path
  first; ripping the provider before that breaks Inquire. (See [[decisions]] 2026-06-17, [[api]] line 15.)
- **Keep pure logic vscode-free in `catalog.ts`** (the testable pattern); `extension.ts` imports `vscode`
  so tests can't import it. Don't fold new logic inline.
- **No model-id transform** — each Provider's `defaultModel` is its native form (re-adding `opencode/` 401s Zen).
- Prompt entry is `showInputBox` (top-center), NOT a floating in-editor widget — that's a proposed,
  unpublishable API. Edit + diff are in-editor; that part matches the native feel.
- `Ctrl+I` is taken by built-in Copilot inline chat (VS 1.116) — use `Ctrl+Shift+I`, rebindable.

Full rolling state in [[active-work]]; pivot rationale + API-path research in [[decisions]]; domain
language in `CONTEXT.md` (will be updated in #5).
