// ----------------- chatProvider.ts — Wisp as a VS Code Language Model Chat Provider ----------------- //

/*
 * Depends on:
 *   - vscode: the finalized (1.104+) Language Model Chat Provider API — registers Wisp's keyed
 *     Providers as selectable models in the native chat / Ctrl+I picker and streams their replies.
 *   - openai: the streamed chat client, built per-Provider by the injected clientFor (same
 *     OpenAI-compatible pattern Inquire uses, with stream: true).
 *   - ./catalog: Provider type + resolveModel + buildChatModelInfos (the vscode-free descriptor
 *     builder, unit-tested) — this file is only the vscode/openai glue around it.
 *
 * Design: an ADDITIONAL surface only. Inquire stays the primary feature and is untouched; this just
 * exposes the same {baseUrl, key, model} backends through VS Code's native chat. extension.ts owns the
 * key handling (SecretStorage) and injects per-Provider resolvers, so this module reads no secrets and
 * adds no key-redirect surface — built-in base URLs stay hardcoded in the catalog.
 *
 * Data shapes:
 *   - ChatProviderDeps: the seam to extension.ts — the catalog, the current model-map/baseUrl getters,
 *     and async per-Provider key/client resolvers.
 *   - ChatMsg: one OpenAI chat message; a single-role union (like catalog.EditMessage) so the array
 *     stays assignable to the SDK's params without a cast.
 */

import * as vscode from 'vscode';
import OpenAI from 'openai';
import { Provider, resolveModel, buildChatModelInfos } from './catalog';

// ----------------------------- Dependencies ----------------------------- //

// The seam to extension.ts. Key/client resolution lives there (it reads SecretStorage); this module is
// handed the catalog plus pure getters so it never touches secrets or config directly.
export type ChatProviderDeps = {
  providers: Provider[];
  modelMap: () => Record<string, string>;          // current per-Provider model memory
  customBaseUrl: () => string;                      // wisp.baseUrl (only Custom resolves from it)
  keyFor: (provider: Provider) => Promise<string>;  // resolved key, '' when none
  clientFor: (provider: Provider) => Promise<OpenAI | undefined>; // built {baseUrl, key} client
  log: (message: string) => void;
};

// ----------------------------- Message mapping ----------------------------- //

// One OpenAI chat message. Native chat only ever sends User/Assistant turns, so the union has just the
// two roles we emit; single-role members keep the array assignable to the SDK's params without a cast.
type ChatMsg = { role: 'user'; content: string } | { role: 'assistant'; content: string };

// Convert the native chat turns into OpenAI messages. Only text parts are carried — tool-call /
// tool-result / data parts are out of scope for this surface and dropped. Role 2 is Assistant; every
// other role (User) maps to 'user'.
const toOpenAiMessages = (messages: readonly vscode.LanguageModelChatRequestMessage[]): ChatMsg[] =>
  messages.map((m) => {
    const content = m.content
      .filter((part): part is vscode.LanguageModelTextPart => part instanceof vscode.LanguageModelTextPart)
      .map((part) => part.value)
      .join('');
    return m.role === vscode.LanguageModelChatMessageRole.Assistant
      ? { role: 'assistant', content }
      : { role: 'user', content };
  });

// ----------------------------- Provider ----------------------------- //

// Implements the three LanguageModelChatProvider methods over Wisp's catalog. The model `id` we
// advertise IS the Provider id, so the response/token methods map it straight back to a Provider.
const makeProvider = (deps: ChatProviderDeps): vscode.LanguageModelChatProvider => ({
  // Advertise one model per usable Provider. Key presence is async (SecretStorage) so resolve it for
  // every Provider first, then hand the plain facts to the pure builder, which owns the usability rules.
  provideLanguageModelChatInformation: async () => {
    const keyedPairs = await Promise.all(
      deps.providers.map(async (p) => [p.id, !!(await deps.keyFor(p))] as const),
    );
    const keyed = Object.fromEntries(keyedPairs);
    return buildChatModelInfos(deps.providers, {
      keyed,
      modelMap: deps.modelMap(),
      customBaseUrl: deps.customBaseUrl(),
    });
  },

  // Stream the reply: resolve the picked Provider's client + model, then forward each content delta as
  // a text part. Cancellation is bridged to an AbortController so the HTTP stream dies with the request.
  provideLanguageModelChatResponse: async (model, messages, _options, progress, token) => {
    const provider = deps.providers.find((p) => p.id === model.id);
    if (!provider) return;
    const client = await deps.clientFor(provider);
    if (!client) return; // only usable models are advertised, so this is the rare key-revoked race
    const modelId = resolveModel(deps.modelMap(), provider);

    const controller = new AbortController();
    token.onCancellationRequested(() => controller.abort());

    try {
      const stream = await client.chat.completions.create(
        { model: modelId, messages: toOpenAiMessages(messages), stream: true },
        { signal: controller.signal },
      );
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) progress.report(new vscode.LanguageModelTextPart(delta));
      }
    } catch (err) {
      if (controller.signal.aborted) return; // user cancelled — normal, not a failure
      deps.log(`[error] chat ${provider.id} ${String(err)}`);
      throw err; // surface real failures to VS Code's chat UI
    }
  },

  // No tokenizer dependency: a ~4-chars-per-token heuristic is enough for the picker's budgeting.
  provideTokenCount: async (_model, text) => {
    const str = typeof text === 'string' ? text : toOpenAiMessages([text]).map((m) => m.content).join('');
    return Math.ceil(str.length / 4);
  },
});

// Register Wisp as the 'wisp' chat-model vendor (matches contributes.languageModelChatProviders in
// package.json). Returns the Disposable for the caller to push onto context.subscriptions.
export const registerWispChatProvider = (deps: ChatProviderDeps): vscode.Disposable =>
  vscode.lm.registerLanguageModelChatProvider('wisp', makeProvider(deps));
