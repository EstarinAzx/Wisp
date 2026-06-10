---
type: pick-up
project: opencode-autocomplete
updated: 2026-06-10
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last task finished (2026-06-10):** built the **Preact + Tailwind v4 side panel** (`src/sidePanelProvider.ts` + `webview/`), refactored shared actions into `src/extension.ts`, ran a 19-agent review and fixed all 12 confirmed findings, and packaged a verified `.vsix`. User eyeball-tested → approved. Committed on branch `feat/side-panel`.

**Next task (pick one):**
1. **TDD M1 + M2** (highest priority) — unit-test the pure functions in `src/extension.ts`: M1 = `stripFences` / `stripPrefixOverlap` (suggestion cleanup), M2 = `buildContext` (completion context). Spec in `PRD.md`. They're not exported yet → test-export or extract first. Use `/tdd`.
2. **Model tuning** — default `opencode/minimax-m3` is unproven. Compare against `glm-5` / `kimi-k2.6` using the latency log (OpenCode Autocomplete output channel) + the panel model picker; change the default if a clear winner emerges.
3. **(optional) `/preset ship`** — push `feat/side-panel`, open a PR.

**Landmines (see [[gotchas]]):**
- Config writes use `targetFor()` (scope-aware) — don't revert to blind `ConfigurationTarget.Global` or panel controls snap back under a workspace override.
- `baseUrl` is `"scope":"machine"` on purpose (blocks workspace key-redirect) — don't loosen without reason.
- Key value never crosses to the webview — incl. error text (`sanitizeError`). Panel gets `keySource: stored|env|none` only.
- Two tsconfigs; `compile` must keep `tsc -p webview` (Vite doesn't type-check).
- Packaging ships `node_modules` deps — `.vsix` works unbundled; bundling is a size-only optimization.

Full rolling state in [[active-work]]; settled choices in [[decisions]].
