// ---------------- anthropic.test.ts — pure Anthropic OAuth Provider helpers ---------------- //

import { describe, it, expect } from 'vitest';
import {
  isAnthropicProvider, isAnthropicSignedIn,
  tokensToAnthropicCreds, shouldRefreshAnthropicToken, parseAnthropicCreds,
  base64url, codeVerifier, codeChallenge, oauthState,
  anthropicFingerprint, anthropicAttribution,
  buildAnthropicMessagesBody, reduceAnthropicTextEvents, anthropicModelCaps,
  type Provider, type SseEvent,
} from './catalog';
import { anthropicMessagesHeaders } from './anthropicClient';

const provider = (over: Partial<Provider> = {}): Provider => ({
  id: 'anthropic', label: 'Claude', baseUrl: 'https://api.anthropic.com',
  defaultModel: 'claude-opus-4-8', apiKeyEnv: '', ...over,
});

describe('isAnthropicProvider', () => {
  it('is true for a row whose kind is anthropic-oauth', () => {
    expect(isAnthropicProvider(provider({ kind: 'anthropic-oauth' }))).toBe(true);
  });

  // Absent kind defaults to openai-chat; the Codex row stays distinct — both must read non-anthropic.
  it('is false for absent kind, openai-chat, and codex', () => {
    expect(isAnthropicProvider(provider({ kind: undefined }))).toBe(false);
    expect(isAnthropicProvider(provider({ kind: 'openai-chat' }))).toBe(false);
    expect(isAnthropicProvider(provider({ kind: 'codex' }))).toBe(false);
  });
});

describe('isAnthropicSignedIn', () => {
  // Anthropic has no API key — usable == a bearer access token is present.
  it('is true when an access token is present', () => {
    expect(isAnthropicSignedIn({ accessToken: 'at', refreshToken: 'rt' })).toBe(true);
  });

  // A `{}` tombstone (written on sign-out) and a refresh-only blob both read as signed-out.
  it('is false for undefined, the tombstone, and a bearer-less blob', () => {
    expect(isAnthropicSignedIn(undefined)).toBe(false);
    expect(isAnthropicSignedIn({})).toBe(false);
    expect(isAnthropicSignedIn({ refreshToken: 'rt' })).toBe(false);
  });
});

describe('tokensToAnthropicCreds', () => {
  // expires_in (seconds, relative) becomes an absolute expiresAt (epoch ms) against the injected clock —
  // Anthropic tokens carry no JWT exp, so the deadline must be computed at exchange time and stored.
  it('computes expiresAt from expires_in against the supplied clock', () => {
    expect(tokensToAnthropicCreds({ access_token: 'at', refresh_token: 'rt', expires_in: 3600 }, 1000))
      .toEqual({ accessToken: 'at', refreshToken: 'rt', expiresAt: 1000 + 3_600_000 });
  });

  // No expires_in → no expiresAt key (time-based refresh simply never fires; a live 401 still recovers).
  it('omits expiresAt when expires_in is absent', () => {
    expect(tokensToAnthropicCreds({ access_token: 'at', refresh_token: 'rt' }, 1000))
      .toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });
});

describe('shouldRefreshAnthropicToken', () => {
  const now = 1_000_000_000_000; // fixed clock so the 5-minute skew window is deterministic

  // Refresh once the token is within 5 minutes of expiry, so it can't die mid-request.
  it('is true when expiry is inside the 5-minute skew window', () => {
    expect(shouldRefreshAnthropicToken({ expiresAt: now + 200_000 }, now)).toBe(true);
  });

  // The boundary is inclusive — exactly 5 minutes out still refreshes.
  it('is true exactly at the 5-minute boundary', () => {
    expect(shouldRefreshAnthropicToken({ expiresAt: now + 5 * 60_000 }, now)).toBe(true);
  });

  it('is false when expiry is well past the skew window', () => {
    expect(shouldRefreshAnthropicToken({ expiresAt: now + 3_600_000 }, now)).toBe(false);
  });

  // No deadline → can't prove staleness, so don't force a refresh that might block a working token.
  it('is false when there is no expiresAt', () => {
    expect(shouldRefreshAnthropicToken({}, now)).toBe(false);
  });
});

