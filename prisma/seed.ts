import { PrismaClient } from '@prisma/client';
import { teamMembers } from '../data/team';
import { kbArticles } from '../data/kb';
import { sampleTickets } from '../data/tickets';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Enable Row Level Security (RLS) on all tables
  try {
    const rlsSql = `
      ALTER TABLE IF EXISTS "Ticket" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "Message" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "KbArticle" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "Agent" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "Callback" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "RateLimit" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "EventLog" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
    `;
    for (const stmt of rlsSql.split(';').map((s) => s.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log('🔒 Row Level Security (RLS) enabled on all tables.');
  } catch (err) {
    console.warn('Notice: RLS execution statement:', (err as Error).message);
  }

  // 2. Upsert 6 Agents
  for (const a of teamMembers) {
    await prisma.agent.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        role: a.role,
        specialty: a.specialty,
        status: a.status,
        shiftStart: a.shift.start,
        shiftEnd: a.shift.end,
        phone: a.phone,
        email: a.email,
        whatsapp: a.whatsapp,
        image: a.avatar,
        bio: a.bio,
      },
      create: {
        id: a.id,
        name: a.name,
        role: a.role,
        specialty: a.specialty,
        status: a.status,
        shiftStart: a.shift.start,
        shiftEnd: a.shift.end,
        phone: a.phone,
        email: a.email,
        whatsapp: a.whatsapp,
        image: a.avatar,
        bio: a.bio,
      },
    });
  }
  console.log(`✅ Upserted ${teamMembers.length} agents.`);

  // 3. Upsert 15 KB Articles
  for (const kb of kbArticles) {
    await prisma.kbArticle.upsert({
      where: { id: kb.id },
      update: {
        title: kb.title,
        category: kb.category,
        content: kb.content,
        keywords: kb.keywords,
        approved: kb.approved,
      },
      create: {
        id: kb.id,
        title: kb.title,
        category: kb.category,
        content: kb.content,
        keywords: kb.keywords,
        approved: kb.approved,
      },
    });
  }
  console.log(`✅ Upserted ${kbArticles.length} KB articles.`);

  // 4. Upsert Sample Tickets with messages
  for (const t of sampleTickets) {
    const matchedAgent = teamMembers.find((m) => m.name === t.assignedAgent || m.id === t.assignedAgent);
    const assignedAgentId = matchedAgent?.id ?? null;

    const createdTicket = await prisma.ticket.upsert({
      where: { id: t.id },
      update: {
        customerName: 'Customer',
        category: t.category,
        priority: t.priority,
        sentiment: t.sentiment,
        status: t.status,
        confidence: t.confidence,
        assignedAgentId,
        summary: t.body,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      },
      create: {
        id: t.id,
        customerName: 'Customer',
        category: t.category,
        priority: t.priority,
        sentiment: t.sentiment,
        status: t.status,
        confidence: t.confidence,
        assignedAgentId,
        summary: t.body,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      },
    });

    const existingMsg = await prisma.message.findFirst({
      where: { ticketId: createdTicket.id },
    });
    if (!existingMsg) {
      await prisma.message.create({
        data: {
          ticketId: createdTicket.id,
          role: 'customer',
          text: t.body,
          createdAt: t.createdAt,
        },
      });
      if (t.aiDraft) {
        await prisma.message.create({
          data: {
            ticketId: createdTicket.id,
            role: 'ai',
            text: t.aiDraft,
            sourceArticleIds: t.kbSources ?? [],
            createdAt: new Date(t.createdAt.getTime() + 15000),
          },
        });
      }
    }
  }
  console.log(`✅ Upserted ${sampleTickets.length} sample tickets & messages.`);
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

