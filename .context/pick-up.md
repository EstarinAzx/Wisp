---
type: pick-up
project: wisp
updated: 2026-06-18
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate.

**Last session (2026-06-18):** Built **slice #7 — the Language Model Chat Provider** (`src/chatProvider.ts`):
Wisp's keyed Providers now show as models in VS Code's **native** chat / Ctrl+I (vendor `wisp`), streaming
through Wisp's own OpenAI client. Then, per user asks, added **tool calling** (forward `options.tools`,
emit `LanguageModelToolCallPart`), **vision** (image parts → `image_url` data URIs), and **live per-model
context/vision from models.dev** (`src/modelsDev.ts`; heuristics demoted to fallback), and fixed the
context **decomposition** so VS Code's summed "Context Size" shows the real window (kimi 256K, not 524K).
**Released v1.0.0** — `CHANGELOG.md`, GitHub release `v1.0.0` + `wisp-1.0.0.vsix`. `npm test` 70/70,
`npm run compile` clean. Merged to `main` via PR; you're on `main`, clean.

**Next task: OPEN / user-led.** The #3 inline-chat pivot epic is fully done. No committed next task.
- If the user wants polish: the **strip-guess-tables** decision is still open (delete `CONTEXT_TABLE` +
  `VISION_FAMILIES` so the only fallback is a neutral default — user leaned toward keeping them).
- Carried backlog: verify the 3 ⚠ `defaultModel`s once keys exist; README pass.
- New feature → `superpowers:brainstorming`, then `/preset init` or `to-prd`/`to-issues`.

**Landmines (see [[gotchas]] + [[decisions]]):**
- **models.dev key = base-URL match, NOT name.** `opencode-zen` (`.../zen/go/v1`) → **`opencode-go`**
  (NOT `opencode`, which is `.../zen/v1`); `kilocode` → **`kilo`**. Wrong key = silent table fallback.
- **Local Ollama, Cline, Custom are absent from models.dev** → no `catalogKey` → table/default. Expected.
- **Honest capabilities:** never advertise `toolCalling`/`imageInput` without the real passthrough — VS
  Code hides non-tool models from agent/edit/Ctrl+I, and a declared-but-unimplemented capability breaks.
- **Context is the TOTAL window, decomposed** input+output (VS Code sums them). Don't pass `context` as
  input AND `output` as output — that double-counts.
- **Pure logic stays vscode-free in `catalog.ts`** (TDD via `npm test`); `modelsDev.ts` is the only
  network module (also vscode-free). Don't fold testable logic into `extension.ts`/`chatProvider.ts`.
- `engines.vscode` is now **^1.104** (the LM Chat Provider API is finalized there).

Full rolling state in [[active-work]]; settled choices in [[decisions]]; domain language in `CONTEXT.md`.
