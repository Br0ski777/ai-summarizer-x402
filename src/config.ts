import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "ai-summarizer",
  slug: "ai-summarizer",
  description: "Summarize long text or web pages into concise key points. Extractive AI summarization.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/summarize",
      price: "$0.01",
      description: "Summarize raw text into key points",
      toolName: "ai_summarize_text",
      toolDescription: "Use this when you need to summarize long text or a web page into concise key points. Accepts raw text or URL. Returns summary, key points, word count reduction, reading time. Powered by AI. Do NOT use for full content extraction — use web_scrape_to_markdown. Do NOT use for SEO analysis — use seo_audit_page.",
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
      toolDescription: "Use this when you need to summarize a web page by URL. Fetches the page, extracts text, and returns a concise summary with key points, word count reduction, and reading time. Do NOT use for full content extraction — use web_scrape_to_markdown. Do NOT use for SEO analysis — use seo_audit_page.",
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
