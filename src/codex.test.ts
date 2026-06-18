// ---------------- codex.test.ts — pure Codex Provider helpers ---------------- //

import { describe, it, expect } from 'vitest';
import {
  isCodexProvider, isCodexSignedIn,
  buildCodexResponsesBody, reduceResponsesTextEvents, extractResponsesText,
  decodeJwtPayload, parseChatgptAccountId, shouldRefreshCodexToken,
  parseCodexAuthJson, codexReasoning, CODEX_MODELS,
  type Provider, type EditMessage,
} from './catalog';

// A JWT is header.payload.signature; only the payload (base64url JSON) is read. Build one so the
// parse/expiry/account-id helpers have a realistic token without a crypto signature.
const jwt = (payload: Record<string, unknown>): string =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

const provider = (over: Partial<Provider> = {}): Provider => ({
  id: 'codex', label: 'Codex', baseUrl: 'https://chatgpt.com/backend-api/codex',
  defaultModel: 'gpt-5-codex', apiKeyEnv: '', ...over,
});

describe('isCodexProvider', () => {
  it('is true for a row whose kind is codex', () => {
    expect(isCodexProvider(provider({ kind: 'codex' }))).toBe(true);
  });

  // Absent kind defaults to openai-chat — the 10 existing rows carry no kind and must stay non-codex.
  it('is false when kind is absent (defaults to openai-chat)', () => {
    expect(isCodexProvider(provider({ kind: undefined }))).toBe(false);
    expect(isCodexProvider(provider({ kind: 'openai-chat' }))).toBe(false);
  });
});

describe('isCodexSignedIn', () => {
  // Codex needs no API key — it is "usable when signed in", i.e. when a bearer credential exists.
  it('is true when an access token is present', () => {
    expect(isCodexSignedIn({ accessToken: 'at', accountId: 'acc' })).toBe(true);
  });

  it('is true when only an exchanged apiKey is present', () => {
    expect(isCodexSignedIn({ apiKey: 'sk-x', accountId: 'acc' })).toBe(true);
  });

  it('is false for absent or bearer-less credentials', () => {
    expect(isCodexSignedIn(undefined)).toBe(false);
    expect(isCodexSignedIn({})).toBe(false);
    expect(isCodexSignedIn({ refreshToken: 'rt' })).toBe(false);
  });
});

