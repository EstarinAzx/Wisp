---
type: pick-up
project: wisp
updated: 2026-06-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate, then `.context/decisions.md`
(2026-06-23 entries) for the Anthropic tool wire contract + the #28 fingerprint contract.

**Last session (2026-06-23):** Built + HITL-verified **slice #30 — Anthropic tool-calling parity (Agent mode)**.
Claude now emits tool calls, Wisp surfaces them as VS Code LM tool calls, results round-trip as `tool_result`
blocks, the loop completes — `toolCalling:true` is honest for Claude. **F5 PASSED** (5 parallel `Read` calls in
one turn). New cores in `catalog.ts` (`toAnthropicTools`, `reduceAnthropicToolCalls`, extended
`buildAnthropicMessagesBody`+`AnthropicMessage`, `parseToolInput`), `anthropicClient.ts` (`AnthropicStreamEvent`
union + tool folding in `anthropicStream`), `chatProvider.ts` (Anthropic branch forwards tools, maps parts).
17 new tests, `npm test` **187/187**, tsc+webview+vite clean. A 20-agent adversarial review found **0 code bugs**
(3 coverage gaps → 2 tests added, 1 justified-skip). Committed on branch `feat/anthropic-oauth` (off `main`).

**Next task: slice #31 — Anthropic thinking/effort parity.** Enter with **`/preset scope 31`**. Claude chat runs
**thinking-OFF, effort-default** because `buildAnthropicMessagesBody` sends no `thinking`/`output_config.effort`.
Mirror Codex's panel Effort knob: add `thinking:{type:'adaptive'}` + `output_config:{effort}` (low..max — **NOT**
`budget_tokens`, which 400s on Opus 4.7+), threading the existing globalState `wisp.effort` (or a Claude-gated one).
TDD the body change. **PROBE FIRST** (the blocker): confirm the subscription OAuth Messages path accepts these body
fields without a synthetic-429. #30's tools rode that path fine — partial evidence it'll work, but verify.

**Landmines / things to know:**
- **The #28 fingerprint contract is load-bearing** — any new body field must NOT change how `firstUserMessage` is
  sampled (first non-system turn's TEXT). #31's `thinking`/`effort` are the next fields to ride it; the fingerprint
  itself only hashes first-user-message text, so the risk is backend *validation* of the new fields, not the hash.
- **Anthropic ≠ Codex wire format** (see [[decisions]] 2026-06-23 #30): no strict schema, object `tool_choice`,
  sibling `tool_use` blocks, parsed `input`, index-keyed streaming. Don't "simplify" toward the Codex shape.
- **Images still deferred** for Anthropic chat — own follow-up, not #31.
- **Subscription 1M ceiling** still unverified — separate small probe (drop opus/sonnet `contextInput` if it 4xx/413s).
- **`CLAUDE.md` still uncommitted** (pre-existing, unrelated) — decide separately.
- **Before any F5:** uninstall `local.wisp` (stale-panel collision). See [[gotchas]].
- **Not yet shipped:** branch `feat/anthropic-oauth` has #28/#29/#30 committed but no PR for #30 yet — run
  `/preset ship` to push + open the PR.

Full state in [[active-work]]; the verified design in [[oauth-recon]]; the request/tool/caps contracts in
[[decisions]] (2026-06-23); traps in [[gotchas]]; domain language in `CONTEXT.md`.
