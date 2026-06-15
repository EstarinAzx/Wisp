---
type: pick-up
project: wisp
updated: 2026-06-15
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last task finished (2026-06-15):** **Specced the multi-provider feature** (planning only — no code).
Studied XETH--7's provider strategy, researched the user's extra providers (web + adversarial verify),
ran grill-with-docs, and wrote the artifacts: `CONTEXT.md` (+4 terms: **Active Provider**, **Provider
catalog**, **Built-in/Custom Provider**), the multi-provider **ADR** in `decisions.md`, 3 new
`gotchas.md` entries, the `PRD.md` multi-provider section (+ user stories 40–44), and **Issues 4–7** in
`issues.md` (tracer-bullet slices). These docs are committed on branch **`feat/multi-provider-catalog`**.

**Next task: implement Issue 4 — Active-Provider plumbing + silent key migration** (the thin
end-to-end tracer; **no UI**). It is on branch **`feat/multi-provider-catalog`** (already created) —
**continue on that branch**. Full scope + acceptance criteria in `issues.md` Issue 4; rationale in
`decisions.md` (2026-06-15 multi-provider ADR). In short:
- 2-row `PROVIDERS` catalog in `src/extension.ts` (`opencode-zen` default + one second, e.g. `groq`),
  base URLs **hardcoded**.
- Machine-scoped `wisp.provider` setting; active-Provider-scoped key (`wisp.apiKey.<id>` → row
  `apiKeyEnv` env → none) + model (globalState `{id:model}` map; `wisp.model` mirrors active).
- `getClient`/`cachedClient` rebuilt from the active row's `{baseUrl,key,model}`.
- **Silent one-time migration** `wisp.apiKey` → `wisp.apiKey.opencode-zen` (+ model), runs once.
- Verify end-to-end (F5): switch provider via `settings.json` → Completion **and** Inquire hit the new
  backend with its own key + native default model; switch back → Zen again.

**Workflow (per the user's directive):** work each issue on a branch; **when the F5 eyeball passes,
merge to main.** Issue 4 rides `feat/multi-provider-catalog`. After 4 lands, Issues 5 (panel dropdown)
and 6 (full 9-provider catalog) are independent; 7 (Custom + Cline note) depends on both.

**Landmines (see [[gotchas]] + [[active-work]]):**
- **`wisp.provider` MUST be `"scope": "machine"`** and built-in base URLs MUST live in code — a
  workspace-overridable provider selector is a bearer-key-redirect vector (same threat as `baseUrl`).
- **No model-id transform** — ship each row's `defaultModel` in native format; never re-add the
  `opencode/` prefix (it 401s Zen).
- Migration must be **idempotent** (no-op if `wisp.apiKey.opencode-zen` already exists) and must not
  lose the key.
- **Ollama Cloud** base URL is `https://ollama.com/v1`, **not** `/api/v1` (Issue 6).
- **Cline** ships user-key-only + a ToS note (Issue 7); **Copilot/Cursor were dropped** — don't re-add.
- Still live (pre-existing): bare model ids on `zen/go/v1`; reasoning models (keep `stripThink`,
  `maxTokens` default `0`); key never crosses to the webview; two tsconfigs.

Full rolling state in [[active-work]]; settled choices in [[decisions]]; domain language in `CONTEXT.md`.
