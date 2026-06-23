---
type: active-work
project: wisp
updated: 2026-06-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-23 by Opus 4.8 (auto)._
_At commit: `239fd6e` on `main`. Uncommitted this session: `CLAUDE.md`, `CONTEXT.md`,
`.context/overview.md` (modified) + `.context/happy-path.md` (new). All docs — no code._

## Current focus
**Planned a new feature — the Bridge — through the full `/preset init` funnel** (grill → MVD → PRD
→ issues). The Bridge is a local OpenAI-compatible endpoint Wisp exposes so external tools (chiefly
the GitHub Copilot CLI running as a session inside VS Code) can use the Provider catalog —
**including Codex + Anthropic subscription sign-in** — by pointing their BYOK base-URL at it. No code
written yet; the work is fully specified as GitHub issues, ready to build.

## State
- **In flight:** nothing coding-wise — design + issues only.
- **Done this session:** PRD **#34** + 6 tracer slices **#35–#40** created on `EstarinAzx/Wisp`.
  `CONTEXT.md` gained the **Bridge** glossary term; `CLAUDE.md` gained **§8 Plain Language When
  Discussing**; `.context/happy-path.md` created (Bridge MVD) + linked from `overview.md` Map.
- **Blocked:** slice #35 is a *finding* that gates the build (see below); #37+ wait on it.

## Pick up here
**Start the Bridge build loop — `#35` and `#36` are both unblocked and parallel:**
1. **#36 (recommended first — pure TDD, AFK):** build the protocol translator (OpenAI ↔ Wisp turns,
   Wisp stream → OpenAI SSE, `GET /v1/models`). vscode-free, mirrors `catalog.test.ts`. → `/preset scope 36`.
2. **#35 (gate — HITL, no production code):** verify whether VS Code passes env vars
   (`COPILOT_PROVIDER_BASE_URL` etc.) into the spawned Copilot CLI. Yes → hands-free; No → document the
   shell-launch / `terminal.integrated.env` fallback. **#37 (skeleton) needs #35 + #36 both done.**
3. After #37: panel **#38**, Codex **#39**, Anthropic **#40** (all blocked by #37).

Commit the uncommitted docs first (CLAUDE.md / CONTEXT.md / overview.md / happy-path.md) — small, run `/preset wrap-up` or commit straight to `main`.

## Skills for next session
- /preset scope — to enter the work loop on #36 or #35.
- superpowers:test-driven-development — #36 is a red-green-refactor pure module.

## Open questions
- **#35's answer** — does the VS Code Copilot CLI session inherit env vars? Unknown until tested; gates wiring, not architecture.

## Recent context
- **Bridge is EMBEDDED in the extension host, not standalone** — required so it reuses the live
  SecretStorage Codex/Anthropic tokens + refresh. Standalone can't read SecretStorage. See [[decisions]].
- **ToS posture unchanged from today** — same subscription sign-ins, creds never leave Wisp; provider
  only ever sees Wisp. The proxy adds no new ToS category (user pushed hard on this; conceded it's the
  same call already made shipping the OAuth providers).
- **User pref reinforced this session:** plain language in discussion/grilling, jargon last (now CLAUDE.md §8).
- **Prior open tasks still live:** tag `v1.3.0` if untagged; subscription 1M-context-ceiling probe; Anthropic image input (deferred).

## Related
- [[overview]]
- [[happy-path]] — the Bridge golden-path MVD
- [[decisions]] — 2026-06-23 "The Bridge" entry (embedded-vs-standalone, addressing, security)
- [[gotchas]] — F5 dup-extension trap still applies before any Bridge F5
