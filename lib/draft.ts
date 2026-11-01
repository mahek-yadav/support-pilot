import { KBArticle, DraftResponse } from '@/types';
import { kbArticles } from '@/data/kb';

export const MIN_RELEVANCE_SCORE = 3;

export type ScorableArticle = {
  id?: string;
  title: string;
  category?: string;
  content: string;
  keywords?: string[];
  approved?: boolean;
};

// Weighted keyword & title scoring
export function scoreArticle(query: string, article: ScorableArticle, preferredCategory?: string): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\W+/).filter((w) => w.length > 2);
  let score = 0;

  // Keyword match (high weight = 3)
  (article.keywords || []).forEach((kw) => {
    const kwLower = kw.toLowerCase();
    if (queryLower.includes(kwLower)) {
      score += 4;
    }
  });

  // Title match (highest weight = 5)
  const titleLower = article.title.toLowerCase();
  const titleWords = titleLower.split(/\W+/).filter(Boolean);
  queryWords.forEach((qw) => {
    if (titleWords.some((tw) => tw === qw)) score += 3;
    else if (titleWords.some((tw) => tw.includes(qw) || qw.includes(tw))) score += 1.5;
  });

  // Content word overlap (weight = 1)
  const contentWords = new Set(article.content.toLowerCase().split(/\W+/));
  queryWords.forEach((qw) => {
    if (contentWords.has(qw)) score += 1;
  });

  // Category alignment boost
  if (preferredCategory && article.category && article.category.toLowerCase() === preferredCategory.toLowerCase()) {
    score += 2;
  }

  return score;
}

/**
 * Extractive sentence-level summarizer:
 * Extracts 1-3 sentences from the article that best match the customer query.
 * Never dumps the whole article, never appends "...", and keeps formatting clean.
 */
export function extractBestSentences(article: { content: string }, query: string, maxSentences: number = 3): string {
  // Split content into sentences and clean list bullet points
  const rawSentences = article.content
    .split(/(?<=[.!?])\s*\n+|\n+/)
    .map((s) => s.trim().replace(/^[•\-\*]\s*/, ''))
    .filter((s) => s.length > 5);

  const queryLower = query.toLowerCase();
  const sentencesInQuery = query.split(/(?<=[.?!])\s+/).filter(Boolean);
  const latestTurn = (sentencesInQuery[sentencesInQuery.length - 1] || query).toLowerCase();
  const latestWords = new Set(latestTurn.split(/\W+/).filter((w) => w.length > 2));
  const allWords = queryLower.split(/\W+/).filter((w) => w.length > 2);

  // Score each sentence
  const scoredSentences = rawSentences.map((sentence, index) => {
    const lower = sentence.toLowerCase();
    let sScore = 0;
    allWords.forEach((qw) => {
      if (lower.includes(qw)) sScore += 1;
    });

    // High priority for keywords appearing in the latest customer turn
    latestWords.forEach((qw) => {
      if (lower.includes(qw)) sScore += 3.5;
    });

    // Temporal/duration question boost
    if (/\b(how long|time|take|when|duration|hours|days|minutes)\b/i.test(latestTurn)) {
      if (
        /\b(\d+[-–]\d+|\d+)\s*(business days?|days?|hours?|minutes?|weeks?)\b/i.test(lower) ||
        /\b(valid for|wait)\b/i.test(lower)
      ) {
        sScore += 8;
      }
    }

    // Troubleshooting / "didn't receive" boost
    if (/\b(not receive|didnt receive|didn't receive|missing|didn't get|dont receive|don't receive)\b/i.test(latestTurn)) {
      if (/\b(receive|spam|junk|promotions|delayed|safe sender)\b/i.test(lower)) {
        sScore += 8;
      }
    }

    // Slight bias for earlier sentences only if scores are very close
    if (index === 0) sScore += 0.2;
    return { sentence, score: sScore, index };
  });

  // Sort by score descending
  const topSentences = [...scoredSentences]
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences);

  // If no sentences matched specific query words, return the first 2 sentences of the article
  if (topSentences.length === 0) {
    return rawSentences.slice(0, 2).join(' ');
  }

  // Restore natural chronological order of selected sentences
  topSentences.sort((a, b) => a.index - b.index);

  // If a sentence ends with a colon, include the immediate follow-up bullets
  const chosen: string[] = [];
  for (const s of topSentences) {
    chosen.push(s.sentence);
    if (s.sentence.endsWith(':')) {
      if (rawSentences[s.index + 1]) chosen.push(rawSentences[s.index + 1]);
      if (rawSentences[s.index + 2]) chosen.push(rawSentences[s.index + 2]);
    }
  }

  return Array.from(new Set(chosen)).slice(0, Math.max(maxSentences, 3)).join(' ');
}

export function buildExtractiveReply(
  query: string,
  topArticle: { title: string; content: string } | undefined,
  isFirstMessage: boolean = false
): string {
  if (!topArticle) {
    return "I don't have approved information to answer this specific question. I'll connect you directly with a specialist who can help.";
  }

  const excerpt = extractBestSentences(topArticle, query);
  if (isFirstMessage) {
    return `Based on our ${topArticle.title}: ${excerpt}`;
  }
  return excerpt;
}

/**
 * Drafts an extractive response grounded strictly in the KB.
 */
export function draftResponse(
  query: string,
  articles?: KBArticle[],
  preferredCategory?: string,
  isFirstMessage: boolean = false
): DraftResponse {
  const pool = (articles !== undefined ? articles : kbArticles).filter(
    (a) => a.approved !== false
  );

  const scored = pool
    .map((a) => ({ article: a, score: scoreArticle(query, a, preferredCategory) }))
    .filter((s) => s.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score);

  const topArticles = scored.slice(0, 3).map((s) => s.article);
  const maxScore = scored[0]?.score ?? 0;
  const shouldEscalate = maxScore < MIN_RELEVANCE_SCORE || topArticles.length === 0;

  const topArticle = topArticles[0];
  const replyText = buildExtractiveReply(query, topArticle, isFirstMessage);

  const confidence = shouldEscalate ? 0.2 : Math.min(0.6 + (maxScore / 25) * 0.38, 0.98);

  return {
    text: replyText,
    kbSources: topArticles,
    confidence: parseFloat(confidence.toFixed(2)),
    shouldEscalate,
  };
}
