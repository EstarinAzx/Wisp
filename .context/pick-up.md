---
type: pick-up
project: wisp
updated: 2026-06-18
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate.

**Last session (2026-06-18):** Built + shipped **slice #12 — OpenCode Zen/Go split + key migration** on
branch **`docs/codex-zen-go-scope`**. Renamed `opencode-zen` → **`opencode-go`** (default, id==catalogKey),
added a real **`opencode-zen`** row at `/zen/v1` (premium Claude/GPT/Gemini, bare ids, default
`claude-haiku-4-5`). New pure cores `planZenToGoMigration` + `resolveKeyId` in `catalog.ts` (TDD).
`migrateZenToGo` runs before the re-pointed `migrateLegacyKey` on activate. **`npm test` 73/73, compile
clean, F5 PASSED.** Discovered+fixed: the new keyless Zen row was hidden from the chat picker → added
**`keyId`** so Zen borrows Go's key (one OpenCode account, one key, two endpoints).

**Next task: build slice #13 — Codex tracer (ChatGPT OAuth sign-in + one Inquire edit).** HITL, unblocked.
Then **#14** (Codex native chat, text streaming) → **#15** (tool-calling parity). Enter with
**`/preset scope 13`**.

**Landmines:**
- Codex = a discriminated **`kind: 'openai-chat' | 'codex'`** Provider row. Pure logic (Responses-event
  reducer, request builder, JWT parse + refresh decision, `~/.codex/auth.json` parser, codex-usable
  branch) → `catalog.ts` (TDD). Impure (OAuth/IO, loopback `:1455`, browser, token store, live Responses
  fetch) → new `codexAuth.ts` + `codexClient.ts`.
- Tokens in SecretStorage **`wisp.codexAuth`**; import `~/.codex/auth.json` if present; refresh at
  `exp − 60s`.
- OAuth = the **published Codex-CLI app** (client_id `app_EMoamEEZ73f0Ck…`, redirect
  `localhost:1455/auth/callback`, PKCE S256, originator `codex_cli_rs`). Reference impl mapped at
  `D:\Mods\xethryon\new agent\XETH--7`.
- **Validate early:** #13 must do a **live round-trip** (Codex backend accepts our originator/headers +
  stream shape) before #14/#15 build on it.
- **Honest capabilities:** flip Codex `toolCalling: true` ONLY once the Responses tool-mapper exists (#15).
- #13 shares `catalog.ts` + the `Provider` type with #12's committed work — build on it, no conflict.
- **`keyId` precedent (from #12):** a Provider sharing an existing account's key sets `keyId`; a keyless
  row is hidden from the chat picker. Relevant if Codex reuses any shared credential. See [[gotchas]].

Full state in [[active-work]]; settled choices in [[decisions]]; domain language in `CONTEXT.md`.