describe('buildCodexResponsesBody', () => {
  // Inquire's buildEditPrompt yields a system + a user message; the Responses API takes the system text
  // as top-level `instructions` and the rest as `input` message items with input_text parts.
  it('maps a system+user prompt to instructions + input', () => {
    const messages: EditMessage[] = [
      { role: 'system', content: 'rules' },
      { role: 'user', content: 'edit this' },
    ];
    expect(buildCodexResponsesBody({ model: 'gpt-5-codex', messages })).toEqual({
      model: 'gpt-5-codex',
      instructions: 'rules',
      input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'edit this' }] }],
      store: false,
      stream: true,
    });
  });

  // No system message → no `instructions` key at all (not an empty string the backend would reject).
  it('omits instructions when there is no system message', () => {
    const body = buildCodexResponsesBody({ model: 'gpt-5-codex', messages: [{ role: 'user', content: 'hi' }] });
    expect('instructions' in body).toBe(false);
    expect(body.input).toEqual([{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hi' }] }]);
  });

  // Reasoning models need a `reasoning` object on the Responses request, or the backend 400s.
  it('includes reasoning when provided', () => {
    const body = buildCodexResponsesBody({ model: 'gpt-5.3-codex', messages: [{ role: 'user', content: 'hi' }], reasoning: { effort: 'medium', summary: 'auto' } });
    expect(body.reasoning).toEqual({ effort: 'medium', summary: 'auto' });
  });

  // Non-reasoning models reject a reasoning object, so it must be omittable entirely.
  it('omits reasoning when not provided', () => {
    const body = buildCodexResponsesBody({ model: 'gpt-4.1', messages: [{ role: 'user', content: 'hi' }] });
    expect('reasoning' in body).toBe(false);
  });
});

describe('codexReasoning', () => {
  // gpt-5 / o-series are reasoning models — send a reasoning object so the Responses call is accepted.
  it('requests reasoning for gpt-5 and o-series models', () => {
    expect(codexReasoning('gpt-5.3-codex')).toEqual({ effort: 'medium', summary: 'auto' });
    expect(codexReasoning('gpt-5.4')).toEqual({ effort: 'medium', summary: 'auto' });
    expect(codexReasoning('o3')).toEqual({ effort: 'medium', summary: 'auto' });
    expect(codexReasoning('o4-mini')).toEqual({ effort: 'medium', summary: 'auto' });
  });

  // The non-reasoning / fast-loop variants must NOT carry reasoning (they reject it).
  it('sends no reasoning for gpt-4.x and spark variants', () => {
    expect(codexReasoning('gpt-4.1')).toBeUndefined();
    expect(codexReasoning('gpt-5.3-codex-spark')).toBeUndefined();
  });
});

describe('CODEX_MODELS', () => {
  // A curated list (no /models route on the Codex backend); it must include the row's default model so
  // the panel dropdown always offers a working pick.
  it('is a non-empty curated list including a current Codex coding model', () => {
    expect(CODEX_MODELS.length).toBeGreaterThan(0);
    expect(CODEX_MODELS).toContain('gpt-5.3-codex');
  });
});

describe('reduceResponsesTextEvents', () => {
  // The streaming path: text arrives as a run of response.output_text.delta events, concatenated in order.
  it('concatenates output_text deltas in order', () => {
    expect(reduceResponsesTextEvents([
      { event: 'response.output_text.delta', data: { delta: 'Hel' } },
      { event: 'response.output_text.delta', data: { delta: 'lo' } },
    ])).toBe('Hello');
  });

  // The terminal response.completed event carries the authoritative full text — prefer it over the
  // accumulated deltas (guards against a dropped/duplicated delta fragment).
  it('prefers the completed payload text over the deltas', () => {
    expect(reduceResponsesTextEvents([
      { event: 'response.output_text.delta', data: { delta: 'partial' } },
      { event: 'response.completed', data: { response: { output: [{ type: 'message', content: [{ type: 'output_text', text: 'FULL' }] }] } } },
    ])).toBe('FULL');
  });

  // A completed event with no text (e.g. a tool-only turn) must not blank the answer — fall back to deltas.
  it('falls back to the deltas when the completed payload has no text', () => {
    expect(reduceResponsesTextEvents([
      { event: 'response.output_text.delta', data: { delta: 'kept' } },
      { event: 'response.completed', data: { response: { output: [] } } },
    ])).toBe('kept');
  });

  // Non-text events (reasoning summaries, item lifecycle) are ignored by the text reducer.
  it('ignores unrelated events', () => {
    expect(reduceResponsesTextEvents([
      { event: 'response.reasoning_summary_text.delta', data: { delta: 'thinking' } },
      { event: 'response.output_item.added', data: { item: { type: 'message' } } },
      { event: 'response.output_text.delta', data: { delta: 'real' } },
    ])).toBe('real');
  });

  // A response.failed event is a backend error — surface its message rather than returning empty text.
  it('throws with the backend message on response.failed', () => {
    expect(() => reduceResponsesTextEvents([
      { event: 'response.failed', data: { response: { error: { message: 'boom' } } } },
    ])).toThrow('boom');
  });

  it('returns empty string for no events', () => {
    expect(reduceResponsesTextEvents([])).toBe('');
  });

  // A later empty terminal event (a stream can emit incomplete-then-completed, or a duplicate) must not
  // blank an answer already captured — only a non-empty payload overwrites.
  it('does not let a later empty terminal event blank the completed text', () => {
    expect(reduceResponsesTextEvents([
      { event: 'response.completed', data: { response: { output: [{ type: 'message', content: [{ type: 'output_text', text: 'FULL' }] }] } } },
      { event: 'response.incomplete', data: { response: { output: [] } } },
    ])).toBe('FULL');
  });

  // A malformed non-string delta must be skipped, not coerced into the text (5 -> '5', {} -> '[object Object]').
  it('ignores a non-string delta', () => {
    expect(reduceResponsesTextEvents([
      { event: 'response.output_text.delta', data: { delta: 5 } },
      { event: 'response.output_text.delta', data: { delta: 'real' } },
    ])).toBe('real');
  });

  // response.incomplete carries a valid (partial) answer the same way response.completed does.
  it('reads text from a response.incomplete terminal event', () => {
    expect(reduceResponsesTextEvents([
      { event: 'response.incomplete', data: { response: { output: [{ type: 'message', content: [{ type: 'output_text', text: 'partial answer' }] }] } } },
    ])).toBe('partial answer');
  });
});

describe('extractResponsesText', () => {
  // A final Responses object: walk output[] messages, join every output_text part's text.
  it('joins output_text parts across message items', () => {
    expect(extractResponsesText({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'A' }, { type: 'output_text', text: 'B' }] }] })).toBe('AB');
  });

  // Reasoning parts and function_call items are not answer text — skip them.
  it('ignores reasoning parts and function_call items', () => {
    expect(extractResponsesText({ output: [
      { type: 'function_call', name: 'edit', arguments: '{}' },
      { type: 'message', content: [{ type: 'reasoning', text: 'no' }, { type: 'output_text', text: 'yes' }] },
    ] })).toBe('yes');
  });

  it('tolerates missing or empty payloads', () => {
    expect(extractResponsesText(undefined)).toBe('');
    expect(extractResponsesText({})).toBe('');
    expect(extractResponsesText({ output: [] })).toBe('');
  });
});