describe('parseAnthropicCreds', () => {
  // A corrupt slot reads as "no creds" rather than throwing — the read path must never crash sign-in state.
  it('returns undefined for absent, empty, and non-JSON slots', () => {
    expect(parseAnthropicCreds(undefined)).toBeUndefined();
    expect(parseAnthropicCreds('')).toBeUndefined();
    expect(parseAnthropicCreds('not-json')).toBeUndefined();
  });

  // The `{}` tombstone parses to an empty object (which isAnthropicSignedIn reads as signed-out).
  it('parses a tombstone to an empty object and a real bundle to its creds', () => {
    expect(parseAnthropicCreds('{}')).toEqual({});
    expect(parseAnthropicCreds('{"accessToken":"at","refreshToken":"rt"}'))
      .toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });
});

describe('base64url', () => {
  // No '+'/'/' and no '=' padding — the form PKCE and the authorize URL require.
  it('encodes URL-safe with padding stripped', () => {
    expect(base64url(Buffer.from([0xff, 0xff, 0xff]))).toBe('____');
    expect(base64url(Buffer.from([0xff]))).toBe('_w');
  });
});

describe('codeChallenge', () => {
  // RFC 7636 Appendix B test vector: the S256 challenge of this verifier is deterministic.
  it('derives the S256 base64url challenge (RFC 7636 vector)', async () => {
    expect(await codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'))
      .toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('codeVerifier / oauthState', () => {
  // Both are 32 random bytes as base64url → 43 url-safe chars, no padding.
  it('produce 43-char URL-safe strings', () => {
    expect(codeVerifier()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(oauthState()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe('anthropicFingerprint', () => {
  // The Claude Code client fingerprint the backend recomputes + validates: 3 hex chars of
  // sha256(salt + msg[4] + msg[7] + msg[20] + version). Vectors computed independently from the spec.
  it('samples chars 4/7/20 and hashes with the salt + version', () => {
    expect(anthropicFingerprint('hello world', '0.19.0')).toBe('ad2');
  });

  // Missing indices substitute '0' — an empty message samples '000'.
  it('substitutes 0 for out-of-range indices', () => {
    expect(anthropicFingerprint('', '0.19.0')).toBe('784');
  });
});

describe('anthropicAttribution', () => {
  // The first system block openclaude sends — carries the validated fingerprint. No cch (native
  // attestation unreproducible/unenforced), no cc_workload for an interactive run.
  it('builds the x-anthropic-billing-header attribution string', () => {
    expect(anthropicAttribution('hello world', '0.19.0'))
      .toBe('x-anthropic-billing-header: cc_version=0.19.0.ad2; cc_entrypoint=cli;');
  });
});

describe('buildAnthropicMessagesBody', () => {
  // Inquire sends system+user: Anthropic carries the system prompt top-level (a block array), NOT as a
  // message role, so the system text moves to `system` and only the user turn stays in `messages`. The
  // attribution rides as the FIRST system block, its fingerprint derived from the first user message.
  it('moves the system turn to a top-level block after the attribution', () => {
    const body = buildAnthropicMessagesBody({
      model: 'claude-opus-4-8', maxTokens: 16_000, version: '0.19.0',
      messages: [{ role: 'system', content: 'rules' }, { role: 'user', content: 'edit this' }],
    });
    expect(body).toEqual({
      model: 'claude-opus-4-8',
      max_tokens: 16_000,
      system: [
        { type: 'text', text: anthropicAttribution('edit this', '0.19.0') },
        { type: 'text', text: 'rules' },
      ],
      messages: [{ role: 'user', content: 'edit this' }],
    });
  });

  // Native chat carries no system turn (VS Code's chat API has no System role) — the system block is then
  // the attribution alone, and assistant turns ride through in order for a multi-turn conversation.
  it('keeps user/assistant turns and emits an attribution-only system when there is no system turn', () => {
    const body = buildAnthropicMessagesBody({
      model: 'claude-sonnet-4-6', maxTokens: 8_000, version: '0.19.0',
      messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }, { role: 'user', content: 'more' }],
    });
    expect(body.system).toEqual([{ type: 'text', text: anthropicAttribution('hi', '0.19.0') }]);
    expect(body.messages).toEqual([
      { role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }, { role: 'user', content: 'more' },
    ]);
  });

  // The streaming path needs stream:true on the body; the non-streaming (Inquire) path must omit it.
  it('adds stream:true only when asked', () => {
    const streamed = buildAnthropicMessagesBody({ model: 'm', maxTokens: 1, version: 'v', stream: true, messages: [{ role: 'user', content: 'x' }] });
    expect(streamed.stream).toBe(true);
    const plain = buildAnthropicMessagesBody({ model: 'm', maxTokens: 1, version: 'v', messages: [{ role: 'user', content: 'x' }] });
    expect('stream' in plain).toBe(false);
  });
});

describe('reduceAnthropicTextEvents', () => {
  // The streaming shape: answer text arrives as a run of content_block_delta events whose delta is a
  // text_delta — concatenate them in order. anthropicStream yields the same fragments live.
  it('concatenates text_delta fragments in order', () => {
    expect(reduceAnthropicTextEvents([
      { event: 'content_block_delta', data: { delta: { type: 'text_delta', text: 'Hel' } } },
      { event: 'content_block_delta', data: { delta: { type: 'text_delta', text: 'lo' } } },
    ])).toBe('Hello');
  });

  // Lifecycle events (message_start, content_block_start/stop, ping, message_delta/stop) and a tool_use's
  // input_json_delta are not answer text — ignored by the text reducer.
  it('ignores lifecycle events and non-text deltas', () => {
    expect(reduceAnthropicTextEvents([
      { event: 'message_start', data: { message: {} } },
      { event: 'content_block_start', data: { content_block: { type: 'text' } } },
      { event: 'ping', data: { type: 'ping' } },
      { event: 'content_block_delta', data: { delta: { type: 'input_json_delta', partial_json: '{"a":' } } },
      { event: 'content_block_delta', data: { delta: { type: 'text_delta', text: 'real' } } },
      { event: 'content_block_stop', data: { index: 0 } },
      { event: 'message_delta', data: { delta: { stop_reason: 'end_turn' } } },
      { event: 'message_stop', data: {} },
    ])).toBe('real');
  });

  // An `error` SSE event is a backend failure — surface its message rather than returning partial text.
  it('throws with the backend message on an error event', () => {
    expect(() => reduceAnthropicTextEvents([
      { event: 'error', data: { error: { type: 'overloaded_error', message: 'boom' } } },
    ])).toThrow('boom');
  });

  // A malformed non-string text must be skipped, not coerced ('[object Object]' / '5').
  it('ignores a non-string text', () => {
    expect(reduceAnthropicTextEvents([
      { event: 'content_block_delta', data: { delta: { type: 'text_delta', text: 5 } } },
      { event: 'content_block_delta', data: { delta: { type: 'text_delta', text: 'real' } } },
    ] as SseEvent[])).toBe('real');
  });

  it('returns empty string for no events', () => {
    expect(reduceAnthropicTextEvents([])).toBe('');
  });
});

describe('anthropicModelCaps', () => {
  // The OAuth Messages path has no models.dev catalogKey, so without this the chat picker would show the
  // neutral default window. Per the model spec: Opus/Sonnet 4.x are 1M context (Opus 128K output, Sonnet
  // 64K), Haiku 4.5 is 200K/64K; all multimodal (vision).
  it('returns the 1M window for Opus/Sonnet and 200K for Haiku, vision capable', () => {
    expect(anthropicModelCaps('claude-opus-4-8')).toEqual({ contextInput: 1_000_000, maxOutput: 128_000, vision: true });
    expect(anthropicModelCaps('claude-sonnet-4-6')).toEqual({ contextInput: 1_000_000, maxOutput: 64_000, vision: true });
    expect(anthropicModelCaps('claude-haiku-4-5')).toEqual({ contextInput: 200_000, maxOutput: 64_000, vision: true });
  });
});

describe('anthropicMessagesHeaders', () => {
  // The client recognition signals: the comma-joined anthropic-beta MUST carry both claude-code-20250219
  // (the primary gate) and oauth-2025-04-20 (the OAuth path), plus the claude-cli User-Agent and the
  // Bearer — without these the subscription backend throttles a valid token to a synthetic 429.
  it('carries the oauth beta, the claude-code gate, and the bearer', () => {
    const h = anthropicMessagesHeaders('tok');
    expect(h['anthropic-beta']).toContain('oauth-2025-04-20');
    expect(h['anthropic-beta']).toContain('claude-code-20250219');
    expect(h['anthropic-version']).toBe('2023-06-01');
    expect(h['User-Agent']).toMatch(/^claude-cli\//);
    expect(h['Authorization']).toBe('Bearer tok');
  });

  // The streaming request must accept an event stream; the non-streaming (Inquire) request must not.
  it('adds the event-stream Accept only when streaming', () => {
    expect(anthropicMessagesHeaders('tok', true)['Accept']).toBe('text/event-stream');
    expect('Accept' in anthropicMessagesHeaders('tok')).toBe(false);
  });
});
