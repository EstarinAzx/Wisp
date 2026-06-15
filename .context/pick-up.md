---
type: pick-up
project: wisp
updated: 2026-06-16
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate the project.

**Last task finished (2026-06-16):** **Multi-provider Provider catalog merged to `main`.**
Opened PR #1, merged `feat/multi-provider-catalog` → `main` via a merge commit (`badd981`), synced local
`main`. The feature (Issues 4–7) is now live on `main`. Working tree clean, on `main`.

**Next task: pick one backlog item** (full detail in `active-work.md` → "Pick up here"):
1. **Verify the 4 ⚠ best-effort `defaultModel`s** against each `GET /models` once keys exist —
   `ollama` (`qwen2.5-coder`), `ollama-cloud` (`gpt-oss:120b`), `kilocode` + `cline`
   (`anthropic/claude-3.5-sonnet`). Fix in `PROVIDERS` (`src/extension.ts`). `issues.md` Issue 6 wants this.
2. **Update `README.md`** — document `wisp.provider`, the Provider catalog, the reworded `wisp.baseUrl`
   ("Custom only").
3. **TDD the pure helpers** — migration guard, `activeModel`/`activeBaseUrl` resolvers,
   `buildInquiryPrompt` slicer. Load `superpowers:test-driven-development`; branch off `main` first.

**Landmines (see [[gotchas]] + [[active-work]]):**
- **No model-id transform** — each row's `defaultModel` is the Provider's native form; never re-add the
  `opencode/` prefix (it 401s Zen).
- Built-in base URLs are hardcoded in `PROVIDERS` (code), never settings; `wisp.provider` +
  `wisp.baseUrl` are `"scope": "machine"` — the bearer-key-redirect defense. Don't relax.
- `wisp.model` is a **mirror**; source of truth is the `globalState['wisp.models']` per-Provider map
  (`mirrorActiveModel()` re-syncs it after a raw `wisp.provider` edit, write-loop-guarded).
- **Ollama Cloud** base URL is `https://ollama.com/v1`, **not** `/api/v1`.
- **Cline** ships user-key-only + a ToS note; **Copilot/Cursor were dropped** — don't re-add.
- Branch `feat/multi-provider-catalog` is merged but **not deleted** (local + remote) — prune when ready.
- Still live (pre-existing): bare model ids on `zen/go/v1`; reasoning models (keep `stripThink`,
  `maxTokens` default `0`); key never crosses to the webview; two tsconfigs.

Full rolling state in [[active-work]]; settled choices in [[decisions]]; domain language in `CONTEXT.md`.
