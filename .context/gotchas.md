---
type: gotchas
project: wisp
updated: 2026-06-21
tags: [context, gotchas]
---

# Gotchas

### No fill-in-middle (FIM) on the Zen endpoint
The provider exposes **only** OpenAI-compatible chat completions — there is no FIM/`suffix` route. Inquire prompts a *chat* model to rewrite a span (whole-file context → return only the replacement code). Don't go looking for a FIM endpoint to "do it properly"; it doesn't exist. This is also why latency is ~0.5–1.5s, not sub-100ms.

### Webview CSP × Tailwind v4
With a Vite **production** build, Tailwind compiles to a static linked stylesheet — no runtime `<style>` injection — so a strict CSP (`script-src 'nonce-…'; style-src ${cspSource}`) is enough. Only add `'unsafe-inline'` to `style-src` if the webview devtools console actually reports a violation. Don't pre-emptively loosen it.

### Two TypeScript configs must stay separate
The extension `tsconfig.json` keeps `include: ["src"]`. The webview's JSX lives under `webview/` with its **own** tsconfig (`jsx: react-jsx`, `jsxImportSource: preact`). If the extension `tsc` ever picks up the webview files it will fail on browser JSX/DOM types. `compile` runs both (`tsc -p ./ && tsc -p webview && vite build`) — Vite's esbuild transform does **not** type-check, so without the `tsc -p webview` step webview type errors ship silently.

### Vite asset names must be deterministic
The extension references the webview bundle by fixed path (`main.js` / `main.css`). The Vite config must disable hashing (`entryFileNames`/`assetFileNames` pinned, `cssCodeSplit:false`, `inlineDynamicImports:true`). Default hashed names will 404 in the webview.

### Config writes must target the defining scope, not always Global
`setModel`/`setProvider`/`setBaseUrl` use `cfg().inspect()` (via `targetFor()`) to write the scope that already defines the value. A blind `ConfigurationTarget.Global` write under a workspace override is silently ineffective and the controlled panel select snaps back. See `targetFor()` in `src/extension.ts`.

### Server error bodies can leak the key — sanitize before posting to the webview
`fetchModelIds` failures must not forward raw `String(err)` to the panel: OpenAI-style 401 bodies echo key fragments (`Incorrect API key provided: sk-…`). `sanitizeError` in `src/sidePanelProvider.ts` maps to a status-code string. The write-only-key rule covers error text too.

### Key is write-only across the webview boundary
Never post the API key value back to the webview — only a `keyIsSet` boolean. Invalidate the cached OpenAI client whenever the key is set or cleared.

