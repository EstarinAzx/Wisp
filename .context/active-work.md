---
type: active-work
project: wisp
updated: 2026-06-17
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-17 by Opus 4.8 (auto)_
_At commit: `79845b8` on branch `feat/inline-chat-pivot`_

## Current focus
**Scope pivot, fully planned — not yet implemented.** Wisp is dropping **Completion**
(the always-on, enabled-gated ghost-text autocomplete) and evolving **Inquire** into a
VS Code inline-chat-style **editor**: type an instruction in a quick input box → AI rewrites
the target span (add **and** delete) → accept/reject diff. Same Provider catalog, client, keys,
side panel. PRD + tracer-slice issues are filed; next session starts coding slice 1 (#4).

## State
- **In flight:** nothing coded yet. Branch `feat/inline-chat-pivot` holds only the design spec.
- **Done this session (planning only):**
  - Brainstormed the pivot; wrote + committed the design spec
    `docs/superpowers/specs/2026-06-17-inline-chat-pivot-design.md` (`5039917`, reframed `79845b8`).
  - Filed GitHub issues: **PRD #3** (parent) + 4 tracer slices — **#4** evolve Inquire→inline-edit (B1),
    **#5** remove Completion, **#6** inline diff (B2), **#7** bonus LM-provider (deferred/HITL).
  - Research settled the API path (see [[decisions]]): native Ctrl+I widget is proposed-API →
    unpublishable; build our own on stable APIs (`showInputBox` + `WorkspaceEdit` + refactor-preview,
    later decorations + CodeLens).
- **Blocked:** nothing.

## Pick up here
**Implement slice 1 — issue #4 (evolve Inquire → inline-edit, B1).** `gh issue view 4 --comments`.
- TDD the pure cores into `src/catalog.ts` (project pattern): `buildEditPrompt`, `extractEditText`
  (composes existing `stripThink`/`stripFences`). Add cases to `src/catalog.test.ts`. `npm test`.
- In `src/extension.ts`, rewire `wisp.inquire`: `showInputBox` for the instruction; selection (or
  current line) = target span; whole file = context; apply a `WorkspaceEdit` replace with
  `needsConfirmation: true` → native refactor-preview accept/reject.
- **Inquire must stop using `pendingInquiry` and the inline-completion provider** — that decoupling is
  the whole point of doing #4 before #5. Completion stays running this slice.
- Add a rebindable `Ctrl+Shift+I` keybinding (Ctrl+I is taken by built-in Copilot inline chat, VS 1.116).
- Verify: `npm test` green, `npm run compile` clean, F5 (select → instruction → preview → accept/reject).

Slices #5/#6 are blocked by #4. #7 is deferred (HITL gating check first).

## Skills for next session
- `superpowers:test-driven-development` — the Vitest harness exists; TDD the new pure cores into `catalog.ts`.
- `superpowers:executing-plans` — implementing the filed slice issues in order.

## Open questions
- **Slice #7 (Option A) gating** — BYOK / LM-chat-provider may need Copilot Business/Enterprise (Apr 2026)
  vs VS Code docs saying it works without a Copilot plan. Resolve before building #7 (non-blocking for #4–#6).

## Recent context
- The pivot is **remove Completion, evolve Inquire** in `CONTEXT.md` vocabulary — not a greenfield feature.
- **Slice order is forced by code:** Inquire today has no surface of its own — it stashes `pendingInquiry`
  that the Completion `InlineCompletionItemProvider` returns via an early-return. So evolve Inquire (#4)
  before ripping the provider (#5), or #4 breaks.
- Prompt entry is a top-center `showInputBox`, NOT a floating in-editor widget — that native widget is a
  proposed API and unpublishable. The edit + diff are in-editor; that part matches the native feel.
- `CONTEXT.md` will need updating in #5 (retire Completion/Suggestion/enabled/Muted/selection-as-prompt,
  redefine Inquire). Stale note fixed this session: the repo IS git with remote `EstarinAzx/BYOK-IDE-Auto-Complete`.

## Related
- [[overview]]
- [[api]] — Inquire/Completion wiring being changed
- [[decisions]] — the pivot decision + API-path research
- [[gotchas]] — `pendingInquiry` entanglement, two tsconfigs, bare model-id
