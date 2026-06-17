// ---------------- catalog.test.ts — pure Provider-catalog helpers ---------------- //

import { describe, it, expect } from 'vitest';
import {
  resolveModel, resolveBaseUrl, buildInquiryContent, planLegacyMigration,
  buildEditPrompt, extractEditText,
  CUSTOM_ID, INQUIRE_CONTEXT_LIMIT, type Provider,
} from './catalog';

// Minimal Provider builder so each test states only the fields it cares about.
const provider = (over: Partial<Provider> = {}): Provider => ({
  id: 'opencode-zen', label: 'Zen', baseUrl: 'https://opencode.ai/zen/go/v1',
  defaultModel: 'minimax-m3', apiKeyEnv: 'OPENCODE_API_KEY', ...over,
});

describe('resolveModel', () => {
  it('returns the provider\'s remembered model when the map has one', () => {
    expect(resolveModel({ 'opencode-zen': 'gpt-4o-mini' }, provider())).toBe('gpt-4o-mini');
  });

  it('falls back to the native default when the provider has no remembered model', () => {
    expect(resolveModel({ groq: 'llama-3.3' }, provider({ defaultModel: 'minimax-m3' }))).toBe('minimax-m3');
  });

  // Empty-string memory must not win — the original uses `||`, so '' degrades to the default.
  it('falls back to the default when the remembered value is an empty string', () => {
    expect(resolveModel({ 'opencode-zen': '' }, provider({ defaultModel: 'minimax-m3' }))).toBe('minimax-m3');
  });
});

describe('resolveBaseUrl', () => {
  // A built-in uses its hardcoded catalog URL and ignores the user's wisp.baseUrl entirely —
  // this is the key-redirect defense: a workspace cannot point a built-in at another endpoint.
  it('returns the built-in\'s hardcoded baseUrl, ignoring the custom one', () => {
    const p = provider({ id: 'groq', baseUrl: 'https://api.groq.com/openai/v1' });
    expect(resolveBaseUrl(p, 'https://evil.example/v1')).toBe('https://api.groq.com/openai/v1');
  });

  it('returns the user-supplied baseUrl only for the Custom provider', () => {
    const p = provider({ id: CUSTOM_ID, baseUrl: '' });
    expect(resolveBaseUrl(p, 'https://my-proxy.local/v1')).toBe('https://my-proxy.local/v1');
  });

  it('returns empty string for Custom when no baseUrl is set', () => {
    expect(resolveBaseUrl(provider({ id: CUSTOM_ID, baseUrl: '' }), '')).toBe('');
  });
});

describe('buildInquiryContent', () => {
  // Under the limit: the whole file goes in verbatim, untruncated.
  it('embeds the whole file when under the context limit', () => {
    const out = buildInquiryContent({ text: 'hello world', languageId: 'typescript', offset: 0 }, 'line 2');
    expect(out).toEqual({
      content: 'Language: typescript\n\nFull file:\nhello world\n\nThe user selected these lines as an instruction:\nline 2',
      truncated: false,
    });
  });

  // The limit is inclusive (`<=`), so a file exactly at the limit is still sent whole.
  it('still sends the whole file at exactly the limit', () => {
    const text = 'x'.repeat(INQUIRE_CONTEXT_LIMIT);
    expect(buildInquiryContent({ text, languageId: 'js', offset: 0 }, 'sel').truncated).toBe(false);
  });

  // Over the limit: fall back to a window of 24000 chars before the caret and 6000 after, marked
  // with <CURSOR>, instead of overflowing the model context.
  it('windows around the caret when over the limit', () => {
    const text = 'a'.repeat(30000) + 'b'.repeat(10000); // 40000 > limit
    const out = buildInquiryContent({ text, languageId: 'go', offset: 30000 }, 'do X');
    expect(out.truncated).toBe(true);
    expect(out.content).toContain('File excerpt around the selection:');
    expect(out.content).toContain(`${'a'.repeat(24000)}<CURSOR>${'b'.repeat(6000)}`);
    expect(out.content).toContain('The user selected these lines as an instruction:\ndo X');
  });
});

describe('planLegacyMigration', () => {
  // Idempotency: once the zen slot exists the migration already ran, so a re-run plans nothing —
  // even if a stray legacy key is still readable. This is what makes it safe to run on every activate.
  it('is a no-op when the zen key slot already exists', () => {
    expect(planLegacyMigration({ zenKeyPresent: true, legacyKey: 'sk-old', legacyModel: 'minimax-m3' })).toBeNull();
  });

  it('is a no-op when there is no legacy key to migrate', () => {
    expect(planLegacyMigration({ zenKeyPresent: false, legacyKey: undefined, legacyModel: 'minimax-m3' })).toBeNull();
  });

  it('plans a key + model copy when a legacy key exists and zen has none', () => {
    expect(planLegacyMigration({ zenKeyPresent: false, legacyKey: 'sk-old', legacyModel: 'minimax-m3' }))
      .toEqual({ storeZenKey: 'sk-old', setModel: 'minimax-m3' });
  });

  it('omits the model when no legacy model is remembered', () => {
    expect(planLegacyMigration({ zenKeyPresent: false, legacyKey: 'sk-old', legacyModel: undefined }))
      .toEqual({ storeZenKey: 'sk-old' });
  });
});

describe('extractEditText', () => {
  // Bare code (the happy path) passes straight through.
  it('passes bare code through unchanged', () => {
    expect(extractEditText('const x = 1')).toBe('const x = 1');
  });

  // A model that wraps its reply in a ``` fence despite instructions → unwrap it.
  it('strips a wrapping ``` fence', () => {
    expect(extractEditText('```ts\nconst x = 1\n```')).toBe('const x = 1');
  });

  // Reasoning models emit a <think>…</think> block before the answer → drop it.
  it('strips a <think> reasoning block', () => {
    expect(extractEditText('<think>plan the change</think>const x = 1')).toBe('const x = 1');
  });

  // Unterminated <think> = the token budget ran out mid-thought, no answer yet → insert nothing.
  it('returns empty string for an unterminated <think>', () => {
    expect(extractEditText('<think>still thinking')).toBe('');
  });
});

describe('buildEditPrompt', () => {
  // The request is a system message (the edit rules) then a user message (the work).
  it('returns a system message then a user message', () => {
    const msgs = buildEditPrompt({ selectionText: 'a', instruction: 'b', languageId: 'ts', context: 'c' });
    expect(msgs.map((m) => m.role)).toEqual(['system', 'user']);
  });

  // The user message carries the four inputs the model needs to do the edit.
  it('puts language, context, target span and instruction in the user message', () => {
    const [, user] = buildEditPrompt({
      selectionText: 'const x = 1', instruction: 'make it 2', languageId: 'typescript', context: 'const x = 1\n',
    });
    expect(user.content).toContain('typescript');
    expect(user.content).toContain('const x = 1');
    expect(user.content).toContain('make it 2');
  });

  // The system message must constrain the model to return ONLY the rewritten span.
  it('tells the model to return only the rewritten span', () => {
    const [system] = buildEditPrompt({ selectionText: '', instruction: 'x', languageId: 'js', context: '' });
    expect(system.content.toLowerCase()).toContain('only');
  });

  // Empty span (no selection → a blank current line) still produces a valid two-message request.
  it('handles an empty target span', () => {
    const msgs = buildEditPrompt({ selectionText: '', instruction: 'add a header', languageId: 'md', context: '' });
    expect(msgs).toHaveLength(2);
    expect(msgs[1].content).toContain('add a header');
  });
});
