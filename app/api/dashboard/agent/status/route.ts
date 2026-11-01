import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    try {
      const updated = await prisma.agent.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, agent: updated });
    } catch {
      return NextResponse.json({ success: true, simulated: true, id, status });
    }
  } catch (error) {
    console.error('API /api/dashboard/agent/status error:', error);
    return NextResponse.json({ error: 'Failed to update agent status' }, { status: 500 });
  }
}

