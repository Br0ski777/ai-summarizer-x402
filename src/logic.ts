import type { Hono } from "hono";
import { parse } from "node-html-parser";


// ATXP: requirePayment only fires inside an ATXP context (set by atxpHono middleware).
// For raw x402 requests, the existing @x402/hono middleware handles the gate.
// If neither protocol is active (ATXP_CONNECTION unset), tryRequirePayment is a no-op.
async function tryRequirePayment(price: number): Promise<void> {
  if (!process.env.ATXP_CONNECTION) return;
  try {
    const { requirePayment } = await import("@atxp/server");
    const BigNumber = (await import("bignumber.js")).default;
    await requirePayment({ price: BigNumber(price) });
  } catch (e: any) {
    if (e?.code === -30402) throw e;
  }
}

// ---------------------------------------------------------------------------
// Text extraction from HTML
// ---------------------------------------------------------------------------
function extractTextFromHtml(html: string): string {
  const root = parse(html);
  // Remove script, style, nav, footer, header tags
  for (const tag of ["script", "style", "nav", "footer", "header", "aside", "noscript"]) {
    root.querySelectorAll(tag).forEach((el) => el.remove());
  }
  // Get text from main content areas first, fallback to body
  const main = root.querySelector("main") || root.querySelector("article") || root.querySelector('[role="main"]') || root.querySelector("body");
  if (!main) return root.text.replace(/\s+/g, " ").trim();
  return main.text.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Sentence splitter
// ---------------------------------------------------------------------------
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end
  const raw = text.match(/[^.!?]*[.!?]+[\s]*/g) || [text];
  return raw
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.split(/\s+/).length >= 3);
}

// ---------------------------------------------------------------------------
// TF-IDF lite: word frequency scoring
// ---------------------------------------------------------------------------
function computeWordFrequencies(sentences: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "dare",
    "it", "its", "this", "that", "these", "those", "i", "you", "he", "she",
    "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
    "our", "their", "what", "which", "who", "whom", "where", "when", "why",
    "how", "not", "no", "nor", "as", "if", "then", "than", "too", "very",
    "just", "about", "above", "after", "again", "all", "also", "am", "any",
    "because", "before", "between", "both", "each", "few", "more", "most",
    "other", "some", "such", "into", "over", "own", "same", "so", "up",
    "out", "only", "now", "here", "there", "s", "t", "re", "ve", "ll", "d",
  ]);

  for (const sentence of sentences) {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word)) {
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    }
  }
  return freq;
}

// ---------------------------------------------------------------------------
// Score sentences
// ---------------------------------------------------------------------------
function scoreSentences(sentences: string[], wordFreq: Map<string, number>): { sentence: string; score: number }[] {
  const maxFreq = Math.max(...wordFreq.values(), 1);

  return sentences.map((sentence, index) => {
    let score = 0;

    // 1. Position score: first sentences score higher
    const positionScore = Math.max(0, 1 - index / Math.max(sentences.length, 1));
    score += positionScore * 3;

    // 2. Keyword frequency (TF-IDF lite)
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    let freqSum = 0;
    for (const word of words) {
      freqSum += (wordFreq.get(word) || 0) / maxFreq;
    }
    score += (freqSum / Math.max(words.length, 1)) * 5;

    // 3. Length score: prefer medium-length sentences (not too short, not too long)
    const wordCount = words.length;
    if (wordCount >= 8 && wordCount <= 35) {
      score += 2;
    } else if (wordCount >= 5 && wordCount <= 50) {
      score += 1;
    }

    // 4. Bonus for sentences with numbers (often factual)
    if (/\d/.test(sentence)) {
      score += 1;
    }

    // 5. Bonus for sentences with capitalized words (entities/proper nouns)
    const capitalWords = sentence.match(/[A-Z][a-z]{2,}/g) || [];
    if (capitalWords.length > 0) {
      score += Math.min(capitalWords.length * 0.3, 1.5);
    }

    return { sentence, score };
  });
}

// ---------------------------------------------------------------------------
// Extract key entities/topics
// ---------------------------------------------------------------------------
function extractKeyTopics(text: string, maxTopics: number = 10): string[] {
  // Find frequently occurring capitalized words (potential entities)
  const matches = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
  const freq = new Map<string, number>();
  const stopCapitals = new Set(["The", "This", "That", "These", "Those", "And", "But", "For", "Not", "You", "All", "Can", "Had", "Her", "Was", "One", "Our", "Out", "Are", "His", "How", "Its", "May", "New", "Now", "Old", "See", "Way", "Who", "Did", "Get", "Has", "Him", "Let", "Say", "She", "Too", "Use"]);

  for (const word of matches) {
    if (!stopCapitals.has(word)) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
  }

  return [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopics)
    .map(([word]) => word);
}

