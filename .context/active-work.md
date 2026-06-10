---
type: active-work
project: opencode-autocomplete
updated: 2026-06-10
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-10 by Opus 4.8 (background)_
_At commit: 6f030be + this session's commit (comment-line guard + vsix 0.0.2)_

## Current focus
Completions worked but output was **clunky**: (1) the model would *continue the comment line*
(`// loop through the array` → ` and log each person's name…` then the loop), and (2) cram a
multi-line construct onto one line. Two-layer fix shipped this session:

1. **Prompt** (`SYSTEM_PROMPT`, `src/extension.ts`) — added format rules: write real newlines +
   match the file's indentation, never collapse multi-line onto one line; if the text before
   `<CURSOR>` is a complete line, start on a new line and never extend a comment. Best-effort
   (a reasoning model obeys format rules only loosely).
2. **Deterministic guard** (`relocateAfterComment` + `lineCommentToken`/`looksLikeCode`/`reindent`,
   `src/extension.ts`) — the load-bearing fix. When the caret is at the **physical end of a
   whole-line comment** in a **known code language**, it forces real code onto its own fresh,
   correctly-indented line and drops a leading run of comment-continuation prose. Fails **safe**
   (returns the suggestion untouched in every ambiguous case; never deletes code).

Designed + adversarially stress-tested via a Workflow (3 approaches × 5 lenses = 15 checks; all 3
naïve approaches broke). The two tight gates (whole-line-comment + physical-EOL) are what survived:
they reject URL `//`, regex `/\/\//`, shell `${var#…}`, YAML `url#frag`, Python docstring `#`,
JSDoc/block-comment bodies, markdown/plaintext, and mid-comment authoring. See [[decisions]] / [[gotchas]].

## State
- **In flight:** committed this session on `feat/side-panel` (package.json version + src/extension.ts).
- **Done this session:**
  - `src/extension.ts` — `SYSTEM_PROMPT` format/newline/no-comment-extension rules.
  - `src/extension.ts` — `relocateAfterComment` guard + `LINE_COMMENT` map, `lineCommentToken`,
    `looksLikeCode`, `reindent` helpers; wired as the final post-clean step before caching.
  - `package.json` — version `0.0.1` → `0.0.2`.
  - Verified: `tsc -p ./ --noEmit` clean; standalone 11-case harness (real bug + every adversarial
    break the workflow found) — 11/11 pass.
  - Recompiled (`npm run compile`, clean) + repackaged `opencode-autocomplete-0.0.2.vsix`.
- **Blocked:** nothing.

## Pick up here
1. **Install + eyeball 0.0.2 live** — `--force`-install the new `.vsix` + reload window (running
   build is stale otherwise, see [[gotchas]]). Retype `// loop through the array`, confirm code
   drops to its own line and the comment is never extended. Spot-check Python (`#`).
2. **Faster default model** — `minimax-m3` is a reasoning model, 4–7.6s/suggestion. Try
   `deepseek-v4-flash` / `kimi-k2.6` in the panel; if a non-reasoning id is reliably sub-second,
   change `DEFAULT_MODEL` (`src/extension.ts`) + the `model` default (`package.json`).
3. **TDD M1 + M2** — the pure fns in `src/extension.ts` (`stripFences`/`stripPrefixOverlap`/
   `stripThink`, now also `looksLikeCode`/`reindent`/`relocateAfterComment`, and `buildContext`)
   are still untested and unexported. Spec in `PRD.md`. Test-export or extract first. Use `/tdd`.
4. **(optional) `/preset ship`** — push `feat/side-panel`, open a PR.

## Open questions
- Block/JSDoc comments (`/* */`, `* …`) are intentionally **unguarded** — only single-line comments
  trigger the model's finish-the-comment behaviour. If block-comment extension shows up in practice,
  detecting an open `/* */` from the prefix is the next increment (the workflow surfaced this gap).

## Related
- [[overview]]
- [[api]]
- [[decisions]]
- [[gotchas]]
