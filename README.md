# AI Text Summarizer API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://ai-summarizer.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](#license)

Summarize raw text or any web URL into key points, with compression ratio and reading-time metrics. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) — no API key, no signup.

Part of the [klymax402](https://klymax402.com) marketplace — 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart — MCP

```json
{
  "mcpServers": {
    "ai-summarizer": {
      "url": "https://ai-summarizer.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart — HTTP (x402)

```bash
curl "https://ai-summarizer.api.klymax402.com/api/summarize?url=https://example.com/article"
# → 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client (`@x402/fetch`, [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 → sign → retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `ai_summarize_text` | POST | `/api/summarize` | $0.01 | Summarize raw text into key points |
| `ai_summarize_url` | GET | `/api/summarize` | $0.015 | Fetch a URL and summarize its content |

### `ai_summarize_text`

Use this when you need to summarize long text into concise key points. Returns a structured summary with bullet points and reading metrics.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `text` | string | yes | The text to summarize |
| `maxLength` | number | no | Maximum summary length in words (default 200) |

**Returns**: `summary`, `keyPoints[]` (3-7 extracted takeaways), `wordCountOriginal`, `wordCountSummary`, `reductionPercent`, `readingTimeMinutes`.

Example response:

```json
{"summary":"The article discusses...","keyPoints":["AI adoption grew 40%","Enterprise spending up"],"wordCountOriginal":2500,"wordCountSummary":180,"reductionPercent":92,"readingTimeMinutes":1}
```

**When to use**: before presenting lengthy content to users — digesting articles, reports, meeting notes, or documentation into actionable summaries.

**Not for**: full content extraction (use `web_scrape_to_markdown`), SEO analysis (use `seo_audit_page`), sentiment analysis (use `text_analyze_sentiment`).

### `ai_summarize_url`

Use this when you need to summarize a web page by URL. Fetches the page, extracts text, and returns a structured summary with key points and reading metrics.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | URL of the web page to summarize |
| `maxLength` | number | no | Maximum summary length in words (default 200) |

**Returns**: `summary`, `keyPoints[]`, `wordCountOriginal`, `wordCountSummary`, `reductionPercent`, `readingTimeMinutes`, `title`, `sourceUrl`.

Example response:

```json
{"title":"OpenAI Blog","summary":"The post announces...","keyPoints":["GPT-5 launches Q3","API pricing drops 50%"],"wordCountOriginal":4200,"wordCountSummary":200,"reductionPercent":95,"readingTimeMinutes":1}
```

**When to use**: before citing or referencing web articles — quickly understanding web pages without reading the full content.

**Not for**: full content extraction (use `web_scrape_to_markdown`), SEO analysis (use `seo_audit_page`), screenshot capture (use `capture_screenshot`).

## Example agent prompts

- "Summarize this article in 100 words: https://..."
- "Give me the key points from this text before I include it in my report"
- "Summarize this URL and tell me the reading time"

## Payment

- Protocol: [x402](https://x402.org) — HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents — one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
