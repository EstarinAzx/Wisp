---
type: decisions
project: wisp
updated: 2026-06-17
tags: [context, decisions]
---

<!-- newest entries are at the bottom; see "Side-panel implementation" (2026-06-10) -->


# Decisions

Settled questions. Append-only. Each entry is dated.

---

## 2026-06-10 — Inline-completion design review

1. **Latency target ~0.5–1.5s (regime B).** Chat-on-Zen cannot hit sub-100ms FIM speed; that is accepted, not a bug. Shapes everything below.
2. **Adaptive short completions: `maxTokens` 64, no hard newline-stop.** Keeps p50 latency in budget while still allowing 2–3 line blocks. _Why:_ a newline-stop would kill legit multi-line like `if (x) {`. **⚠️ CORRECTED 2026-06-10 — the 64 cap proved unreliable (truncated multi-line; starved reasoning models that spend the budget in `<think>`); default is now `0` = uncapped. See the "Uncapped tokens + strip reasoning" entry below.**
3. **Non-streaming.** The VS Code inline API resolves a suggestion once, so streaming gives no perceived-latency win; only complexity. Revisit only if p95 annoys.
4. **API key in SecretStorage + `OPENCODE_API_KEY` env fallback; no plaintext setting.** _Why:_ a `settings.json` key leaks via Settings Sync / screen-share.
5. **Default model `opencode/minimax-m3` + per-request latency log + `listModels` command.** _Why:_ it's the id proven working against `go/v1` in the reference `llm-provider`; pick the real winner (`glm-5` / `kimi-k2.6`?) from the logged data. Model stays a setting. **⚠️ CORRECTED 2026-06-10 — see the "Bare model ids required" entry below: the prefixed id is rejected by this endpoint; the default is now the bare `minimax-m3`.**
6. **Trigger gating (sensible, not aggressive):** skip on empty/whitespace prefix, active selection, and native-IntelliSense-open (`selectedCompletionInfo`). _Why:_ no language-aware string/comment parsing — too brittle across languages.
7. **Single-entry last-result cache.** _Why:_ the dominant waste is same-position re-fires (VS Code re-queries on cursor moves/re-renders); one entry erases it cheaply.
8. **Status-bar heartbeat (ready/thinking/disabled/error), click toggles enabled.** _Why:_ regime-B latency is felt; the user needs "working vs frozen" signal.
9. **Strip prefix-overlap before returning.** _Why:_ chat models often echo the current line → doubled ghost text; the system prompt alone doesn't prevent it.

## 2026-06-10 — Side-panel feature (planned)

10. **Panel scope = key + model + enabled toggle.** Other settings stay in `settings.json`. _Why:_ matches the ask plus the one cheap, useful toggle; avoids scope creep into a full control center.
11. **Model picker = live `/models` list + free-text override + refresh.** _Why:_ discovery without locking the user out of unadvertised ids; manual field still works without a valid key.
12. **Stack = Preact + Tailwind v4, bundled by Vite into one unhashed asset; deprecated webview-ui-toolkit avoided (theme via `--vscode-*` vars).**
13. **Key is write-only from the webview** — UI sends the key, receives only `keyIsSet`, never the value back.
14. **Tests marked for the pure modules M1 (suggestion cleanup) + M2 (completion context)** — see `PRD.md`. M3–M6 are VS Code/DOM glue → manual/integration verify.
15. **PRD delivered as `PRD.md` in-repo** (project is greenfield / non-git at decision time, so a local doc is the "copy", not a GitHub issue).

## 2026-06-10 — Side-panel implementation (post-review)

**Decision:** Config writes (`model`, `enabled`) target the scope that already defines the value (`inspect()` → WorkspaceFolder / Workspace / else Global), not always `ConfigurationTarget.Global`.
**Why:** a Global write under a workspace override is silently ineffective — the controlled panel select/checkbox would snap back. Surfaced by the multi-agent review.
**Reversibility:** easy.

