---
type: pick-up
project: wisp
updated: 2026-06-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate.

**Last session (2026-06-23):** Docs-only — updated `README.md` for **v1.3.0** documenting the new
Anthropic (Claude.ai OAuth) provider. Hero pitch now covers ChatGPT **or** Claude.ai subscription;
three backend kinds (was two); new "Anthropic provider" table; **Wisp: Sign in/out of Claude** command
rows; Effort added to the side-panel bullet; provider count 11→12; version 1.3.0. Also refreshed
`overview.md` (count, three kinds, Anthropic modules in layout) + `active-work.md`. No code change.
Release 1.3.0 itself (the full Anthropic provider #28–#32) was already merged to `main` at `6bb632e`.

**Next task:**
1. **Tag `v1.3.0`** if missing — `git tag --list` to check; match the `v1.2.0` tag convention; consider
   a GitHub release.
2. **Subscription 1M-context-ceiling probe** — `anthropicModelCaps` (`src/catalog.ts`) advertises
   model-spec 1M for Opus/Sonnet; if a long Claude.ai-OAuth chat 4xx/413s, the subscription path caps
   lower (~200K?) → drop their `contextInput`. Small, isolated. See [[decisions]] (2026-06-23 #29 entry).
3. **Anthropic image input** — deferred follow-up (tool-calling #30 shipped; images stay deferred).

**Landmines / things to know:**
- **`CLAUDE.md` is uncommitted** (pre-existing, unrelated) — keep it out of doc commits unless asked.
- **README is router-first** (since v1.1.0) — Inquire is the secondary surface; don't reframe Inquire-first.
- **Effort is two independent capabilities** — `max` = Opus 4.6/4.7/4.8, `xhigh` = Opus 4.7/4.8. Picker
  over-offers, wire clamps (`anthropicThinkingEffort`). Source: openclaude `src/utils/effort.ts`. [[gotchas]].
- **The #28 fingerprint contract is load-bearing** — samples first-user-message TEXT only, never body fields.
- **Before any F5:** uninstall `local.wisp` (stale-panel collision). See [[gotchas]].

Full state in [[active-work]]; verified design in [[oauth-recon]]; contracts in [[decisions]] (2026-06-23);
traps in [[gotchas]]; domain language in `CONTEXT.md`.
