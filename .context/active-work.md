---
type: active-work
project: wisp
updated: 2026-06-19
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-19 by Opus 4.8._
_At commit: about to commit (branch `feat/codex-tracer`)._

## Current focus
Building the **Codex Provider + OpenCode Zen/Go split** batch (PRD **#11**, slices **#12–#15**). **#12, #13, #14 are DONE.** Codex now works on **both** surfaces — Inquire edits AND VS Code's native chat / Ctrl+I picker (text streaming, real context windows, vision). Remaining: **#15** (tool-calling parity in agent mode).

## State
- **Done this session — slice #14 (Codex in native chat, text streaming):** Codex appears in the native chat / Ctrl+I picker when signed in and streams its reply.
  - **Picker visibility:** `keyed[codex] = codexAuth.isSignedIn()` (was hidden as keyless). VS Code **hard-filters the picker on `toolCalling`** — a model without it is invisible *everywhere* (Ask mode + Manage Models too, confirmed by F5), so Codex advertises `toolCalling: true`; tools are **not forwarded yet** (that's #15) — `options.tools` ignored, model answers as text. This **reverses #14's acceptance #3** ("advertise false") — see [[decisions]].
  - **Streaming:** new `codexStream` async-gen in `codexClient.ts` — incremental `sseBlocks` reader yields `response.output_text.delta` text live → `progress.report(TextPart)`; falls back to terminal payload if no deltas; throws on `response.failed`. Shares `codexResponsesRequest` (headers/body/fetch) + the pure `parseSseBlock` with the non-streaming `codexInquire` (no duplicate parser).
  - **Request contract fixes (live-found via F5 400s):** the backend **requires `instructions`** → `buildCodexResponsesBody` defaults `"You are a helpful coding assistant."` when no system turn (VS Code chat has no System role). Assistant turns serialize as **`output_text`** (user/system `input_text`) — wrong type 400s.
  - **Real context + vision:** new pure `codexModelCaps` — gpt-5.x family **400K/32K**, o-series **200K/100K**, `vision: true` (numbers from models.dev/api.json via XETH-7; the backend accepts `input_image` as XETH-7's codexShim sends it). Wired into `chatProvider`'s caps resolver (codex has no models.dev catalogKey). Images forwarded as `input_image` data-URIs (`buildCodexResponsesBody` + `toCodexMessages`).
  - **Verified:** `npm test` **121/121**, `npm run compile` clean (tsc host+webview + Vite). **F5 PASSED** (Codex shows, streams, 400K context, Vision badge, image round-trip, multi-turn).
- **In flight:** nothing — #14 finished, about to commit.
- **Planned next:** **#15 (HITL)** — Codex tool-calling parity (agent mode). Map VS Code tools → Responses `tools`, forward them in `codexStream`, reassemble streamed `function_call` items → `LanguageModelToolCallPart`. *Grab next.*
- **Blocked:** nothing.

## Pick up here
Grab **#15** — `/preset scope 15`. **Goal: Codex tool calling in agent mode.** Today the codex chat branch advertises `toolCalling: true` but **ignores `options.tools`** (text-only). #15 wires the real path: (1) convert VS Code tool defs → Responses `tools` array (XETH-7 `codexShim.ts` `convertToolsToResponsesTools` + strict-schema `required` enforcement is the reference); (2) include them in `buildCodexResponsesBody`/`codexResponsesRequest`; (3) in `codexStream`, the SSE carries `response.output_item.added`/`function_call` items — accumulate their `arguments` deltas and emit `LanguageModelToolCallPart` (mirror the existing chat-completions `assembleToolCalls` pattern, but for Responses events). Reference: XETH-7 `codexShim.ts` (tool conversion + the Responses tool-call event handling).

## Skills for next session
- `superpowers:test-driven-development` — TDD new pure cores (Responses tool-call reducer, tool converter) into `catalog.ts`.
- `/preset scope 15` — entry gate before coding #15.

## Open questions
- Codex `reasoning` effort is a fixed `medium` for gpt-5/o models. If a model needs `high` (or rejects `medium`), make it per-model. Not yet observed.
- `codexModelCaps` vision is blanket-`true` for all codex ids (matches XETH-7's unconditional image forwarding). If a specific `*-codex` id 400s on an image, gate vision per-model. Not yet observed.

## Recent context
- **VS Code picker filtering (the #14 surprise):** the chat/Ctrl+I picker shows ONLY tool-capable models — a `toolCalling:false` model is absent even from Ask mode, only visible in the Manage Models list. Docs: "if the model doesn't support tool calling, it won't be shown in the model picker." This forced advertising `toolCalling:true` before tools are actually wired.
- **Vision correction:** mid-session I wrongly called Codex text-only (trusting Copilot's conservative `modalities` metadata). XETH-7's codexShim forwards `input_image` to the *same* backend → vision is real; corrected to `vision:true` + image plumbing.

## Related
- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[api]]
