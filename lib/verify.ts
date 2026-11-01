import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { KBArticleDoc, getGeminiModel } from './ai';

export interface VerificationResult {
  verified: boolean;
  unsupportedClaims: string[];
  notes: string;
  sourceArticlesUsed: string[];
}

/**
 * Normalizes text for entity and fact comparison:
 * Lowercases, standardizes dashes (en-dash, em-dash to hyphen), normalizes spaces.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Step A: Deterministic Fact & Entity Extraction Check
 * Extracts numbers, prices, percentages, dates, durations, URLs, emails and phones.
 * Verifies that each extracted claim appears in the cited KB articles' text.
 * List markers (e.g. 1., 2.) are ignored so numbered step lists are never blocked.
 */
export function verifyReplyStepA(
  reply: string,
  retrievedArticles: KBArticleDoc[],
  citedIds: string[]
): { verified: boolean; unsupportedClaims: string[]; citedArticles: KBArticleDoc[] } {
  const unsupportedClaims: string[] = [];

  // Map cited IDs or titles/index references (e.g. "kb-001", "ARTICLE 1", or title) to valid retrieved articles
  const validCitedArticles = retrievedArticles.filter((a, index) => {
    return (
      citedIds.includes(a.id) ||
      citedIds.some((cid) => {
        const cLower = cid.toLowerCase();
        return (
          cLower === a.id.toLowerCase() ||
          cLower === a.title.toLowerCase() ||
          cLower === `article ${index + 1}` ||
          cLower === `[article ${index + 1}]`
        );
      })
    );
  });

  // If no cited articles match or citedIds is empty
  if (validCitedArticles.length === 0) {
    unsupportedClaims.push('No approved KB source articles cited in reply.');
    return { verified: false, unsupportedClaims, citedArticles: [] };
  }

  // Combined text of cited articles (normalized)
  const sourceText = normalizeText(
    validCitedArticles.map((a) => `${a.title} ${a.content}`).join(' ')
  );

  // Strip list markers (e.g. "1. ", "2. ", "1) ", "2) ") from reply before extracting numerical claims
  const replyContentWithoutMarkers = reply.replace(/(?:^|\n|\.\s+)\d+[\.\)]\s+/g, ' ');
  const normalizedReply = normalizeText(replyContentWithoutMarkers);

  // 1. Extract Prices: e.g. $29, $79, $100
  const priceRegex = /\$\d+(?:\.\d{2})?/g;
  const pricesInReply = reply.match(priceRegex) || [];
  for (const price of pricesInReply) {
    const rawNum = price.replace('$', '');
    if (!sourceText.includes(price.toLowerCase()) && !sourceText.includes(rawNum)) {
      unsupportedClaims.push(`Price claim "${price}" is not in cited articles.`);
    }
  }

  // 2. Extract Percentages: e.g. 20%, 98%, 95%
  const percentRegex = /\b\d+%\b/g;
  const percentsInReply = reply.match(percentRegex) || [];
  for (const p of percentsInReply) {
    if (!sourceText.includes(p.toLowerCase())) {
      unsupportedClaims.push(`Percentage claim "${p}" is not in cited articles.`);
    }
  }

  // 3. Extract Durations & Ranges: e.g. "5-7 business days", "30 days", "24 hours", "2-3 business days"
  const durationRegex = /\b\d+(?:[\-–]\d+)?\s+(?:business days?|days?|hours?|weeks?|months?|minutes?)\b/gi;
  const durationsInReply = reply.match(durationRegex) || [];
  for (const dur of durationsInReply) {
    const normDur = normalizeText(dur);
    const directMatch = sourceText.includes(normDur);

    // Also check digits presence and range equivalents ("5 to 7" vs "5-7")
    const digits = normDur.match(/\d+/g) || [];
    const digitsPresent = digits.length > 0 && digits.every((d) => sourceText.includes(d));

    // Check "30-day" vs "30 days"
    const hyphenated = normDur.replace(/\s+/g, '-');
    const hyphenMatch = sourceText.includes(hyphenated);

    if (!directMatch && !digitsPresent && !hyphenMatch) {
      unsupportedClaims.push(`Duration claim "${dur}" is not found in cited articles.`);
    }
  }

  // 4. Extract URLs
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>,;)]+|[a-zA-Z0-9.-]+\.(?:com|org|io|net)\b[^\s<>,;)]*/gi;
  const urlsInReply = reply.match(urlRegex) || [];
  for (const url of urlsInReply) {
    const cleanUrl = url.replace(/[.,;:)]+$/, '').toLowerCase();
    // Exclude generic brand mention
    if (cleanUrl !== 'supportpilot.com' && !sourceText.includes(cleanUrl)) {
      unsupportedClaims.push(`URL "${cleanUrl}" is not in cited articles.`);
    }
  }

  // 5. Extract Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailsInReply = reply.match(emailRegex) || [];
  for (const email of emailsInReply) {
    const cleanEmail = email.toLowerCase();
    if (!sourceText.includes(cleanEmail)) {
      unsupportedClaims.push(`Email address "${cleanEmail}" is not in cited articles.`);
    }
  }

  // 6. Extract Phone Numbers (e.g. +1..., 1-800...)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phonesInReply = reply.match(phoneRegex) || [];
  for (const phone of phonesInReply) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 7 && !sourceText.replace(/\D/g, '').includes(digits)) {
      unsupportedClaims.push(`Phone number "${phone}" is not in cited articles.`);
    }
  }

  const verified = unsupportedClaims.length === 0;
  return { verified, unsupportedClaims, citedArticles: validCitedArticles };
}

