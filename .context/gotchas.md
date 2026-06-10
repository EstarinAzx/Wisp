---
type: gotchas
project: opencode-autocomplete
updated: 2026-06-10
tags: [context, gotchas]
---

# Gotchas

### No fill-in-middle (FIM) on the Zen endpoint
The provider exposes **only** OpenAI-compatible chat completions — there is no FIM/`suffix`/completion route. The extension prompts a *chat* model to act as a completer (`prefix<CURSOR>suffix` → return only the insertion). Don't go looking for a FIM endpoint to "do it properly"; it doesn't exist. This is the root reason latency is ~0.5–1.5s, not sub-100ms.

### Chat models echo the current line → doubled ghost text
A chat model frequently returns the line it's completing (`const x = ` → `const x = 42`), which renders as `const x = const x = 42`. The `stripPrefixOverlap` step in `src/extension.ts` trims the longest prefix-tail the suggestion repeats. The system prompt alone does **not** prevent this — keep the trim.

### Debounce is the cancellation token, not a manual timer
The provider `await delay(debounceMs)` then checks `token.isCancellationRequested`. VS Code cancels the token on the next keystroke, so abandoned requests bail before hitting the network. Don't "fix" this into a standalone debounce timer — it would double-fire.

### Webview CSP × Tailwind v4
With a Vite **production** build, Tailwind compiles to a static linked stylesheet — no runtime `<style>` injection — so a strict CSP (`script-src 'nonce-…'; style-src ${cspSource}`) is enough. Only add `'unsafe-inline'` to `style-src` if the webview devtools console actually reports a violation. Don't pre-emptively loosen it.

### Two TypeScript configs must stay separate
The extension `tsconfig.json` keeps `include: ["src"]`. The webview's JSX lives under `webview/` with its **own** tsconfig (`jsx: react-jsx`, `jsxImportSource: preact`). If the extension `tsc` ever picks up the webview files it will fail on browser JSX/DOM types. `compile` runs both (`tsc -p ./ && tsc -p webview && vite build`) — Vite's esbuild transform does **not** type-check, so without the `tsc -p webview` step webview type errors ship silently.

### Vite asset names must be deterministic
The extension references the webview bundle by fixed path (`main.js` / `main.css`). The Vite config must disable hashing (`entryFileNames`/`assetFileNames` pinned, `cssCodeSplit:false`, `inlineDynamicImports:true`). Default hashed names will 404 in the webview.

### Config writes must target the defining scope, not always Global
`setModel`/`setEnabled` use `cfg().inspect()` to write the scope that already defines the value. A blind `ConfigurationTarget.Global` write under a workspace override is silently ineffective and the controlled panel select/checkbox snaps back. See `targetFor()` in `src/extension.ts`.

### Server error bodies can leak the key — sanitize before posting to the webview
`fetchModelIds` failures must not forward raw `String(err)` to the panel: OpenAI-style 401 bodies echo key fragments (`Incorrect API key provided: sk-…`). `sanitizeError` in `src/sidePanelProvider.ts` maps to a status-code string. The write-only-key rule covers error text too.

### Key is write-only across the webview boundary
Never post the API key value back to the webview — only a `keyIsSet` boolean. Invalidate the cached OpenAI client whenever the key is set or cleared.

### Packaging ships node_modules — bundling is optional (size only)
**Empirically verified:** `vsce package` includes production `dependencies`, so `node_modules/openai` is inside the `.vsix` and the extension runs installed without esbuild/webpack. (The earlier claim that it "won't ship without bundling" was wrong.) Bundling remains worth doing later to shrink the package — the unbundled `.vsix` is ~1402 files / 2.33 MB and vsce warns about it — but it is not a correctness blocker.

## Related
- [[api]]
- [[decisions]]
- [[overview]]
