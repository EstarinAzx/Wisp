---
type: active-work
project: wisp
updated: 2026-06-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-23 by Opus 4.8 (auto)._
_At commit: `6bb632e` (Merge PR #33) on `main` — release **1.3.0** landed. README updated for 1.3.0
in this session (uncommitted at note time). `CLAUDE.md` also dirty — pre-existing, unrelated._

## Current focus
**1.3.0 (full Anthropic provider, #28–#32) is shipped and merged to `main`.** This session updated the
README to document the Anthropic provider: hero pitch now covers ChatGPT **or** Claude.ai subscription,
three backend kinds (was two), new "Anthropic provider" table, Sign in/out of Claude commands, Effort in
the side-panel list, provider count 11→12, version 1.3.0.

## State
- **Done this session:** README.md doc update for 1.3.0 (Anthropic provider). No code change — docs only.
- **Done prior (1.3.0 release):** the 2-PR stack merged — PR #31 (umbrella, #28–#30) then PR #33 (#31-effort
  + #32). `main` at `6bb632e`. `npm test` was 204/204 at release.
- **Blocked:** none.

## Pick up here
1. **Tag `v1.3.0`** if not already tagged (match the `v1.2.0` tag convention). Check `git tag --list`.
2. **Subscription 1M context ceiling** (small probe) — `anthropicModelCaps` advertises model-spec 1M for
   Opus/Sonnet; if a long-context chat 4xx/413s on the Claude.ai OAuth path, the subscription caps lower →
   drop their `contextInput`. See [[decisions]] (2026-06-23 slice #29 entry).
3. **Anthropic image input** — deferred follow-up; tool-calling (#30) shipped but images stay deferred.

## Open questions
- **Subscription context ceiling** — is 1M actually granted on the Claude.ai OAuth path, or does it cap (~200K)?
- **Does Sonnet `max` actually 400, or clamp server-side?** Moot for us (we pre-clamp to `high`), but the
  first-party client showing `max` for Sonnet implies it clamps, not errors.

## Skills for next session
- /preset ship — if the README/CLAUDE.md commits want a PR rather than a direct push.

## Recent context
- **Effort taxonomy (verified against openclaude `src/utils/effort.ts` + the first-party Claude Code
  `/effort` slider):** the ladder is `low|medium|high|xhigh|max` (5 levels; `xhigh` and `max` are distinct).
  `max` = Opus 4.6/4.7/4.8; `xhigh` = Opus 4.7/4.8 (+ Codex). Sonnet 4.6 / Opus 4.5 take neither (top at
  `high`). The picker is provider-only (mirrors official); the wire clamp (`anthropicThinkingEffort`) is the
  single source of capability truth.
- **README is router-first** (since v1.1.0) — Inquire is the secondary surface; don't reframe to Inquire-first.

## Related
- [[overview]]
- [[oauth-recon]] — the design source of truth for the Anthropic provider
- [[decisions]] — 2026-06-23 entries (#30 tool wire contract; #32 max effort + picker pivot)
- [[gotchas]] — effort taxonomy trap; synthetic-429 / fingerprint contract; F5 dup-extension trap
