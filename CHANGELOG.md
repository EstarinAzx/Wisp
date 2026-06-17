# Changelog

All notable changes to **Wisp** are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-18

First stable release. Wisp is now an inline-edit assistant (**Inquire**) backed by a
catalog of OpenAI-compatible providers, and it also exposes those providers as models
in VS Code's **native** chat.

### Added

- **Language Model Chat Provider.** Wisp registers its keyed providers as selectable
  models in VS Code's native chat / `Ctrl+I` picker (vendor `wisp`), streaming through
  Wisp's own OpenAI-compatible client. (Issue #7)
- **Tool calling.** Agent tools are forwarded to the backend and streamed tool calls are
  emitted back, so Wisp models are first-class in agent/edit/`Ctrl+I` (which hide models
  without tool support).
- **Vision.** Image attachments are forwarded as data URIs for multimodal models.
- **Live model capabilities from [models.dev](https://models.dev).** Each model's real
  context window and vision support are read live (cached, with graceful fallback) instead
  of being hardcoded — so the picker shows accurate, per-model numbers that track model
  switches.
- **Multi-provider catalog.** Nine built-in providers (OpenCode Zen, OpenAI, Groq,
  Mistral, OpenRouter, Ollama, Ollama Cloud, KiloCode, Cline) plus a user-defined Custom
  endpoint, each with its own key and remembered model. (Issues 4–7)
- **Side panel** for key/provider/model management with a thinking/idle activity indicator.
- **First test runner** — pure provider-catalog and capability helpers extracted to a
  vscode-free module under Vitest (`npm test`).

### Changed

- **Inquire is now an inline-edit editor.** Describe an edit; the model returns
  SEARCH/REPLACE blocks applied as an in-editor diff with Accept/Reject CodeLenses —
  replacing the whole-file suggestion flow. (Slices 1–3)
- **Minimum VS Code raised to 1.104** (the Language Model Chat Provider API is finalized
  there).
- Rebranded the product to **Wisp** (Wisp = the product; OpenCode Zen = a provider).

### Removed

- **Always-on ghost-text Completion** and its enable toggle — Wisp is Inquire-only.

### Security

- Built-in provider base URLs are hardcoded and machine-scoped; only the Custom provider
  uses a user-supplied URL, so a workspace cannot redirect an API key to another endpoint.
- API keys live in the OS keychain (SecretStorage), never in plaintext settings.

## [0.0.x] — pre-1.0

Early development: initial OpenCode-backed completion extension, side-panel activity
indicator (`v0.0.3`), and the first manual whole-file suggestion (Inquire).

[1.0.0]: https://github.com/EstarinAzx/BYOK-IDE-Auto-Complete/releases/tag/v1.0.0
