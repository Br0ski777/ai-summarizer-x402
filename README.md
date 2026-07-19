# AI Text Summarizer API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://ai-summarizer.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

AI text and URL summarizer -- key points, word count reduction, reading time. Fast extractive summaries for agents. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "ai-summarizer": {
      "url": "https://ai-summarizer.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl -X POST "https://ai-summarizer.api.klymax402.com/api/summarize" \
  -H "Content-Type: application/json" \
  -d '{"text":"..."}'
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `ai_summarize_text` | POST | `/api/summarize` | $0.03 | Summarize raw text into key points |
| `ai_summarize_url` | GET | `/api/summarize` | $0.04 | Fetch a URL and summarize its content |

### `ai_summarize_text`

Use this when you need to summarize long text into concise key points. Returns a structured summary with bullet points and reading metrics.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `text` | string | yes | The text to summarize |
| `maxLength` | number | no | Maximum summary length in words (default 200) |

**Returns**

- `summary` -- condensed text summary (respects maxLength)
- `keyPoints` -- array of 3-7 extracted key takeaways
- `wordCountOriginal` -- word count of input text
- `wordCountSummary` -- word count of output summary
- `reductionPercent` -- percentage of text reduced (e.g. 78%)
- `readingTimeMinutes` -- estimated reading time for the summary

Example response:

```json
{"summary":"The article discusses...","keyPoints":["AI adoption grew 40%","Enterprise spending up"],"wordCountOriginal":2500,"wordCountSummary":180,"reductionPercent":92,"readingTimeMinutes":1}
```

**When to use**: presenting lengthy content to users. Essential for digesting articles, reports, meeting notes, or documentation into actionable summaries.

### `ai_summarize_url`

Use this when you need to summarize a web page by URL. Fetches the page, extracts text, and returns a structured summary with key points and reading metrics.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | URL of the web page to summarize |
| `maxLength` | number | no | Maximum summary length in words (default 200) |

**Returns**

- `summary` -- condensed text summary of the page content
- `keyPoints` -- array of 3-7 key takeaways from the page
- `wordCountOriginal` -- word count of the full page text
- `wordCountSummary` -- word count of the summary
- `reductionPercent` -- percentage of content reduced
- `readingTimeMinutes` -- estimated reading time for the summary
- `title` -- page title extracted from HTML

Example response:

```json
{"title":"OpenAI Blog","summary":"The post announces...","keyPoints":["GPT-5 launches Q3","API pricing drops 50%"],"wordCountOriginal":4200,"wordCountSummary":200,"reductionPercent":95,"readingTimeMinutes":1}
```

**When to use**: citing or referencing web articles. Essential for quickly understanding web pages without reading the full content.

## Example agent prompts

- "Summarize long text into concise key points"
- "Summarize a web page by URL"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
