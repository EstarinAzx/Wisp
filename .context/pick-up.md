---
type: pick-up
project: wisp
updated: 2026-06-19
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate.

**Last session (2026-06-19):** Built + shipped **slice #14 — Codex in the native chat picker (text streaming)**
on branch **`feat/codex-tracer`**. Codex now appears in VS Code's native chat / Ctrl+I picker when signed in
and **streams** its text reply through the Responses API, with **real context windows** (gpt-5.x 400K / o-series
200K) and **vision** (image attachments forwarded as `input_image`). New pure cores in `catalog.ts` (TDD) +
`codexStream` in `codexClient.ts`. **`npm test` 121/121, tsc+webview+vite clean, F5 PASSED** (shows, streams,
400K, Vision badge, image + multi-turn round-trip).

**Next task: build slice #15 — Codex tool-calling parity (agent mode).** HITL, unblocked. Enter with
**`/preset scope 15`**.

**What #15 must do:** the codex chat branch already advertises `toolCalling: true` but **ignores
`options.tools`** (text-only — it just streams text). Wire the real path:
- **Convert tools** — VS Code tool defs → Responses `tools` array; add them to `buildCodexResponsesBody` /
  `codexResponsesRequest`.
- **Stream tool calls** — in `codexStream`, the SSE carries `function_call` items (via
  `response.output_item.added` + argument deltas); accumulate them and emit `LanguageModelToolCallPart`
  (mirror the chat-completions `assembleToolCalls` pattern, but for Responses events).

**Landmines:**
- Reference: `XETH--7` `src/services/api/codexShim.ts` — `convertToolsToResponsesTools` (+ its strict-schema
  `required` enforcement) and the Responses tool-call event handling (`D:\Mods\xethryon\new agent\XETH--7`).
- The Codex `/responses` backend **requires `instructions`** (defaults to "You are a helpful coding assistant."
  when no system turn — VS Code chat has no System role). Assistant content is **`output_text`**, user/system
  `input_text` — wrong type 400s. Images (`input_image`) only on non-assistant turns.
- The picker **hard-filters on `toolCalling`** — that's why Codex advertises true now; once tools forward,
  the advertise becomes fully honest (it currently reverses #14's acceptance #3 — see [[decisions]]).
- Bearer = OAuth **access_token** (subscription path); reasoning models need `reasoning:{effort,summary:'auto'}`
  (`codexReasoning`); `gpt-5-codex` is a dead id (default `gpt-5.3-codex`).
- #14 shares `catalog.ts` + `chatProvider.ts` + `codexClient.ts` with committed #12/#13 — build on it.

Full state in [[active-work]]; settled choices in [[decisions]]; new traps in [[gotchas]]; domain language in `CONTEXT.md`.
