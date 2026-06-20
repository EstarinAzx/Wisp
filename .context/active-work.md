---
type: active-work
project: wisp
updated: 2026-06-21
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-21 by Opus 4.8._
_At branch: `feat/codex-effort` — this session's commit lands **slice #24**. `main` = `ec60e62`.
Also uncommitted on the branch: pre-existing `CLAUDE.md` edit (ecosystem-KB / handoff / trace sections —
NOT this work) and the `.context` + `CONTEXT.md` #23-planning edits, folded into this commit._

## Current focus
**Built slice #24 — Codex Effort control (PRD #23).** A side-panel **Effort** knob for the **Codex
Provider** replaces the hardcoded `medium` and governs **every** Codex call (Inquire + chat). One global
value. Scale is **`low` / `medium` / `high` / `xhigh`** (xhigh added this session — Codex codex-max models
accept it). **No code committed yet** at time of writing — `/preset wrap-up` is committing it now.

## State
- **Slice #24 — DONE (uncommitted → committing this session).** `codexReasoning(model, effort)` threads the
  Effort; new `CodexEffort` type + `DEFAULT_EFFORT='medium'`; `wisp.effort` globalState value
  (`activeEffort`/`setEffort`); panel `<select>` (Codex-gated) → `selectEffort` → `setEffort`. Threaded to
  both surfaces via the single `codexResponsesRequest` chokepoint. **`npm test` 139/139, tsc+webview+vite
  clean, F5 PASSED** (knob renders Codex-only; a message sent on a selected effort).
- **Slice #25 — "Model-picker label mirrors Effort." NOW UNBLOCKED** (#24 landed). `buildChatModelInfos`
  (`catalog.ts:~299`, `name: \`${p.label} — ${model}\``) appends `· <Effort>` for reasoning Codex rows
  only. No live-refresh event needed: the picker re-calls `provideLanguageModelChatInformation` on open
  (chatProvider is stateless — confirmed no `onDidChange…` event exists; finalized 1.104 API). Test:
  `buildChatModelInfos` (`catalog.test.ts:~267`). The 13 existing tests assert the current name format —
  expectations for the Codex row will need the suffix.
- **Effort is one global value** (globalState `wisp.effort`), not per-model — matches the model-memory
  design. Inert for non-reasoning Codex models (`spark`/`gpt-4.x`) for free via `codexReasoning`'s gating.
- **Blocked:** Marketplace publish still pending a real `publisher` + Azure DevOps PAT (user creds).

## Pick up here
1. **Build Slice #25** — enter with **`/preset scope 25`**. Unblocked, AFK; verified by `buildChatModelInfos`
   unit tests + F5. Touches `catalog.ts` (label) + `catalog.test.ts`. Webview untouched → no `dist/webview`
   rebuild needed, but F5 to confirm the picker label.
2. If shipping #24 (and #25 when done) instead: **`/preset ship`** for a PR on `feat/codex-effort`.

## Skills for next session
- `/preset scope 25` — enter the work loop on the last slice of PRD #23.

## Open questions
- **`· <Effort>` label honesty for #25:** suffix only when the active Codex model is reasoning-capable
  (reuse `codexReasoning`'s gate), so an inert `spark`/`gpt-4.x` row never claims a depth. Decided in PRD;
  verify the gate reuse at scope.
- Carried over (latent): replayed `function_call` items send `call_id` only (add a derived `fc_…` `id`
  only if a multi-turn round-trip 400s); `codexModelCaps` vision is blanket-`true`. See [[gotchas]].
- **`xhigh` × model pairing:** one global effort, no per-model gating — `xhigh` paired with an older
  `gpt-5`/`o3` may 400 (only codex-max honors it). User's pairing responsibility, by design (PRD "set it once").

## Recent context
- **Dev-environment dup bit the F5:** the old installed VSIX (`local.wisp@1.1.0`) + the F5 dev build
  (`EsarinAzx.wisp`) both contributed `wisp.*` settings → "already registered" warnings and a **stale
  panel** (no Effort knob). Fixed by uninstalling `local.wisp` before F5. New trap in [[gotchas]].
- **`setEffort` landmine:** a globalState write fires no config-change event (unlike `setModel`'s
  `wisp.model` mirror), so `setEffort` calls `panel.postState()` itself. Don't remove that line.
- **`pick-up.md` was stale** at session start (pointed at the already-shipped `feat/codex-tracer`); the
  ship task was long done (PR #17 + v1.1.0). Rewritten by this wrap-up.

## Related
- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[api]]
