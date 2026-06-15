---
type: active-work
project: opencode-autocomplete
updated: 2026-06-15
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-15 by Opus 4.8_
_At commit: uncommitted (issues.md, package.json, src/extension.ts, .context/*) on branch `docs/inquire-spec` off `main`_

## Current focus
**Built Issue 2 — Inquire** (manual, whole-file, insertable-code suggestion). Eyeball/F5 **passed** —
the spike (the one unproven assumption) holds: `editor.action.inlineSuggest.trigger` + a stashed
pending result renders ghost text at a collapsed caret after the selection. All Issue 2 acceptance
criteria checked in `issues.md`.

## State
- **In flight:** nothing — Issue 2 is built, compiles clean, packaged, and eyeball-verified.
- **Done this session:**
  - `src/extension.ts` — `inquire` command; module-level `pendingInquiry`; provider **early-return**
    (before the enabled/selection/debounce/cache gates) returning the stash on caret match;
    `INQUIRE_SYSTEM_PROMPT`; `buildInquiryPrompt` (whole-file context, ~32k-char guard →
    windowed `buildContext(24000/6000)` fallback); cancellable `withProgress`; reuses
    `stripThink`/`stripFences`/`relocateAfterComment`; `enter/exitInFlight` for Activity.
  - `buildContext` gained optional `maxPrefixChars`/`maxSuffixChars` overrides (completion path
    unchanged — undefined → config defaults).
  - `package.json` — `inquire` command + `editor/context` menu (`when: editorHasSelection`);
    version 0.0.3 → **0.0.4**.
  - `issues.md` — Issue 2 criteria all `[X]`.
  - Packaged `opencode-autocomplete-0.0.4.vsix`.
- **Blocked:** nothing.

## Pick up here
Issue 2 (and Issue 1) are **done**. `issues.md` has no open slices. Next options:
1. **Ship** — `/preset ship` to push `docs/inquire-spec` + open a PR (branch name is doc-era; the build
   lives on it). Not pushed yet (wrap-up commits only).
2. **Carried-forward** options below (faster model, TDD M1/M2).
3. New slice — needs a fresh `issues.md` entry first.

## Skills for next session
- `/preset ship` — push + PR for the Inquire build.
- `/tdd` — if M1/M2 pure fns (or the new `buildInquiryPrompt` size-guard slicer) get tests.

## Open questions
- None blocking. Minor: non-comment selections rely on `relocateAfterComment` only for the newline —
  a selection ending mid-line (not a whole-line comment) appends at the caret without a forced newline.
  Acceptable per spec (comment-as-instruction is the primary flow); revisit only if it grates.

## Carried-forward (pre-Inquire) options, still open
1. **Faster default model** — `minimax-m3` is a reasoning model (4–7.6s). Try `deepseek-v4-flash` /
   `kimi-k2.6`; if a non-reasoning id is reliably sub-second, change `DEFAULT_MODEL`
   (`src/extension.ts`) + the `model` default (`package.json`).
2. **TDD M1 + M2** — pure fns in `src/extension.ts` still untested + unexported. Spec in `PRD.md`.

## Recent context
- Inquire reuses Completion's **ghost-text surface** + cleanup pipeline — it is Completion's manual,
  whole-file twin. The mechanic: collapse the selection (inline ghost text won't render while a
  selection is active), stash a result keyed to document + collapsed caret, fire
  `inlineSuggest.trigger`; the provider hands it back before any gate, then clears it.
- **Append, never replace; code only, never prose** — both alternatives stay rejected (data-loss /
  wrong-surface). The zero-width insert range guarantees append.
- Stale doc nits (not touched, surgical): `overview.md` still says "repo is non-git"; `api.md` still
  lists `maxTokens` default `64` (actual `0`). Pre-existing — fix only if revisiting those files.

## Related
- [[overview]]
- [[api]]
- [[decisions]]
- [[gotchas]]
