---
type: active-work
project: wisp
updated: 2026-06-24
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-24 by Opus 4.8 (auto)._
_At commit: uncommitted (Bridge #38 this session, on branch `feat/bridge`)._

## Current focus
**Building the Bridge** (PRD #34) — Wisp's outward-facing local OpenAI-compatible endpoint, so the GitHub
Copilot CLI (and curl, and any OpenAI client) can drive a coding task through any Wisp Provider. Slices #35
(gate), #36 (translator), #37 (HTTP listener) landed earlier; this session the **side-panel control + real
access secret + env injection (#38)** is built and partly live-verified. Next: the two subscription
send-paths — Codex (#39), Anthropic (#40).

## State
- **Done this session:**
  - **#38 (panel toggle + generated secret + address + #35 env injection) — BUILT + SMOKE-VERIFIED.**
    Files: `src/extension.ts`, `src/sidePanelProvider.ts`, `webview/app.tsx`. No `package.json` change
    (command + `bridge.port` setting pre-existed).
    - Dropped the temp constant `BRIDGE_ACCESS_SECRET` → `ensureBridgeSecret()`: generate `randomBytes(32)`
      base64url **once**, store in SecretStorage slot **`wisp.bridge.secret`**, reuse after. Listener now
      reads `accessSecret: () => bridgeSecret` (a module var, materialized on start, `''` while stopped).
    - `startBridge`/`stopBridge` — one shared lifecycle; the `wisp.bridgeToggle` command **and** the panel
      switch both route through it (no fork). `stopBridge` closes the port + wipes the in-mem secret + clears
      env.
    - `injectCopilotEnv()` (#35): 5 `COPILOT_*` BYOK vars via `context.environmentVariableCollection.replace`
      — `BASE_URL=http://127.0.0.1:<port>/v1`, `MODEL=`active-Provider-id, `API_KEY=`secret, `TYPE=openai`,
      `OFFLINE=true`. Cleared on stop **and on activate** (collection `.persistent` defaults true → would
      otherwise re-apply a dead-port/stale-secret set on reload while the Bridge is OFF). `COPILOT_MODEL`
      re-synced if the Provider switches mid-run.
    - Panel `getState` carries `bridgeRunning`/`bridgeAddress`/`bridgeSecret` (secret only while running);
      Bridge section in `app.tsx` = running/stopped dot, Start/Stop button, address + secret rows w/ Copy
      (host-side via `vscode.env.clipboard`), new-terminal hint.
  - **Review applied:** `cavecrew-reviewer` flagged 3🟡; fixed #1 (env clear-on-activate) + #2 (re-inject
    `COPILOT_MODEL` on Provider switch); #3 (fast stop→start `EADDRINUSE`, self-healing) accepted with a
    `ponytail:` ceiling note.
  - **Verified:** `tsc` clean, **234 tests still green** (glue → not unit-tested per PRD), **live F5 smoke**:
    a real `chat.completion` came back through `opencode-go` (panel Start → `Invoke-RestMethod` non-stream).
- **In flight:** nothing — clean stopping point.
- **Blocked:** nothing. #39/#40 are unblocked.

## Pick up here
**Start #39 — Codex over the Bridge.** Make the `kind:'codex'` Provider reachable on `POST /v1/chat/completions`
instead of the current `400 not yet reachable` (`bridgeServer.ts` `handleChat`). Reuse `codexClient.codexInquire`
/ the Responses stream + `codexAuth.current()` (sign-in + refresh), exactly as the LM Chat Provider path does.
The translator (`bridge.ts`) and the panel/secret/env plumbing are already in place — this is a send-path slice.
After #39: Anthropic (#40, the Messages stream).

## Skills for next session
- /preset scope — to enter the work loop on #39.

## Open questions
- **#35's live Copilot-CLI confirm is still pending** — the curl/`Invoke-RestMethod` smoke proved the listener
  + secret + routing, but a real **Copilot CLI session in a VS Code terminal** inheriting the injected
  `COPILOT_*` vars and reaching the Bridge was NOT run this session. That's the last unproven acceptance bit;
  do it on the next F5 (open a **new** terminal after Start — existing ones stay stale).

## Recent context
- **The Bridge secret is real now** — auto-generated, SecretStorage-backed (`wisp.bridge.secret`), shown in
  the panel with Copy. Replaces #37's `BRIDGE_ACCESS_SECRET` constant. It crosses the webview boundary (as
  `type="password"`) only while running — deliberate: it's the Bridge's own localhost secret, meant to be
  copied into the CLI, not a Provider key.
- **Env vars reach only NEW terminals** — `environmentVariableCollection` applies at terminal creation, so a
  terminal open before Start stays stale until relaunched (the panel hint + VS Code's own stale-env indicator
  cover this). Added to [[gotchas]].
- **Keyed Providers only over the Bridge still** — `codex`/`anthropic` return `400 not yet reachable` until
  #39/#40. So set the panel Provider to a keyed one (e.g. `opencode-go`) before an F5 round-trip.
- **PowerShell curl JSON gotcha** (still live): use `Invoke-RestMethod`, not `curl.exe`, for Bridge tests.
- Before any F5: uninstall `local.wisp` (stale-panel dup-extension trap). See [[gotchas]].

## Related
- [[overview]]
- [[happy-path]] — the Bridge golden-path MVD
- [[api]] — the `wisp.bridgeToggle` command, the `wisp.bridge.secret` slot, the `COPILOT_*` env vars, Bridge endpoints + panel messages
- [[decisions]] — 2026-06-24 (#38 build + the persistent-env clear-on-activate call)
- [[gotchas]] — the PowerShell curl trap, the F5 dup-extension trap, the new-terminal env trap
