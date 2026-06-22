---
type: pick-up
project: wisp
updated: 2026-06-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate, then `.context/decisions.md`
(2026-06-23 entries) for the Anthropic effort wire contract + the #28 fingerprint contract.

**Last session (2026-06-23):** Built + F5-verified **slice "#31" — Anthropic thinking/effort parity**. Claude
chat/Inquire now honor the shared `wisp.effort` knob: `output_config.effort` (string `low|medium|high|xhigh`) +
`thinking:{type:'adaptive'}` ride the Messages body behind the **`effort-2025-11-24` beta header** (load-bearing —
without it the backend silently drops effort). Model-gated (`anthropicThinkingEffort` in `catalog.ts`:
`/opus-4-[5-8]/`+`sonnet-4-6`; Haiku/older get neither), with **`xhigh→high` clamp** on all but Opus 4.7/4.8. The
shared knob's `chatProvider` dep was renamed `codexEffort`→`effort`; the panel Effort select is ungated for
Anthropic (data-gated `state.effort !== undefined`). **F5 PASSED** — effort knob live for Claude, no synthetic-429
(the blocker probe resolved positive). 9 new tests, `npm test` **196/196**, tsc+webview+vite clean. A
cavecrew-reviewer pass pre-commit caught the `xhigh`-on-Sonnet 400 and the `[5-9]` over-match → both fixed.
Committed on branch `feat/anthropic-thinking-effort` (off `feat/anthropic-oauth`), PR opened stacked on PR #31.

**Next task: slice #32 — Anthropic `max` effort** (GitHub issue #32). Enter with **`/preset scope 32`**. `max`
was deferred from #31 because the Effort select + `wisp.effort` knob are **shared** with Codex and the
`CodexEffort` type tops at `xhigh` (Codex has no `max`). To add it: (1) widen the shared effort type past `xhigh`;
(2) per-model panel option gating — show `max` only for max-capable Claude (Opus 4.6/4.7/4.8); (3) a `max→high`
clamp in `anthropicThinkingEffort` (the #31 `xhigh` clamp is the exact template; `modelSupportsAnthropicMax =
/opus-4-[678]/`); (4) cross-provider normalization — a stored `max` must map for Codex (openclaude
`standardEffortToOpenAI`: `max→xhigh`) so switching Provider doesn't send an invalid level. TDD `anthropicThinkingEffort`.

**Landmines / things to know:**
- **The #28 fingerprint contract is load-bearing** — it samples first-user-message TEXT only, never body fields,
  so #31's effort fields rode it safely (confirmed at F5). Keep any new body field out of the system attribution block.
- **Effort wire shape (see [[decisions]] 2026-06-23 #31):** effort is `output_config.effort` (NESTED string), NOT
  top-level, NOT `thinking.budget_tokens` (400s on Opus 4.7+). The `effort-2025-11-24` beta is required.
- **The effort knob is shared Codex+Anthropic** — #32's type-widening + any clamp must not break the Codex path
  (Codex tops at `xhigh`; a stored `max` needs the `max→xhigh` map before it reaches `codexReasoning`).
- **Subscription 1M ceiling** still unverified — separate small probe (drop opus/sonnet `contextInput` if it 4xx/413s).
- **`CLAUDE.md` still uncommitted** (pre-existing, unrelated) — decide separately. NOT part of #31.
- **Before any F5:** uninstall `local.wisp` (stale-panel collision). See [[gotchas]].
- **Not yet merged:** PR #31 (`feat/anthropic-oauth`→main, slices #28–30) and the #31 effort PR
  (`feat/anthropic-thinking-effort`→`feat/anthropic-oauth`, stacked) are both open.

Full state in [[active-work]]; the verified design in [[oauth-recon]]; the request/effort/tool contracts in
[[decisions]] (2026-06-23); traps in [[gotchas]]; domain language in `CONTEXT.md`.