// ---------------------------------------------------------------------------
// Summarize
// ---------------------------------------------------------------------------
interface SummaryResult {
  summary: string;
  keyPoints: string[];
  keyTopics: string[];
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  readingTimeMinutes: number;
}

function summarizeText(text: string, maxLength: number = 200): SummaryResult {
  const originalWordCount = text.split(/\s+/).length;
  const readingTimeMinutes = Math.round((originalWordCount / 238) * 10) / 10; // average reading speed

  const sentences = splitSentences(text);

  if (sentences.length === 0) {
    return {
      summary: text.slice(0, maxLength * 6),
      keyPoints: [],
      keyTopics: [],
      originalWordCount,
      summaryWordCount: Math.min(originalWordCount, maxLength),
      compressionRatio: 1,
      readingTimeMinutes,
    };
  }

  const wordFreq = computeWordFrequencies(sentences);
  const scored = scoreSentences(sentences, wordFreq);
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  // Select top sentences to fit maxLength words
  const selected: { sentence: string; score: number; originalIndex: number }[] = [];
  let wordCount = 0;

  for (const item of sorted) {
    const sentenceWords = item.sentence.split(/\s+/).length;
    if (wordCount + sentenceWords <= maxLength) {
      const originalIndex = sentences.indexOf(item.sentence);
      selected.push({ ...item, originalIndex });
      wordCount += sentenceWords;
    }
    if (wordCount >= maxLength) break;
  }

  // Sort selected sentences by their original position for coherent reading
  selected.sort((a, b) => a.originalIndex - b.originalIndex);

  const summary = selected.map((s) => s.sentence).join(" ");
  const summaryWordCount = summary.split(/\s+/).length;

  // Key points: top 5 sentences by score
  const keyPoints = sorted
    .slice(0, 5)
    .map((s) => s.sentence);

  const keyTopics = extractKeyTopics(text);

  return {
    summary,
    keyPoints,
    keyTopics,
    originalWordCount,
    summaryWordCount,
    compressionRatio: Math.round((1 - summaryWordCount / Math.max(originalWordCount, 1)) * 100) / 100,
    readingTimeMinutes,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export function registerRoutes(app: Hono) {
  // POST /api/summarize — summarize raw text
  app.post("/api/summarize", async (c) => {
    await tryRequirePayment(0.01);
    const body = await c.req.json<{ text?: string; maxLength?: number }>();
    if (!body.text || typeof body.text !== "string") {
      return c.json({ error: "Missing 'text' field in request body" }, 400);
    }
    if (body.text.trim().length < 50) {
      return c.json({ error: "Text too short to summarize (minimum 50 characters)" }, 400);
    }
    const maxLength = body.maxLength && body.maxLength > 0 ? Math.min(body.maxLength, 1000) : 200;
    const result = summarizeText(body.text, maxLength);
    return c.json(result);
  });

  // GET /api/summarize?url=...&maxLength=... — fetch URL and summarize
  app.get("/api/summarize", async (c) => {
    await tryRequirePayment(0.015);
    const url = c.req.query("url");
    if (!url) {
      return c.json({ error: "Missing 'url' query parameter" }, 400);
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return c.json({ error: "URL must use http or https protocol" }, 400);
      }
    } catch {
      return c.json({ error: "Invalid URL format" }, 400);
    }

    // Fetch the page
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AISummarizer/1.0)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        return c.json({ error: `Failed to fetch URL: HTTP ${response.status}` }, 502);
      }
      html = await response.text();
    } catch (e: any) {
      return c.json({ error: `Failed to fetch URL: ${e.message}` }, 502);
    }

    const text = extractTextFromHtml(html);
    if (text.length < 50) {
      return c.json({ error: "Could not extract enough text from the page" }, 422);
    }

    const maxLength = parseInt(c.req.query("maxLength") || "200", 10);
    const clamped = maxLength > 0 ? Math.min(maxLength, 1000) : 200;
    const result = summarizeText(text, clamped);
    return c.json({ ...result, sourceUrl: url });
  });
}
