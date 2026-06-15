---
type: pick-up
project: opencode-autocomplete
updated: 2026-06-15
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last task finished (2026-06-15):** **built Issue 2 — Inquire** (`issues.md`, all criteria `[X]`).
Manual, whole-file, insertable-code suggestion: select lines → **OpenCode: Inquire** (right-click with
a selection, or palette) → selection is the prompt, whole file is context → code-only ghost text
**after** the selection (append, never replace), works even with completion disabled. Eyeball/F5
**passed** — the spike held. Touched `src/extension.ts` (`inquire` command, `pendingInquiry`, provider
early-return before all gates, `INQUIRE_SYSTEM_PROMPT`, `buildInquiryPrompt` + 32k size guard,
`withProgress`, `buildContext` optional overrides) and `package.json` (command + `editor/context` menu,
v0.0.3 → **0.0.4**). Packaged `opencode-autocomplete-0.0.4.vsix`. Decision logged in `decisions.md`.

**Next task:** no open slices left (Issues 1 + 2 both done). Pick one:
- **Ship** — `/preset ship` to push branch `docs/inquire-spec` + open a PR (this commit is **not pushed**).
- Carried-forward: faster default model, or `/tdd` for M1/M2 (+ the new `buildInquiryPrompt` slicer).
- New work → add an `issues.md` slice first.

**Landmines (see [[gotchas]] + [[active-work]]):**
- Inquire's provider early-return must stay **before** the enabled/selection/debounce/cache gates and
  must **not** read/write `lastResult`. Keep it **append-only, code-only** — both alternatives rejected.
- Inline ghost text won't render while a selection is active → the command collapses the selection to
  the caret before triggering. Don't remove that.
- Reinstalling the **same** vsix version may not refresh — bump version + repackage + `--force` install
  (or F5) each test iteration; reload window after.
- Still live: bare model ids on `zen/go/v1` (the `opencode/` prefix 401s); reasoning models (keep
  `stripThink`, `maxTokens` default `0`); key never crosses to the webview; two tsconfigs.

Full rolling state in [[active-work]]; settled choices in [[decisions]]; domain language in `CONTEXT.md`.
