---
type: active-work
project: wisp
updated: 2026-06-24
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-24 by Opus 4.8._
_Branch: `feat/bridge` (off `main` at `6adecdf`). Bridge slices #35 + #36 landed this session._

## Current focus
**Building the Bridge** (PRD #34) — Wisp's outward-facing local OpenAI-compatible endpoint, so the GitHub
Copilot CLI (run as a session inside VS Code) can drive a coding task through any Wisp Provider, **including
the Codex (ChatGPT) and Anthropic (Claude.ai) subscription sign-ins**. Outward mirror of the inward LM Chat
Provider. The two foundation slices are done; the HTTP listener is next.

## State
- **Done this session:**
  - **#35 (env-var gate) — RESOLVED.** VS Code does **not** auto-pass env vars into a Copilot-CLI session it
    spawns. Wisp injects them itself via `context.environmentVariableCollection.replace()` (×5 Copilot BYOK
    vars: `COPILOT_PROVIDER_BASE_URL` / `COPILOT_MODEL` / `COPILOT_PROVIDER_API_KEY` / `COPILOT_PROVIDER_TYPE` /
    `COPILOT_OFFLINE`); fallbacks = `terminal.integrated.env.<platform>` or shell-launch. Full finding in
    [[decisions]] (2026-06-24). Verdict derived from docs + the 1.104 API — **the live F5 is the pending
    final confirm** (see Open questions).
  - **#36 (protocol translator) — BUILT.** New pure, vscode-free `src/bridge.ts` + `src/bridge.test.ts`
    (joins the `catalog.ts` family). `parseOpenAiChatRequest` (inbound, inverse of `buildOpenAiChatMessages`),
    OpenAI-SSE emitters (`textChunk`/`toolCallChunk`/`finalChunk`/`sseLine`/`SSE_DONE`), `buildModelsList`.
    A 15-agent adversarial review of the diff confirmed 5 trust-boundary findings → untrusted-input guards
    added (TDD). `npm test` **234 green**, `tsc` clean. `catalog.ts` untouched.
- **In flight:** nothing — clean stopping point, committed.
- **Unblocked:** **#37** (HTTP listener + key-based walking skeleton) needed #35 + #36 both done → now ready.

## Pick up here
**Start #37 — the HTTP listener + key-based Provider walking skeleton.** → `/preset scope 37`.
1. Bind `127.0.0.1` on a configurable `wisp.*` port; enforce the access-secret Bearer on every request.
2. Wire the translator: untrusted JSON body → `parseOpenAiChatRequest` → resolve the named Provider
   (`model` = a Provider id) → existing **OpenAI SDK** send path (keyed Providers first; Codex #39 /
   Anthropic #40 later) → render the reply stream back through `bridge.ts`'s SSE emitters.
3. Serve `GET /v1/models` from `buildModelsList(buildChatModelInfos(...))`.
4. The parse **degrades** on malformed input (empty turns / skipped bad parts) rather than throwing — so map
   a parse that yields nothing to a deliberate **400**, don't rely on catching a `TypeError`.
- The listener, panel toggle, and secret display are **glue → F5/manual-verified, NOT unit-tested** (per PRD).
- After #37: panel toggle + secret (#38), Codex (#39), Anthropic (#40).

## Skills for next session
- /preset scope — to enter the work loop on #37.
- superpowers:test-driven-development — only the *pure* parts get TDD'd; #37 is mostly glue (F5).

## Open questions
- **#35's live F5** — does a Copilot CLI session in a VS Code terminal actually inherit the injected vars and
  reach the Bridge? Documented-yes, live-unconfirmed. Confirm during/after #37, when there's a listener to hit.

## Recent context
- **Bridge is EMBEDDED in the extension host** (reuses the live SecretStorage Codex/Anthropic tokens +
  refresh); standalone rejected — it can't read SecretStorage. See [[decisions]] 2026-06-23.
- **The translator guards untrusted input by design** — `parseOpenAiChatRequest` degrades (never throws) on a
  missing/non-array `messages`, non-iterable user `content`, a `tool_call`/`tools` entry with no `function`,
  or unknown/partial content parts. **Don't strip those guards** — the #37 listener relies on a non-throwing
  parse. (Surfaced by the pre-landing adversarial review.)
- **ToS posture unchanged** — the Bridge adds no new ToS category (same subscription sign-ins, creds never
  leave Wisp; the provider only ever sees Wisp).

## Related
- [[overview]]
- [[happy-path]] — the Bridge golden-path MVD
- [[decisions]] — 2026-06-23 "The Bridge" + 2026-06-24 (#35 finding, #36 build)
- [[gotchas]] — F5 dup-extension trap still applies before any Bridge F5
