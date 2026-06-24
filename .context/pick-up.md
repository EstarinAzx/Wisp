---
type: pick-up
project: wisp
updated: 2026-06-24
tags: [context, pick-up]
---

# Pick up here

**Start:** read `.context/overview.md` + `.context/active-work.md` to rehydrate, then continue below.

## What this session established (investigation only — NO code change landed)
- **Vision wire is correct.** v1.4.1 fix (`7dfa8b0`) verified end-to-end with a temporary probe: every
  captured request carried the `image` block with real base64; Claude read it (F5, real PNGs;
  single/multi-turn/multi-image). Confirmed the **shipped `wisp-1.4.1.vsix` bytes** contain the fix — the
  artifact is NOT stale. v1.4.1 stays shipped (pushed, released Latest, vsix attached). No rollback.
- **OPEN: agent-mode vision is intermittent.** Same image/model/build, Copilot agent mode sometimes says
  "attachment empty" — but also succeeds in agent mode sometimes (so NOT a clean Ask-vs-Agent split).
  Earlier "resolved / just model behavior" was an over-claim, corrected.
- **The probe was reverted** — `git diff src/chatProvider.ts` is empty (== HEAD). Tests green, compile clean.

## Next task → pin the agent-mode flake (only if pursuing it)
The decisive datum was never captured (every probe log caught was a *success* turn). To resolve:
1. Re-add the two probes in `chatProvider.ts` `provideLanguageModelChatResponse` (see [[active-work]]
   Open questions for the exact shape: incoming `turns/images/last` line + `OUT` body-shape line).
2. Uninstall any installed Wisp first (dup trap), F5, agent mode, Anthropic model.
3. Reproduce until the model answers "empty"; read the pair for THAT turn:
   - `images=0` → VS Code dropped the image on that turn (host bug, not ours).
   - `images≥1` + no `image(...)` in `OUT` → our builder dropped it → **our bug, fix it**.
   - `images≥1` + `OUT` has `image(…b64)` → sent correct, model ignored it (model/host behavior).
4. Remove the probe again when done.

Not pursuing it is fine — Ask mode reads images reliably; only agent mode is flaky.

## Landmines
- **Don't re-release / bump for "the vision fix"** — nothing functional changed; 1.4.1 is already correct & out.
- **Before any F5:** uninstall the installed Wisp (`code --list-extensions | grep -E 'wisp|opencode'`, then
  uninstall) — the dup trap serves a stale panel. New terminal after Start. See [[gotchas]].
- `.context/flows.md` is untracked and **not mine** — leave it out of commits.

## Related
- [[active-work]] · [[overview]] · [[gotchas]]
