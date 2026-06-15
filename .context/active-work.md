---
type: active-work
project: wisp
updated: 2026-06-16
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-16 by Opus 4.8 (auto)_
_At commit: `68b266e` (spec) + this commit lands Issues 4–7 code on `feat/multi-provider-catalog`._

## Current focus
**Multi-provider Provider catalog — BUILT and tested.** Issues 4–7 are implemented on
`feat/multi-provider-catalog`: the Active-Provider plumbing + silent key migration (4), the panel
Provider dropdown + switch UX (5), the full 9-built-in catalog (6), and the Custom Provider + Cline
ToS note (7). Compiles clean (`tsc ./` + `tsc webview` + `vite build`), packaged as `wisp-0.0.8.vsix`,
installed, and **verified working against a real second Provider** by the user.

## State
- **In flight:** nothing — feature is complete and committing now.
- **Done this session:**
  - **Issue 4** — `PROVIDERS` catalog + `activeProvider()`/`activeModel()`/`keySlot()`/`activeBaseUrl()`;
    per-Provider key (`wisp.apiKey.<id>` → row `apiKeyEnv` → none); per-Provider model memory
    (`globalState['wisp.models']` → row `defaultModel`, `wisp.model` mirror); machine-scoped
    `wisp.provider`; client rebuild on provider/key/model change; silent one-time `migrateLegacyKey`.
  - **Issue 5** — Provider `<select>` at panel top; `setProvider`; `getState` returns catalog +
    `isCustom` + `keyEnv`; `modelsOrigin` re-keys on provider change; env hint now names the **active**
    Provider's var (was hardcoded `OPENCODE_API_KEY`).
  - **Issue 6** — catalog widened to 9 built-ins (Zen·OpenAI·Groq·Mistral·OpenRouter·Ollama·Ollama
    Cloud·KiloCode·Cline); `wisp.provider` `enum`; Ollama Cloud `/v1` (not `/api/v1`).
  - **Issue 7** — `custom` row (base URL from machine-scoped `wisp.baseUrl` via `activeBaseUrl`, own
    `wisp.apiKey.custom` slot, typed model); Custom-only editable base-URL field; `setBaseUrl`; Cline
    ToS note when Cline is active; `wisp.baseUrl` description reworded to "Custom only". Version 0.0.8.
- **Blocked:** nothing.

## Pick up here
Feature is committed on `feat/multi-provider-catalog`. **Next task: merge `feat/multi-provider-catalog`
→ `main`** (the original gate — F5/real-provider eyeball passed). Then the follow-up backlog:
1. **Verify the 4 ⚠ best-effort `defaultModel`s** against each `GET /models` once keys are available:
   `ollama` (`qwen2.5-coder`), `ollama-cloud` (`gpt-oss:120b`), `kilocode` + `cline`
   (`anthropic/claude-3.5-sonnet`). Fix in `PROVIDERS` (`src/extension.ts`). Acceptance criterion in
   `issues.md` Issue 6 wants these verified.
2. **README** — not updated this session (out of Issues 4–7 scope): document `wisp.provider`, the
   Provider catalog, and the reworded `wisp.baseUrl`.
3. Carried-forward: faster default Zen model (try `deepseek-v4-flash`/`kimi-k2.6`); TDD for the pure
   helpers (migration guard, `activeModel`/`activeBaseUrl` resolvers, `buildInquiryPrompt` slicer).

## Skills for next session
- `/preset ship` — push the branch + open the PR for the merge to `main`.
- `superpowers:test-driven-development` — for the pure resolver/migration unit tests in backlog item 3.

## Open questions
- None blocking. The 4 ⚠ model ids (above) are the only known unverified bit.

## Recent context
- **No model-id transform anywhere** — each row's `defaultModel` is the Provider's native form; never
  re-add the `opencode/` prefix (it 401s Zen). Verified by the live cross-provider test.
- `wisp.model` is now a **mirror** of the Active Provider's model (source of truth = globalState map);
  `mirrorActiveModel()` re-syncs it after a raw `wisp.provider` edit, write-loop-guarded.
- `.vsix` artifacts are git-ignored; `wisp-0.0.8.vsix` was built with `--allow-missing-repository` and
  installed via `code --install-extension … --force`.
- All built-in base URLs live in code (`PROVIDERS`), never settings — the machine-scope on
  `wisp.provider`/`wisp.baseUrl` is the load-bearing key-redirect defense. Don't relax.

## Related
- [[overview]]
- [[api]]
- [[decisions]]
- [[gotchas]]
