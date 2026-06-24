---
type: pick-up
project: wisp
updated: 2026-06-24
tags: [context, pick-up]
---

# Pick up here

**Start:** read `.context/overview.md` + `.context/active-work.md` to rehydrate, then continue below.

## What just finished (this session, all on `main`, committed)
- **Anthropic native-chat vision — FIXED (`7dfa8b0`).** Images were advertised but silently dropped;
  now forwarded as Messages `image` blocks (mirrors the Codex path). +3 unit tests.
  Files: `src/catalog.ts`, `src/chatProvider.ts`, `src/anthropic.test.ts`.
- **Provider label `Claude` → `Anthropic` (`4834ecc`).** One line at `src/extension.ts:87`. `id` stays `'anthropic'`.
- **v1.4.1 bump** — `package.json` + `CHANGELOG.md`, committed with this `.context/` update.
- `tsc` clean, full compile clean, **237 tests green**.

## Next task → **Ship**
1. `/preset ship` — push `main` to `origin` (commits are local). Open a PR only if you want review.
2. **Optional follow-ups** (see active-work for detail):
   - **Bridge image follow-up** — `handleAnthropicChat` in `src/bridgeServer.ts` still drops images;
     same shape as the native fix now that `buildAnthropicMessagesBody` accepts `images`.
   - Close PRD **#34** if still open; Copilot catalog token-window warning; package the vsix.

## Landmines
- **Live vision not F5-proven.** Unit tests lock the wire shape; no real-PNG drag confirmed end-to-end.
  F5 + drag a PNG into native chat with the Anthropic model to verify Claude actually reads it.
- **Before any F5:** uninstall `local.wisp` (stale-panel dup trap); open a NEW terminal after Start. See [[gotchas]].
- `.context/flows.md` is untracked and **not mine** — leave it out of commits.

## Related
- [[active-work]] · [[overview]] · [[gotchas]]