**Decision:** `wisp.baseUrl` is `"scope": "machine"`.
**Why:** otherwise a malicious workspace could redirect requests — and the bearer API key — to an attacker endpoint. Side effect: baseUrl can no longer be set per-workspace (acceptable; it's near-constant).
**Reversibility:** easy (drop the scope line) but security-relevant — don't revert without reason.

**Decision:** `PanelState.keySource` is tri-state (`stored | env | none`), not a bare `keyIsSet` boolean; the webview Clear button is enabled only for `stored`.
**Why:** the `OPENCODE_API_KEY` env fallback made Clear look dead (deletes an absent secret, env key still resolves). Tri-state keeps the UI honest. Key value still never crosses to the webview.
**Reversibility:** easy.

**Decision:** No esbuild/webpack bundling — `vsce package` ships `openai` (and other prod `dependencies`) as-is.
**Why:** empirically verified the `.vsix` contains `node_modules/openai`; the prior "won't ship without bundling" assumption was false. Bundling stays a *size* optimization (1402 files), not a correctness requirement.
**Reversibility:** easy (add bundling later if package size matters).

## 2026-06-10 — Bare model ids required (corrects decision #5)

**Decision:** Model ids for `zen/go/v1` are **bare** (`minimax-m3`), never provider-prefixed (`opencode/minimax-m3`). `DEFAULT_MODEL`, the `wisp.model` default, and `fetchModelIds` all use/return the bare form exactly as `GET /models` serves it.
**Why:** the chat endpoint returns `401 Model opencode/minimax-m3 is not supported` for the prefixed form. This **falsifies decision #5's** claim that `opencode/minimax-m3` was "proven working" — that was inherited from the reference `llm-provider`, which targets a different gateway; inline completions had been erroring the entire time. A mid-session experiment that *added* the `opencode/` prefix to the fetched list went the wrong way and was reverted.
**Reversibility:** easy to revert, but don't — the prefixed form is confirmed-rejected by this endpoint.

**Decision:** The panel auto-fetches the `/models` list once a key is set (on first state, key-set, or endpoint change), gated on origin change.
**Why:** the dropdown otherwise only filled on a manual ↻ button users didn't discover, so they only ever saw the single configured model. The origin gate prevents a refetch loop on an empty result and avoids re-firing on unrelated config pushes (model/enabled).
**Reversibility:** easy.

## 2026-06-10 — Uncapped tokens + strip reasoning (corrects decision #2)

**Decision:** `maxTokens` default → `0` (uncapped); `max_tokens` is sent only when the setting is `>0`. A new `stripThink` step removes inline `<think>…</think>` reasoning from the completion before insertion (an unterminated `<think>` → insert nothing).
**Why:** the served models (minimax-m3, mimo, qwen3*, glm5*) are **reasoning models** that emit chain-of-thought inline as `<think>…</think>`. With the 64-token cap they burned the whole budget thinking and never produced code, and even non-reasoning output got truncated mid-line — both surfaced as "broken / unreliable autocomplete". Uncapping lets the answer finish; `stripThink` keeps the reasoning out of the ghost text. Tradeoff: reasoning models are slow per keystroke — a non-reasoning id (`deepseek-v4-flash`, `kimi-k2.6`) is the snappy choice.
**Reversibility:** easy (re-cap via the setting), but don't default it back — the cap is what made it unreliable.

## 2026-06-10 — Comment-line clunk: deterministic guard, not prompt-only

**Decision:** Stop the model from extending a comment line with a **deterministic** post-clean guard
(`relocateAfterComment` in `src/extension.ts`), not by the system prompt alone. It fires only when the
caret is at the **physical end of a whole-line comment** (the comment token is the first non-whitespace
char) in a **known code language** (`LINE_COMMENT` map; unknown languageId → never fires), then forces
real code onto its own indented line and drops leading comment-continuation prose. It **fails safe** —
returns the suggestion untouched in every ambiguous case and never deletes code. The `SYSTEM_PROMPT`
format/newline rules stay as a best-effort backup.
**Why:** the served models are reasoning models that obey format instructions only loosely, so a prompt
cannot *guarantee* the comment is never extended. A multi-agent adversarial design pass (3 approaches ×
5 lenses) broke **every** naïve detector: a `//`/`#` found anywhere on the line false-positives on URLs
(`https://`), regex (`/\/\//`), shell `${var#…}`, YAML `url#frag`, Python docstrings, and JSDoc/block
bodies; defaulting `//` onto every language mangles markdown/plaintext (the provider matches `**`); a
trim-based end-of-line check misfires on mid-comment authoring. The **whole-line-comment + physical-EOL +
known-language** trio is the minimal set of gates that rejects all of those. Verified by an 11-case
harness (real bug + each adversarial break) — 11/11.
**Reversibility:** easy to remove, but don't weaken the gates to `indexOf('//')` / a `//` default / a
`trim()`-based EOL test — each reintroduces a confirmed false-positive class. Block comments are
deliberately out of scope (see [[gotchas]]).

## 2026-06-10 — Panel activity indicator via a dedicated `activity` message

**Decision:** Surface the extension's **Activity** (Thinking / Idle — see `CONTEXT.md`) in the side
panel as a top status row (pulse dot, "Thinking…"/"Idle", muted `opacity-50` when disabled), fed by a
**new lightweight `activity{thinking}`** ext→webview message. `enter/exitInFlight` push it via
`panel.postActivity(inFlight > 0)`; the `ready` handler pushes the current activity via a new
`PanelHost.getActivity()`. The webview holds `thinking` **separate** from `state`. The 4-state status
bar is left untouched; the panel shows only the two Activity states.
**Why:** the panel was the blind spot — the status bar already had thinking/idle. The signal is
high-frequency (per debounced keystroke); folding `thinking` into `state` was rejected because
`getState` is async and a `state` push also triggers the webview's model-refetch path, so firing it
per keystroke would be wasteful and semantically wrong. A dedicated synchronous boolean message is
cheap and decoupled. Pushing on `ready` too keeps a panel reopened mid-request correct.
**Reversibility:** easy (could merge `activity` into `state` later — minutes). No ADR: trivially reversible.

## 2026-06-14 — Inquire: a manual, whole-file, insertable-code suggestion (new feature)

**Decision:** Add **Inquire** (see `CONTEXT.md`) — select lines → right-click → the selection is the
prompt, the **whole file** is context, and the result is **insertable code** rendered as ghost text
**after** the selection (append, never replace). It is **code only, never prose**, **independent of
the `enabled` toggle**, and reuses the existing ghost-text surface + cleanup pipeline. Mechanic: stash
a pending result and fire `editor.action.inlineSuggest.trigger`; the inline provider returns it before
the enabled/selection/debounce/cache gates. Whole-file context has a ~32k-char size guard that falls
back to a windowed `buildContext`. Feedback = cancellable `withProgress` + existing Activity. Spec in
`PRD.md`; build in `issues.md` Issue 2.
**Why:** the user wants the answer to feel exactly like an autocomplete suggestion (ghost text, Tab),
so reusing Completion's surface beat a new panel/hover UI. **Code-only** (rejecting prose Q&A / chat):
prose can't live in ghost text and would need a different surface + interaction model — out of scope.
**Append, not replace** (rejecting transform-in-place): a loose reasoning model returning junk must
never destroy the user's selected code, matching the pipeline's fail-safe "never deletes code" ethos.
**Whole file with a guard** (vs Completion's prefix/suffix cap): the whole point is full-file context,
but an unbounded send overflows the model context window on big files — the guard degrades gracefully.
**Reversibility:** easy to remove the command; but don't quietly turn Inquire into prose Q&A or a
replace-mode without re-deciding — both were rejected paths (data-loss / wrong-surface).
**Risk (unproven):** the manual ghost-text trigger (`inlineSuggest.trigger` + stashed result at a
collapsed caret) is keystroke-driven by default — Issue 2 validates it with a spike before building.

## 2026-06-15 — Inquire built; spike confirmed (resolves the 2026-06-14 unproven risk)

**Decision:** Inquire shipped in `src/extension.ts` + `package.json` (v0.0.4). The manual ghost-text
mechanic **works**: collapse the selection (inline ghost text will not render while a selection is
active), stash `pendingInquiry` keyed to document URI + collapsed caret, fire
`editor.action.inlineSuggest.trigger`; the provider returns the stash from an **early-return ahead of
all gates** (enabled/selection/debounce/cache) and clears it. Whole-file context with a 32k-char guard
falls back to `buildContext(24000/6000)`. Eyeball/F5 verified.
**Why:** this closes the "Risk (unproven)" flagged 2026-06-14 — the keystroke-driven concern was
unfounded; `inlineSuggest.trigger` queries the provider on demand regardless of our `enabled` flag (it
gates on VS Code's own `editor.inlineSuggest.enabled`, default on). Don't re-litigate the surface.
**Reversibility:** easy (remove the command + early-return) — but the append-only / code-only / before-
gates constraints stay load-bearing; see the 2026-06-14 entry.

## 2026-06-15 — Rebrand to Wisp; product / provider split (Issue 3)

**Decision:** The **product** is now **Wisp** — everything user-visible and every product identifier
renamed from `opencodeAutocomplete` / "OpenCode (Zen) Autocomplete" to `wisp` / "Wisp": package
`name`/`displayName`, the `wisp.*` namespace for command **and** setting ids, the SecretStorage key
(`opencodeAutocomplete.apiKey` → `wisp.apiKey`), the activity-bar container + webview view ids/titles,
the `WispPanelProvider` class, status-bar text, output-channel name, all `Wisp: …` toast/progress
strings, the README, and the icon (`media/opencode.svg` → `media/wisp.svg`). Version bumped 0.0.4 →
0.0.5. The **provider** keeps its own name, **OpenCode Zen**: `DEFAULT_BASE_URL`
(`https://opencode.ai/zen/go/v1`), the `OPENCODE_API_KEY` env fallback, the "OpenCode Zen provider"
wording in the `baseUrl` setting, and the `opencode/`-prefix discussion all stay. Pure rename — **no
behavior change**. See `CONTEXT.md` ("Product and provider") for the vocabulary.
**Why:** give the product its own identity, separate from any one provider, so additional providers can
be added later (a future issue) without another rename. **Wisp** = the product; **OpenCode Zen** = the
(current, first) provider — the product *has* a provider.
**Breaking:** the setting namespace and the SecretStorage key both moved, so any previously stored key
is orphaned — the user re-enters it once via **Wisp: Set API Key**. Acceptable for a pre-release (0.0.x).
**Reversibility:** easy mechanically, but don't — the split is the point. Multi-provider support builds on it.
**Out of scope (future issues):** multi-provider architecture, provider-switching UI, logo redesign (the
glyph was reused, only its filename changed).

## 2026-06-15 — Multi-provider: a Provider catalog (config-only, API-key, OpenAI-compatible)

**Decision:** Add multiple **Providers** as a curated **Provider catalog** plus a **Custom**
escape hatch. v1 catalog (9 built-in): **OpenCode Zen** (default) · OpenAI · Groq · Mistral ·
OpenRouter · Ollama (local) · **Ollama Cloud** · **KiloCode** · **Cline** — every one
OpenAI-chat-compatible + API-key (Bearer), reached through the **existing `openai` SDK** by
swapping base URL + key + model. **No new client code, no OAuth subsystem.**

**Architecture — the Active Provider is the source of truth** (chosen over a "populate the free
settings then forget" model): state is an **Active Provider id** (`wisp.provider`) + a
**per-Provider record** `{ key, model }`. Keys live in namespaced SecretStorage slots
(`wisp.apiKey.<id>`) with a per-Provider env-var fallback from each catalog row (`OPENCODE_API_KEY`,
`OPENAI_API_KEY`, `OLLAMA_API_KEY`, …). Per-Provider **model memory** lives in extension
`globalState` (a `{ providerId: model }` map); `wisp.model` mirrors the Active Provider's current
model. Built-in **base URLs are hardcoded in the catalog**; **Custom** is the only Provider exposing
a user-supplied base URL (the repurposed machine-scoped `wisp.baseUrl`). There is **no model-id
transform** — each row ships its `defaultModel` in the Provider's *native* format (avoids re-adding
the `opencode/` prefix that 401'd Zen; see the "Bare model ids" entry).
_Why source-of-truth:_ per-Provider key memory already forces a per-Provider record; a single global
model is actively wrong across Providers (Zen `minimax-m3` vs OpenAI `gpt-4o`) → switching with a
stale id 401/404s; and it removes provider/baseUrl drift.

**Security — `wisp.provider` is `"scope": "machine"`** (extends the 2026-06-10 `baseUrl` machine-scope
ADR). _Why:_ selecting a Provider selects where the **bearer key is sent**, so a workspace-overridable
selector is a key-redirect/exfiltration vector. Built-in URLs in code (not settings) mean a hostile
workspace cannot tamper with where Zen/OpenAI/etc. point; Custom's URL is machine-scoped only.
**Reversibility:** easy to drop the scope line, but security-relevant — don't revert without reason.

**Migration — silent one-time** `wisp.apiKey` → `wisp.apiKey.opencode-zen` (+ `wisp.model` into Zen's
record), then delete the old slot. _Why a shim here when the rebrand chose none:_ the rebrand was a
namespace rename where old→new was a blind guess across an unknown future; here Zen is the **only**
Provider today, so the existing key is **provably** the Zen key — the mapping is unambiguous, so a
shim is safe, not a guess. Avoids a second key re-entry in two consecutive releases.

**Dropped: GitHub Copilot and Cursor** (researched + adversarially verified, 2026-06-15).
**Copilot** — the only OpenAI-compatible path to its chat backend is reverse-engineered client
impersonation against undocumented endpoints → **high, irreversible account-ban risk**; the sanctioned
Copilot SDK is an *agent runtime*, not raw `/chat/completions`, so it can't drive inline completion.
**Cursor** — even its sanctioned API is **shape-incompatible** (agent orchestration, no
`/chat/completions`); "auth only" = piggybacking the local Cursor session token to hit the private
`api2.cursor.sh` → ToS violation + live ban precedent. OAuth would not fix *why* either fails, so **no
"OAuth providers" feature is needed** for this set.

**Cline ToS (medium risk):** Cline's terms §2.2 bar "competing products" use → ship **user-supplied-key
only** (never an embedded/proxied shared key) + a one-line "you are responsible for your own ToS
compliance" note. Built-in `defaultModel`s + KiloCode's model-id namespace are **best-effort presets**,
verified against each `GET /models` at build; **Custom** is the always-works fallback.

**Reversibility:** the catalog and per-Provider record are additive and easy to trim; the machine-scope
and the dropped-provider calls are the load-bearing, don't-casually-revert parts.

## 2026-06-16 — Extract pure cores to a vscode-free module + Vitest for unit tests

**Decision:** Pull the pure logic out of the VS Code-coupled wrappers into a new **`src/catalog.ts`
that imports nothing** — `resolveModel`, `resolveBaseUrl`, `buildInquiryContent` (reshaped to take
`{ text, languageId, offset }` instead of a `vscode.TextDocument`), and `planLegacyMigration` (the
migration's idempotency/correctness **decision** as a pure plan; `extension.ts` reads storage state,
calls it, applies the plan). `extension.ts` keeps thin wrappers that read config/state and delegate —
behaviour-identical. Add **Vitest** as the test runner (`test: vitest run`, `tsconfig` excludes
`src/**/*.test.ts` from the extension build); 13 tests cover the four functions. `ollama-cloud`'s
`gpt-oss:120b` was **user-verified working** (its ⚠ dropped).
**Why:** the resolvers read module-level VS Code state and `extension.ts` imports `vscode` at the top,
so nothing there is importable by a plain Node/Vitest test (no Extension Development Host). Extracting
the pure cores makes them genuinely unit-testable **without** `@vscode/test-electron` — Vitest was
chosen over the official VS Code test harness precisely because the logic under test is pure, so an
Electron host is dead weight. Establishes the pattern: testable logic is vscode-free in `catalog.ts`.
**Reversibility:** easy — but don't fold the pure logic back inline; that re-breaks testability (see [[gotchas]]).

## 2026-06-17 — Scope pivot: remove Completion, evolve Inquire into an inline-chat editor

**Decision:** Deprecate **Completion** (the always-on, `enabled`-gated ghost-text autocomplete) and
evolve **Inquire** from a ghost-text Suggestion into a VS Code inline-chat-style **editor**: an
instruction typed in a quick `showInputBox`, the selection (or current line) as the **target span**,
the whole file as context, and the model's rewrite applied as a `WorkspaceEdit` replace that can add
**and** delete lines, reviewed via accept/reject. Planned as 4 tracer slices (PRD **#3**; **#4** evolve
Inquire B1 → **#5** remove Completion → **#6** inline diff B2 → **#7** bonus LM-provider). Design spec:
`docs/superpowers/specs/2026-06-17-inline-chat-pivot-design.md`.

**Why:** ghost text can only insert at the caret — it can never delete/rewrite; the user wants full
add+delete control driven by an explicit prompt. Three constraints fixed the shape:
- The **native Ctrl+I inline-chat widget is a proposed API** → unpublishable to the Marketplace. So we
  build our own on **stable APIs** (`showInputBox` + `WorkspaceEdit` + `needsConfirmation` refactor-preview
  for B1; `setDecorations` + `CodeLens` for the in-editor diff in B2). Prompt entry is a top-center input
  box, **not** a floating in-editor widget (impossible on stable APIs).
- **Inference stays on Wisp's own OpenAI-compatible client**, independent of `vscode.lm` and GitHub
  Copilot — keeps Wisp provider-agnostic and its own product, not a Copilot model plug-in.
- **Slice order is forced by entanglement:** Inquire has no output surface of its own — it stashes a
  `pendingInquiry` the Completion `InlineCompletionItemProvider` returns via an early-return. Inquire must
  get its own edit path (#4) **before** the provider is removed (#5), or #4 breaks. See [[gotchas]].
- **Option A** (register as a VS Code Language Model Chat Provider so Wisp models appear in *native* inline
  chat) is a **deferred, optional bonus (#7), HITL** — its BYOK gating is unresolved (may need Copilot
  Business/Enterprise as of Apr 2026 vs docs saying no Copilot plan needed). Never the core.

**Reversibility:** the product **direction** is a hard pivot (one-way once Completion code is deleted in
#5). But as of this session nothing destructive is committed — only the spec + issues exist on branch
`feat/inline-chat-pivot`; trivially reversible until #5 lands.

## 2026-06-17 — Completion removed (slice #5 lands the pivot's one-way step)

**Decision:** Ripped **Completion** end-to-end — Wisp is now **Inquire-only**. Gone: the
`InlineCompletionItemProvider` + registration, `SYSTEM_PROMPT`, the prefix/suffix context
(`buildContext`/`buildUserPrompt`), `stripPrefixOverlap`, the `delay`/debounce, the single-entry
`lastResult` cache, the whole comment-line guard (`LINE_COMMENT`/`looksLikeCode`/`reindent`/
`relocateAfterComment`), the now-inert `pendingInquiry` stash + provider early-return, the **`enabled`
toggle** across every layer (`wisp.toggle` command, `setEnabled`, the status-bar disabled state, the
panel checkbox + its **Muted** dressing), and the Completion-only settings (`enabled`/`debounceMs`/
`maxPrefixChars`/`maxSuffixChars`). `catalog.ts` lost `buildInquiryContent` + `INQUIRE_CONTEXT_LIMIT`
(dead since #4) and their tests. `CONTEXT.md` retired Completion/Suggestion/enabled/Muted/
selection-as-prompt. The status bar collapsed to **thinking / error / ready** and is no longer
clickable (no toggle to bind). Verified: `npm test` 18/18, `npm run compile` clean, F5 eyeball PASSED.
**Why:** Inquire got its own edit surface in #4, so Completion was the last thing pinning the
inline-completion provider in place; removing it is what the 2026-06-17 pivot called the "one-way"
step. `stripThink`/`stripFences` survive in `catalog.ts` (Inquire's `extractEditText` composes them).
**Reversibility:** one-way — Completion is deleted, not flag-gated. Reverting means re-implementing it.

## 2026-06-17 — Inquire edit fidelity: SEARCH/REPLACE edit blocks (supersedes whole-file rewrite)

**Decision:** Inquire will ask the model for targeted **SEARCH/REPLACE edit blocks**, not a span/whole-
file rewrite. The model gets whole-file context + the instruction and returns one or more blocks (exact
original snippet → replacement); Wisp locates each SEARCH text in the document, applies the replacement,
then renders the result through the **existing B2 inline diff** (`diffLines` + decorations + Accept/
Reject). New pure core (a block parser + an apply planner) in `catalog.ts`, TDD'd. Planned as a **new
slice (#8)**, built **before** the deferred bonus (#7).
**Why:** a mid-session experiment made no-selection Inquire target the **whole file** so the model could
edit anywhere (caret-agnostic — the user's ask). It worked sometimes, but the model frequently re-emitted
the 100+ line file with unrelated lines dropped/reformatted; the B2 diff faithfully showed the damage and
**Accept would have applied it → data-loss risk**. Edit blocks give the same "edit anywhere" capability
**without** re-emitting untouched code: only changed regions are emitted, so untouched code is
structurally preserved, diffs stay small, latency/tokens drop. Standard robust approach (Aider/Cursor).
The whole-file span change was **reverted**; B2 ships on the selection/current-line span (its documented
scope). `diffLines` itself was unaffected (it correctly showed a minimal diff of a mangled reply).
**Reversibility:** easy — the block format + parser are additive. Don't reintroduce whole-file re-emit as
the edit path; it's the confirmed mangling / data-loss vector.

## 2026-06-17 — Edit blocks built (slice #8): exact match, fails safe; extractEditText retired

**Decision:** Built the SEARCH/REPLACE path. `parseEditBlocks` (Aider markers, strips `<think>`,
CRLF→LF, ignores surrounding fences/prose, empty REPLACE = delete) + `applyEditBlocks` (EOL-agnostic
first-occurrence locate+splice, returns the applied text + a `notFound` list, empty-search guarded) are
new pure cores in `catalog.ts`, TDD'd (35/35). `buildEditPrompt` lost its `selectionText` arg and got a
block-eliciting `EDIT_SYSTEM_PROMPT`. `inquire` now parses → applies → diffs the **whole document**
before/after through the unchanged B2 `renderInlineDiff`. **Match policy is exact** (EOL-agnostic only),
**not** whitespace-fuzzy. `extractEditText` + `stripFences` were **removed** (orphaned by the switch to
`parseEditBlocks`); `stripThink` survives (reused) — this **supersedes** the slice-#5 note that said
"stripThink/stripFences survive… extractEditText composes them."
**Why exact + fails-safe:** a SEARCH that isn't byte-present is recorded in `notFound` and skipped, never
force-matched — so a bad/paraphrased block can't corrupt the file; the user reviews what landed via the
diff. Whitespace-fuzzy matching was deferred because it adds a false-match (wrong-region) risk class for
marginal gain. The whole-document diff **span** is safe (unlike the reverted whole-file *re-emit*):
`applyEditBlocks` copies untouched code verbatim, so `diffLines` emits a minimal diff.
**Reversibility:** easy. The deferred fork (add trimmed-line/fuzzy matching) stays open — take it only if
real use shows verbatim misses are frequent (see [[gotchas]]). Don't re-add `extractEditText`/whole-file
re-emit.

## 2026-06-18 — LM Chat Provider (slice #7) built; HITL gate resolved

**Decision:** Built the deferred bonus — Wisp registers a **Language Model Chat Provider** (vendor
`wisp`) so its keyed Providers appear as models in VS Code's **native** chat / Ctrl+I picker, streaming
through Wisp's own OpenAI-compatible client. New `src/chatProvider.ts` (vscode/openai glue) +
pure `buildChatModelInfos` in `catalog.ts` (one row per *usable* Provider: key + resolvable model +
Custom's URL). `extension.ts` generalized to per-Provider key/client resolvers; Inquire untouched.
**HITL gate resolved (was the blocker):** `registerLanguageModelChatProvider` is **finalized in VS
Code 1.104** (Aug 2025), NOT proposed API — publishable. The "BYOK needs Copilot Business/Enterprise"
worry is Copilot's *own* BYOK (Manage Models), a different feature; our extension API is open. Cost:
`engines.vscode` + `@types/vscode` bumped to `^1.104`.
**Why now:** the user asked for it after the core slices landed; gating verified before any code.
**Reversibility:** additive surface — easy to drop; Inquire does not depend on it.

## 2026-06-18 — Tool calling + vision passthrough (honest capabilities)

**Decision:** Declare a capability ONLY with its real implementation. **Tool calling**: advertise
`toolCalling: true` AND forward `options.tools` → reassemble streamed `delta.tool_calls` →
`LanguageModelToolCallPart` (pure `toOpenAiTools`/`buildOpenAiChatMessages`/`assembleToolCalls` in
`catalog.ts`, TDD'd). **Vision**: forward image `LanguageModelDataPart`s as OpenAI `image_url` data
URIs, multimodal user content built by `buildOpenAiChatMessages`.
**Why:** VS Code hides models without `toolCalling` from the agent/edit/Ctrl+I pickers (only Ask mode /
"Other Models" showed them) — so the capability is required for selection, and declaring it without the
passthrough would let agent mode pick a model that silently can't call tools.
**Reversibility:** easy; out of scope stays image *output*, prompt-tsx, managementCommand.

## 2026-06-18 — Read real context/vision LIVE from models.dev (the big one)

**Decision:** Stop hardcoding context windows / vision. Read them live from **[models.dev](https://models.dev)**
`api.json` — a public, no-auth aggregated catalog (~145 providers) carrying each model's real
`limit.context`, `limit.output`, and `modalities.input` (contains `"image"` ⇒ vision). Each Provider row
gains a **`catalogKey`** (matched to models.dev by **base-URL**, not name — e.g. `.../zen/go/v1` →
**`opencode-go`**, NOT `opencode`; `kilocode` → `kilo`). New `src/modelsDev.ts` fetches + caches (30-min
TTL, in-flight dedupe, warmed at registration, 4-s timeout so a cold fetch never stalls the picker).
Pure `parseModelsDevEntry`/`lookupModelsDevCaps` in `catalog.ts`. Resolution chain per field:
**models.dev → hardcoded heuristic table (`CONTEXT_TABLE`/`VISION_FAMILIES`) → neutral default**.
**Why models.dev over per-provider /models:** ~half the providers publish **nothing** via their own API
(OpenAI, OpenCode Zen — verified against OpenAI's OpenAPI spec/SDK); others need special endpoints
(Ollama `POST /api/show` per model, Cline's authed path). models.dev is the one source covering all of
them + vision, in a single cached fetch. Discovered + adversarially verified by a 19-agent research
workflow (686k tokens) — the provider-key map and field names are verified against the live `api.json`
and its source Zod schema. **Local Ollama, Cline, Custom are absent from models.dev → table/default.**
**Reversibility:** easy — caps are injected and degrade to the old table behaviour on any failure. The
table is now a *fallback*, kept deliberately (offline / models models.dev doesn't list).

## 2026-06-18 — Context window is DECOMPOSED into input+output (display correctness)

**Decision:** VS Code's "Context Size" column = `maxInputTokens + maxOutputTokens` (summed). So treat
the source value as the **total** window and split it: `maxOutputTokens = min(output, floor(window/2))`,
`maxInputTokens = window − maxOutputTokens`. The pair sums to the real context; the half-window cap stops
an anomalous `output == context` entry (real: `kimi-k2.7-code`, ctx=out=262144) from zeroing the input.
**Why:** passing `context` as input AND `output` as output inflated every model (kimi showed 524K vs its
real 256K; gpt-4o-mini 144K vs 128K). Verified live: kimi 256K, gpt-4o-mini 128K — matching each
provider's real window (and Ollama's display).
**Reversibility:** easy.

## 2026-06-18 — Released v1.0.0

**Decision:** First **stable release**. Bundles everything unreleased since `v0.0.3`: rebrand to Wisp,
the multi-provider catalog, the Inquire inline-edit pivot (Completion removed), and the LM Chat Provider
(tool calling, vision, live models.dev capabilities). Added `CHANGELOG.md`. `engines.vscode ^1.104`.
**Why 1.0.0 (not 0.0.9):** the inline-edit + native-chat surfaces make this a feature-complete product,
and the min-VS-Code bump + Completion removal are breaking — a major bump is honest.

## Related
- [[overview]]
- [[gotchas]]
