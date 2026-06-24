---
type: pick-up
project: wisp
updated: 2026-06-24
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` (rehydrate the project, then the Bridge build state).

**Last session (2026-06-24, branch `feat/bridge`):** Bridge slice **#39** — Codex over the Bridge.
- **#39 — BUILT + SMOKE-VERIFIED.** Edits to `src/bridgeServer.ts` + `src/extension.ts` (no `package.json`
  change). Pure reuse of the LM Chat Provider's Codex path: `handleCodexChat` drives `codexStream` on
  `codexAuth.current()` creds + `standardEffortToCodex(effort)` + `toCodexResponsesTools`; `parsed.system`
  re-attached as a leading `role:'system'` message (→ `instructions`); renders back through bridge.ts's
  `textChunk`/`toolCallChunk`/`finalChunk` (same wire shape as keyed). `/v1/models` shows `codex` when
  signed in. No creds → 401, stream throw → 502. `tsc` clean, **234 tests green**, **live F5 smoke** (real
  `chat.completion` from `codex` Provider through the ChatGPT sub via `Invoke-RestMethod`, port 41184).
  Rationale in [[decisions]] (2026-06-24, #39).

**Next task — #40 (unblocked): Anthropic over the Bridge.**
`/preset scope 40`. Make the `kind:'anthropic'` Provider reachable on `POST /v1/chat/completions` instead of
the current `400 not yet reachable`.
1. In `src/bridgeServer.ts` `handleChat`, the `if (isAnthropicProvider(provider)) return sendError(... 400 ...)`
   is the only remaining gate. Branch it into a new `handleAnthropicChat`, exactly mirroring `handleCodexChat`.
2. **Copy #39's shape, swap the cores:** `anthropicStream` (Messages SSE) + `anthropicAuth.current()` (sign-in
   + refresh) + `toAnthropicTools` + `anthropicThinkingEffort`/`deps.effort()` — the same way `chatProvider.ts`'s
   Anthropic branch already does it. Anthropic also consumes `system` separately (top-level `system` block), so
   pass `parsed.system` through however `buildAnthropicMessagesBody` wants it (check the chatProvider path).
3. Add `anthropicCreds`/`anthropicSignedIn` to `BridgeDeps`; wire them from `extension.ts` (the getters already
   exist — `registerWispChatProvider` gets `anthropicAuth.isSignedIn`/`anthropicAuth.current`). Flip `/v1/models`
   to show anthropic when signed in. Render back through the same bridge.ts SSE emitters.
After #40 the Bridge is feature-complete → release (and take the shared-renderer refactor #39 deferred — three
duplicate send-paths is the trigger).

**Landmines / things to know:**
- **The live Copilot-CLI confirm is STILL PENDING** — pending since #35, and it IS #39's acceptance #5. The
  `Invoke-RestMethod` smoke proved listener + secret + **Codex routing**, but a real **Copilot CLI session**
  in a VS Code terminal reaching the Bridge through the ChatGPT sub was NOT run. Do it on the next F5: panel
  Provider=Codex (or Anthropic after #40), Start, open a **NEW** terminal, run the Copilot CLI on a small task.
- **Codex edges not run live:** signed-out → 401, and a tool-call round-trip. The Copilot-CLI run above
  exercises both at once.
- The `model` field is a **Provider id** (`codex`/`anthropic`), not a model name. `resolveModel` picks the model.
- **Testing from PowerShell:** `curl.exe` mangles inline JSON → use `Invoke-RestMethod`. PS prints nested
  objects as `message=;` (display collapse, not empty) — read `.choices[0].message.content` to confirm text.
  See [[gotchas]].
- **Before any F5:** uninstall `local.wisp` (stale-panel collision); open a NEW terminal after Start. See [[gotchas]].

Full state in [[active-work]]; the #39 design rationale in [[decisions]] (2026-06-24); traps in [[gotchas]]; the
command/secret-slot/endpoints/panel-messages in [[api]].
