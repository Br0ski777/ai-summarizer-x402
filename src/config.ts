import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "ai-summarizer",
  slug: "ai-summarizer",
  description: "AI text and URL summarizer -- key points, word count reduction, reading time. Fast extractive summaries for agents.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/summarize",
      price: "$0.01",
      description: "Summarize raw text into key points",
      toolName: "ai_summarize_text",
      toolDescription: `Use this when you need to summarize long text into concise key points. Returns a structured summary with bullet points and reading metrics.

1. summary: condensed text summary (respects maxLength)
2. keyPoints: array of 3-7 extracted key takeaways
3. wordCountOriginal: word count of input text
4. wordCountSummary: word count of output summary
5. reductionPercent: percentage of text reduced (e.g. 78%)
6. readingTimeMinutes: estimated reading time for the summary

Example output: {"summary":"The article discusses...","keyPoints":["AI adoption grew 40%","Enterprise spending up"],"wordCountOriginal":2500,"wordCountSummary":180,"reductionPercent":92,"readingTimeMinutes":1}

Use this BEFORE presenting lengthy content to users. Essential for digesting articles, reports, meeting notes, or documentation into actionable summaries.

Do NOT use for full content extraction -- use web_scrape_to_markdown. Do NOT use for SEO analysis -- use seo_audit_page. Do NOT use for sentiment analysis -- use text_analyze_sentiment.`,
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "The text to summarize" },
          maxLength: { type: "number", description: "Maximum summary length in words (default 200)" },
        },
        required: ["text"],
      },
    },
    {
      method: "GET",
      path: "/api/summarize",
      price: "$0.015",
      description: "Fetch a URL and summarize its content",
      toolName: "ai_summarize_url",
      toolDescription: `Use this when you need to summarize a web page by URL. Fetches the page, extracts text, and returns a structured summary with key points and reading metrics.

1. summary: condensed text summary of the page content
2. keyPoints: array of 3-7 key takeaways from the page
3. wordCountOriginal: word count of the full page text
4. wordCountSummary: word count of the summary
5. reductionPercent: percentage of content reduced
6. readingTimeMinutes: estimated reading time for the summary
7. title: page title extracted from HTML

Example output: {"title":"OpenAI Blog","summary":"The post announces...","keyPoints":["GPT-5 launches Q3","API pricing drops 50%"],"wordCountOriginal":4200,"wordCountSummary":200,"reductionPercent":95,"readingTimeMinutes":1}

Use this BEFORE citing or referencing web articles. Essential for quickly understanding web pages without reading the full content.

Do NOT use for full content extraction -- use web_scrape_to_markdown. Do NOT use for SEO analysis -- use seo_audit_page. Do NOT use for screenshot capture -- use capture_screenshot.`,
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL of the web page to summarize" },
          maxLength: { type: "number", description: "Maximum summary length in words (default 200)" },
        },
        required: ["url"],
      },
    },
  ],
};