### Model ids are BARE on `zen/go/v1` — the `opencode/` prefix is rejected
The chat endpoint returns `401 Model opencode/minimax-m3 is not supported` for a provider-prefixed id. Use the **bare** id exactly as `GET /models` serves it (`minimax-m3`, `glm-5`, `kimi-k2.6`, …). `DEFAULT_MODEL`, the setting default, and `fetchModelIds` must all stay bare. The `opencode/<id>` form (from the reference `llm-provider` and the public docs) does **not** work against this gateway — it had inline completions silently erroring the whole time. The sibling **`/zen/v1`** (OpenCode Zen, added in #12) also serves **bare** ids (verified 2026-06-18 against its public `GET /zen/v1/models`) — but a **different, premium** model set (Claude/GPT/Gemini), not Go's budget ids. See [[decisions]].

### A shared-credential Provider must set `keyId` or it's hidden from the chat picker
`buildChatModelInfos` only advertises **keyed** Providers (a keyless row would be a dead pick). So a new
row that shares another row's credential is **invisible** until it has its own key — even though the
credential already exists. **OpenCode Go + OpenCode Zen are one OpenCode account / one key, two endpoints**
(`/zen/go/v1` vs `/zen/v1`); the Zen row sets **`keyId: 'opencode-go'`** so it borrows Go's stored key via
`resolveKeyId`/`keySlotFor`. This also dictated the #12 migration: the zen→go move **deletes** the old
`opencode-zen` slot, because a Go key left in it would be inherited by the new `/zen/v1` row → 401. When
adding any Provider that shares an existing account's key, set `keyId` — don't make the user enter it twice.
See [[decisions]] 2026-06-18 Zen/Go-split-built entry.

### Served models are reasoning models — strip `<think>` and DON'T cap tokens
Most `zen/go` ids (minimax-m3, mimo, qwen3*, glm5*) emit chain-of-thought **inline** as `<think>…</think>`, then the real answer. Two consequences: (1) `stripThink` (in `src/catalog.ts`, composed into `extractEditText`) must drop the block (and treat an unterminated `<think>` as "no answer yet" → return nothing) or the Inquire edit is the model's thinking; (2) a low `max_tokens` cap starves the answer — the model spends the budget thinking and never reaches code. `maxTokens` default is therefore `0` (uncapped); `max_tokens` is omitted from the request unless set `>0`. For snappy edits use a non-reasoning id (`deepseek-v4-flash`, `kimi-k2.6`). See [[decisions]].

### Output-channel logs persist on disk — read them to debug a user's error
`OutputChannel` content is written to `%APPDATA%\Code\logs\<session>\window<n>\exthost\output_logging_<ts>\<n>-Wisp.log`. When the user can't surface the Output panel, glob the newest matching file and grep `[error]` instead of walking them through the UI. This is how the `401 … not supported` cause was found.

### Packaging ships node_modules — bundling is optional (size only)
**Empirically verified:** `vsce package` includes production `dependencies`, so `node_modules/openai` is inside the `.vsix` and the extension runs installed without esbuild/webpack. (The earlier claim that it "won't ship without bundling" was wrong.) Bundling remains worth doing later to shrink the package — the unbundled `.vsix` is ~1402 files / 2.33 MB and vsce warns about it — but it is not a correctness blocker.

### Ollama Cloud base URL is `/v1`, NOT `/api/v1`
Ollama Cloud (`ollama.com`, the **hosted** service — distinct from local `localhost:11434`) is
OpenAI-compatible at `https://ollama.com/v1`. The `/api` prefix (`/api/chat`, `/api/tags`) is Ollama's
**native** protocol and breaks the OpenAI SDK. Use `/v1` for the catalog row; key env var
`OLLAMA_API_KEY` (Bearer). Local Ollama needs no key. Verified 2026-06-15 (multi-provider research).

### The Provider selector is a key-redirect vector — keep `wisp.provider` machine-scoped
`wisp.provider` selects which base URL the bearer API key is sent to, so it carries the exact threat
`wisp.baseUrl` does: a workspace-overridable selector lets a hostile repo redirect the key to an
attacker endpoint. `wisp.provider` MUST stay `"scope": "machine"`, and built-in base URLs MUST live in
code (the `PROVIDERS` catalog), never in settings. Custom's `wisp.baseUrl` is the only user-supplied
URL, also machine-scoped. Don't relax either without re-reading the 2026-06-15 multi-provider ADR.

### Cline ToS, and why Copilot/Cursor were dropped
Cline's ToS §2.2 bars use "to develop competing products… or otherwise to our detriment." Ship the Cline
Provider **user-supplied-key only** (never an embedded/shared/proxied key) + a one-line in-panel note
that the user owns their ToS compliance. **GitHub Copilot** and **Cursor** were dropped entirely —
Copilot's only path is reverse-engineered client impersonation (account-ban risk); Cursor's API is
shape-incompatible (no `/chat/completions`) and "auth-only" use means session-token piggybacking (ToS
violation). Don't re-add them as "OAuth providers" — OAuth doesn't fix *why* they fail. See the
2026-06-15 ADR.

### Unit-testable logic must live vscode-free in `catalog.ts`, not in `extension.ts`
`extension.ts` imports `vscode` (and `openai`) at the top, so a plain Vitest/Node test can't import it —
there's no Extension Development Host outside VS Code, so the import throws. Pure, unit-testable logic
therefore lives in `src/catalog.ts`, which **imports nothing**: `resolveModel`, `resolveBaseUrl`,
`planLegacyMigration` (the migration's decision as a pure plan; `extension.ts` applies it), and the
Inquire helpers `buildEditPrompt` / `extractEditText` (`stripThink` + `stripFences`). The
`extension.ts` wrappers read VS Code state and delegate. Don't fold this logic back inline "to keep it
together" — it becomes untestable. Tests are kept out of the extension build via `tsconfig` `exclude:
["src/**/*.test.ts"]`. Run `npm test`. See [[decisions]].

### Don't make the Inquire edit span the whole file — the model mangles untouched code
Inquire sends the whole file as **context** but the edit replaces only the **target span** (selection /
current-line). A mid-session experiment widened the no-selection span to the whole file so the model
could "edit anywhere" — but a whole-file **re-emit** makes the model drop/reformat unrelated lines; the
B2 diff faithfully renders the damage and **Accept would apply it → data loss**. `diffLines` is correct
(it showed a minimal diff of a mangled reply). Caret-agnostic "edit anywhere" is delivered safely by the
**SEARCH/REPLACE edit-blocks** slice (#8), which emits only changed regions. Don't reintroduce whole-file
re-emit as the edit path. See [[decisions]] 2026-06-17 edit-fidelity entry.

### Edit blocks are flaky with reasoning models — the failure is SAFE, and retry usually works
Inquire's SEARCH/REPLACE matching is **exact** (EOL-agnostic only, no whitespace-fuzz). Reasoning models
don't reliably copy code verbatim, so a given run can: return a SEARCH that isn't byte-present → all
blocks miss → **"could not locate the text to edit"**; or return no blocks at all → **"nothing to
change"**. Re-running the same instruction usually yields a matching block (it's model variance, not a
parser bug — confirmed in F5: one run missed, the reload+retry passed). This is **by design** — a miss
is surfaced and skipped, never force-matched, so the file is never corrupted (no data loss). Don't "fix"
the flakiness by loosening to fuzzy/trimmed matching reflexively — that trades a safe miss for a
wrong-region false match. The fuzzy-matching fork is deferred; take it only if misses prove frequent in
real use. The throwaway `[debug]` reply/`trimmedMatch` instrumentation in `inquire` (used to tell
indent-drift from paraphrase) was removed after diagnosis — re-add it the same way if revisiting. See
[[decisions]] 2026-06-17 edit-blocks-built entry.

### Codex: bearer is the access_token, NOT the exchanged API key
For the subscription path (`https://chatgpt.com/backend-api/codex/responses`), the bearer is the OAuth
**`access_token`** + the `chatgpt-account-id` header. The id_token→`sk-` exchange (`exchangeCodexIdTokenForApiKey`
in the reference) produces an **API-platform** key billed against `api.openai.com` — a *different* endpoint. Wisp
keeps `apiKey` only as a fallback; `codexClient` sends `creds.accessToken || creds.apiKey`. Don't switch the
default bearer to the exchanged key — it routes off the subscription. `chatgpt-account-id` is **hard-required**:
absent → error early (`codexClient` throws) rather than send a header-less request that 401/403s opaquely.

### Codex reasoning models REQUIRE a `reasoning` object — and `gpt-5-codex` is a dead id
The Codex `/responses` backend **400s** a gpt-5/o-series request that omits `reasoning: { effort, summary:'auto' }`,
and **400s** a gpt-4.x/spark request that *includes* it — so it's per-model (`codexReasoning` in `catalog.ts`:
`medium` for gpt-5/o, undefined for gpt-4.x/`*-spark`). Separately, **`gpt-5-codex` is not a valid model id**
(400); the live lineup is `gpt-5.5`/`gpt-5.4`/`gpt-5.3-codex`/`gpt-5.3-codex-spark`/`gpt-5.2-codex`/
`gpt-5.1-codex-max`/`gpt-5.1-codex-mini`/`gpt-5.4-mini`/`o3`/`o4-mini` (the codex row default is `gpt-5.3-codex`).
There is **no `/models` route** on the Codex backend, so the dropdown uses the hardcoded `CODEX_MODELS` list,
not a live fetch. Both confirmed by the #13 F5 round-trip. See [[decisions]] 2026-06-19.

### Codex sign-out must write a tombstone, not delete the slot
`CodexAuth.signOut` stores an empty `{}` to `wisp.codexAuth` instead of `secrets.delete`. If it deleted, the
next `current()`/`isSignedIn()` would **re-import `~/.codex/auth.json`** (a Codex-CLI login) and instantly
re-sign-in — sign-out would never stick for a CLI user. A present-but-bearer-less blob reads as signed-out
*and* suppresses the import. Only an **unwritten** slot (undefined) triggers the one-time auth.json import; a
tombstone does not. Don't "simplify" sign-out back to a delete.

### The chat/Ctrl+I picker hard-filters on `toolCalling` — a text-only model is INVISIBLE
VS Code shows ONLY tool-capable models in the chat / Ctrl+I / agent picker. A model advertising
`toolCalling: false` is absent **everywhere** the picker appears — Ask mode included; it shows up **only** in
the Manage Models list (which lists every registered model, regardless of capability). Docs: "if the model
doesn't support tool calling, it won't be shown in the model picker" (confirmed by #14 F5). Consequence:
**Codex advertises `toolCalling: true` so it is selectable**, and as of #15 the flag is **honest** (tools are
forwarded + round-tripped). `buildChatModelInfos` sets `toolCalling: true` for every row. Don't set it false
for a model you still want selectable. (`imageInput`/vision is NOT filtered on — only `toolCalling`.)

