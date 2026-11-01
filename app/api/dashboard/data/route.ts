import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sampleTickets } from '@/data/tickets';
import { kbArticles as fallbackKb } from '@/data/kb';
import { teamMembers as fallbackTeam } from '@/data/team';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let tickets: any[] = [];
    let kbArticles: any[] = [];
    let agents: any[] = [];
    let eventLogs: any[] = [];

    try {
      tickets = await prisma.ticket.findMany({
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          assignedAgent: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      kbArticles = await prisma.kbArticle.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      agents = await prisma.agent.findMany({
        orderBy: { name: 'asc' },
      });

      eventLogs = await prisma.eventLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      console.warn('Dashboard DB query note:', (dbErr as Error).message);
    }

    // If database tables are empty, use fallback sample data
    if (tickets.length === 0) {
      tickets = sampleTickets;
    }
    if (kbArticles.length === 0) {
      kbArticles = fallbackKb;
    }
    if (agents.length === 0) {
      agents = fallbackTeam.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        specialty: m.specialty,
        status: m.status,
        shiftStart: m.shift.start,
        shiftEnd: m.shift.end,
        phone: m.phone,
        email: m.email,
        whatsapp: m.whatsapp,
        image: m.avatar,
        bio: m.bio,
      }));
    }

    // Analytics calculations
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === 'Resolved').length;
    const escalated = tickets.filter((t) => t.status === 'Escalated').length;
    const open = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
    const avgConfidence = total > 0 ? tickets.reduce((acc, t) => acc + (t.confidence || 0.85), 0) / total : 0.91;

    // Categories count
    const categoryCounts: Record<string, number> = {};
    for (const t of tickets) {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    }
    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      tickets,
      kbArticles,
      agents,
      eventLogs,
      analytics: {
        total,
        resolved,
        escalated,
        open,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        categoryData,
      },
    });
  } catch (error) {
    console.error('API /api/dashboard/data error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