const llmJudgeSchema = z.object({
  supported: z.boolean(),
  unsupportedClaims: z.array(z.string()).default([]),
});

/**
 * Step B: Optional LLM Judge using Gemini
 */
export async function verifyReplyStepB(
  reply: string,
  citedArticles: KBArticleDoc[]
): Promise<{ verified: boolean; unsupportedClaims: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    return { verified: true, unsupportedClaims: [] };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const articlesText = citedArticles.map((a) => `[${a.title}]: ${a.content}`).join('\n\n');

    const prompt = `You are a strict, objective verification judge.
Review the AI response against the provided knowledge base articles.
Determine whether EVERY factual claim (dates, prices, numbers, steps, policies) made in the reply is supported by the articles.

ARTICLES:
${articlesText}

AI REPLY:
"${reply}"

Return a valid JSON object matching:
{
  "supported": boolean,
  "unsupportedClaims": string[] (list any claim not explicitly supported, or empty array if all supported)
}`;

    const modelName = getGeminiModel();
    const res = await Promise.race([
      ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.0,
        },
      }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    const parsed = JSON.parse(res.text ?? '{}');
    const validated = llmJudgeSchema.parse(parsed);

    return {
      verified: validated.supported && validated.unsupportedClaims.length === 0,
      unsupportedClaims: validated.unsupportedClaims,
    };
  } catch {
    // If Step B call fails or times out, rely purely on Step A deterministic checks
    return { verified: true, unsupportedClaims: [] };
  }
}

/**
 * Combined Two-Stage Verification Pipeline
 */
export async function verifyReply({
  reply,
  retrievedArticles,
  citedIds,
}: {
  reply: string;
  retrievedArticles: KBArticleDoc[];
  citedIds: string[];
}): Promise<VerificationResult> {
  // Step A: Deterministic check
  const stepA = verifyReplyStepA(reply, retrievedArticles, citedIds);
  const sourceArticlesUsed = stepA.citedArticles.map((a) => a.id);

  if (!stepA.verified) {
    return {
      verified: false,
      unsupportedClaims: stepA.unsupportedClaims,
      notes: `Deterministic check failed: ${stepA.unsupportedClaims.join('; ')}`,
      sourceArticlesUsed,
    };
  }

  // Step B: Optional LLM Judge
  const enableLLMJudge = process.env.ENABLE_LLM_VERIFIER === 'true';
  if (enableLLMJudge && stepA.citedArticles.length > 0) {
    const stepB = await verifyReplyStepB(reply, stepA.citedArticles);
    if (!stepB.verified) {
      return {
        verified: false,
        unsupportedClaims: stepB.unsupportedClaims,
        notes: `LLM Judge flagged unsupported claims: ${stepB.unsupportedClaims.join('; ')}`,
        sourceArticlesUsed,
      };
    }
  }

  return {
    verified: true,
    unsupportedClaims: [],
    notes: 'Verified against cited knowledge base articles.',
    sourceArticlesUsed,
  };
}
