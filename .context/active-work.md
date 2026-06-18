---
type: active-work
project: wisp
updated: 2026-06-19
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-19 by Opus 4.8._
_At commit: uncommitted (branch `feat/codex-tracer`, off `docs/codex-zen-go-scope` which holds the committed #12)._

## Current focus
Building the **Codex Provider + OpenCode Zen/Go split** batch (PRD **#11**, slices **#12–#15**). **#12 + #13 are DONE.** Codex sign-in + one live Inquire edit works end-to-end. Remaining: **#14** (Codex in the native chat picker — streaming) → **#15** (tool-calling parity).

## State
- **Done this session — slice #13 (Codex tracer):** Codex is a working Provider via ChatGPT OAuth. New pure cores in `catalog.ts` (TDD): `isCodexProvider`, `isCodexSignedIn`, `buildCodexResponsesBody`, `reduceResponsesTextEvents`/`extractResponsesText`, `decodeJwtPayload`/`parseChatgptAccountId`/`shouldRefreshCodexToken`, `parseCodexAuthJson`, `codexReasoning`, `CODEX_MODELS` + the `Provider.kind` field. New impure modules `codexAuth.ts` (PKCE S256 OAuth, loopback `:1455`, SecretStorage `wisp.codexAuth`, `~/.codex/auth.json` import, refresh) + `codexClient.ts` (raw `/responses` fetch, SSE→text). `extension.ts` wires the Codex row, the Inquire codex branch, sign-in/out commands, panel state. Panel shows sign-in (no key field) + a curated Codex model dropdown. **`npm test` 111/111, tsc (host+webview) + Vite clean, F5 live round-trip PASSED** (a real Inquire edit ran against the Codex backend).
- **In flight:** nothing — #13 finished, about to commit.
- **Planned next (GitHub issues, dependency order):**
  - **#14 (HITL)** — Codex in the native chat picker, **text streaming**. *Grab next.*
  - **#15 (HITL)** — Codex tool-calling parity (agent mode). Blocked by #14.
- **Blocked:** nothing.

## Pick up here
Grab **#14** — `/preset scope 14`. **Goal: make Codex appear in and work through VS Code's native Language Models / Ctrl+I picker** (it's deliberately absent now — see below). Two coupled changes: (1) advertise the Codex row when **signed in** — currently keyless rows are hidden by `buildChatModelInfos`, so feed `keyed[codex] = await codexAuth.isSignedIn()` (and stop relying on `keyForProvider` returning '' for codex); (2) branch `provideLanguageModelChatResponse` in `chatProvider.ts` to the **Codex Responses streaming** path for `kind === 'codex'` rows (the current path uses the OpenAI chat-completions client → 404 against `/responses`). Reuse `codexClient`/`reduceResponsesTextEvents` but make it **stream** (the picker streams deltas) — likely a new streaming variant of `codexInquire` that yields `response.output_text.delta` text as it arrives, plus `codexAuth.current()` for refreshed creds. Keep `toolCalling` **false** for codex until #15. Reference: `XETH--7` `codexShim.ts` `codexStreamToAnthropic` (the streaming reducer).

## Skills for next session
- `superpowers:test-driven-development` — TDD any new pure cores (e.g. a streaming-delta reducer) into `catalog.ts`.
- `/preset scope 14` — entry gate before coding #14.

## Open questions
- The Codex `reasoning` effort is a fixed `medium` for all gpt-5/o models. If a model needs `high` (or rejects `medium`), make it per-model. Not yet observed.

## Recent context
- **#13 live findings (F5):** `gpt-5-codex` is a **dead model id** (400) — current Codex ids are `gpt-5.4`/`gpt-5.3-codex`/`gpt-5.2-codex`/`gpt-5.1-codex-max`/… The default is now **`gpt-5.3-codex`**. Reasoning models **require** a `reasoning: { effort, summary:'auto' }` object on the `/responses` body or they 400 — sent for gpt-5/o models, omitted for gpt-4.x/spark (`codexReasoning`). The bearer is the OAuth **access_token** (subscription path), NOT the exchanged `sk-` apiKey.
- **#13 non-obvious fix:** sign-out must write an **empty tombstone** to `wisp.codexAuth`, not delete the slot — else `~/.codex/auth.json` is re-imported on the next render and sign-out never sticks. See [[gotchas]].
- Codex is intentionally **absent from the native chat picker** in #13 (keyless → hidden, and the chat surface speaks chat-completions not Responses). That's exactly #14's job.

## Related
- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[api]]
