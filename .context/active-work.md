---
type: active-work
project: opencode-autocomplete
updated: 2026-06-10
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-10 by Opus 4.8 (background)_
_At commit: 83c3d60 + uncommitted side-panel work (commit being created by this wrap-up)_

## Current focus
Side panel **built, reviewed, fixed, and packaged**. The Preact + Tailwind v4 WebviewView (API key + model picker + on/off toggle) is implemented, compiles clean, and ships in a verified `.vsix`. User eyeball-tested → go. This session's task is done; commit pending.

## State
- **In flight:** nothing mid-edit. About to commit `feat/side-panel`.
- **Done this session:**
  - `src/sidePanelProvider.ts` — `WebviewViewProvider` (strict CSP + nonce shell, message routing, host helpers injected to dodge a circular import), `sanitizeError` so server error bodies never leak key fragments to the webview.
  - `src/extension.ts` — extracted shared actions (`storeApiKey`/`clearApiKey`/`fetchModelIds`/`setModel`/`setEnabled`/`getState`); commands + panel call the same helpers. `getState` returns `keySource: stored|env|none`. Config writes target the defining scope (`targetFor`). `secrets.onDidChange` is the single key-sync point. NUL bytes in `cacheKey` literal swapped to `\0` escapes.
  - `webview/` (Preact app, own tsconfig, Tailwind v4, vscode.d.ts), `vite.config.ts` (unhashed `dist/webview/main.js`+`main.css`), `media/opencode.svg`, `.vscode/launch.json`+`tasks.json` (F5), `package.json` (views + scripts + dev deps), `.vscodeignore`/`.gitignore`.
  - Ran a 19-agent multi-lens review (protocol/security/vscode-api/ui + adversarial verify): 12 findings confirmed, all fixed.
  - Packaged `opencode-autocomplete-0.0.1.vsix` (2.33 MB) — verified `openai`, `main.js`, `main.css`, icon all inside.
- **Blocked:** nothing.

## Pick up here
Feature is complete and verified. Remaining work, in priority order:
1. **TDD the pure modules** — PRD marks **M1** (suggestion cleanup: `stripFences`/`stripPrefixOverlap`) and **M2** (completion context: `buildContext`) for unit tests. Still not written. These are pure functions in `src/extension.ts` → easy red-green. Use `/tdd`. Note: they're not yet exported; extract or test-export first.
2. **Model tuning** — default `opencode/minimax-m3` is unproven. Use the per-request latency log (OpenCode Autocomplete output channel) + the panel's model picker to compare against `glm-5` / `kimi-k2.6` on real code, then change the default if warranted.
3. **(optional) `/preset ship`** — push `feat/side-panel`, open a PR.
4. **(optional) packaging polish** — add `repository` + `LICENSE` to silence vsce warnings; consider esbuild bundling to cut the .vsix from 1402 files (works fine unbundled, just bloated).

## Skills for next session
- /tdd — for M1/M2 unit tests (red-green).
- /preset ship — if landing as a PR.

## Open questions
None blocking.

## Recent context
- **Empirical correction:** `vsce package` ships production `dependencies` (incl. `openai`) without esbuild/webpack — the old "not bundled for packaging" gotcha was wrong. See [[gotchas]].
- Review rejected 3 findings as non-defects (disposed-webview race is spec-safe on VS Code ≥1.57; `assetFileNames` fragility speculative; baseUrl-exfil now mitigated by machine scope).
- Two run paths now exist: **F5** (dev host, fast iterate) and **.vsix install** (dogfood on real code). Re-test after edits = recompile + repackage + `--force` install, or just F5.

## Related
- [[overview]]
- [[api]]
- [[decisions]]
- [[gotchas]]
