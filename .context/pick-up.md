---
type: pick-up
project: wisp
updated: 2026-06-24
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` (rehydrate the project, then the Bridge build state).

**Last session (2026-06-24, branch `feat/bridge`):** Bridge slice **#38** — the side-panel control + real
access secret + #35 env injection.
- **#38 — BUILT + SMOKE-VERIFIED + reviewed.** Edits to `src/extension.ts`, `src/sidePanelProvider.ts`,
  `webview/app.tsx` (no `package.json` change). Auto-generated `randomBytes(32)` secret in SecretStorage slot
  `wisp.bridge.secret` (replaces the #37 constant); shared `startBridge`/`stopBridge` driven by BOTH the
  `wisp.bridgeToggle` command and the panel switch; panel shows running/stopped + address + secret w/ Copy;
  `injectCopilotEnv()` sets the 5 `COPILOT_*` vars (cleared on stop AND activate). `tsc` clean, **234 tests
  green**, **live F5 smoke** (real `chat.completion` through `opencode-go` via `Invoke-RestMethod`). Reviewer
  fixes applied. Rationale in [[decisions]] (2026-06-24, #38).

**Next task — #39 (unblocked): Codex over the Bridge.**
`/preset scope 39`. Make the `kind:'codex'` Provider reachable on `POST /v1/chat/completions` instead of the
current `400 not yet reachable`.
1. In `src/bridgeServer.ts` `handleChat`, the guard `if (isCodexProvider(provider) || isAnthropicProvider(...))`
   currently 400s both. Branch Codex into its send-path instead of rejecting it.
2. Reuse the existing Codex stream — `codexClient.codexInquire` / the Responses SSE path + `codexAuth.current()`
   (sign-in + refresh) — exactly as `chatProvider.ts`'s LM Chat Provider path already does. The Bridge already
   has the deps seam; you'll likely need to pass codex creds/effort getters into `createBridgeServer` like
   `registerWispChatProvider` gets them.
3. Render the Responses-API events back through `bridge.ts`'s SSE emitters (same OpenAI-chat output shape the
   keyed path uses). Tools + streaming must round-trip (Copilot CLI requires both).
After #39: Anthropic over the Bridge (#40, the Messages stream).

**Landmines / things to know:**
- **The #35 live Copilot-CLI confirm is STILL PENDING** — the smoke proved the listener + secret + routing via
  `Invoke-RestMethod`, but a real Copilot CLI session in a VS Code terminal reaching the Bridge was not run.
  Do it on the next F5: open a **NEW** terminal after Start (existing terminals stay stale), keyed Provider only.
- The listener + panel/secret/env are **glue → F5/manual-verified, not unit-tested** (per PRD). `bridge.ts` is
  the unit-test target; #39's genuinely-new logic (if any beyond reuse) goes there.
- The `model` field is a **Provider id** (`codex`), not a model name. `resolveModel` picks the Provider's model.
- **Testing from PowerShell:** `curl.exe` mangles inline JSON → use `Invoke-RestMethod`. See [[gotchas]].
- **Before any F5:** uninstall `local.wisp` (stale-panel collision). See [[gotchas]].

Full state in [[active-work]]; the #38 design rationale in [[decisions]] (2026-06-24); traps in [[gotchas]]; the
command/secret-slot/endpoints/panel-messages in [[api]].
