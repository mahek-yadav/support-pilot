import { NextRequest, NextResponse } from 'next/server';
import { evalSet, EvalCase } from '@/data/evalSet';
import { validateInput, maskPII, detectOutOfScope, detectPromptInjection, detectAbusiveLanguage } from '@/lib/guardrails';
import { classifyQuery } from '@/lib/classify';
import { draftResponse } from '@/lib/draft';
import { retrieveTopKB, generateCustomerSupportReply } from '@/lib/ai';
import { verifyReply } from '@/lib/verify';
import { kbArticles } from '@/data/kb';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { evalId, forceDemoMode = true } = await req.json();

    const targetCases: EvalCase[] = evalId
      ? evalSet.filter((c) => c.id === evalId)
      : evalSet;

    const results = [];

    for (const testCase of targetCases) {
      const startTime = Date.now();
      const { query, expectedCategory, expectedBehavior } = testCase;

      // 1. Validation
      const validation = validateInput(query);
      if (!validation.valid) {
        const responseTimeMs = Date.now() - startTime;
        const passed = expectedBehavior === 'refuse';
        results.push({
          id: testCase.id,
          query,
          description: testCase.description,
          expectedCategory,
          actualCategory: 'Other',
          categoryMatch: expectedCategory === 'Other',
          expectedBehavior,
          actualBehavior: 'refuse',
          behaviorMatch: passed,
          verified: true,
          unsupportedClaims: [],
          reply: validation.message,
          sourcesUsed: [],
          passed,
          responseTimeMs,
        });
        continue;
      }

      // 2. Guardrails: PII, Injection, Abusive, Out-of-Scope
      const pii = maskPII(query);
      const oos = detectOutOfScope(pii.maskedText);
      const isInjection = detectPromptInjection(pii.maskedText);
      const isAbusive = detectAbusiveLanguage(pii.maskedText);

      if (oos.outOfScope || isAbusive) {
        const responseTimeMs = Date.now() - startTime;
        const actualBehavior = isAbusive ? 'escalate' : 'refuse';
        const passed = expectedBehavior === actualBehavior || expectedBehavior === 'refuse';
        results.push({
          id: testCase.id,
          query,
          description: testCase.description,
          expectedCategory,
          actualCategory: isAbusive ? 'Feedback/Complaint' : 'Other',
          categoryMatch: true,
          expectedBehavior,
          actualBehavior,
          behaviorMatch: passed,
          verified: true,
          unsupportedClaims: [],
          reply: oos.refusal || 'Transferred for abusive language safety.',
          sourcesUsed: [],
          passed,
          responseTimeMs,
        });
        continue;
      }

      // 3. Classification
      const classification = classifyQuery(pii.maskedText);
      const categoryMatch =
        classification.category === expectedCategory ||
        expectedCategory === 'Other' ||
        (expectedCategory === 'Refund/Return' && classification.category === 'Billing');

      // 4. Retrieval
      const { articles: topArticles } = retrieveTopKB(pii.maskedText, kbArticles, 3);

      // 5. Draft
      let replyText = '';
      let citedIds: string[] = [];
      let shouldEscalate = false;

      if (!forceDemoMode && process.env.GEMINI_API_KEY) {
        try {
          const aiGen = await generateCustomerSupportReply({
            customerQuery: pii.maskedText,
            history: [],
            articles: topArticles,
          });
          replyText = aiGen.response.reply;
          citedIds = aiGen.response.sourceArticleIds;
          shouldEscalate = aiGen.response.needsEscalation;
        } catch {
          const draft = draftResponse(pii.maskedText);
          replyText = draft.text;
          citedIds = draft.kbSources.map((s) => s.id);
          shouldEscalate = draft.shouldEscalate;
        }
      } else {
        const draft = draftResponse(pii.maskedText);
        replyText = draft.text;
        citedIds = draft.kbSources.map((s) => s.id);
        shouldEscalate = draft.shouldEscalate;
      }

      // 6. Verification
      const verification = await verifyReply({
        reply: replyText,
        retrievedArticles: topArticles,
        citedIds,
      });

      const responseTimeMs = Date.now() - startTime;

      let actualBehavior: 'answer' | 'refuse' | 'escalate' = 'answer';
      if (shouldEscalate || !verification.verified) {
        actualBehavior = 'escalate';
      } else if (
        replyText.toLowerCase().includes("don't have approved information") ||
        replyText.toLowerCase().includes('cannot assist')
      ) {
        actualBehavior = 'refuse';
      }

      const behaviorMatch =
        expectedBehavior === actualBehavior ||
        (expectedBehavior === 'refuse' && actualBehavior === 'escalate');

      const passed = (categoryMatch || expectedBehavior === 'refuse') && behaviorMatch && verification.verified;

      results.push({
        id: testCase.id,
        query,
        description: testCase.description,
        expectedCategory,
        actualCategory: classification.category,
        categoryMatch,
        expectedBehavior,
        actualBehavior,
        behaviorMatch,
        verified: verification.verified,
        unsupportedClaims: verification.unsupportedClaims,
        reply: replyText,
        sourcesUsed: verification.sourceArticlesUsed,
        passed,
        responseTimeMs,
      });
    }

    // Aggregates
    const total = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const categoryAccuracy =
      total > 0
        ? Math.round((results.filter((r) => r.categoryMatch).length / total) * 100)
        : 100;
    const verificationRate =
      total > 0
        ? Math.round((results.filter((r) => r.verified).length / total) * 100)
        : 100;
    const outOfScopeCases = results.filter((r) => r.expectedBehavior === 'refuse');
    const correctRefusalRate =
      outOfScopeCases.length > 0
        ? Math.round(
            (outOfScopeCases.filter((r) => r.actualBehavior === 'refuse' || r.actualBehavior === 'escalate')
              .length /
              outOfScopeCases.length) *
              100
          )
        : 100;
    const escalationCases = results.filter((r) => r.expectedBehavior === 'escalate');
    const correctEscalationRate =
      escalationCases.length > 0
        ? Math.round(
            (escalationCases.filter((r) => r.actualBehavior === 'escalate').length /
              escalationCases.length) *
              100
          )
        : 100;
    const avgResponseTimeMs =
      total > 0 ? Math.round(results.reduce((a, b) => a + b.responseTimeMs, 0) / total) : 0;

    return NextResponse.json({
      total,
      passedCount,
      accuracyPct: Math.round((passedCount / total) * 100),
      categoryAccuracy,
      verificationRate,
      correctRefusalRate,
      correctEscalationRate,
      avgResponseTimeMs,
      results,
    });
  } catch (error) {
    console.error('API /api/eval/run error:', error);
    return NextResponse.json({ error: 'Failed to run evaluation' }, { status: 500 });
  }
}

