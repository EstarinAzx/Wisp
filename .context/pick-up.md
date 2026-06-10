---
type: pick-up
project: opencode-autocomplete
updated: 2026-06-10
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last task finished (2026-06-10):** fixed **clunky completion output**, committed on `feat/side-panel`,
vsix bumped to `0.0.2`. Two layers in `src/extension.ts`:
1. `SYSTEM_PROMPT` — format/newline/no-comment-extension rules (best-effort).
2. `relocateAfterComment` guard (+ `lineCommentToken`/`looksLikeCode`/`reindent`) — deterministic,
   load-bearing: at the physical end of a whole-line comment in a known code language, forces code onto
   its own indented line and drops comment-continuation prose. Fails safe.
Designed + adversarially verified via a Workflow (3×5 = 15 checks; all naïve approaches broke). Verified:
`tsc --noEmit` clean + an 11-case harness (real bug + every adversarial break) 11/11. Recompiled + repackaged.

**Next task (pick one):**
1. **Install + eyeball 0.0.2 live** — `--force`-install the new `.vsix` + reload window (running build is
   stale otherwise). Retype `// loop through the array`, confirm code drops to its own line, comment never
   extended; spot-check Python `#`. ⚠️ This is the one thing not yet done — code is verified by harness, not
   yet by hand in-editor.
2. **Faster default model** — `minimax-m3` is a reasoning model, 4–7.6s/suggestion. Try `deepseek-v4-flash`
   / `kimi-k2.6`; if a non-reasoning id is reliably sub-second, change `DEFAULT_MODEL` (`src/extension.ts`)
   + the `model` default (`package.json`).
3. **TDD M1 + M2** — pure fns in `src/extension.ts` still untested + unexported (now incl.
   `looksLikeCode`/`reindent`/`relocateAfterComment`). Spec in `PRD.md`. Use `/tdd`.
4. **(optional) `/preset ship`** — push `feat/side-panel`, open a PR.

**Landmines (see [[gotchas]]):**
- Comment guard: don't weaken the gates (whole-line comment + known code language + strict
  `character === line.length`) to `indexOf('//')` / a `//` default / a `trim()` check — each reopens a
  confirmed false-positive class (URLs, regex, shell `${#}`, docstrings, markdown). Block comments are
  intentionally unguarded.
- Model ids are **bare** on `zen/go/v1` — the `opencode/` prefix is rejected (401).
- Served models are **reasoning models** — keep `stripThink`, keep `maxTokens` default `0`.
- After editing, the running build is stale until **rebuild + reload window** (recompile + repackage +
  `--force` install, or F5).
- Config writes use `targetFor()` (scope-aware); `baseUrl` is `"scope":"machine"`; key never crosses to
  the webview (incl. error text via `sanitizeError`); two tsconfigs — `compile` must keep `tsc -p webview`.

Full rolling state in [[active-work]]; settled choices in [[decisions]].
