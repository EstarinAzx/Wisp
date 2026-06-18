// ----------------- codexClient.ts — Wisp: Codex Responses request + SSE→text ----------------- //

/*
 * Depends on:
 *   - node fetch/AbortSignal: the live HTTP call to the Codex Responses endpoint. The OpenAI SDK is NOT
 *     used here — Codex speaks the Responses API (events, not chat completions), so this is a raw fetch.
 *   - ./catalog: the pure cores — buildCodexResponsesBody (request shape), reduceResponsesTextEvents
 *     (SSE-events→text), CodexCreds + EditMessage types. The IO lives here; the logic is unit-tested there.
 *
 * Data shapes:
 *   - The request body is buildCodexResponsesBody's output (model/instructions/input/store/stream).
 *   - The response is an SSE stream of `event:`/`data:` blocks; parseSseEvents splits it into the
 *     CodexResponsesEvent[] the pure reducer consumes.
 */

import { CodexCreds, EditMessage, buildCodexResponsesBody, codexReasoning, reduceResponsesTextEvents, type CodexResponsesEvent } from './catalog';

// ----------------------------- SSE parsing ----------------------------- //

// Split a Codex Responses SSE body into events. Each event is a blank-line-separated block of `event:`
// and `data:` lines; we pair the event name with its JSON data and drop keep-alives / [DONE] / unparseable
// blocks. The whole body is read before parsing — Inquire is non-streaming UX (spinner → diff), so there
// is no need for incremental token delivery here.
const parseSseEvents = (body: string): CodexResponsesEvent[] => {
  const events: CodexResponsesEvent[] = [];
  for (const block of body.split('\n\n')) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const eventLine = lines.find((l) => l.startsWith('event:'));
    const dataLines = lines.filter((l) => l.startsWith('data:'));
    if (!eventLine || dataLines.length === 0) continue;
    const raw = dataLines.map((l) => l.slice('data:'.length).trim()).join('\n');
    if (raw === '[DONE]') continue;
    try { events.push({ event: eventLine.slice('event:'.length).trim(), data: JSON.parse(raw) }); } catch { /* skip non-JSON block */ }
  }
  return events;
};

// ----------------------------- Request ----------------------------- //

// Run one Inquire edit through the Codex Responses backend and return the model's reply text.
// Bearer = the OAuth access token (the subscription path against chatgpt.com/backend-api/codex); the
// exchanged apiKey is only a fallback. The CLI-identifying headers (account id, originator, OpenAI-Beta,
// session_id) mirror the Codex CLI so the backend accepts the request. Errors carry the status + body so
// a failed live round-trip is diagnosable.
export const codexInquire = async (args: {
  creds: CodexCreds;
  baseUrl: string;
  model: string;
  messages: EditMessage[];
  signal?: AbortSignal;
}): Promise<string> => {
  const bearer = args.creds.accessToken || args.creds.apiKey;
  if (!bearer) throw new Error('Not signed in to Codex.');
  // The Codex backend requires the account id — fail early with an actionable message rather than send
  // a header-less request and get an opaque 401/403.
  if (!args.creds.accountId) throw new Error('Codex account id missing — sign out and sign in to Codex again.');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Authorization': `Bearer ${bearer}`,
    'chatgpt-account-id': args.creds.accountId,
    'OpenAI-Beta': 'responses=experimental',
    'originator': 'codex_cli_rs',
    'session_id': crypto.randomUUID(),
  };

  const res = await fetch(`${args.baseUrl}/responses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildCodexResponsesBody({ model: args.model, messages: args.messages, reasoning: codexReasoning(args.model) })),
    signal: args.signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Codex API error ${res.status}${body.trim() ? `: ${body.trim().slice(0, 500)}` : '.'}`);
  }
  return reduceResponsesTextEvents(parseSseEvents(await res.text()));
};
