# AI wiki LLM provider konfiguráció

A wiki kliens az Anthropic SDK-t használja, mert a MiniMax és az OpenRouter is az Anthropic-kompatibilis Messages protokollt támogatja. A kliens nem tartalmaz külön `claude` providert.

## Mock (alapértelmezett)

```env
LLM_PROVIDER=mock
```

API kulcs nélkül is fut, és a magyar placeholder összefoglalót adja. Ez az alapértelmezett fejlesztői viselkedés.

## MiniMax

```env
LLM_PROVIDER=minimax
MINIMAX_API_KEY=...
MINIMAX_MODEL=MiniMax-M3
```

A kliens az `https://api.minimax.io/anthropic` végpontot használja. Kulcs nélkül automatikusan mock fallbackre vált.

## OpenRouter

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=minimax/minimax-m3
```

A kliens az `https://openrouter.ai/api/v1` végpontot használja. Kulcs nélkül automatikusan mock fallbackre vált.

Ha a konfigurált szolgáltató hívása hibázik, a kliens szintén a magyar mock összefoglalóval folytatja, így a wiki generálás helyi tesztelése és a graceful degradation működőképes marad.
