import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  generateCustomerSupportReply,
  generateLocalFallback,
  retrieveTopKB,
  rewriteFollowUpQuery,
  detectsEscalationIntent,
  getGeminiModel,
  KBArticleDoc,
} from '@/lib/ai';
import { verifyReply } from '@/lib/verify';
import {
  validateInput,
  maskPII,
  detectOutOfScope,
  detectPromptInjection,
  detectAbusiveLanguage,
  logSecurityEvent,
} from '@/lib/guardrails';
import { kbArticles as fallbackKbArticles } from '@/data/kb';
import { findAvailableAgent } from '@/data/team';
import { TeamMember } from '@/types';
import { classifyQuery } from '@/lib/classify';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Database-backed rate limiter (15 requests/minute per ticket or IP)
async function checkRateLimit(key: string): Promise<boolean> {
  try {
    const nowWindow = new Date(Math.floor(Date.now() / 60000) * 60000);
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.windowStart < nowWindow) {
      await prisma.rateLimit.upsert({
        where: { key },
        update: { windowStart: nowWindow, count: 1 },
        create: { key, windowStart: nowWindow, count: 1 },
      });
      return true;
    }

    if (existing.count >= 15) {
      return false;
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return true;
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ticketId,
      message,
      customerName = 'Customer',
      unresolvedCount = 0,
      noAnswerCount = 0,
    } = body;

    // ─── Guardrail 1: Input Validation ─────────────────────────────────────────
    const validation = validateInput(String(message || ''));
    if (!validation.valid) {
      return NextResponse.json({
        ticketId: ticketId || `tkt-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: 'ai',
          text: validation.message,
          sourceArticleIds: [],
          createdAt: new Date().toISOString(),
          verified: false,
          engine: 'fallback',
          verificationNotes: 'Input validation feedback',
        },
        classification: {
          category: 'Other',
          priority: 'Low',
          sentiment: 'Neutral',
          confidence: 1.0,
        },
        shouldEscalate: false,
        assignedAgent: null,
        isDemoMode: false,
        engine: 'fallback',
        unresolvedCount,
        noAnswerCount,
        validationNotice: validation.message,
      });
    }

    // ─── Guardrail 2: Rate Limiting Check ───────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'localhost';
    const rateLimitKey = ticketId ? `rl:ticket:${ticketId}` : `rl:ip:${ip}`;
    const allowed = await checkRateLimit(rateLimitKey);
    if (!allowed) {
      await logSecurityEvent({
        type: 'rate_limit',
        ticketId,
        details: `Rate limit hit for ${rateLimitKey}`,
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded (max 15 messages/minute). Please wait a moment.' },
        { status: 429 }
      );
    }

    // ─── Guardrail 3: Personal Data (PII) Masking ──────────────────────────────
    const piiResult = maskPII(String(message || ''));
    let cleanQuery = piiResult.maskedText;

    if (piiResult.hasPII) {
      await logSecurityEvent({
        type: 'pii_masked',
        ticketId,
        details: `Masked sensitive info: ${piiResult.detectedTypes.join(', ')}`,
      });
    }

    // ─── Guardrail 4: Prompt Injection Detection ────────────────────────────────
    if (detectPromptInjection(cleanQuery)) {
      await logSecurityEvent({
        type: 'prompt_injection',
        ticketId,
        details: `Prompt injection pattern detected: "${cleanQuery.slice(0, 80)}"`,
      });
    }

    // ─── Guardrail 5: Abusive Language Detection ────────────────────────────────
    if (detectAbusiveLanguage(cleanQuery)) {
      await logSecurityEvent({
        type: 'escalation',
        ticketId,
        details: 'Abusive language detected, transferring to team lead',
      });
      const timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
      const agent = findAvailableAgent('Feedback/Complaint', new Date(), timeZone);
      const agentName = agent ? agent.name : 'a specialist';
      return NextResponse.json({
        ticketId: ticketId || `tkt-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: 'ai',
          text: `I understand you may be frustrated, but I ask that we keep our conversation respectful. I will connect you directly with ${agentName} from our team right away.`,
          sourceArticleIds: [],
          createdAt: new Date().toISOString(),
          verified: false,
          engine: 'fallback',
          verificationNotes: 'Abusive language safety handoff',
        },
        classification: {
          category: 'Feedback/Complaint',
          priority: 'Urgent',
          sentiment: 'Negative',
          confidence: 1.0,
        },
        shouldEscalate: true,
        assignedAgent: agent,
        isDemoMode: false,
        engine: 'fallback',
        unresolvedCount,
        noAnswerCount,
      });
    }

    // ─── 7. Load or Create Ticket & Conversation History ───────────────────────
    let currentTicketId = ticketId;
    let history: { role: 'customer' | 'ai' | 'agent' | 'system'; text: string }[] = [];

    try {
      if (currentTicketId) {
        const ticket = await prisma.ticket.findUnique({
          where: { id: currentTicketId },
          include: {
            messages: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        });
        if (ticket) {
          history = (ticket.messages as Array<{ role: string; text: string }>)
            .map((m: { role: string; text: string }) => ({ role: m.role as any, text: m.text }))
            .reverse();
        }
      } else {
        const newTicket = await prisma.ticket.create({
          data: {
            customerName,
            category: 'Other',
            priority: 'Med',
            sentiment: 'Neutral',
            status: 'Open',
            confidence: 0.85,
          },
        });
        currentTicketId = newTicket.id;
      }
    } catch {
      currentTicketId = currentTicketId || `tkt-${Date.now()}`;
    }

    // ─── Guardrail 6: Out of Scope Question Detection ──────────────────────────
    const oos = detectOutOfScope(cleanQuery);
    if (oos.outOfScope) {
      const nextNoAnswer = noAnswerCount + 1;
      const shouldEscalateOOS = nextNoAnswer >= 2;
      const timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
      let agentOOS: TeamMember | null = null;
      let replyText = oos.refusal || "I can only answer questions related to NovaShop products, accounts, orders, and billing.";

      if (shouldEscalateOOS) {
        agentOOS = findAvailableAgent('Other', new Date(), timeZone);
        const name = agentOOS ? agentOOS.name : 'a specialist';
        replyText = `I understand you have questions outside our automated knowledge base. I'll connect you directly with ${name} from our support team who can help further.`;
      }

      console.log(
        `[Chat] engine=guardrail model=none status=200 retrieved=[none] verification=OOS_SAFE`
      );

      return NextResponse.json({
        ticketId: currentTicketId,
        message: {
          id: `msg-${Date.now()}`,
          role: 'ai',
          text: replyText,
          sourceArticleIds: [],
          createdAt: new Date().toISOString(),
          verified: false,
          engine: 'fallback',
          verificationNotes: `Out-of-scope query on ${oos.topic}`,
        },
        classification: {
          category: 'Other',
          priority: 'Low',
          sentiment: 'Neutral',
          confidence: 0.95,
        },
        shouldEscalate: shouldEscalateOOS,
        assignedAgent: agentOOS,
        isDemoMode: false,
        engine: 'fallback',
        unresolvedCount,
        noAnswerCount: nextNoAnswer,
        piiWarning: piiResult.warning,
      });
    }

    // ─── 8. Query Rewriting for Follow-Up Queries ──────────────────────────────
    const rewrittenQuery = await rewriteFollowUpQuery({
      query: cleanQuery,
      history,
      apiKey: process.env.GEMINI_API_KEY,
      modelName: getGeminiModel(),
    });

    const initialClassification = classifyQuery(rewrittenQuery);

    // ─── 9. Retrieve Top Matching KB Articles from DB ──────────────────────────
    let articles: KBArticleDoc[] = [];
    try {
      const dbArticles = await prisma.kbArticle.findMany({
        where: { approved: true },
      });
      if (dbArticles && dbArticles.length > 0) {
        articles = (dbArticles as Array<{ id: string; title: string; category: string; content: string; keywords?: string[]; approved?: boolean }>).map(
          (a: { id: string; title: string; category: string; content: string; keywords?: string[]; approved?: boolean }) => ({
            id: a.id,
            title: a.title,
            category: a.category,
            content: a.content,
            keywords: a.keywords || [],
            approved: a.approved,
          })
        );
      } else {
        articles = fallbackKbArticles;
      }
    } catch {
      articles = fallbackKbArticles;
    }

    const { articles: topArticles, scores: retrievalScores } = retrieveTopKB(
      rewrittenQuery,
      articles,
      3,
      initialClassification.category
    );

    // ─── 10. Draft Response with Gemini (or Extractive Fallback) ─────────────────
    let { response: aiResult, isDemoMode, engine, modelUsed, errorCode } =
      await generateCustomerSupportReply({
        customerQuery: cleanQuery,
        effectiveQuery: rewrittenQuery,
        history,
        articles: topArticles,
        isFirstMessage: history.length === 0,
      });

    if (isDemoMode) {
      await logSecurityEvent({
        type: 'fallback_used',
        ticketId: currentTicketId,
        details: `Extractive fallback used (model: ${modelUsed}, error: ${errorCode || 'DEMO'})`,
      });
    }

    // ─── 11. Verification Layer ────────────────────────────────────────────────
    let verification = await verifyReply({
      reply: aiResult.reply,
      retrievedArticles: topArticles,
      citedIds: aiResult.sourceArticleIds,
    });

    let finalReply = aiResult.reply;

    if (!verification.verified && engine === 'gemini') {
      await logSecurityEvent({
        type: 'verification_failed',
        ticketId: currentTicketId,
        details: `Initial verification failed: ${verification.unsupportedClaims.join('; ')}`,
      });

      // Attempt 1 stricter regeneration
      const retry = await generateCustomerSupportReply({
        customerQuery: `${cleanQuery}\n[STRICT INSTRUCTION: Previous draft contained ungrounded claims (${verification.unsupportedClaims.join(
          ', '
        )}). State ONLY facts, figures, and durations explicitly found in the approved KB articles. If unavailable, set needsEscalation=true.]`,
        history,
        articles: topArticles,
        isFirstMessage: false,
      });

      const retryVerification = await verifyReply({
        reply: retry.response.reply,
        retrievedArticles: topArticles,
        citedIds: retry.response.sourceArticleIds,
      });

      if (retryVerification.verified) {
        aiResult = retry.response;
        verification = retryVerification;
        finalReply = aiResult.reply;
      } else {
        // If second Gemini attempt still fails verification:
        // Use the verified extractive fallback built from best-matching KB sentences!
        const extractiveFallback = generateLocalFallback(
          cleanQuery,
          topArticles,
          history.length === 0
        );
        aiResult = extractiveFallback;
        finalReply = extractiveFallback.reply;
        verification = {
          verified: true,
          unsupportedClaims: [],
          notes: 'Grounded via verified KB extractive fallback',
          sourceArticlesUsed: extractiveFallback.sourceArticleIds,
        };
        engine = 'fallback';
      }
    }

    // ─── 12. Evaluate Escalation Rules ──────────────────────────────────────────
    const isCustomerUnresolved = unresolvedCount >= 2;
    const isCustomerAskingForHuman = detectsEscalationIntent(cleanQuery);
    const nextNoAnswer = noAnswerCount + (aiResult.needsEscalation ? 1 : 0);
    const isNoAnswerRepeated = nextNoAnswer >= 2;
    const isCriticalUrgent = aiResult.sentiment === 'Negative' && aiResult.priority === 'Urgent';

    const shouldEscalate =
      isCustomerUnresolved ||
      isCustomerAskingForHuman ||
      isNoAnswerRepeated ||
      isCriticalUrgent;

    let assignedAgent: TeamMember | null = null;
    const timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata';

    if (shouldEscalate) {
      assignedAgent = findAvailableAgent(aiResult.category, new Date(), timeZone);
      const agentName = assignedAgent ? assignedAgent.name : 'a senior specialist';
      const specialty = assignedAgent ? assignedAgent.specialty : aiResult.category;
      finalReply = `I'll connect you directly with ${agentName} from our ${specialty} team right away.`;

      await logSecurityEvent({
        type: 'escalation',
        ticketId: currentTicketId,
        details: `Escalated to ${agentName}. Reason: ${
          isCustomerAskingForHuman
            ? 'Customer requested human'
            : isCustomerUnresolved
            ? 'Unresolved twice'
            : isCriticalUrgent
            ? 'Urgent negative issue'
            : 'Unanswered KB query twice'
        }`,
      });
    } else {
      // If NOT escalating, ensure reply text never falsely promises a human handoff
      if (aiResult.needsEscalation && nextNoAnswer < 2) {
        finalReply =
          "I don't have approved information in our knowledge base to answer that specific question. Could you clarify your request, or would you like to speak with a human specialist?";
      }
    }

    // ─── 13. Persist Messages & Update Ticket ──────────────────────────────────
    let savedMsgId = `msg-${Date.now()}`;
    try {
      if (currentTicketId) {
        // Customer message (PII masked!)
        await prisma.message.create({
          data: {
            ticketId: currentTicketId,
            role: 'customer',
            text: cleanQuery,
          },
        });

        // AI message (storing verification flag & notes)
        const aiMsg = await prisma.message.create({
          data: {
            ticketId: currentTicketId,
            role: 'ai',
            text: finalReply,
            sourceArticleIds: aiResult.sourceArticleIds,
            verified: verification.verified,
            verificationNotes: verification.notes,
          },
        });
        savedMsgId = aiMsg.id;

        // Update ticket
        const conversationSummary = `Inquiry: ${aiResult.category}. Status: ${
          shouldEscalate ? 'Escalated' : aiResult.resolved ? 'Resolved' : 'In Progress'
        }. Latest query: "${cleanQuery.slice(0, 80)}"`;

        await prisma.ticket.update({
          where: { id: currentTicketId },
          data: {
            category: aiResult.category,
            priority: aiResult.priority,
            sentiment: aiResult.sentiment,
            confidence: aiResult.confidence,
            status: shouldEscalate ? 'Escalated' : aiResult.resolved ? 'Resolved' : 'In Progress',
            assignedAgentId: assignedAgent ? assignedAgent.id : undefined,
            summary: conversationSummary,
            resolvedAt: aiResult.resolved ? new Date() : undefined,
          },
        });
      }
    } catch (dbErr) {
      console.warn('Prisma message persistence note:', (dbErr as Error).message);
    }

    // ─── 14. Server-Side Telemetry Logging (Fix 1) ──────────────────────────────
    const scoresSummary = Object.entries(retrievalScores)
      .map(([id, s]) => `${id}:${s}`)
      .join(',') || 'none';
    console.log(
      `[Chat] engine=${engine} model=${modelUsed} status=${errorCode ? errorCode : 200} retrieved=[${scoresSummary}] verification=${
        verification.verified ? 'PASS' : 'FAIL'
      }`
    );

    return NextResponse.json({
      ticketId: currentTicketId,
      message: {
        id: savedMsgId,
        role: 'ai',
        text: finalReply,
        sourceArticleIds: aiResult.sourceArticleIds,
        verified: verification.verified,
        engine,
        verificationNotes: verification.notes,
        unsupportedClaims: verification.unsupportedClaims,
        createdAt: new Date().toISOString(),
      },
      classification: {
        category: aiResult.category,
        priority: aiResult.priority,
        sentiment: aiResult.sentiment,
        confidence: aiResult.confidence,
      },
      verification: {
        verified: verification.verified,
        notes: verification.notes,
        unsupportedClaims: verification.unsupportedClaims,
      },
      shouldEscalate,
      assignedAgent,
      isDemoMode,
      engine,
      unresolvedCount,
      noAnswerCount: nextNoAnswer,
      piiWarning: piiResult.warning,
    });
  } catch (error) {
    console.error('API /api/chat critical error:', error);
    return NextResponse.json(
      {
        error: 'Our AI support assistant encountered a momentary issue. Please try again.',
      },
      { status: 500 }
    );
  }
}
