---
type: pick-up
project: wisp
updated: 2026-06-19
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate.

**Last session (2026-06-19):** Built + shipped **slice #15 — Codex tool-calling parity (agent mode)** on
branch **`feat/codex-tracer`**. The codex chat branch now **forwards agent tools and round-trips tool
calls/results**, so the `toolCalling: true` flag (flipped in #14 for picker visibility) is now **honest**.
New pure cores in `catalog.ts` (TDD): `toCodexResponsesTools` (+ recursive strict-schema enforcer),
`reduceResponsesToolCalls` (Responses analogue of `assembleToolCalls`), and `buildCodexResponsesBody`
extended to serialize `function_call` / `function_call_output` round-trip items. `codexStream`
(`codexClient.ts`) yield widened `string` → **`CodexStreamEvent`** union; `chatProvider` threads tools in
and emits text / tool-call parts. **`npm test` 137/137, tsc+webview+vite clean, F5 PASSED** — Codex fired
5 parallel `Read` tool calls, results round-tripped, summary reflected real file contents.

**This completes PRD #11 (slices #12–#15).** The Codex Provider + OpenCode Zen/Go batch is feature-complete.

**Next task: SHIP the branch — `feat/codex-tracer` (#13+#14+#15) → PR / merge to `main`.** Enter with
**`/preset ship`**. There is no remaining slice in PRD #11; if instead starting new work, `/preset init`.

**Landmines / things to know:**
- **#15 is uncommitted-then-committed this session** — if the commit didn't land, the working tree holds the
  #15 diff (`catalog.ts`, `chatProvider.ts`, `codexClient.ts`, `codex.test.ts`). Verify with `git log`.
- **Replayed `function_call` items use `call_id` only (no `id`)** — F5-proven sufficient. If a future
  multi-turn agent round-trip 400s, add a derived `id` (`fc_…`) to the item in `buildCodexResponsesBody`
  (one line + one test). See [[gotchas]] "Codex tools must be STRICT…".
- **Codex tools must be STRICT** (every object closed + all keys required) — `enforceStrictResponsesSchema`
  does this; don't loosen it (Codex 400s open objects). The tool shape is **flat**, not chat-completions'
  nested `function` — don't reuse `toOpenAiTools` for Codex.
- Reference for the Responses tool shapes: `XETH--7` `src/services/api/codexShim.ts`
  (`D:\Mods\xethryon\new agent\XETH--7`).

Full state in [[active-work]]; settled choices in [[decisions]]; traps in [[gotchas]]; domain language in `CONTEXT.md`.
