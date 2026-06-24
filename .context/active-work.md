---
type: active-work
project: wisp
updated: 2026-06-24
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-24 by Opus 4.8 (auto)._
_At commit: `c3b603c` on `main` (v1.4.1 released; this session was investigation-only, no code change)._

## Current focus
**Vision wire is correct; agent-mode reliability is an OPEN question.** A user reported Anthropic
native chat "inconsistently" not seeing images. Investigated with a temporary boundary probe (added,
used, removed — net zero code change). Proven: the v1.4.1 fix (`7dfa8b0`) is correct on the wire —
every captured request carried the `image` block with real base64 bytes, and Claude read it (F5 +
real PNGs, single/multi-turn/multi-image). Verified the **shipped `wisp-1.4.1.vsix` bytes** contain
the fix (`catalog.js` image block, `chatProvider.js` forwards `images`) — the artifact is NOT stale.

**Unresolved:** images are **intermittent in Copilot agent mode** — same image/model/build, the model
sometimes answers "attachment empty." NOT cleanly Ask-vs-Agent (a success was confirmed in agent mode
too). Root cause NOT pinned: could be VS Code dropping the image on tool-planning turns, or the model
not attending mid-tool-loop. **The decisive datum was never captured** — every probe log caught was a
*success* turn; need a log at the exact "empty" moment (see Pick up here). Earlier "it's resolved /
just model behavior" was an over-claim — corrected. **Ask mode is reliable; v1.4.1 stays shipped, no
rollback.**

## State
- **Done this session (all on `main`):**
  - **Anthropic native-chat vision — FIXED (`7dfa8b0`).** The provider advertised vision but
    silently dropped attached images (Claude saw an empty message). Root cause: `normalizeTurn`
    collected images, but `toAnthropicMessages` omitted them and `buildAnthropicMessagesBody` had no
    image block. Mirrored the working Codex path: `AnthropicMessage` gained `images?`; the body
    builder emits `{type:'image',source:{type:'base64',media_type,data}}` user blocks
    (order: tool_result → image → text); `toAnthropicMessages` forwards `t.images`. +3 unit tests.
    Files: `src/catalog.ts`, `src/chatProvider.ts`, `src/anthropic.test.ts`.
  - **Provider label `Claude` → `Anthropic` (`4834ecc`).** It's a provider name, not a model.
    One-line change at [extension.ts:87](../src/extension.ts#L87) (`label`). `id` stays `'anthropic'`;
    the Claude.ai account/sign-in copy in the webview is unchanged (refers to the real account).
  - **v1.4.1 bump (this wrap-up):** `package.json` 1.4.0 → 1.4.1, `CHANGELOG.md` 1.4.1 entry
    (Fixed: vision; Changed: label). Committed with the `.context/` update.
  - **Checks:** `tsc` clean, full `npm run compile` clean, **237 tests green** (was 234, +3 image).
- **In flight:** nothing — clean stopping point.
- **Blocked:** nothing.

## Pick up here
Nothing forced — vision is resolved, v1.4.1 is out. Optional follow-ups, rough priority:
1. **Bridge image follow-up.** `handleAnthropicChat` in `src/bridgeServer.ts` still drops images —
   same shape as the native fix, now that `buildAnthropicMessagesBody` accepts `images`. Just thread
   them through the Bridge's message mapping. Low priority (Copilot CLI rarely sends images).
2. **Close PRD #34** (the Bridge parent) if still open.
3. **Copilot CLI catalog warning** (`injectCopilotEnv`): inject
   `COPILOT_PROVIDER_MAX_PROMPT_TOKENS` / `_MAX_OUTPUT_TOKENS` from real model caps to kill the
   `not in the built-in catalog` token-window warning. Cosmetic.

## Skills for next session
- /preset ship — push `main`, open a PR if you want review (commits are local).
- /preset pick-up — resume from this note.

## Open questions
- **Agent-mode vision is intermittent — root cause NOT pinned (OPEN).** Plain/Ask mode reads images
  reliably; agent mode sometimes answers "attachment empty" (same image/model/build, confirmed both a
  success AND a failure in agent mode). To resolve: re-add the probe (incoming `images=` count + last-turn
  part kinds + `OUT` body shape — both blocks were in `chatProvider.ts` `provideLanguageModelChatResponse`),
  F5, reproduce a FAILURE, read the pair at the "empty" turn. `images=0` → VS Code dropped it on that turn
  (host, not ours). `images≥1` + no `image(...)` in `OUT` → our builder dropped it (our bug → fix).
  `images≥1` + `OUT` shows `image(…b64)` → sent correct, model ignored it (model/host behavior).
- ~~Live vision round-trip not F5-proven.~~ RESOLVED — wire confirmed (image block leaves with real bytes,
  Claude reads it) for non-agent turns.

## Recent context
- **Vision is advertised per `VISION_FAMILIES`** ([catalog.ts:226](../src/catalog.ts#L226)) — Claude
  rows light up `imageInput:true`, so VS Code *attaches* the image and sends it. The drop was purely on
  Wisp's send side. The Codex path was already correct; Anthropic was the lone gap.
- **Anthropic image block shape:** `{type:'image', source:{type:'base64', media_type, data}}`, images
  before text (Anthropic's recommended vision ordering).

## Related
- [[overview]]
- [[happy-path]] — the Bridge golden-path MVD
- [[api]] — Bridge endpoints, `COPILOT_*` env, `wisp.bridge.secret` slot
- [[decisions]] — Bridge + side-panel forks
- [[gotchas]] — PowerShell curl trap, F5 dup trap, new-terminal env trap, GUI-app-no-Bridge trap
