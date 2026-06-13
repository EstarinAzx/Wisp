---
type: decisions
project: opencode-autocomplete
updated: 2026-06-10
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

**Decision:** `opencodeAutocomplete.baseUrl` is `"scope": "machine"`.
**Why:** otherwise a malicious workspace could redirect requests — and the bearer API key — to an attacker endpoint. Side effect: baseUrl can no longer be set per-workspace (acceptable; it's near-constant).
**Reversibility:** easy (drop the scope line) but security-relevant — don't revert without reason.

**Decision:** `PanelState.keySource` is tri-state (`stored | env | none`), not a bare `keyIsSet` boolean; the webview Clear button is enabled only for `stored`.
**Why:** the `OPENCODE_API_KEY` env fallback made Clear look dead (deletes an absent secret, env key still resolves). Tri-state keeps the UI honest. Key value still never crosses to the webview.
**Reversibility:** easy.

**Decision:** No esbuild/webpack bundling — `vsce package` ships `openai` (and other prod `dependencies`) as-is.
**Why:** empirically verified the `.vsix` contains `node_modules/openai`; the prior "won't ship without bundling" assumption was false. Bundling stays a *size* optimization (1402 files), not a correctness requirement.
**Reversibility:** easy (add bundling later if package size matters).

## 2026-06-10 — Bare model ids required (corrects decision #5)

**Decision:** Model ids for `zen/go/v1` are **bare** (`minimax-m3`), never provider-prefixed (`opencode/minimax-m3`). `DEFAULT_MODEL`, the `opencodeAutocomplete.model` default, and `fetchModelIds` all use/return the bare form exactly as `GET /models` serves it.
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

## Related
- [[overview]]
- [[gotchas]]
