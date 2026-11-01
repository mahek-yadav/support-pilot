import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findAvailableAgent, teamMembers } from '@/data/team';
import { getTimeInZone } from '@/lib/timezone';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { ticketId, category = 'Other', reason = 'Customer request or session timeout' } = await req.json();

    const timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
    const now = new Date();
    const assignedAgent = findAvailableAgent(category, now, timeZone);

    const timeInfo = getTimeInZone(timeZone, now);

    if (ticketId) {
      try {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'Escalated',
            assignedAgentId: assignedAgent ? assignedAgent.id : null,
            summary: `Escalated to human support. Reason: ${reason}. Category: ${category}.`,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn('Escalate ticket DB update note:', (err as Error).message);
      }
    }

    if (assignedAgent) {
      return NextResponse.json({
        success: true,
        agent: assignedAgent,
        isAvailable: true,
        reason,
      });
    }

    // No agent available currently
    return NextResponse.json({
      success: true,
      agent: null,
      isAvailable: false,
      nextAvailableTime: '09:00 AM ' + timeZone,
      reason,
    });
  } catch (error) {
    console.error('API /api/escalate error:', error);
    return NextResponse.json(
      { error: 'Failed to process escalation' },
      { status: 500 }
    );
  }
}

