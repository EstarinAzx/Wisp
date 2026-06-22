---
type: research
project: wisp
updated: 2026-06-22
tags: [context, research, oauth, anthropic, xai, providers]
---

# OAuth recon — Anthropic + xAI providers (from openclaude)

Investigation feeding the **add Anthropic-OAuth + xAI-OAuth providers** idea. Source: `D:/.claude/claude projects/openclaude` (a Claude Code fork), cross-mapped onto Wisp's existing Codex/ChatGPT OAuth provider (`kind:'codex'`). 5 parallel readers + synthesis, all claims source-verified.

---

## 1. Anthropic OAuth in openclaude

### Flow (6 steps)
1. **PKCE + listener up front.** `OAuthService` mints `code_verifier = base64url(randomBytes(32))`, starts a loopback `AuthCodeListener` on an OS-assigned port (`listen(0,'localhost')`), derives `code_challenge = base64url(SHA-256(verifier))` (S256), `state = base64url(randomBytes(32))` — `index.ts:28-30`, `auth-code-listener.ts:38-53`, `crypto.ts:11-23`.
2. **Build BOTH authorize URLs.** A *manual* URL (`redirect_uri = MANUAL_REDIRECT_URL`) and an *automatic* URL (`redirect_uri = http://localhost:{port}/callback`). Base = `CLAUDE_AI_AUTHORIZE_URL` for subscribers else `CONSOLE_AUTHORIZE_URL`; both carry `code=true`, `client_id`, `response_type=code`, `scope`, `code_challenge`, `code_challenge_method=S256`, `state` — `index.ts:59-70`, `client.ts:46-105`.
3. **Open browser, capture code.** Provider 302s to `http://localhost:{port}/callback?code=…&state=…`; listener rejects path ≠ `/callback`, enforces **state CSRF check** (mismatch → HTTP 400), resolves the code — `index.ts:74-85`, `auth-code-listener.ts:194-235`.
4. **Exchange code.** POST JSON `{grant_type:'authorization_code', code, redirect_uri, client_id, code_verifier, state}` to `TOKEN_URL`, 15s timeout. `redirect_uri` must match authorize byte-for-byte (manual vs localhost chosen *after* code arrives via `listener.hasPendingResponse()`) — `client.ts:107-144`.
5. **Persist + profile.** Store `{accessToken, refreshToken, expiresAt = now+expires_in*1000, scopes, subscriptionType, rateLimitTier}` under `secureStorage.claudeAiOauth` (`~/.claude/.credentials.json`). Inference-only / non-claude.ai tokens *refused* — `auth.ts:1215-1274`, `client.ts:276-309`.
6. **Refresh + inference.** Refresh POSTs `{grant_type:'refresh_token', refresh_token, client_id, scope}` (subscribers *omit* scopes so backend expands). `isOAuthTokenExpired` uses **5-min** skew. Expiry from `expires_in` only — **no JWT decode**. Inference → **Messages API** with Bearer — `client.ts:146-274`, `api/client.ts:643-664`.

### Reference table
| Item | Value |
|---|---|
| client_id (prod) | `9d1c250a-e61b-44d9-88ed-5944d1962f5e` (env override `CLAUDE_CODE_OAUTH_CLIENT_ID`) |
| Authorize (subscriber) | `https://claude.com/cai/oauth/authorize` (307s to claude.ai) |
| Authorize (console) | `https://platform.claude.com/oauth/authorize` |
| Token | `https://platform.claude.com/v1/oauth/token` |
| Manual redirect | `https://platform.claude.com/oauth/code/callback` |
| Profile / Roles | `https://api.anthropic.com/api/oauth/profile` · `.../api/oauth/claude_cli/roles` (Bearer) |
| Scopes | `user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload org:create_api_key` |
| **Beta header** | `anthropic-beta: oauth-2025-04-20` (`oauth.ts:36`) |
| **Inference wire** | **Anthropic Messages API** `POST https://api.anthropic.com/v1/messages`, `Authorization: Bearer`, `apiKey:null`, + beta header — `api/client.ts:643-664`, `betas.ts:251-253` |
| Inference gate | `shouldUseClaudeAIAuth` requires `user:inference` scope — `client.ts:38-40` |

Separate Console path (`create_api_key`, `org:create_api_key`) mints a durable `x-api-key` — **not** the subscriber Bearer path; don't conflate (`client.ts:311-342`).

---

## 2. xAI OAuth in openclaude

