---
type: active-work
project: wisp
updated: 2026-06-18
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-18 by Opus 4.8._
_Released **v1.0.0**. Branch `feat/lm-chat-provider` (slice #7 + dynamic capabilities) → PR → merged to `main`._

## Current focus
**Slice #7 (LM Chat Provider) shipped, plus everything the user asked on top of it, then released v1.0.0.**
Wisp's keyed Providers now appear as models in VS Code's **native** chat / Ctrl+I, with tool calling,
vision, and **real per-model context/vision read live from models.dev**.

## State
- **In flight:** nothing (v1.0.0 cut).
- **Done this session (branch `feat/lm-chat-provider`, 7 feature commits + release):**
  1. `src/chatProvider.ts` — registers the `wisp` Language Model Chat Provider; streams via Wisp's own
     OpenAI client. Pure `buildChatModelInfos` in `catalog.ts`.
  2. **Tool calling** — forward `options.tools`, reassemble streamed `delta.tool_calls` → tool-call parts.
  3. **Vision** — forward image parts as `image_url` data URIs.
  4–5. Context + vision derived from the **active model** (heuristic `CONTEXT_TABLE`/`VISION_FAMILIES`).
  6. **Live models.dev** (`src/modelsDev.ts`) — real `limit.context`/`output`/`modalities` per model,
     keyed by per-row `catalogKey`; heuristics demoted to fallback. (See [[decisions]] 2026-06-18.)
  7. **Context decomposition** — split the window into input+output so VS Code's summed "Context Size"
     column shows the real number (kimi 256K not 524K).
  - **Release:** version → **1.0.0**, new `CHANGELOG.md`, GitHub release `v1.0.0` + `wisp-1.0.0.vsix`.
- **Verification:** `npm test` **70/70**; `npm run compile` clean; live e2e against models.dev confirmed
  (kimi 256K, gpt-4o-mini 128K, minimax-m3 512K + vision). Native-chat F5 done by the user earlier
  (models appeared + selectable after tool-calling landed).
- **Blocked:** nothing.

## Pick up here
The #3 pivot epic is **complete** (slices #4–#8 + the #7 bonus all shipped). Next session is open:
- **Optional cleanup (offered, not yet done):** strip `CONTEXT_TABLE` + `VISION_FAMILIES` so the only
  fallback is a neutral default (no per-model *guesses*) — the user leaned toward keeping them as offline
  fallback. Decide if/when.
- **Carried backlog:** verify the 3 still-⚠ `defaultModel`s once keys exist (`ollama` `qwen2.5-coder`,
  `kilocode`/`cline` `anthropic/claude-3.5-sonnet` — the latter two are stale ids absent from models.dev,
  so they fall back today). README pass for `wisp.provider` / catalog / native-chat usage.

## Skills for next session
- `superpowers:test-driven-development` — TDD any new pure logic into `src/catalog.ts` (`npm test`).
- `superpowers:brainstorming` — for any new feature the user brings.

## Open questions
- Strip the heuristic guess-tables, or keep as offline fallback? (user-led)
- The 3 ⚠ model ids stay unverified until keys exist (non-blocking; models.dev covers the rest).

## Recent context
- **models.dev is the capability source** — keyed by base-URL match, NOT provider name (`.../zen/go/v1`
  → `opencode-go`, `kilocode` → `kilo`). Local Ollama / Cline / Custom are absent → table/default. See
  [[decisions]] + [[gotchas]].
- Pattern intact: pure, unit-tested logic lives vscode-free in `catalog.ts`; `extension.ts` / `chatProvider.ts`
  do the vscode/network glue. `modelsDev.ts` is the only network module (vscode-free).

## Related
- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[api]]
