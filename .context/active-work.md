---
type: active-work
project: wisp
updated: 2026-06-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-23 by Opus 4.8 (auto)._
_At commit: `b6ae9b2` (#28 merged) + uncommitted slice-#29 work on branch `feat/anthropic-oauth`.
`CLAUDE.md` still uncommitted — pre-existing, unrelated; NOT part of #29, decide separately._

## Current focus
**Anthropic OAuth Provider — slice #29 (native chat, text streaming) is DONE and HITL-verified.** Signed
in, Claude models appear in the native chat / Ctrl+I picker and a turn streams text token-by-token off the
Messages SSE. Third Provider kind (`kind:'anthropic-oauth'`) now works on BOTH surfaces (Inquire + chat).
Next is slice **#30** (Anthropic tool-calling parity / Agent mode).

## State
- **Done this session (#29):** `buildAnthropicMessagesBody` (one tested body builder; `anthropicInquire`
  refactored onto it), `anthropicTextDelta`/`reduceAnthropicTextEvents` (Messages SSE→text), `anthropicModelCaps`
  (Opus/Sonnet **1M**, Haiku 200K — see [[decisions]] 2026-06-23), `SseEvent`/`AnthropicMessage` in `catalog.ts`;
  `sseBlocks` exported from `codexClient.ts`; `anthropicMessagesHeaders` + `anthropicStream` in `anthropicClient.ts`;
  `chatProvider.ts` deps/usability/caps/streaming branch + `toAnthropicMessages`; `extension.ts` two getters.
  11 new tests, **`npm test` 170/170**; `tsc` (root + webview) + vite clean. **F5 streaming chat PASSED.**
- **In flight:** nothing mid-edit. #29 complete, **not yet committed** (branch ready — see Pick up).
- **Blocked:** none for #30.

## Pick up here
1. **Commit #29 first** (if `/preset wrap-up` didn't finish it): stage `src/catalog.ts`, `src/anthropicClient.ts`,
   `src/codexClient.ts`, `src/chatProvider.ts`, `src/extension.ts`, `src/anthropic.test.ts`, `.context/`.
   Do NOT stage `CLAUDE.md`. Conventional commit, then `/preset ship` → PR.
2. **Slice #30 — Anthropic tool-calling parity:** `gh issue view 30 --comments`. Map Anthropic `tool_use` /
   `tool_result` content blocks ↔ VS Code LM tool calls in BOTH directions; extend the SSE reducer to surface
   tool-call blocks (not just text — `tool_use` block + `input_json_delta` args), forward `options.tools` in
   `chatProvider`'s Anthropic branch, round-trip results. Mirror Codex's #15 (`reduceResponsesToolCalls` /
   `toCodexResponsesTools` / the `function_call` round-trip). TDD the tool-call mapping. **HITL verify.**
3. **Two follow-ups (own slices, not #30):** (a) **thinking/effort parity** — Claude chat runs thinking-OFF;
   add `thinking`+`output_config.effort` like Codex's Effort knob, but FIRST probe the subscription path
   accepts them without a synthetic-429 (see [[decisions]] 2026-06-23). (b) **subscription context ceiling** —
   verify whether the OAuth Messages path actually grants 1M; if it caps lower, drop opus/sonnet `contextInput`.

## Skills for next session
- superpowers:test-driven-development — #30's tool-call mapping (both directions) wants a red-green loop;
  prior art is Codex's `reduceResponsesToolCalls` tests in `codex.test.ts`.
- /preset scope — to enter #30 (restate, plan files, go/no-go).

## Open questions
- **Does the subscription OAuth Messages path accept `thinking`/`output_config.effort`** without tripping the
  #28 synthetic-429 fingerprint contract? Unverified — blocks the thinking/effort follow-up.
- **Subscription context ceiling** — is 1M actually granted on the Claude.ai OAuth path, or does it cap (e.g.
  ~200K)? Caps currently advertise the model-spec 1M; revisit if a long-context chat 4xx/413s.

## Recent context
- **1M vs 200K caps was a deliberated call** — chose model-spec 1M (Opus/Sonnet) over a conservative 200K
  floor: the floor guards only an unverified+avoidable over-pack case, while under-advertising certainly hurts
  the OAuth-moat feature. See [[decisions]] 2026-06-23.
- **#29 reused, didn't duplicate:** `sseBlocks` + `parseSseBlock` are provider-agnostic (Codex + Anthropic both
  flow through them); only event names differ. `anthropicInquire` (#28, non-streaming JSON) now shares the body
  builder with `anthropicStream` — one tested request shape.
- **#29 sends no tools** (that's #30) but advertises `toolCalling:true` (picker-visibility requirement) — same
  bounded white lie Codex carried between #14 and #15.

## Related
- [[overview]]
- [[oauth-recon]] — the design source of truth for this feature
- [[decisions]] — 2026-06-23 #29 entry (caps decision + effort deferral)
- [[gotchas]] — synthetic-429 / fingerprint contract; F5 dup-extension trap
