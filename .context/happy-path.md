---
type: happy-path
project: wisp
updated: 2026-06-23
tags: [happy-path, mvd]
---
# Happy Paths (MVD)

## Bridge — drive Copilot CLI through a Wisp provider
- **Idea:** Wisp exposes a local OpenAI-compatible endpoint (the **Bridge**) so the GitHub Copilot CLI can run a coding task through any Wisp provider — including a Claude.ai or ChatGPT subscription sign-in.  **Mode:** ux+beat  **Actor:** Wisp user (developer in VS Code)  **Goal:** Copilot CLI completes a task using the user's Claude.ai subscription, no API key.
- **Updated:** 2026-06-23

```mermaid
flowchart LR
  panel([Wisp side panel]) -->|toggle Bridge on · start localhost listener| running[Bridge running — address + access secret shown]
  running -->|copy secret + address into Copilot CLI settings| configured[Copilot CLI pointed at the Bridge]
  configured -->|start a session, pick a Wisp provider as the model| session[Session ready on e.g. 'anthropic']
  session -->|type a coding task · CLI sends it to localhost with the secret| working[CLI working the task]
  working -->|Wisp matches provider + its picked model · calls Claude.ai via sign-in, streams the reply back| done([Task done via the Claude.ai subscription])
```

**Note (pre-spine gate, not on the happy path):** before any of this is built, one
check decides the whole approach — does VS Code pass Wisp's settings to the
Copilot CLI it launches? If yes, the spine above is hands-free. If no, the only
change is *how* step 2→3 wires the settings (user launches VS Code from a shell
that already has them); the journey is otherwise identical.
