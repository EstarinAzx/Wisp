---
type: pick-up
project: wisp
updated: 2026-06-19
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate.

**Last session (2026-06-19):** Built + shipped **slice #13 — Codex tracer** on branch **`feat/codex-tracer`**.
Codex is now a working Provider via ChatGPT OAuth: sign in (or import `~/.codex/auth.json`) → one **Inquire**
edit runs live against the Codex **Responses** backend. New pure cores in `catalog.ts` (TDD) + new impure
`codexAuth.ts` (OAuth/PKCE/loopback `:1455`/SecretStorage `wisp.codexAuth`/refresh) + `codexClient.ts`
(`/responses` fetch + SSE→text). **`npm test` 111/111, tsc+webview+vite clean, F5 live round-trip PASSED.**

**Next task: build slice #14 — Codex in the native chat picker (text streaming).** HITL, unblocked. Then
**#15** (tool-calling parity). Enter with **`/preset scope 14`**.

**What #14 must do:** make Codex appear in **and work through** VS Code's native Language Models / Ctrl+I
picker (it's deliberately absent in #13). Two coupled changes:
- **Advertise when signed in** — keyless rows are hidden by `buildChatModelInfos`; feed
  `keyed[codex] = await codexAuth.isSignedIn()` rather than `keyForProvider` returning ''.
- **Stream the Responses path** — branch `provideLanguageModelChatResponse` (`chatProvider.ts`) for
  `kind === 'codex'` to a **streaming** Codex call (the current OpenAI chat-completions path 404s against
  `/responses`). Likely a new streaming variant of `codexInquire` that yields `response.output_text.delta`
  text as it arrives. Use `codexAuth.current()` for refreshed creds.

**Landmines:**
- Reference for the streaming reducer: `XETH--7` `src/services/api/codexShim.ts` `codexStreamToAnthropic`
  (`D:\Mods\xethryon\new agent\XETH--7`).
- Bearer = OAuth **access_token** (subscription path), NOT the exchanged `sk-` apiKey. Headers:
  `chatgpt-account-id`, `originator: codex_cli_rs`, `OpenAI-Beta: responses=experimental`, `session_id`.
- Reasoning models **require** `reasoning: { effort, summary:'auto' }` on the body (`codexReasoning`);
  `gpt-5-codex` is a dead id — default is `gpt-5.3-codex`.
- Keep Codex **`toolCalling: false`** until #15 (honest capabilities) — but VS Code hides non-tool models
  from agent/edit pickers, so confirm Codex still shows in Ask mode at least, or accept agent-mode hiding.
- #13 shares `catalog.ts` + `chatProvider.ts` + the `Provider` type with committed #12 — build on it.

Full state in [[active-work]]; settled choices in [[decisions]]; domain language in `CONTEXT.md`.
