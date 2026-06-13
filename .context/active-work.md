---
type: active-work
project: opencode-autocomplete
updated: 2026-06-14
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-14 by Opus 4.8_
_At commit: uncommitted (CONTEXT.md, PRD.md, issues.md) on a feature branch off `main`_

## Current focus
Spec'd a **new feature, Inquire**, end-to-end via a `/grill-with-docs` session — **no code this
session**. Inquire = a **manual, whole-file-context, insertable-code** suggestion: select lines →
right-click **OpenCode: Inquire** → the selection is the prompt, the whole file is context, and the
result lands as ghost text **after** the selection (append, never replace). It works **even when
Completion is disabled**. It returns **code only, never prose** — chat/explanation was explicitly
rejected. Terms fixed in `CONTEXT.md`; design captured in `PRD.md`; build captured as **Issue 2**.

## State
- **In flight:** nothing — planning is done; Issue 2 is ready to build.
- **Done this session:**
  - `CONTEXT.md` — new terms **Suggestion / Completion / Inquire / Selection-as-prompt** (resolves the
    "suggestion" overload: it names the ghost-text surface, shared by both triggers).
  - `PRD.md` — Solution part 3 (Inquire), user stories #33–#39, an "Inquire" implementation-decisions
    block (6 settled choices + the spike risk), deferred modes in Out of Scope.
  - `issues.md` — header de-staled (repo **is** git now); **Issue 2 — Inquire** appended, spike-first.
- **Blocked:** nothing.

## Pick up here
**Issue 2 — Inquire** (`issues.md`). Spike-first:
1. **Step 0 spike** — confirm `editor.action.inlineSuggest.trigger` + a stashed pending result renders
   ghost text at a **collapsed caret after a selection**. If it does NOT, stop and revisit the
   answer-surface decision before building. This is the one unproven assumption.
2. Then build per Issue 2: new `opencodeAutocomplete.inquire` command + `editor/context` menu
   (`when: editorHasSelection`) + palette; module-level `pendingInquiry`; provider early-return
   **before** the enabled/selection/debounce/cache gates; `INQUIRE_SYSTEM_PROMPT`; whole-file context
   with a ~32k-char size guard (fall back to a `buildContext` window + "file too big" toast);
   cancellable `withProgress`; reuse `stripThink`/`stripFences`/`relocateAfterComment` + the `model`
   setting. `package.json` 0.0.3 → 0.0.4. No webview change.

Consider `/preset scope` before coding, and `/tdd` for any pure helper extracted (size-guard slicer).

## Skills for next session
- `/preset scope` — entry gate before the Inquire build.
- `/tdd` — if the size-guard context slicer is extracted as a pure fn (and the still-untested M1/M2
  pure fns remain a standing option — see below).

## Open questions
- None for Inquire — every fork was resolved in the grill (surface, append-vs-replace, size cap,
  feedback, edge cases). The only unknown is the **spike** (does manual ghost-text trigger render).

## Carried-forward (pre-Inquire) options, still open
1. **Faster default model** — `minimax-m3` is a reasoning model (4–7.6s). Try `deepseek-v4-flash` /
   `kimi-k2.6`; if a non-reasoning id is reliably sub-second, change `DEFAULT_MODEL`
   (`src/extension.ts`) + the `model` default (`package.json`).
2. **TDD M1 + M2** — pure fns in `src/extension.ts` still untested + unexported. Spec in `PRD.md`.

## Recent context
- "Inquire" reuses the existing **ghost-text surface** and the whole cleanup pipeline — it is
  Completion's manual, whole-file twin, not a new UI. Picked because the user wants the answer to feel
  exactly like an autocomplete suggestion.
- Append-after (not replace) was chosen for **data safety**: a loose reasoning model returning junk
  must never eat the user's selected code. See [[decisions]].
- The pick-up note's "repo is non-git" landmine is **stale** — the repo is git (branch `main`).

## Related
- [[overview]]
- [[api]]
- [[decisions]]
- [[gotchas]]
