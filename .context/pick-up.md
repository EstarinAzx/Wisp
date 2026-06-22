---
type: pick-up
project: wisp
updated: 2026-06-22
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate, then
`.context/oauth-recon.md` (the design source of truth for the work below).

**Last session (2026-06-22):** Planning only, no code. Investigated openclaude's Anthropic + xAI OAuth
(verified, written to `oauth-recon.md`) and ran the init funnel: created **PRD #27 — Anthropic OAuth
Provider** and split it into slices **#28 → #29 → #30** on `EstarinAzx/Wisp`. Scope is **Anthropic only**;
xAI is deferred to a future PRD (no xAI subscription). PRD #23 (Codex Effort) already shipped earlier via
#26 + **v1.2.0** — that baton is closed.

**Next task: implement slice #28** — the Anthropic Provider **tracer** (sign in + one Inquire edit). Enter
with **`/preset scope 28`** (restate, plan files-to-touch, go/no-go) before code. Build `src/anthropicAuth.ts`
+ minimal `src/anthropicClient.ts` mirroring `src/codexAuth.ts` / `src/codexClient.ts`; wire
`kind:'anthropic-oauth'` into `catalog.ts` / `extension.ts` / panel / `package.json`. Constants + flow in
`oauth-recon.md` §1.

**Landmines / things to know:**
- **#28 verify is HITL** — the OAuth round-trip needs your real Claude.ai account + browser; the agent loop
  can build + unit-test but cannot confirm sign-in alone.
- **Anthropic is NOT OpenAI-compatible** — slice #29 needs a bespoke Messages-API adapter (the Codex
  Responses-adapter analogue), not a reused chat path. Don't budget it as "another OAuth row."
- **No system-prompt spoof required** — openclaude proves Anthropic OAuth serves a non-"Claude Code"
  identity; Wisp keeps its own prompt. Recognition = token + client_id + UA + `oauth-2025-04-20` beta.
- **Dormant kill-switch:** `NATIVE_CLIENT_ATTESTATION` is a known ceiling Wisp (Node) can't reproduce —
  unenforced today; if it activates, the Anthropic path breaks (xAI unaffected). Not a blocker.
- **Before any F5:** uninstall `local.wisp` (old VSIX collides with the dev build — stale panel). See [[gotchas]].
- **`CLAUDE.md` still uncommitted** (pre-existing ecosystem-KB/handoff/trace edit, unrelated) — decide
  separately.

Full state in [[active-work]]; the verified design in [[oauth-recon]]; settled choices in [[decisions]]
(2026-06-22 entry); traps in [[gotchas]]; domain language in `CONTEXT.md`.
