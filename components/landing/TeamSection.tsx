'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TeamLanyardRail from '@/components/ui/team-lanyard-rail';
import { teamMembers, toSupportAgent } from '@/data/team';

export default function TeamSection() {
  const TEAM = useMemo(() => {
    const now = new Date();
    return teamMembers.map((m) => toSupportAgent(m, now));
  }, []);

  return (
    <section className="w-full py-16 relative">
      <TeamLanyardRail
        items={TEAM}
        eyebrow="Meet the team"
        heading="Real human experts standing by"
        caption="Brush along the rail to meet someone, pull a badge down, click to flip it."
        autoplay
        action={
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-sm text-white transition-all duration-200 hover:scale-105 shadow-[0_0_24px_rgba(124,58,237,0.35)]"
          >
            Try Live Chat <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />
    </section>
  );
}
