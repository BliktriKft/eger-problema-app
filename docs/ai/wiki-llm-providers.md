# Wiki LLM Provider Switch Guide

This document explains how to switch the wiki generation pipeline between
its three supported LLM backends. The selection is a **runtime config
flag**, not a code change or redeploy.

**Module**: `apps/api/src/modules/wiki/wiki-llm.client.ts`
**Flag**: `LLM_PROVIDER`
**Default**: `mock`

## Providers

| Value      | Backend                                                | Key env var      | Model env var  | Default model            |
| ---------- | ------------------------------------------------------ | ---------------- | -------------- | ------------------------ |
| `mock`     | Local Hungarian placeholder (no network)               | _(none)_         | _(none)_       | n/a                      |
| `minimax`  | MiniMax M-series via Anthropic-compatible gateway      | `MINIMAX_API_KEY`| `MINIMAX_MODEL`| `MiniMax-M3`             |
| `claude`   | Official Anthropic SDK                                 | `ANTHROPIC_API_KEY` | `CLAUDE_MODEL` | `claude-3-5-sonnet-latest` |

## How the flag is read

The provider is parsed from `process.env.LLM_PROVIDER` once, in the
`WikiLlmClient` constructor. The value is case-insensitive. Anything
that isn't `mock`, `minimax`, or `claude` falls back to `mock` with a
warning log.

```ts
// wiki-llm.client.ts (excerpt)
const requested = readProviderEnv();       // reads LLM_PROVIDER
const apiKey = this.resolveApiKey(requested);
if (apiKey === null) {
  // missing key → degrade to mock
  this.provider = "mock";
  return;
}
this.provider = requested;
```

## Graceful degradation

The client never throws because of a missing key or a failed API call.
Instead:

1. **Missing key** (e.g. `LLM_PROVIDER=minimax` but `MINIMAX_API_KEY`
   is unset) → log a warning, set `provider = "mock"`. Subsequent
   calls return the Hungarian placeholder.
2. **API call throws** (network down, 4xx/5xx, rate-limit) → log an
   error, return the mock result. The wiki service's downstream
   "every claim must cite a source" validator still passes because
   the mock body always cites the first source URL.

The caller (`WikiService.generate`) cannot tell whether the answer
came from the API or from the mock — except via `result.mocked` and
the `modelVersion` prefix (`mock@…` vs `minimax:…@…` vs `claude:…@…`).

## Switching providers

### Local dev (default — no setup)

```bash
# apps/api/.env
LLM_PROVIDER=mock
```

`wiki:regenerate <id>` returns a Hungarian placeholder. The pipeline
end-to-end is exercised (scrape → mock → persist), no API quota is
spent.

### Switch to MiniMax

1. Provision an API key at the MiniMax Console (link to be added when
   the console is ready; for V1 dev the key is shared via the team's
   password manager).
2. Add to `apps/api/.env`:

   ```bash
   LLM_PROVIDER=minimax
   MINIMAX_API_KEY=sk-minimax-…
   MINIMAX_MODEL=MiniMax-M3
   ```

3. Restart the API (`pnpm --filter @eger/api dev`).
4. Trigger a regeneration and check the `wiki_entries.model_version`
   column — it should start with `minimax:MiniMax-M3@`.

The MiniMax gateway is reached at `https://api.minimax.io/anthropic`.
The Anthropic SDK works against this endpoint unchanged because the
gateway speaks the same protocol.

### Switch to Claude

```bash
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-…
CLAUDE_MODEL=claude-3-5-sonnet-latest
```

Kept for editorial comparison and as a fallback if MiniMax is down.

## Cost & quota notes

- `mock` → free, deterministic. Used in CI.
- `minimax` → billable per the MiniMax contract.
- `claude` → billable per Anthropic's pricing.

Switch to `mock` in any environment where you don't want to spend
quota (CI, PR preview, smoke tests after a deploy).

## CI / preview environments

`apps/api/.env.example` ships with `LLM_PROVIDER=mock`. Production
environments should override this to `minimax` (or `claude`) once the
relevant API key is provisioned.

## Reply format

The system prompt asks the LLM to reply in a strict textual format:

```
TITLE: <cím, max 200 karakter>

BODY:
<markdown szöveg, max 1500 karakter, minden állítás után [1], [2]…>
```

MiniMax tends to obey this exactly. Claude tends to wrap answers in
```json fences. The client tries the textual parser first, falls back
to a tolerant JSON parser, and ultimately throws if neither shape
parses. The throw is caught and converted to a mock result.

## Testing

`apps/api/src/modules/wiki/wiki-llm.client.spec.ts` covers:

- Provider selection under every `LLM_PROVIDER` value (mock /
  minimax / claude / unknown / case-insensitive).
- Graceful degradation when the matching API key is missing or empty.
- End-to-end (mocked SDK) call paths for both `minimax` and `claude`,
  verifying the right `baseURL`, `apiKey`, and `model` arguments are
  passed to the Anthropic SDK.
- Runtime fallback to mock when the API call rejects, returns no
  text block, or returns empty title/body.
- `parseReply` and `parseTextualReply` for the `TITLE:` / `BODY:`
  format, the legacy JSON format, and the textual-format preference.

Total: 27 tests in the wiki module, 43 in the API package.
