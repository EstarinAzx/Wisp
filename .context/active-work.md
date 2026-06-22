---
type: active-work
project: wisp
updated: 2026-06-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-23 by Opus 4.8 (auto)._
_At commit: `4ab0ce1` (#29 merged-to-branch) + uncommitted slice-#30 work on branch `feat/anthropic-oauth`.
`CLAUDE.md` still uncommitted — pre-existing, unrelated; NOT part of #29/#30, decide separately._

## Current focus
**Anthropic OAuth Provider — slice #30 (tool-calling parity / Agent mode) is DONE and HITL-verified.**
Claude in Agent mode emits tool calls, Wisp surfaces them as VS Code LM tool calls, results round-trip as
`tool_result` blocks, the call→result→continue loop completes. `toolCalling:true` is now **honest** for Claude
(was a bounded white lie since #29). **F5 PASSED** — Claude fired 5 parallel `Read` calls in one turn, VS Code
ran them, results round-tripped. The three Provider kinds now have full chat+agent parity.

## State
- **Done this session (#30):** new pure cores in `catalog.ts` — `toAnthropicTools` (schema passthrough, **no**
  strict closure unlike Codex), `reduceAnthropicToolCalls` (folds `content_block_start`+`input_json_delta`
  by content-block **index**), extended `AnthropicMessage` (`toolCalls`/`toolResults`) + `buildAnthropicMessagesBody`
  (tool_use/tool_result block expansion, `tool_choice` **object** `{type:'auto'|'any'}`, `parseToolInput`).
  `anthropicClient.ts`: `AnthropicStreamEvent` widened to `{text}|{toolCall}`, tools threaded through,
  `anthropicStream` folds tool calls at stream end. `chatProvider.ts`: Anthropic branch forwards `options.tools`
  + maps `toolMode`→`'any'/'auto'` + emits `LanguageModelToolCallPart`; `toAnthropicMessages` carries the round-trip.
  **17 new tests** (15 + 2 review-driven regression guards), **`npm test` 187/187**; tsc (root+webview) + vite clean.
- **Adversarial review (20-agent workflow):** 0 code bugs; 3 coverage gaps confirmed → 2 added (full round-trip
  ordering, multi-parallel tool_use blocks), 1 justified-skip (chatProvider `toolMode` seam — non-pure module
  deliberately out of the pure unit suite; union type catches the copy-paste error at compile time).
- **In flight:** nothing mid-edit. #30 complete, **not yet committed** (wrap-up commits it; `ship` opens the PR).
- **Blocked:** none.

## Pick up here
1. **Slice #31 (likely next) — Anthropic thinking/effort parity.** Mirror Codex's panel **Effort** knob:
   `buildAnthropicMessagesBody` currently sends NO `thinking` / `output_config.effort`, so Claude chat runs
   **thinking-OFF, effort-default**. Add `thinking:{type:'adaptive'}` + `output_config:{effort}` (low..max;
   **NOT** `budget_tokens` — 400s on Opus 4.7+). Thread the existing globalState `wisp.effort` (Codex's knob)
   or add a Claude-gated one. **Blocker = a probe FIRST:** confirm the subscription OAuth Messages path accepts
   these body fields without tripping the #28 synthetic-429. *Encouraging precedent:* #30's `tools` rode that
   path and worked first try — tools are a Claude-Code-native body field, same category as thinking/effort, and
   the fingerprint samples only first-user-message TEXT (not body fields). Still verify backend validation.
2. **Subscription 1M context ceiling** (separate small probe) — caps advertise model-spec 1M for Opus/Sonnet;
   if a long-context chat 4xx/413s, the subscription path caps lower → drop their `contextInput`. See [[decisions]].

## Open questions
- **Does the subscription OAuth Messages path accept `thinking`/`output_config.effort`** without a synthetic-429?
  Unverified — gates slice #31. (Tools working is partial evidence it will, but probe before shipping.)
- **Subscription context ceiling** — is 1M actually granted on the Claude.ai OAuth path, or does it cap (~200K)?

## Skills for next session
- superpowers:test-driven-development — #31's body-field change wants a red-green loop on `buildAnthropicMessagesBody`.
- /preset scope — to enter #31 (restate, probe-first plan, go/no-go).

## Recent context
- **#30 mirrored Codex #15 but Anthropic's wire format differs:** tools have NO strict-schema closure (Anthropic
  accepts a plain `input_schema`); parallel tool calls are **sibling `tool_use` blocks inside ONE assistant turn**
  (Codex emits flat `function_call` items); `tool_choice` is an **object** `{type:'auto'|'any'}` (Codex: a string
  `'auto'|'required'`); `tool_use` block `input` is a **parsed object** (Codex round-trips the raw JSON string).
- **The #28 fingerprint survived #30 untouched** — `firstUserMessage` still sourced from the first non-system
  turn's `.content` text; `tools` ride as a separate top-level body key, never the system attribution block.
- **Images still deferred** for Anthropic chat (dropped in `toAnthropicMessages`) — a separate follow-up, not #30.

## Related
- [[overview]]
- [[oauth-recon]] — the design source of truth for this feature
- [[decisions]] — 2026-06-23 #30 entry (Anthropic tool wire contract)
- [[gotchas]] — synthetic-429 / fingerprint contract; F5 dup-extension trap
