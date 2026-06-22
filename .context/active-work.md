---
type: active-work
project: wisp
updated: 2026-06-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-23 by Opus 4.8 (auto)._
_At commit: #32 (Anthropic `max` effort) about to be committed on `feat/anthropic-thinking-effort`.
Shipping the WHOLE Anthropic stack (#28–#32) to `main` as release **1.3.0**. `CLAUDE.md` still
uncommitted — pre-existing, unrelated; left out of the release commit on purpose._

## Current focus
**Slice #32 — Anthropic `max` effort — DONE, eyeball-passed. Releasing the full Anthropic provider to
`main` as 1.3.0.** The Effort picker now mirrors the first-party Claude Code `/effort` slider: every
effort-capable Claude shows the full `low→medium→high→xhigh→max` ladder; the wire clamps to each model's
ceiling (`anthropicThinkingEffort`), so an offered `xhigh`/`max` degrades to `high` rather than 400-ing.

## State
- **Done this session (#32):** `EffortLevel = CodexEffort | 'max'` superset; `standardEffortToCodex`
  (`max→xhigh`) for the Codex wire; `modelSupportsAnthropicMax = /opus-4-[678]/`; `anthropicThinkingEffort`
  gained a `max→high` clamp beside the `xhigh→high` one; `effortOptionsFor(provider)` — Anthropic → full
  `low→max`, Codex → `low→xhigh` (NOT model-gated — capability lives in the clamp, mirrors official). Threaded
  `EffortLevel` through extension/chatProvider/anthropicClient; Codex send-sites wrap `standardEffortToCodex`;
  `selectEffort` accepts `max`; webview renders from `state.effortOptions`. **6 new tests**, `npm test`
  **204/204**, tsc (root+webview) + vite clean.
- **Release prep:** `package.json`/`package-lock.json` 1.2.0 → **1.3.0**; `CHANGELOG.md` `[1.3.0]` entry
  covers the full Anthropic provider (#28–#32). Eyeball passed.
- **In flight:** the merge orchestration of the 2-PR stack to `main` (see Pick up here).
- **Blocked:** none.

## Pick up here
1. **Land the stack on `main` (1.3.0).** The branch `feat/anthropic-thinking-effort` is a linear descendant
   of `main`: `main → #28 → #29 → #30 → #31-effort(812d7a8) → #32`. Two open PRs: **#31** (umbrella,
   `feat/anthropic-oauth → main`, contains #28–#30) and **#33** (`feat/anthropic-thinking-effort →
   feat/anthropic-oauth`, contains #31-effort + #32). Plan: merge **#31** first (lands #28–#30), then
   `gh pr edit 33 --base main` and merge **#33** (lands effort + max). Repo convention = merge-commit
   (`--merge`, cf. the v1.2.0 "Merge pull request #26"). Tag `v1.3.0` after, to match the `v1.2.0` tag.
2. **Subscription 1M context ceiling** (separate small probe) — caps advertise model-spec 1M for Opus/Sonnet;
   if a long-context chat 4xx/413s, the subscription path caps lower → drop their `contextInput`. See [[decisions]].

## Open questions
- **Subscription context ceiling** — is 1M actually granted on the Claude.ai OAuth path, or does it cap (~200K)?
- **Does Sonnet `max` actually 400, or clamp server-side?** Moot for us (we pre-clamp to `high`), but the
  first-party client showing `max` for Sonnet implies it clamps, not errors. The issue #32 claim ("max 400s
  on Sonnet") drove the original gating; we overrode it to match the official picker.

## Skills for next session
- /preset ship — if any merge step remains, finish the orchestration + tag.

## Recent context
- **Effort taxonomy (verified against openclaude `src/utils/effort.ts` + the first-party Claude Code
  `/effort` slider):** the ladder is `low|medium|high|xhigh|max` (5 levels; `xhigh` and `max` are distinct,
  NOT aliases). `max` = Opus 4.6/4.7/4.8 (`modelSupportsMaxEffort`); `xhigh` = Opus 4.7/4.8 (+ OpenAI/Codex).
  Opus 4.6 takes `max` but NOT `xhigh` — the sets are independent. Sonnet 4.6 / Opus 4.5 take neither (top at
  `high`). The first-party picker is uniform (shows the full ladder for all) and clamps the *applied* value
  per model — we copy that.
- **Why the picker is provider-only, not model-gated:** issue #32 specified per-model `max` gating; we
  overrode it after seeing the first-party client expose `max` for Sonnet and clamp on apply. The clamp
  (`anthropicThinkingEffort`) is the single source of capability truth; the picker just mirrors official.

## Related
- [[overview]]
- [[oauth-recon]] — the design source of truth for the Anthropic provider
- [[decisions]] — 2026-06-23 entries (#30 tool wire contract; #32 max effort + picker pivot)
- [[gotchas]] — effort taxonomy trap; synthetic-429 / fingerprint contract; F5 dup-extension trap