### Codex `/responses` requires a non-empty `instructions` — default it for native chat
The backend **400s "Instructions are required"** if `instructions` is absent or empty. Inquire never hit this
(`buildEditPrompt` always emits a system message), but the native-chat path has **no System role** (VS Code's
chat API only has User/Assistant), so it sent none → 400. `buildCodexResponsesBody` now **defaults**
`"You are a helpful coding assistant."` when no system turn is present; `CodexResponsesBody.instructions` is
required, not optional. Don't make it omittable again.

### Codex Responses input: assistant content is `output_text`, user/system is `input_text`
A replayed **assistant** turn's content part must be typed `output_text`; user/system stay `input_text`. The
Responses API rejects the wrong type. `buildCodexResponsesBody` picks per role. Images (`input_image`) ride
only on non-assistant turns (the API rejects `input_image` on assistant items). Mirrors XETH-7's codexShim
`convertContentBlocksToResponsesParts`.

### Codex caps come from `codexModelCaps`, not models.dev — and it IS vision-capable
The Codex row has no models.dev `catalogKey` and the backend has no `/models` route, so the live-caps path
(which retired the context guess table) can't reach these ids. `codexModelCaps` (in `catalog.ts`) supplies
real windows — gpt-5.x **400K/32K**, o-series **200K/100K** — and `vision: true`. `chatProvider`'s caps
resolver routes codex rows to it. **Vision is real**: gpt-5/o are multimodal and the Codex backend accepts
`input_image` (XETH-7's codexShim forwards it to the same endpoint) — don't be misled by Copilot's
conservative `modalities: ['text']` registry flag, which understates it. This is the one place a small
codex-only caps table is intentional (see [[decisions]] 2026-06-19); don't fold codex back to the neutral
default.

### Codex tools must be STRICT, and a replayed `function_call` needs only `call_id` (not `id`)
Two facts for the #15 agent round-trip. **(1) Strict schemas:** `toCodexResponsesTools` runs every tool's
`inputSchema` through `enforceStrictResponsesSchema` — every object gets `additionalProperties:false` and
**all** its keys listed in `required` (recursively, incl. array `items` and `anyOf/oneOf/allOf`), and the
tool carries `strict:true`. Codex strict mode **rejects** an open or partially-required object. The tool is
**flat** (`{type,name,description,parameters,strict}`), NOT chat-completions' nested `function` object —
don't reuse `toOpenAiTools` for Codex. **(2) call_id-only round-trip:** the replayed `function_call` input
item carries **`call_id`, name, arguments** — **no `id`**. With `store:false` the request is stateless, so
there is no prior server item for an `id` to reference; the F5 round-trip succeeded sending call_id-only.
XETH-7 *also* sends a derived `id` (`fc_…`) — unnecessary here. If a future multi-turn flow 400s on the
round-trip, add `id` to the `function_call` item in `buildCodexResponsesBody` (one line). The reducer
(`reduceResponsesToolCalls`) keys streamed events by the **item id** but surfaces **call_id** as the
round-trip id — that is what `function_call_output.call_id` must match. See [[decisions]] 2026-06-19.

### Two Wisp extensions at once → "already registered" warnings + a stale panel (F5 vs installed VSIX)
F5 launches the dev build (`EsarinAzx.wisp` — current `package.json` publisher) while an **old installed
VSIX** (`local.wisp@1.1.0`, from before the publisher rename) is still enabled. Different extension ids but
the **same `wisp.model` / `wisp.baseUrl` / `wisp.provider` setting keys**, so VS Code logs **"Cannot
register 'wisp.X' — this property is already registered"** (blamed on whichever loads second), and the
side panel you see may be the **stale installed build** — none of the new UI (e.g. the Effort knob) shows.
Not a code bug, a dev-environment dup. Fix: **uninstall/disable the installed Wisp before F5** —
`code --uninstall-extension local.wisp` — then stop the debug session and F5 again. Disappears once a single
published extension id exists. (`wisp.effort` is globalState, not a contributed setting, so it never collides.)

### `setEffort` (and any globalState write) fires no config event — re-push the panel yourself
`setModel` mirrors into `wisp.model`, and the `onDidChangeConfiguration` listener re-`postState()`s the
panel. A **globalState** write (`wisp.models`, `wisp.effort`) triggers **no** event, so a mutation that only
touches globalState must call `panel.postState()` itself or the controlled input won't reflect the change.
`setEffort` does exactly this. Don't remove that line, and remember it for any future globalState-backed knob.

## Related
- [[api]]
- [[decisions]]
- [[overview]]