### Flow (6 steps)
1. **Discovery.** GET `https://auth.x.ai/.well-known/openid-configuration`; every discovered endpoint pinned to `https` + host `x.ai`/`*.x.ai` (blocks hijack) — `xaiOAuthShared.ts:77-97, 150-204`.
2. **PKCE + state + nonce.** S256 + 16-byte hex `nonce` (OIDC) — `xaiOAuth.ts:296-299`.
3. **Loopback fixed port.** `127.0.0.1:56121/callback`. Authorize adds `response_type=code, client_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method=S256, plan=generic, referrer=openclaude` — `xaiOAuth.ts:300-333`.
4. **Capture + exchange.** State-checked; POST form-encoded `grant_type=authorization_code` with `code, redirect_uri, client_id, code_verifier` **plus** `code_challenge`+`method=S256` (xAI re-validates PKCE at exchange) — `xaiOAuth.ts:209-244, 353-388`.
5. **Persist.** Requires `refresh_token` on first grant. Identity (email/name/sub) **decoded from id_token/access_token JWT — no userinfo call.** Secure-storage key `'xai'`, `allowPlainTextFallback:false` — `xaiCredentials.ts:125-198`.
6. **Refresh + inference.** Refresh `{client_id, refresh_token}`; **60s** skew, **60s** failure cooldown, in-flight dedup; expiry from `expires_in` else JWT `exp` — `xaiCredentials.ts:200-257`. Inference: Bearer → `https://api.x.ai/v1`, **OpenAI chat-completions shape, identical path to `XAI_API_KEY`, no proxy/beta headers** — `openaiShim.ts:2840-2930`, `vendors/xai.ts:3-17`.

Device-code flow also exists for headless (`xaiOAuth.ts:448-605`) — not needed for VS Code.

### Reference table
| Item | Value |
|---|---|
| client_id | `b1a00492-073a-47ea-816f-4c329264a828` (env override `XAI_OAUTH_CLIENT_ID`) |
| Issuer / Discovery | `https://auth.x.ai` · `/.well-known/openid-configuration` |
| Loopback | `http://127.0.0.1:56121/callback` (env `XAI_OAUTH_CALLBACK_PORT`/`_HOST`) |
| Profile | **none** — identity from JWT |
| Scopes | `openid profile email offline_access grok-cli:access api:access` |
| Beta header | none |
| **Inference wire** | **OpenAI-compatible** `https://api.x.ai/v1`, `Authorization: Bearer` — same path as API key |

**Resolved:** real public OAuth2+OIDC server run by xAI (issuer `auth.x.ai`), **not** an internal IdP — `xaiOAuthShared.ts:15-16`. Shared public client for third-party CLI use; consent may read "Grok Build". Works outside openclaude. `referrer=openclaude`/`plan=generic` are cosmetic → rename `referrer` to `wisp`.

---

## 3. Wisp's existing Codex-OAuth pattern (the template)

- **Catalog (`catalog.ts`)** — `kind?: 'openai-chat' | 'codex'` discriminator (`:32`; absent == openai-chat, so 10 API-key rows untouched). Dispatch = `isCodexProvider` (`:443`); usability `isCodexSignedIn` = bearer present (`:448-449`). `CodexCreds {accessToken, refreshToken, idToken, accountId, apiKey}` (`:433-439`). JWT helpers `decodeJwtPayload`/`jwtExpiryMs`/`shouldRefreshCodexToken` (60s skew, `:695-733`) reusable for any JWT token.
- **Auth (`codexAuth.ts`)** — constants `:38-49` (issuer/token/client_id/port **1455**/path `/auth/callback`/scope, slot `CODEX_SECRET_SLOT='wisp.codexAuth'` *outside* `wisp.apiKey.<id>` namespace). Generic PKCE+CSRF helpers `:54-58`. Loopback `startCallbackServer` (1455, EADDRINUSE→port 0, path+code+state validation), `runCodexOAuth` (PKCE→server→openExternal→`Promise.race` 5-min→exchange→`finally close()`). Class `read/store/refreshIfNeeded/signIn/signOut/current/isSignedIn` with `(secrets, openExternal, log)` injection. **Sign-out writes `{}` tombstone, never deletes.**
- **Client (`codexClient.ts`)** — `:38-66`: bearer = `accessToken||apiKey`, requires `accountId`, `POST ${baseUrl}/responses`, headers Bearer + `chatgpt-account-id` + `OpenAI-Beta: responses=experimental` + `originator` + `session_id`, body from `buildCodexResponsesBody`. `sseBlocks` generator (splits `\n\n`) is provider-agnostic; body builder + event names are Responses-specific.