describe('decodeJwtPayload', () => {
  it('decodes the base64url JSON payload', () => {
    expect(decodeJwtPayload(jwt({ sub: 'x', exp: 123 }))).toEqual({ sub: 'x', exp: 123 });
  });

  it('returns undefined for a string that is not a JWT', () => {
    expect(decodeJwtPayload('notajwt')).toBeUndefined();
  });

  it('returns undefined when the payload is not valid JSON', () => {
    expect(decodeJwtPayload('h.@@@.s')).toBeUndefined();
  });
});

describe('parseChatgptAccountId', () => {
  // Codex stows the ChatGPT account id inside the namespaced auth claim of the id/access token.
  it('reads the account id from the nested auth claim', () => {
    expect(parseChatgptAccountId(jwt({ 'https://api.openai.com/auth': { chatgpt_account_id: 'acc_123' } }))).toBe('acc_123');
  });

  // Some token versions carry the id under a flat dotted key rather than the nested object.
  it('reads the account id from the flat dotted claim key', () => {
    expect(parseChatgptAccountId(jwt({ 'https://api.openai.com/auth.chatgpt_account_id': 'acc_flat' }))).toBe('acc_flat');
  });

  it('returns undefined when the token is missing or has no account id', () => {
    expect(parseChatgptAccountId(undefined)).toBeUndefined();
    expect(parseChatgptAccountId(jwt({ sub: 'x' }))).toBeUndefined();
  });
});

describe('shouldRefreshCodexToken', () => {
  const now = 1_000_000_000_000; // fixed clock so the skew window is deterministic
  const expAt = (ms: number): string => jwt({ exp: Math.floor(ms / 1000) });

  // Refresh when the access token expires inside the 60s skew window (about to be invalid mid-request).
  it('is true when the access token expires within the skew window', () => {
    expect(shouldRefreshCodexToken({ accessToken: expAt(now + 30_000) }, now)).toBe(true);
  });

  it('is false when the access token is valid well past the skew window', () => {
    expect(shouldRefreshCodexToken({ accessToken: expAt(now + 3_600_000) }, now)).toBe(false);
  });

  // No parseable expiry → cannot decide it is stale, so don't force a refresh (matches Codex CLI).
  it('is false when no expiry can be parsed', () => {
    expect(shouldRefreshCodexToken({ accessToken: 'garbage' }, now)).toBe(false);
    expect(shouldRefreshCodexToken({}, now)).toBe(false);
  });

  // Falls back to the id token's expiry when the access token carries none.
  it('uses the id token expiry when the access token has none', () => {
    expect(shouldRefreshCodexToken({ accessToken: 'no-exp', idToken: expAt(now + 30_000) }, now)).toBe(true);
  });
});

describe('parseCodexAuthJson', () => {
  // The real ~/.codex/auth.json: a `tokens` block (snake_case) plus a possibly-null OPENAI_API_KEY.
  it('reads the tokens block of a real Codex auth.json', () => {
    expect(parseCodexAuthJson({
      OPENAI_API_KEY: null,
      tokens: { id_token: 'idt', access_token: 'at', refresh_token: 'rt', account_id: 'acc_1' },
      last_refresh: '2026-06-19T00:00:00Z',
    })).toEqual({ accessToken: 'at', refreshToken: 'rt', idToken: 'idt', accountId: 'acc_1' });
  });

  // A bare OPENAI_API_KEY (no OAuth tokens) is still a usable credential.
  it('captures a string OPENAI_API_KEY', () => {
    expect(parseCodexAuthJson({ OPENAI_API_KEY: 'sk-abc', tokens: {} })).toEqual({ apiKey: 'sk-abc' });
  });

  // When tokens.account_id is absent, derive it from the id token's account claim.
  it('derives the account id from the id token when absent', () => {
    const idt = jwt({ 'https://api.openai.com/auth': { chatgpt_account_id: 'acc_jwt' } });
    expect(parseCodexAuthJson({ tokens: { access_token: 'at', id_token: idt } })).toEqual({ accessToken: 'at', idToken: idt, accountId: 'acc_jwt' });
  });

  it('returns undefined when there is no usable credential', () => {
    expect(parseCodexAuthJson({})).toBeUndefined();
    expect(parseCodexAuthJson(null)).toBeUndefined();
    expect(parseCodexAuthJson('nope')).toBeUndefined();
    expect(parseCodexAuthJson({ OPENAI_API_KEY: null, tokens: {} })).toBeUndefined();
  });
});
