---
type: active-work
project: wisp
updated: 2026-06-15
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-06-15 by Opus 4.8 (auto)_
_At commit: about to branch `feat/multi-provider-catalog` off `main` and commit the multi-provider
**spec** (PRD/issues/CONTEXT/ADR/gotchas) — docs only, no code yet. Rebrand (Issue 3) is committed on
`main` (`de959be`)._

## Current focus
**Multi-provider — a Provider catalog.** Planning done this session (grill-with-docs → PRD → Issues
4–7). The feature adds a curated **Provider catalog** (9 built-in + Custom, all OpenAI-compatible +
API-key) with a panel **Provider picker** and **per-Provider key + model memory**, built on the
**Active Provider = source of truth** model. **Next: implement Issue 4** (active-provider plumbing +
silent key migration — the thin end-to-end tracer) on the new branch. No code written yet.

## State
- **In flight:** nothing — multi-provider is **specced, not built**. Docs about to be committed on a
  feature branch; Issue 4 implementation is the next session's job.
- **Done this session (planning only, no code):**
  - **Studied** `D:\Mods\xethryon\new agent\XETH--7`'s provider strategy (env-flag selection, profile
    builders, smart router, LiteLLM). Lifted the transferable core: **a catalog of OpenAI-compatible
    rows reached by one SDK** — dropped the heavy routing/OAuth/profile machinery (overkill for Wisp).
  - **Researched** (background workflow, web + adversarial verify) the 5 user-requested extras:
    **Ollama Cloud / KiloCode / Cline** are plain **API-key, first-party, OpenAI-compatible** gateways
    (KiloCode & Cline are NOT OAuth) → ship. **GitHub Copilot** (reverse-eng/ban risk) + **Cursor**
    (shape-incompatible, session-piggyback ToS) → **dropped**. So **no OAuth subsystem** needed.
  - **Grill-with-docs:** settled the design tree (preset picker + per-Provider key/model memory;
    machine-scope security; Active Provider = source of truth; silent key migration; 9-built-in catalog
    + Custom; panel switch UX; terminology). `CONTEXT.md` +4 terms; multi-provider **ADR** in
    `decisions.md`; 3 new `gotchas.md` entries.
  - **PRD.md:** multi-provider section + user stories 40–44. **issues.md:** **Issues 4–7** (judge-panel
    tracer-bullet decomposition).
- **Blocked:** nothing.

## Pick up here
Spec done; about to branch `feat/multi-provider-catalog` + commit the docs. **Next task: implement
Issue 4** — Active-Provider plumbing + silent key migration (the thin end-to-end tracer: a 2-row
`PROVIDERS` catalog, machine-scoped `wisp.provider`, per-Provider `wisp.apiKey.<id>` + env fallback,
globalState model memory, silent `wisp.apiKey` → `wisp.apiKey.opencode-zen` migration; **no UI**).
Then Issues 5 (panel dropdown) ∥ 6 (full 9-provider catalog) → 7 (Custom + Cline note). Full acceptance
criteria in `issues.md`; rationale in `decisions.md` (2026-06-15 multi-provider ADR).

## Skills for next session
- `/preset pick-up` — reads the handoff note and resumes Issue 4 on the feature branch.
- `/tdd` for Issue 4's pure pieces if any emerge (migration guard is testable).

## Open questions
- None blocking. KiloCode/Cline/Ollama-Cloud **default model ids** are best-effort presets — verify each
  against `GET /models` when building Issue 6 (`issues.md` notes this).

## Recent context
- The rename is **breaking**: setting namespace + SecretStorage key both moved, so any previously
  stored key is orphaned — re-enter once. Accepted for a 0.0.x pre-release; no silent-migration shim.
- Grep guard is satisfied *in spirit*: no live `opencodeAutocomplete` identifiers remain; the only
  matches are `issues.md` spec text + the rebrand ADR, which document the old name. All other `opencode`
  hits are provider-scoped (base URL, `OPENCODE_API_KEY`, `opencode.ai`, `opencode/` prefix).
- Carried-forward (pre-rebrand, still open): faster default model (try `deepseek-v4-flash`/`kimi-k2.6`);
  TDD for M1/M2 pure fns + the `buildInquiryPrompt` slicer.

## Related
- [[overview]]
- [[api]]
- [[decisions]]
- [[gotchas]]
