---
type: active-work
project: wisp
updated: 2026-06-19
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-19 by Opus 4.8._
_At commit: `main` = `568942c` (clean; v1.1.0 released)._

## Current focus
**Shipped v1.1.0 and repositioned the product.** The Codex Provider + OpenCode Zen/Go batch (PRD #11,
slices #12–#15) is merged to `main`, **released as v1.1.0**, and Wisp is now framed primarily as a
**BYOK model router for VS Code's Copilot chat harness** (native chat / Agent / Ctrl+I), with Inquire as
the secondary inline-edit surface. No feature work in flight.

## State
- **Released v1.1.0** — GitHub release `v1.1.0` ("Copilot-harness model router"), marked Latest, with
  `wisp-1.1.0.vsix` attached (clean build, 1408 files / 2.37 MB). Tag `v1.1.0` → `568942c`.
- **Version bump** — `package.json` 1.0.0 → 1.1.0; added `repository` field + `AI`/`Chat` categories;
  description reframed to the router positioning. `CHANGELOG.md` has the 1.1.0 entry.
- **README rewritten** — router-first (drafted by a 4-agent panel workflow, then synthesized). Removed the
  stale ghost-text Completion / `enabled` / `debounce` docs. Leads with "route your own models into the
  Copilot harness"; Inquire is documented as secondary.
- **Packaging hygiene** — `.vscodeignore` now excludes `.claude/**` and `docs/**` (a stray scheduler lock
  + internal spec were being swept into the vsix).
- **Merged this session:** PR #17 (the #12–#15 batch → main), PR #18 (release prep), PR #19 (vsix hygiene).
  All Codex/Zen-Go issues (#11–#15) CLOSED.
- **In flight:** nothing.
- **Blocked:** **Marketplace publish** — needs a real `publisher` (currently `local`) + an Azure DevOps PAT.
  Cannot be done without the user's credentials (see Pick up).

## Pick up here
No pending feature slice. Options:
1. **Marketplace publish (if wanted)** — set a real `publisher` in `package.json` (currently `local`,
   `private:true`), then `vsce login <publisher>` / `vsce publish` with an Azure DevOps PAT. User must
   create the publisher + PAT; the build is otherwise release-ready.
2. **New work** — `/preset init` for a brand-new feature, or address an open question below.

## Skills for next session
- `/preset init` — only if starting a brand-new feature (no slice is pending).

## Open questions
- **Codex `id` field on replayed `function_call` items:** Wisp sends `call_id` only (F5-proven sufficient).
  If a future multi-turn agent flow 400s on the round-trip, add a derived `id` (`fc_…`) in
  `buildCodexResponsesBody` (one line + one test). See [[gotchas]].
- Codex `reasoning` effort fixed at `medium` for gpt-5/o; make per-model only if one needs `high`.
- `codexModelCaps` vision is blanket-`true`; gate per-model only if a specific id 400s on an image.

## Recent context
- **Repositioning is a product-direction call (this session):** v1.1.0's README/description/overview now
  lead with the router-for-Copilot-harness framing. Inquire was NOT removed — only demoted to secondary.
  See [[decisions]] 2026-06-19 v1.1.0 entry.
- **Local artifact:** `wisp-1.1.0.vsix` sits untracked in the working dir (build output). `CLAUDE.md` has
  pre-existing uncommitted edits (not part of any session change).

## Related
- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[api]]
