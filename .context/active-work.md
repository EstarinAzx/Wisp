---
type: active-work
project: wisp
updated: 2026-06-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-23 by Opus 4.8 (auto)._
_At commit: #28/#29/#30 on `feat/anthropic-oauth` (open PR #31) + slice-#31 thinking/effort work committed on
branch `feat/anthropic-thinking-effort` (off `feat/anthropic-oauth`). `CLAUDE.md` still uncommitted —
pre-existing, unrelated; decide separately._

## Current focus
**Anthropic OAuth Provider — slice "#31" (thinking/effort parity) is DONE, F5-verified, committed + shipped.**
Claude chat/Inquire now honor the shared `wisp.effort` knob: `output_config.effort` + `thinking:{type:'adaptive'}`
ride the body behind the `effort-2025-11-24` beta header, model-gated, with `xhigh→high` clamp on non-Opus-4.7/8.
The panel Effort select is ungated for Anthropic. **F5 PASSED** — effort knob live for Claude, no synthetic-429
(blocker probe resolved positive). `max` effort deferred → issue #32.

## State
- **Done this session (#31):** `anthropicThinkingEffort(model, effort)` pure core in `catalog.ts` (model-gate
  `/opus-4-[5-8]/`+`sonnet-4-6`, `xhigh→high` clamp via `/opus-4-[78]/`); `buildAnthropicMessagesBody` takes
  `effort?`, spreads the fragment. `anthropicClient.ts`: `effort-2025-11-24` added to `ANTHROPIC_BETA`,
  `AnthropicRequestArgs.effort?` threaded into the body. `extension.ts` (Inquire) + `chatProvider.ts` (chat/agent)
  pass `activeEffort()`; the shared dep `codexEffort`→`effort`; panel effort ungated for Anthropic
  (`isCodexProvider(p) || isAnthropicProvider(p)`). `app.tsx` Effort select data-gated (`state.effort !== undefined`).
  **9 new tests**, **`npm test` 196/196**; tsc (root+webview) + vite clean.
- **Review (cavecrew-reviewer, pre-commit):** caught 2 real issues → fixed (the `xhigh`-on-Sonnet 400 via the
  clamp; the `[5-9]` over-match tightened to `[5-8]`). 1 question (thinking/effort coupling) → kept, intentional.
- **In flight:** nothing mid-edit. #31 committed on `feat/anthropic-thinking-effort`, PR opened (stacked on #31).
- **Blocked:** none.

## Pick up here
1. **Slice #32 — Anthropic `max` effort** (GitHub issue #32). Widen the shared effort type past `xhigh`, add
   per-model panel option gating (`max` is Opus-4.6+-only), a `max→high` clamp (the #31 `xhigh` clamp is the
   template), and cross-provider normalization (Codex maps a stored `max`→`xhigh`, openclaude
   `standardEffortToOpenAI`). Reference: openclaude `src/utils/effort.ts`.
2. **Subscription 1M context ceiling** (separate small probe) — caps advertise model-spec 1M for Opus/Sonnet;
   if a long-context chat 4xx/413s, the subscription path caps lower → drop their `contextInput`. See [[decisions]].

## Open questions
- **Subscription context ceiling** — is 1M actually granted on the Claude.ai OAuth path, or does it cap (~200K)?
- _(Resolved #31:)_ the subscription OAuth Messages path accepts `output_config.effort`/`thinking` with no
  synthetic-429 — confirmed at F5.

## Skills for next session
- superpowers:test-driven-development — #32's effort-type widening + clamp wants a red-green loop on `anthropicThinkingEffort`.
- /preset scope — to enter #32 (restate, plan the cross-provider normalization, go/no-go).

## Recent context
- **#30 mirrored Codex #15 but Anthropic's wire format differs:** tools have NO strict-schema closure (Anthropic
  accepts a plain `input_schema`); parallel tool calls are **sibling `tool_use` blocks inside ONE assistant turn**
  (Codex emits flat `function_call` items); `tool_choice` is an **object** `{type:'auto'|'any'}` (Codex: a string
  `'auto'|'required'`); `tool_use` block `input` is a **parsed object** (Codex round-trips the raw JSON string).
- **The #28 fingerprint survived #30 untouched** — `firstUserMessage` still sourced from the first non-system
  turn's `.content` text; `tools` ride as a separate top-level body key, never the system attribution block.
- **Images still deferred** for Anthropic chat (dropped in `toAnthropicMessages`) — a separate follow-up, not #30.

## Related
- [[overview]]
- [[oauth-recon]] — the design source of truth for this feature
- [[decisions]] — 2026-06-23 #30 entry (Anthropic tool wire contract)
- [[gotchas]] — synthetic-429 / fingerprint contract; F5 dup-extension trap
