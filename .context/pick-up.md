---
type: pick-up
project: wisp
updated: 2026-06-24
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` (rehydrate the project, then the Bridge build state).

**Last session (2026-06-24, branch `feat/bridge`):** Bridge foundation slices **#35** and **#36**.
- **#35 (env-var gate) — resolved.** VS Code does NOT auto-pass env vars to a spawned Copilot CLI; Wisp
  injects the 5 Copilot BYOK vars itself via `context.environmentVariableCollection`. Documented-yes;
  **live F5 still unconfirmed.** Finding in [[decisions]] (2026-06-24).
- **#36 (protocol translator) — built.** Pure `src/bridge.ts` + `bridge.test.ts` (`npm test` 234 green,
  tsc clean). A pre-landing adversarial review added trust-boundary guards. `catalog.ts` untouched.

**Next task — #37 (now unblocked):**
`/preset scope 37` — the Bridge **HTTP listener + key-based walking skeleton**: bind `127.0.0.1` on a
`wisp.*` port, enforce the access-secret Bearer, parse the body with `parseOpenAiChatRequest`, resolve the
named Provider, send via the existing OpenAI SDK path, render the reply through `bridge.ts`'s SSE emitters,
serve `GET /v1/models` from `buildModelsList(buildChatModelInfos(...))`. Glue → F5-verified, not unit-tested.
After #37: panel toggle + secret (#38), Codex (#39), Anthropic (#40).

**Landmines / things to know:**
- The translator **degrades, never throws** on malformed input by design — in #37, map a parse that yields
  nothing to a deliberate **400**; don't lean on try/catch for control flow, and don't strip the guards.
- **#35 is documented-yes / live-unconfirmed** — confirm a Copilot CLI session actually reaches the Bridge during #37.
- **Before any F5:** uninstall `local.wisp` (stale-panel collision). See [[gotchas]].

Full state in [[active-work]]; the #36 design rationale + the #35 finding in [[decisions]] (2026-06-24); traps in [[gotchas]].
