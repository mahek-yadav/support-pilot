import { Category, Classification, Priority, Sentiment } from '@/types';

// ─── Keyword maps per category ────────────────────────────────────────────────
const categoryKeywords: Record<Category, string[]> = {
  'Billing': ['bill', 'invoice', 'charge', 'payment', 'subscription', 'paid', 'cost', 'fee', 'price', 'refund billing', 'double charged', 'overcharged', 'credit card', 'debit'],
  'Technical Support': ['error', 'bug', 'crash', 'not working', 'broken', 'api', 'integration', 'slow', 'freeze', 'glitch', 'technical', 'developer', 'code', 'endpoint', 'webhook'],
  'Account & Login': ['login', 'password', 'account', 'sign in', 'access', '2fa', 'two factor', 'authentication', 'locked', 'username', 'email change', 'forgot', 'reset'],
  'Shipping/Delivery': ['shipping', 'delivery', 'track', 'package', 'arrive', 'dispatch', 'carrier', 'fedex', 'dhl', 'usps', 'transit', 'shipped', 'order status'],
  'Refund/Return': ['refund', 'return', 'send back', 'money back', 'reimburse', 'cancel order', 'exchange', 'wrong item', 'damaged', 'return label'],
  'Product Info': ['product', 'feature', 'plan', 'pricing', 'upgrade', 'warranty', 'specification', 'how does', 'what is', 'compare', 'tier', 'license'],
  'Feedback/Complaint': ['complaint', 'feedback', 'unhappy', 'disappointed', 'frustrated', 'terrible', 'poor', 'bad experience', 'praise', 'great', 'amazing', 'love'],
  'Other': ['other', 'general', 'question', 'help', 'support'],
};

const priorityKeywords: Record<Priority, string[]> = {
  'Urgent': ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'down', 'broken', 'cannot access', 'losing money', 'production'],
  'High': ['very frustrated', 'very upset', 'several days', 'still waiting', 'escalate', 'unacceptable', 'wrong item', 'double charged'],
  'Med': ['issue', 'problem', 'not working', 'help', 'need to', 'would like'],
  'Low': ['question', 'wondering', 'how do', 'interested', 'curious', 'what is'],
};

const negativeWords = ['frustrated', 'angry', 'terrible', 'awful', 'horrible', 'unacceptable', 'disappointed', 'worst', 'hate', 'upset', 'furious', 'ridiculous', 'failed', 'broken', 'useless', 'never again', 'poor'];
const positiveWords = ['great', 'amazing', 'excellent', 'wonderful', 'fantastic', 'love', 'perfect', 'thank you', 'awesome', 'helpful', 'quick', 'brilliant', 'happy', 'satisfied'];

function scoreCategory(text: string): { category: Category; score: number }[] {
  const lower = text.toLowerCase();
  return (Object.keys(categoryKeywords) as Category[]).map((cat) => {
    const matches = categoryKeywords[cat].filter((kw) => lower.includes(kw)).length;
    return { category: cat, score: matches };
  }).sort((a, b) => b.score - a.score);
}

function scorePriority(text: string, category: Category, sentiment: Sentiment): Priority {
  const lower = text.toLowerCase();
  if (priorityKeywords['Urgent'].some((kw) => lower.includes(kw))) return 'Urgent';
  if (priorityKeywords['High'].some((kw) => lower.includes(kw))) return 'High';
  if (sentiment === 'Negative' && (category === 'Billing' || category === 'Refund/Return')) return 'High';
  if (priorityKeywords['Low'].some((kw) => lower.includes(kw))) return 'Low';
  return 'Med';
}

function scoreSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const negScore = negativeWords.filter((w) => lower.includes(w)).length;
  const posScore = positiveWords.filter((w) => lower.includes(w)).length;
  if (negScore > posScore) return 'Negative';
  if (posScore > negScore) return 'Positive';
  return 'Neutral';
}

/**
 * Classifies a customer query.
 * Swap this for an LLM call by setting NEXT_PUBLIC_LLM_API_KEY and
 * routing through /api/classify when ready.
 */
export function classifyQuery(query: string): Classification {
  const scored = scoreCategory(query);
  const topCategory = scored[0].score > 0 ? scored[0].category : 'Other';
  const secondScore = scored[1]?.score ?? 0;
  const topScore = scored[0].score;

  // Confidence: ratio of top score to total matches, normalised
  const totalMatches = scored.reduce((s, c) => s + c.score, 0);
  let confidence = totalMatches === 0 ? 0.3 : Math.min(0.55 + (topScore / (totalMatches + 1)) * 0.45, 0.98);
  // Boost if top outperforms second by a lot
  if (topScore > 0 && secondScore === 0) confidence = Math.min(confidence + 0.15, 0.98);

  const sentiment = scoreSentiment(query);
  const priority = scorePriority(query, topCategory, sentiment);

  return { category: topCategory, priority, sentiment, confidence: parseFloat(confidence.toFixed(2)) };
}

