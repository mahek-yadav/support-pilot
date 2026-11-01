import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { action, id, title, category, content, keywords, approved } = await req.json();

    if (action === 'create') {
      const created = await prisma.kbArticle.create({
        data: {
          title,
          category,
          content,
          keywords: keywords || [],
          approved: approved !== undefined ? approved : true,
        },
      });
      return NextResponse.json({ success: true, article: created });
    }

    if (action === 'update') {
      const updated = await prisma.kbArticle.update({
        where: { id },
        data: {
          title,
          category,
          content,
          keywords: keywords || [],
          approved: approved !== undefined ? approved : true,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, article: updated });
    }

    if (action === 'delete') {
      await prisma.kbArticle.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API /api/dashboard/kb error:', error);
    return NextResponse.json({ error: 'Failed to update KB article' }, { status: 500 });
  }
}

