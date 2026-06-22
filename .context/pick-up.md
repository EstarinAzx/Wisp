---
type: pick-up
project: wisp
updated: 2026-06-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate, then `.context/decisions.md`
(2026-06-23 entries) for the Anthropic request contract + the caps decision.

**Last session (2026-06-23):** Built + HITL-verified **slice #29 — Anthropic native chat, text streaming**.
Signed in, Claude shows in the native chat / Ctrl+I picker (1M context for Opus/Sonnet) and a turn streams
text live off the Messages SSE. New pure cores in `catalog.ts` (`buildAnthropicMessagesBody`,
`reduceAnthropicTextEvents`/`anthropicTextDelta`, `anthropicModelCaps`, `SseEvent`/`AnthropicMessage`),
`sseBlocks` exported from `codexClient.ts`, `anthropicMessagesHeaders`+`anthropicStream` in `anthropicClient.ts`,
wired into `chatProvider.ts` + `extension.ts`. 11 new tests, `npm test` **170/170**, tsc + webview clean.
**F5 PASSED.** Committed on branch `feat/anthropic-oauth` (off `main`).

**Next task: slice #30 — Anthropic tool-calling parity (Agent mode).** Enter with **`/preset scope 30`**.
`gh issue view 30 --comments`. Map Anthropic `tool_use`/`tool_result` blocks ↔ VS Code LM tool calls both
ways: extend the SSE reducer to surface tool-call blocks (`tool_use` block + `input_json_delta` arg fragments,
not just text), forward `options.tools` in `chatProvider`'s Anthropic branch, round-trip the result as a
`tool_result` block, loop to completion. Mirror Codex's slice #15 (`reduceResponsesToolCalls`,
`toCodexResponsesTools`, the `function_call`/`function_call_output` round-trip). TDD the mapping. Makes the
already-advertised `toolCalling:true` honest for Claude.

**Landmines / things to know:**
- **The 429 fingerprint contract is load-bearing** (#28) — #30's tool requests ride the SAME headers
  (`anthropic-beta: claude-code-20250219,oauth-2025-04-20`, `claude-cli/0.19.0` UA, the `x-anthropic-billing-header`
  first system block). They already do via `anthropicMessagesHeaders`/`buildAnthropicMessagesBody` — don't bypass them.
- **#30 is Messages-API, NOT OpenAI-compatible** — bespoke `tool_use`/`tool_result` mapping, like Codex's Responses adapter.
- **Two deferred follow-ups (own slices, not #30):** (a) **thinking/effort parity** — Claude chat runs thinking-OFF;
  before adding `thinking`/`output_config.effort`, PROBE the subscription path accepts them without a synthetic-429.
  (b) **1M subscription ceiling** — caps advertise model-spec 1M for Opus/Sonnet; if a long-context chat 4xx/413s, the
  subscription path caps lower → drop `contextInput`. See [[decisions]] 2026-06-23.
- **#30 verify is HITL** — real Claude.ai account + Agent mode tool use.
- **`CLAUDE.md` still uncommitted** (pre-existing, unrelated) — NOT part of #29/#30; decide separately.
- **Before any F5:** uninstall `local.wisp` (stale-panel collision). See [[gotchas]].

Full state in [[active-work]]; the verified design in [[oauth-recon]]; the request + caps contracts in
[[decisions]] (2026-06-23); traps in [[gotchas]]; domain language in `CONTEXT.md`.
