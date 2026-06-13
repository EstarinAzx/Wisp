---
type: pick-up
project: opencode-autocomplete
updated: 2026-06-14
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last task finished (2026-06-14):** spec'd a new feature, **Inquire**, via `/grill-with-docs` —
**docs only, no code**. Inquire = a **manual, whole-file-context, insertable-code** suggestion: select
lines → right-click **OpenCode: Inquire** → selection is the prompt, whole file is context, result is
ghost text **after** the selection (append, never replace). Works **even when Completion is disabled**;
returns **code only, never prose**. Wrote: `CONTEXT.md` (terms **Suggestion/Completion/Inquire/
Selection-as-prompt**), `PRD.md` (Solution part 3, stories #33–#39, Inquire decisions block, Out-of-
Scope deferred modes), `issues.md` (**Issue 2 — Inquire**, spike-first). Decision logged in
`decisions.md` (2026-06-14).

**Next task:** **build Issue 2 — Inquire** (`issues.md`). **Spike first** (step 0): confirm
`editor.action.inlineSuggest.trigger` + a stashed pending result renders ghost text at a **collapsed
caret after a selection** — if not, stop and revisit the surface before building. Then implement per
Issue 2 in `src/extension.ts` + `package.json` (0.0.3 → 0.0.4); no webview change. Consider
`/preset scope` before coding.

**Landmines (see [[gotchas]] + [[active-work]]):**
- **The spike is the one unproven assumption** — inline suggestions are keystroke-driven by default;
  the whole feature rests on the manual trigger working. Validate it before writing the rest.
- **Append, never replace; code only, never prose** — both alternatives were explicitly rejected
  (data-loss / wrong-surface). Don't quietly reintroduce them.
- Inquire must run **before** the provider's enabled/selection/debounce/cache gates and must **not**
  touch the `lastResult` cache.
- Reuse `stripThink`/`stripFences`/`relocateAfterComment` + the `model` setting — don't reinvent.
- Still live: bare model ids on `zen/go/v1` (the `opencode/` prefix 401s); served models are reasoning
  models (keep `stripThink`, `maxTokens` default `0`); key never crosses to the webview; two tsconfigs.
- After editing, rebuild + reload window (recompile + repackage + `--force` install, or F5) — the
  running build is otherwise stale.

Full rolling state in [[active-work]]; settled choices in [[decisions]]; domain language in `CONTEXT.md`.
