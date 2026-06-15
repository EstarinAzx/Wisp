---
type: active-work
project: wisp
updated: 2026-06-16
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-16 by Opus 4.8 (auto)_
_At commit: `badd981` (merge of `feat/multi-provider-catalog` → `main`)_

## Current focus
**Multi-provider Provider catalog — SHIPPED and merged to `main`.** Issues 4–7 (Active-Provider
plumbing + silent key migration, panel Provider dropdown, the 9-built-in catalog, Custom Provider +
Cline ToS note) are live on `main`. The next work is the post-merge follow-up backlog, not the feature
itself.

## State
- **In flight:** nothing.
- **Done this session:** opened **PR #1** (`gh`, body drafted from the real diff + adversarially
  verified claim-by-claim), merged it into `main` via a **merge commit** (`badd981`), and
  fast-forwarded local `main` to `origin/main`. Now on `main`, in sync.
- **Blocked:** nothing.

## Pick up here
On `main`, working tree clean. Pick one:
1. **Verify the 4 ⚠ best-effort `defaultModel`s** against each `GET /models` once keys exist —
   `ollama` (`qwen2.5-coder`), `ollama-cloud` (`gpt-oss:120b`), `kilocode` + `cline`
   (`anthropic/claude-3.5-sonnet`). Fix in `PROVIDERS` (`src/extension.ts`). `issues.md` Issue 6 wants
   this verified.
2. **README** — document `wisp.provider`, the Provider catalog, and the reworded `wisp.baseUrl`
   ("Custom only"). Skipped during Issues 4–7 (out of scope).
3. **TDD the pure helpers** — migration guard (`migrateLegacyKey` idempotency), `activeModel()` /
   `activeBaseUrl()` resolvers, `buildInquiryPrompt` slicer. Branch off `main` first per repo rule.

Carried-forward (lower priority): try a snappier default Zen model (`deepseek-v4-flash` / `kimi-k2.6`).

## Skills for next session
- `superpowers:test-driven-development` — for the pure resolver/migration unit tests (item 3).
- `superpowers:using-git-worktrees` — if isolating the next feature branch from `main`.

## Open questions
- None blocking. The 4 ⚠ model ids (item 1) are the only known unverified bit.

## Recent context
- Branch `feat/multi-provider-catalog` is **merged but not deleted** (local + remote still exist).
  Prune with `git branch -d feat/multi-provider-catalog && git push origin --delete …` when ready.
- Merged via a **merge commit**, not squash/rebase — keeps both the spec (`68b266e`) and feat
  (`79955d7`) commits in history.
- This handoff/`.context` update was committed **directly on `main`** (doc-only bookkeeping, user-approved).
- **No model-id transform anywhere** — each row's `defaultModel` is the Provider's native form; never
  re-add the `opencode/` prefix (it 401s Zen).

## Related
- [[overview]]
- [[api]]
- [[decisions]]
- [[gotchas]]
