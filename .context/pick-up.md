---
type: pick-up
project: wisp
updated: 2026-06-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate, then `.context/decisions.md`
(2026-06-23 entries) for the Anthropic effort wire contract + the #28 fingerprint contract.

**Last session (2026-06-23):** Built + eyeball-passed **slice #32 — Anthropic `max` effort**, then cut release
**1.3.0** shipping the whole Anthropic provider (#28–#32) to `main`. The Effort picker now mirrors the
first-party Claude Code `/effort` slider: `effortOptionsFor(provider)` shows Anthropic the full
`low→medium→high→xhigh→max` ladder (NOT model-gated), Codex stops at `xhigh`. Capability lives in the wire
clamp — `anthropicThinkingEffort` does `xhigh→high` (non-Opus-4.7/8) and `max→high`
(`modelSupportsAnthropicMax = /opus-4-[678]/`); `standardEffortToCodex` folds a stored `max→xhigh` for the
Codex wire. New type `EffortLevel = CodexEffort | 'max'`. 6 new tests, `npm test` **204/204**, tsc+webview+vite
clean. `package.json`/lock → 1.3.0, `CHANGELOG.md` `[1.3.0]` entry added.

**This session also handled the merge to `main`** — see [[active-work]] "Pick up here" for exact PR-merge
state. If the merge orchestration was interrupted, finish it: the 2-PR stack is **#31** (umbrella,
`feat/anthropic-oauth → main`, slices #28–30) then **#33** (`feat/anthropic-thinking-effort →` repointed to
`main`, effort + max). Repo convention = merge-commit (`--merge`). Tag `v1.3.0` after (matches the `v1.2.0`
tag), and consider a GitHub release.

**Next task (once 1.3.0 is landed): the subscription 1M-context-ceiling probe.** Caps advertise model-spec 1M
for Opus/Sonnet; if a long-context Claude chat 4xx/413s, the Claude.ai OAuth path caps lower (~200K?) → drop
their `contextInput` in `anthropicModelCaps`. Small, isolated.

**Landmines / things to know:**
- **Effort is two independent capabilities, not one ladder** — `max` = Opus 4.6/4.7/4.8, `xhigh` = Opus 4.7/4.8.
  Opus 4.6 has `max` but NOT `xhigh`. Sonnet 4.6 / Opus 4.5 have neither (ceiling `high`). The picker over-offers
  and the wire clamps — by design. Source of truth: openclaude `src/utils/effort.ts`. See [[gotchas]].
- **The #28 fingerprint contract is load-bearing** — samples first-user-message TEXT only, never body fields.
  Keep any new body field out of the system attribution block.
- **Effort wire shape:** `output_config.effort` (NESTED string), NOT top-level, NOT `thinking.budget_tokens`
  (400s on Opus 4.7+). The `effort-2025-11-24` beta header is required or effort is silently dropped.
- **`CLAUDE.md` still uncommitted** (pre-existing, unrelated) — deliberately excluded from the 1.3.0 commit.
- **Before any F5:** uninstall `local.wisp` (stale-panel collision). See [[gotchas]].

Full state in [[active-work]]; the verified design in [[oauth-recon]]; the request/effort/tool contracts in
[[decisions]] (2026-06-23); traps in [[gotchas]]; domain language in `CONTEXT.md`.