### Integration touch-points (every new kind branches here)
| Surface | Location |
|---|---|
| Catalog row | `extension.ts:70` |
| Kind union + predicate | `catalog.ts:32, :443, :448` |
| Auth singleton | `extension.ts:633` (new), `:109` (decl) |
| getState / panel state | `extension.ts:289-305` |
| Inquire dispatch | `extension.ts:526-559` |
| Chat dispatch + picker + caps | `chatProvider.ts:100, 112-114, 138-158` |
| ChatProviderDeps getters | `chatProvider.ts:40-52` |
| Commands | `extension.ts:467-483, :673-674`; `package.json:62-69, :95-108` |
| Panel host/routing/state | `sidePanelProvider.ts:44-56, 139-149, 26-39`; `extension.ts:652-664` |
| Webview UI | `webview/app.tsx:30, 187-238, 251-261, 277-295` |
| Secret-change listener | `extension.ts:710` |

---

## 4. Porting map

### xAI (easy)
- **REUSE wholesale:** all `codexAuth.ts` scaffolding (PKCE/state, `startCallbackServer`, `runCodexOAuth`, class, slot convention); JWT helpers (fit *better* — xAI uses JWT `exp`); **the entire OpenAI-compatible chat client** (xAI is OpenAI wire-format).
- **NEW:** `src/xaiAuth.ts` (clone codexAuth: slot `wisp.xaiAuth`, discovery + `x.ai`-only pin, nonce, loopback 56121, refresh `{client_id, refresh_token}`, JWT identity). `kind:'xai-oauth'`. **No new client file.**
- **EDIT:** union/predicate, catalog row, dispatch sites, commands, panel/webview, `package.json`.
- **Subtlety:** the OpenAI chat path takes `apiKey`; xAI-OAuth has none → a *small shim* sourcing `Authorization` from `xaiAuth.current().accessToken` for this kind (openclaude does this at `openaiShim.ts:2840-2857`).

### Anthropic (hard)
- **REUSE:** same `codexAuth.ts` OAuth scaffolding. Codex Responses client *not* reusable but its skeleton (`token→headers→fetch→SSE-block`) + `sseBlocks` + `NormalizedTurn`/`normalizeTurn` transfer.
- **NEW:** `src/anthropicAuth.ts` (slot `wisp.anthropicAuth`, subscriber authorize, `expires_in` expiry + 5-min skew, scope-omitting refresh). **`src/anthropicClient.ts` — bespoke Messages-API client** (`/v1/messages`, Bearer + `anthropic-version` + `anthropic-beta: oauth-2025-04-20`, Anthropic SSE reducer, tool-call mapping). `kind:'anthropic-oauth'`.
- **EDIT:** same set, plus a *third* dispatch branch routing Anthropic → `anthropicClient`.

---

## 5. Risks & open questions

