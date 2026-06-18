---
type: active-work
project: wisp
updated: 2026-06-19
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-19 by Opus 4.8._
_At commit: about to commit slice #15 (branch `feat/codex-tracer`); #12–#14 committed (HEAD `774354b`)._

## Current focus
**Codex Provider + OpenCode Zen/Go split batch is COMPLETE** — PRD **#11**, slices **#12–#15** all done.
Codex now has **full parity** across both surfaces: Inquire edits AND VS Code's native chat / agent /
Ctrl+I — text streaming, real context windows, vision, **and tool calling** (agent-mode round-trip).
Branch `feat/codex-tracer` holds #13/#14 (committed) + #15 (about to commit) and is ready to ship.

## State
- **Done this session — slice #15 (Codex tool-calling parity, agent mode):** the codex chat branch now
  forwards agent tools and round-trips tool calls/results — the `toolCalling: true` flag (flipped in #14
  for picker visibility) is now **honest**.
  - **Tool converter:** new pure `toCodexResponsesTools` (`catalog.ts`) — VS Code tool defs → **flat**
    Responses function tools (`{type,name,description,parameters,strict:true}`, NOT chat-completions'
    nested `function` object). A self-contained recursive `enforceStrictResponsesSchema` makes every
    object closed (`additionalProperties:false`) with **all** keys `required` — Codex strict mode demands it.
  - **Tool-call reducer:** new pure `reduceResponsesToolCalls` (`catalog.ts`) — Responses analogue of
    `assembleToolCalls`. Accumulates `response.output_item.added` (function_call id/call_id/name) +
    `response.function_call_arguments.delta` (arg fragments) keyed by **item id**, surfaces **call_id** as
    the round-trip id. Returns `AssembledToolCall[]`.
  - **Round-trip serialization:** `buildCodexResponsesBody` extended — assistant tool calls →
    `function_call` input items, tool results → `function_call_output` items, ordered per API
    (function_call_output before the next user message). Body gains `tools`/`tool_choice`/
    `parallel_tool_calls` only when tools are non-empty.
  - **Stream widening:** `codexStream` (`codexClient.ts`) yield type `string` → **`CodexStreamEvent`**
    union (`{type:'text'} | {type:'toolCall'}`); collects function-call events, folds them via the reducer
    at stream end. `chatProvider` codex branch threads `options.tools`/`toolMode` in and emits
    `LanguageModelTextPart` / `LanguageModelToolCallPart`. `toCodexMessages` now carries
    `toolCalls`/`toolResults` (drop-filter removed so tool-only turns survive).
  - **Verified:** `npm test` **137/137**, `npm run compile` clean (tsc host+webview + Vite). **F5 PASSED**
    — agent mode, Codex (gpt-5.5) fired **5 parallel `Read` tool calls**, results fed back, summary
    reflected actual file contents. Full model→tool→result→continue loop confirmed.
- **In flight:** nothing — #15 finished, about to commit.
- **Planned next:** **ship the branch** — `feat/codex-tracer` (#13+#14+#15) → PR / merge to `main`
  (`/preset ship`). The Codex/Zen-Go batch is feature-complete; no slice left in PRD #11.
- **Blocked:** nothing.

## Pick up here
The **#11 batch is done**. Next action is **shipping `feat/codex-tracer`** (open the PR / merge — run
`/preset ship`), not more feature code. If instead starting a NEW line of work, there is no pending slice —
pick a new PRD/idea (`/preset init`) or address an open question below.

## Skills for next session
- `/preset ship` — push `feat/codex-tracer` and open the PR composed from the diff.
- `/preset init` — only if starting a brand-new feature (no slice is pending).

## Open questions
- **Codex `id` field on replayed `function_call` items:** Wisp sends **`call_id` only** (the documented
  stateless Responses contract); XETH-7 also sends a derived `id` (`fc_…`). The #15 F5 round-trip
  **succeeded with call_id-only**, so the extra `id` is unnecessary here — but if a future multi-turn agent
  flow 400s on the round-trip, adding `id` to the `function_call` item in `buildCodexResponsesBody` is the
  fix (one line + one test). See [[gotchas]].
- Codex `reasoning` effort is a fixed `medium` for gpt-5/o models. Make it per-model only if one needs
  `high` / rejects `medium`. Not yet observed.
- `codexModelCaps` vision is blanket-`true` for all codex ids. Gate per-model only if a specific `*-codex`
  id 400s on an image. Not yet observed.

## Recent context
- **#15 F5 (this session):** "read the files in this directory" → Codex emitted 5 `Read` tool calls in one
  turn (parallel), VS Code ran them, results round-tripped, the model summarized the real contents. This
  both proves the agent loop and resolves the call_id-only question above (no 400).
- **The honesty arc across #14→#15:** #14 advertised `toolCalling:true` for *picker visibility* while
  tools were ignored (answered as text) — a bounded honesty gap. #15 forwards the tools, closing it; the
  flag is now fully honest.

## Related
- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[api]]
