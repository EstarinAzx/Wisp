---
type: active-work
project: wisp
updated: 2026-06-18
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-18 23:40 by Opus 4.8._
_At commit: uncommitted (branch `docs/codex-zen-go-scope`)._

## Current focus
Building the **Codex Provider + OpenCode Zen/Go split** batch (PRD **#11**, slices **#12–#15**). **#12 is DONE** (the Zen/Go split); the Codex Provider (#13–#15) is the remaining work.

## State
- **Done this session — slice #12 (Zen/Go split + key migration):** renamed the misnamed `opencode-zen` row → **`opencode-go`** ("OpenCode Go", kept default, id now matches `catalogKey`), added a new **`opencode-zen`** row for `/zen/v1` (`catalogKey: 'opencode'`, `defaultModel: claude-haiku-4-5`). New pure `planZenToGoMigration` + `resolveKeyId` in `catalog.ts` (TDD). `migrateLegacyKey` re-pointed to the go slot; new `migrateZenToGo` runs first on activate. `package.json` enum/default synced. `npm test` **73/73**, `npm run compile` clean, **F5 eyeball PASSED**.
- **In flight:** nothing — #12 is finished, about to commit.
- **Planned next (GitHub issues, dependency order):**
  - **#13 (HITL)** — Codex tracer: ChatGPT OAuth sign-in + one Inquire edit. *Unblocked — grab next.*
  - **#14 (HITL)** — Codex in native chat (text streaming). Blocked by #13.
  - **#15 (HITL)** — Codex tool-calling parity (agent mode). Blocked by #14.
- **Blocked:** nothing.

## Pick up here
Grab **#13** — `/preset scope 13`. Codex = a discriminated **`kind: 'openai-chat' | 'codex'`** Provider row. Pure logic (Responses-event reducer, request builder, JWT parse + refresh decision, `~/.codex/auth.json` parser, codex-usable branch) → `catalog.ts` (TDD, `npm test`). Impure (OAuth/IO, loopback `:1455`, browser, token store, live Responses fetch) → new `codexAuth.ts` + `codexClient.ts`. Tokens in SecretStorage `wisp.codexAuth`; import `~/.codex/auth.json` if present; refresh at `exp − 60s`. OAuth = the **published Codex-CLI app** (`client_id app_EMoamEEZ73f0Ck…`, redirect `localhost:1455/auth/callback`, PKCE S256, originator `codex_cli_rs`). Reference impl: `D:\Mods\xethryon\new agent\XETH--7`. **#13 must do a live round-trip** to validate the originator/headers + stream shape before #14/#15 build on it. #13 shares `catalog.ts` + the `Provider` type with #12's now-committed work — no conflict, just build on it.

## Skills for next session
- `superpowers:test-driven-development` — TDD the pure Codex cores into `catalog.ts`.
- `/preset scope 13` — entry gate before coding #13.

## Open questions
- Codex Responses backend accepts our originator/headers + stream shape — validate with the **live round-trip in #13** before #14/#15.

## Recent context
- **#12 verified findings:** `GET /zen/v1/models` is **public** (no key needed) and serves **bare** ids (`claude-opus-4-8`, `gpt-5.5`, `gemini-3.5-flash`); `/zen/v1` is the **premium** catalog (Claude/GPT/Gemini), distinct from Go's budget `/zen/go/v1`. Default `claude-haiku-4-5` is best-effort (cheapest verified-present model).
- **#12 non-obvious fix (from F5):** the new keyless Zen row was hidden from the chat picker (`buildChatModelInfos` hides keyless Providers). Fixed by `keyId` — OpenCode Go + Zen are one account/one key, so Zen borrows Go's slot via `keyId: 'opencode-go'`. See [[gotchas]].
- The Codex case **supersedes the 2026-06-15 "no OAuth subsystem" decision**; Copilot/Cursor stay dropped. See [[decisions]].

## Related
- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[api]]
