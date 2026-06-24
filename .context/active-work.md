---
type: active-work
project: wisp
updated: 2026-06-24
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-24 by Opus 4.8 (auto)._
_At commit: uncommitted (Bridge #39 this session, on branch `feat/bridge`)._

## Current focus
**Building the Bridge** (PRD #34) — Wisp's outward-facing local OpenAI-compatible endpoint, so the GitHub
Copilot CLI (and curl, and any OpenAI client) can drive a coding task through any Wisp Provider. Slices #35
(gate), #36 (translator), #37 (HTTP listener), #38 (panel + secret + env) landed. This session: **#39 — the
Codex subscription send-path** is built and smoke-verified. Next: **#40 — Anthropic over the Bridge** (the
last send-path, the Messages stream).

## State
- **Done this session:**
  - **#39 (Codex over the Bridge) — BUILT + SMOKE-VERIFIED.** Files: `src/bridgeServer.ts`,
    `src/extension.ts`. Pure reuse — no new auth/transport.
    - `bridgeServer.ts`: `BridgeDeps` gained `codexCreds` / `codexSignedIn` / `effort`. `/v1/models` now
      shows `codex` when **signed in** (`isCodexProvider(p) ? await deps.codexSignedIn() : …`); anthropic
      still forced false (#40). The `handleChat` guard split: `codex` → new **`handleCodexChat`**, anthropic
      → still `400 not yet reachable`.
    - `handleCodexChat` drives **`codexStream`** (the same Responses-API core the LM Chat Provider uses),
      with `codexAuth.current()` creds, `standardEffortToCodex(effort)`, and `toCodexResponsesTools(parsed.tools)`.
      `parsed.system` is re-attached as a leading `role:'system'` message so `buildCodexResponsesBody` folds
      it into `instructions`. Text + assembled tool calls render back through bridge.ts's `textChunk` /
      `toolCallChunk` / `finalChunk` (or one `chat.completion` when `stream:false`) — **identical wire shape
      to the keyed path**. No creds → clean **401**; a stream throw (signed-out / refresh fail) → **502**.
    - `extension.ts`: passed `codexAuth.isSignedIn` / `codexAuth.current` / `activeEffort` into
      `createBridgeServer` (same getters `registerWispChatProvider` already gets).
  - **Verified:** `tsc` clean, **234 tests still green** (glue → not unit-tested per PRD), **live F5 smoke**:
    a real `chat.completion` came back from the **`codex`** Provider through the **ChatGPT subscription**
    (panel Provider=Codex, signed in, Bridge Start → `Invoke-RestMethod` non-stream, port 41184,
    `finish_reason=stop`).
- **In flight:** nothing — clean stopping point.
- **Blocked:** nothing. #40 is unblocked.

## Pick up here
**Start #40 — Anthropic over the Bridge.** Make the `kind:'anthropic'` Provider reachable on
`POST /v1/chat/completions` instead of the current `400 not yet reachable` (`bridgeServer.ts` `handleChat`).
**Mirror #39 exactly**, swapping the Codex cores for the Anthropic ones: `anthropicStream` (Messages SSE) +
`anthropicAuth.current()` + `toAnthropicTools` + `anthropicThinkingEffort`/`deps.effort()`, exactly as
`chatProvider.ts`'s Anthropic branch already does. Add `anthropicCreds`/`anthropicSignedIn` to `BridgeDeps`
and wire them from `extension.ts` (the getters already exist — `registerWispChatProvider` gets them). Flip
`/v1/models` to show anthropic when signed in. After #40: the Bridge is feature-complete → release.

## Skills for next session
- /preset scope — to enter the work loop on #40.

## Open questions
- **The live Copilot-CLI confirm is STILL the last unproven acceptance bit** — pending since #35, and #39's
  acceptance #5 is the same thing (a real **Copilot CLI session** over the Bridge through the ChatGPT sub).
  The `Invoke-RestMethod` smoke proved listener + secret + **Codex routing**, but a CLI session inheriting
  the injected `COPILOT_*` vars and completing a task was NOT run this session. Do it on the next F5: panel
  Provider=Codex, Start, open a **NEW** terminal, run the Copilot CLI on a small task.
- **Codex edge cases not explicitly run:** signed-out → 401 (code path exists, untested live) and a
  tool-call round-trip (the Copilot CLI run above exercises both at once — covers them when done).

## Recent context
- **Codex is now reachable over the Bridge** — `model:'codex'` (the Provider id) routes to the Responses
  stream behind the ChatGPT sign-in; no API key. The reasoning Effort is the shared panel knob.
- **The `model` field is a Provider id**, not a model name. `resolveModel` picks the Provider's model
  (`gpt-5.5` etc.).
- **Keyed + Codex over the Bridge now; Anthropic still 400** until #40. Set the panel Provider accordingly
  before an F5 round-trip.
- **Testing from PowerShell:** use `Invoke-RestMethod`, not `curl.exe` (it mangles inline JSON). PowerShell
  prints nested objects as `message=;` — that's display collapse, not empty content; read
  `.choices[0].message.content` to confirm text. See [[gotchas]].
- **Before any F5:** uninstall `local.wisp` (stale-panel dup-extension trap). Open a **new** terminal after
  Start (existing ones keep stale env). See [[gotchas]].

## Related
- [[overview]]
- [[happy-path]] — the Bridge golden-path MVD
- [[api]] — the Bridge endpoints (Codex now routes), commands, `wisp.bridge.secret` slot, `COPILOT_*` env
- [[decisions]] — 2026-06-24 (#39 Codex send-path), 2026-06-24 (#38 build)
- [[gotchas]] — the PowerShell curl trap, the F5 dup-extension trap, the new-terminal env trap
