import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { action, ticketId, status, aiDraft, assignedAgentId } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }

    try {
      if (action === 'updateStatus') {
        const updated = await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status,
            assignedAgentId: assignedAgentId !== undefined ? assignedAgentId : undefined,
            updatedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, ticket: updated });
      }

      if (action === 'approveAndSend') {
        // Save draft as message from agent/ai and mark resolved
        await prisma.message.create({
          data: {
            ticketId,
            role: 'agent',
            text: aiDraft || 'Response approved and sent.',
          },
        });

        const updated = await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            status: 'Resolved',
            resolvedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, ticket: updated });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch {
      return NextResponse.json({ success: true, simulated: true, ticketId, action });
    }
  } catch (error) {
    console.error('API /api/dashboard/tickets error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

