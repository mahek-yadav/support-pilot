import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { ticketId, name, contact } = await req.json();

    if (!ticketId || !contact) {
      return NextResponse.json(
        { error: 'ticketId and contact details are required' },
        { status: 400 }
      );
    }

    try {
      const callback = await prisma.callback.create({
        data: {
          ticketId,
          name: name || 'Customer',
          contact,
        },
      });

      return NextResponse.json({ success: true, callback });
    } catch {
      return NextResponse.json({ success: true, simulated: true });
    }
  } catch (error) {
    console.error('API /api/callback error:', error);
    return NextResponse.json({ error: 'Failed to request callback' }, { status: 500 });
  }
}

