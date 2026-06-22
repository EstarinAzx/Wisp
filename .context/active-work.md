---
type: active-work
project: wisp
updated: 2026-06-22
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-22 by Opus 4.8 (auto)._
_At commit: `5f6712b` (on `main`; PRD #23 already shipped via #26 + v1.2.0). `CLAUDE.md` still
uncommitted — pre-existing ecosystem-KB/handoff/trace edit, unrelated; decide its fate separately._

## Current focus
**New feature planned: the Anthropic OAuth Provider.** Let a Claude.ai (Pro/Max) subscriber sign in to
Wisp over OAuth and drive Claude models through native chat / Agent / Inquire — a third **Provider kind**
alongside the API-key and Codex kinds. This session did the investigation + funnel only (no code):
**PRD #27** created and split into slices **#28 → #29 → #30**. xAI deferred to a future PRD (user has no
xAI subscription).

## State
- **Done this session (planning):** verified investigation of openclaude's Anthropic + xAI OAuth, written
  to **[[oauth-recon]]** (the design source of truth). Created **PRD #27** + slices **#28** (tracer:
  sign-in + one Inquire), **#29** (native chat text streaming), **#30** (tool-calling parity). All on
  `EstarinAzx/Wisp`.
- **In flight:** nothing in code yet. Next action is implementing slice **#28**.
- **Blocked:** none for #28. (Anthropic ToS/client_id-reuse risk was considered and **accepted** — it's
  the intended "subscription-as-a-model" moat; see [[decisions]] 2026-06-22.)

## Pick up here
1. **Implement slice #28** — `gh issue view 28 --comments`. Build `src/anthropicAuth.ts` (mirror
   `src/codexAuth.ts`: PKCE S256 + loopback + SecretStorage slot `wisp.anthropicAuth` + refresh w/ 5-min
   skew + `{}` tombstone) and a minimal `src/anthropicClient.ts` Messages call; wire `kind:'anthropic-oauth'`
   into `catalog.ts` / `extension.ts` / panel / `package.json`; route Inquire to it. Constants in [[oauth-recon]] §1.
2. **TDD the pure logic** in `catalog.ts`-style tests (PKCE/state, expiry+refresh boundary, tombstone) —
   prior art `codex.test.ts`.
3. Before any F5: uninstall `local.wisp` (old VSIX collides with the dev build — stale panel). See [[gotchas]].
4. **#28 verification is HITL** — needs your real Claude.ai account + browser for the OAuth round-trip.

## Skills for next session
- superpowers:test-driven-development — the two new deep modules' pure logic wants a red-green loop.
- /preset scope — to enter the work loop on #28 (restate, plan files, go/no-go).

## Open questions
- **Dispatch-registry refactor** is deliberately deferred (only 2 OAuth kinds today). Revisit if/when xAI
  lands and a 3rd kind makes the copy-pasted `isCodexProvider`-style branches worth generalizing.
- **`NATIVE_CLIENT_ATTESTATION`** is a dormant Anthropic kill-switch Wisp (Node, no Bun/Zig) can't
  reproduce. Currently unenforced; if it activates, the Anthropic path breaks. Known ceiling, not a blocker.

## Recent context
- **openclaude split cleanly:** Anthropic OAuth = `services/oauth/*` + `constants/oauth.ts` (Messages-API
  inference, `oauth-2025-04-20` beta); xAI = `services/api/xaiOAuth*` (OpenAI-compatible, OAuth2+OIDC at
  `auth.x.ai`). Both mirror Wisp's existing Codex template.
- **No system-prompt spoof needed** — openclaude ships an "OpenClaude" identity and Anthropic OAuth still
  serves; recognition is token + client_id + `claude-code/<ver>` UA + the beta + billing header.
- **Anthropic is NOT OpenAI-compatible** — needs a bespoke Messages-API adapter (the analogue of Codex's
  Responses adapter). This is the genuinely new engineering, in slice #29's client work.
- Full per-provider porting map, endpoints, scopes, and risks live in [[oauth-recon]].

## Related
- [[overview]]
- [[oauth-recon]] — the investigation + design source of truth for this feature
- [[decisions]] — 2026-06-22 Anthropic-OAuth scope/architecture call
- [[gotchas]] — F5 dup-extension trap; Codex contract facts the new provider parallels
