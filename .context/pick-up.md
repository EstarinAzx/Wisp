---
type: pick-up
project: wisp
updated: 2026-06-21
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `.context/active-work.md` to rehydrate.

**Last session (2026-06-21):** Built + verified **slice #24 — Codex Effort control** on branch
**`feat/codex-effort`** (committed this session). A side-panel **Effort** knob (`low`/`medium`/`high`/`xhigh`)
for the **Codex Provider** replaces the hardcoded `medium` and governs **every** Codex call (Inquire + chat).
`codexReasoning(model)` → `codexReasoning(model, effort)`; one global value in globalState `wisp.effort`,
threaded through the single `codexResponsesRequest` chokepoint. **`npm test` 137→139, tsc+webview+vite clean,
F5 PASSED** (knob renders Codex-only; message sent on a selected effort). `xhigh` was added mid-session per
the user (codex-max models accept it). **This completes PRD #23's first slice.**

**Next task: BUILD slice #25 — "Model-picker label mirrors Effort."** Enter with **`/preset scope 25`**.
Now unblocked (#24 landed). It appends `· <Effort>` to the Codex row's name in `buildChatModelInfos`
(`catalog.ts:~299`, the `name: \`${p.label} — ${model}\`` line), **only for reasoning-capable Codex models**
(reuse `codexReasoning`'s gate so an inert `spark`/`gpt-4.x` row never claims a depth). Test:
`buildChatModelInfos` (`catalog.test.ts:~267`) — the 13 existing tests assert the current name format, so
the Codex-row expectations need the suffix. No webview change → no `dist/webview` rebuild; F5 to confirm the
picker label. **No live-refresh event needed:** chatProvider is stateless; VS Code re-queries
`provideLanguageModelChatInformation` on picker open (verified: no `onDidChange…` event exists in the
finalized 1.104 API — fallback "relabel on next open" is the actual behavior, acceptable).

After #25: PRD #23 is complete → **`/preset ship`** a PR on `feat/codex-effort` (#24+#25).

**Landmines / things to know:**
- **Two Wisp extensions collide under F5.** The old installed VSIX `local.wisp@1.1.0` + the dev build
  `EsarinAzx.wisp` both contribute `wisp.*` settings → "already registered" warnings + a STALE panel
  (no new UI). **Uninstall `local.wisp` before F5** (`code --uninstall-extension local.wisp`). See [[gotchas]].
- **`setEffort` must call `panel.postState()` itself** — a globalState write fires no config event (unlike
  `setModel`). Don't remove that line; applies to any future globalState-backed knob. See [[gotchas]].
- **`CLAUDE.md` is still uncommitted** (a pre-existing, unrelated ecosystem-KB/handoff/trace edit, NOT this
  work) — left out of the #24 commit deliberately. Decide its fate separately.
- **`xhigh` × model:** one global effort, no per-model gating — `xhigh` on a non-codex-max model may 400.
  By design (PRD "set it once").

Full state in [[active-work]]; settled choices in [[decisions]]; traps in [[gotchas]]; domain language in `CONTEXT.md`.
