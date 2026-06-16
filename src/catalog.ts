// ---------------- catalog.ts — Wisp: pure Provider-catalog data + resolvers ---------------- //

/*
 * Depends on: nothing — this module is deliberately vscode-free so its logic is unit-testable
 *   without the Extension Development Host. extension.ts imports these and feeds them the values it
 *   reads from the VS Code config/state; the thin wrappers there stay behaviour-identical.
 *
 * Data shapes:
 *   - Provider: one OpenAI-chat-compatible backend = { id, label, baseUrl, defaultModel, apiKeyEnv }.
 *     id doubles as the SecretStorage key-slot and the per-Provider model-map suffix.
 */

// ----------------------------- Types ----------------------------- //

export type Provider = {
  id: string;            // stable id; also the key-slot + globalState model-map suffix
  label: string;         // canonical vendor name (panel/UI, never the status bar)
  baseUrl: string;       // hardcoded OpenAI-compatible base URL ('' for Custom — comes from settings)
  defaultModel: string;  // native-format model id used when the Provider has none remembered
  apiKeyEnv: string;     // env-var fallback for the key ('' = none, e.g. local Ollama)
};

// ----------------------------- Constants ----------------------------- //

// The Custom Provider's id — the one Provider whose base URL is user-supplied (machine-scoped
// wisp.baseUrl) rather than hardcoded in the catalog.
export const CUSTOM_ID = 'custom';

// Above this many characters, sending the whole file risks overflowing the model context window,
// so Inquire falls back to a large window around the selection instead. The window is asymmetric
// (more before the caret than after) because the lead-up matters more than the trailing context.
export const INQUIRE_CONTEXT_LIMIT = 32000;
const INQUIRE_PREFIX_CHARS = 24000;
const INQUIRE_SUFFIX_CHARS = 6000;

// ----------------------------- Resolvers ----------------------------- //

// Active model for a Provider: its remembered model (from the per-Provider map) else its native
// default. `||` not `??` on purpose — an empty-string memory degrades to the default, never wins.
export const resolveModel = (modelMap: Record<string, string>, provider: Provider): string =>
  modelMap[provider.id] || provider.defaultModel;

// Base URL for a Provider. Built-ins use their hardcoded catalog URL and ignore the user-supplied
// value entirely; only Custom resolves from it. That asymmetry is the key-redirect defense — a
// workspace cannot redirect a built-in's bearer key to another endpoint.
export const resolveBaseUrl = (provider: Provider, customBaseUrl: string): string =>
  provider.id === CUSTOM_ID ? customBaseUrl : provider.baseUrl;

// ----------------------------- Inquire prompt ----------------------------- //

// Inquire's user message: the whole file plus the selection marked as the instruction. The caller
// passes the file text, its languageId, and the caret's character offset (so this stays vscode-free).
// Over INQUIRE_CONTEXT_LIMIT the whole file is swapped for a window around the caret, so a big file
// degrades to nearby context instead of overflowing the model.
export const buildInquiryContent = (
  file: { text: string; languageId: string; offset: number },
  selectionText: string,
): { content: string; truncated: boolean } => {
  const header = `The user selected these lines as an instruction:\n${selectionText}`;
  if (file.text.length <= INQUIRE_CONTEXT_LIMIT) {
    return { content: `Language: ${file.languageId}\n\nFull file:\n${file.text}\n\n${header}`, truncated: false };
  }
  const prefix = file.text.slice(Math.max(0, file.offset - INQUIRE_PREFIX_CHARS), file.offset);
  const suffix = file.text.slice(file.offset, file.offset + INQUIRE_SUFFIX_CHARS);
  return {
    content: `Language: ${file.languageId}\n\nFile excerpt around the selection:\n${prefix}<CURSOR>${suffix}\n\n${header}`,
    truncated: true,
  };
};

// ----------------------------- Migration ----------------------------- //

// Decide what the one-time pre-catalog migration should do, given the current storage state. Returns
// null = no-op. The zen-slot-present check is the idempotency guard: once migrated the zen slot
// exists, so every later activate plans nothing and the legacy key can never be lost or double-copied.
// The caller performs the plan (store the zen key, optionally record the model, delete the legacy slot).
export const planLegacyMigration = (
  state: { zenKeyPresent: boolean; legacyKey?: string; legacyModel?: string },
): { storeZenKey: string; setModel?: string } | null => {
  if (state.zenKeyPresent || !state.legacyKey) return null;
  return { storeZenKey: state.legacyKey, ...(state.legacyModel ? { setModel: state.legacyModel } : {}) };
};