**(a) Anthropic inference ≠ OpenAI-compatible.** openclaude drives it via the **Messages API** with the `oauth-2025-04-20` beta header — needs a **bespoke Messages adapter** (the direct analogue of Codex's Responses adapter). Known-feasible (Codex proved the non-OpenAI shape) but real net-new work. **Budget Anthropic as "a second non-OpenAI wire format," not "another OAuth row."** Rec: build the Messages client; the `create_api_key` path adds Console scope + durable-key concerns without removing the wire-format problem.

**(b) Anthropic client_id reuse / subscription ToS — load-bearing, human go/no-go.** openclaude ships Claude Code's prod `client_id`. Reusing it in a third-party extension to drive a user's Claude subscription against the Messages API is exactly the "subscription-as-a-model" moat — and exactly what Anthropic's terms most likely treat as out-of-policy. Risks: client_id revocation/scope-gating, moving `oauth-2025-04-20` beta, per-user bans. **Needs explicit human decision before any Anthropic code.** Gate Anthropic behind it; ship xAI first regardless.

**(c) xAI OAuth public? — Yes, resolved.** Real public OAuth2+OIDC, shared client for third-party CLI use. Safe to lead with.

**(d) xAI client_id reuse.** Shared public client → lower stakes; "Grok Build" consent is cosmetic. Decision: ship under shared CLI `client_id` (matches reference, zero friction) vs register Wisp's own (removes consent wart + shared rate-limit coupling). Rec: shared first, follow-up to register if xAI offers self-serve.

**Cross-cutting — dispatch doesn't scale.** `isCodexProvider` is a boolean singleton at ~6 sites. Adding two kinds via copy-paste if-chains triples every branch. **Decide up front: kind-keyed registry (predicate + auth + client per kind) before adding kinds, or accept triplication.** Rec: small registry refactor first — cheap now, ugly later.

**(e) "openclaude just gets recognised as Claude Code" — what actually carries that, and the one thing Wisp can't reproduce.**
- **No system-prompt spoof is required.** openclaude ships `PRODUCT_DISPLAY_NAME='OpenClaude'` (`constants/product.ts:1`) and sends `"You are OpenClaude, an open-source coding agent and CLI."` as the first sysprompt block (`constants/system.ts:11-12`, test asserts it does NOT contain "Claude Code" — `promptIdentity.test.ts:81-83`), yet subscriber OAuth inference still serves. So Anthropic does **not** currently gate OAuth on the literal Claude-Code identity prompt. Wisp does **not** need to lie about identity. Recognition = the user's OAuth **token** + `client_id 9d1c250a-…` + UA `claude-code/<ver>` (`utils/userAgent.ts:8-10`) + `anthropic-beta: oauth-2025-04-20` + the `x-anthropic-billing-header` attribution (`constants/system.ts:77-99`). **All replicable from a Node/VS Code extension.** Works today, same as openclaude.
- **The asymmetry — native client attestation (dormant kill-switch).** openclaude is not "a third-party tool that logs in"; it is **Claude Code's own source recompiled on Bun**, so it inherits the native attestation primitive: a `cch=00000` sentinel injected into the billing header that **Bun's `bun-anthropic/src/http/Attestation.zig` overwrites with a computed token the server verifies "to confirm the request came from a real Claude Code client"** (`constants/system.ts:68-99`, used first-in-body at `services/api/claude.ts:1417, 1751-1758`). It is behind `feature('NATIVE_CLIENT_ATTESTATION')` and currently appears **unenforced** server-side (that's why openclaude's rebrand works at all). Wisp runs on **Node in the VS Code extension host — no Bun, no Zig, no `Attestation.zig`** — so Wisp **cannot** compute that token. Today irrelevant; the day Anthropic enforces it, Bun-based forks (openclaude) keep working and a Node extension (Wisp) gets rejected. **This is a known ceiling, not a blocker:** if it ever activates, the Anthropic-OAuth slice dies; xAI is wholly unaffected (separate issuer, no attestation).

**Smaller:** (i) loopback ports — Codex 1455, xAI 56121, both OS-fallback; confirm no clash on dual sign-in. (ii) `onDidChange` (`extension.ts:710`) watches `wisp.apiKey*`; new slots are outside that namespace → need own refresh trigger. (iii) Anthropic manual-paste fallback — Codex didn't need it; loopback-only is simpler and fine for desktop VS Code.

---

## 6. Suggested slices (dependency-ordered)

1. **Dispatch registry refactor** — generalize `isCodexProvider`/`isCodexSignedIn` into kind-keyed lookup across ~6 sites + `ChatProviderDeps`. *Verify:* Codex unchanged. **Prereq; ship alone.**
2. **Shared OAuth scaffolding extraction** — lift PKCE/state/`startCallbackServer`/`runCodexOAuth`/JWT helpers out of `codexAuth.ts` into a reusable module. *Verify:* Codex auth tests pass.
3. **xAI-OAuth provider (ship first)** — `kind:'xai-oauth'`, `src/xaiAuth.ts`, bearer-for-apiKey shim into existing OpenAI path, catalog row, commands, panel, webview, `package.json`. *Verify:* loopback sign-in → Grok in picker → chat streams → refresh → sign-out tombstone. **Lowest risk, no new client, proves the pattern.**
4. **Anthropic OAuth auth-only** — `kind:'anthropic-oauth'`, `src/anthropicAuth.ts`. *Verify:* sign in, store, refresh — no inference. **Gated behind (b).**
5. **Anthropic Messages-API client** — `src/anthropicClient.ts` + wire into dispatch. *Verify:* Claude model streams real Messages response + tool calls. **The genuinely new engineering; depends on 4.**
6. **Polish** — `onDidChange` for new slots, manual-paste decision, `referrer` rename, docs.

**Two decisions need a human call before code:** (b) Anthropic client_id-reuse / subscription-ToS go/no-go, and the registry-vs-triplication choice in slice 1.
