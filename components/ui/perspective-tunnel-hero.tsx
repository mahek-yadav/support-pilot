'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  MotionValue,
} from 'framer-motion';
import {
  ArrowRight,
  Zap,
  MessageSquare,
  Tag,
  FileText,
  CheckCircle2,
  User,
  Shield,
  Clock,
} from 'lucide-react';

export interface TunnelCardData {
  id: string;
  title: string;
  content: React.ReactNode;
  footer?: string;
}

export interface TunnelHeroProps {
  brandName?: string;
  eyebrow?: string;
  tagline?: string;
  cards?: TunnelCardData[];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

// 9 designed cards representing SupportPilot features with 100% relative 'em' sizing
const DEFAULT_CARDS: TunnelCardData[] = [
  {
    id: 'card-1',
    title: 'Incoming Query',
    footer: 'Just now · Live Ticket #1042',
    content: (
      <div className="space-y-[0.5em]">
        <p className="text-[0.78em] text-zinc-200 leading-snug font-medium line-clamp-2">
          &ldquo;My refund hasn&apos;t arrived yet. It has been 6 business days.&rdquo;
        </p>
        <div className="inline-flex items-center gap-[0.4em] px-[0.6em] py-[0.25em] rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[0.72em]">
          <span className="w-[0.45em] h-[0.45em] rounded-full bg-orange-400" />
          <span>Refund / Return</span>
        </div>
      </div>
    ),
  },
  {
    id: 'card-2',
    title: 'Auto Categorised',
    footer: '99.2% classification accuracy',
    content: (
      <div className="flex flex-wrap gap-[0.35em]">
        <span className="text-[0.7em] px-[0.5em] py-[0.2em] rounded-md bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
          Billing
        </span>
        <span className="text-[0.7em] px-[0.5em] py-[0.2em] rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
          Technical
        </span>
        <span className="text-[0.7em] px-[0.5em] py-[0.2em] rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
          Account
        </span>
        <span className="text-[0.7em] px-[0.5em] py-[0.2em] rounded-md bg-green-500/15 text-green-300 border border-green-500/30">
          Shipping
        </span>
      </div>
    ),
  },
  {
    id: 'card-3',
    title: 'KB-Grounded Draft',
    footer: 'Strict Zero-Hallucination Policy',
    content: (
      <div className="space-y-[0.4em]">
        <p className="text-[0.75em] text-zinc-300 leading-relaxed line-clamp-2">
          &ldquo;Standard card refunds settle within 5&ndash;7 banking business days&hellip;&rdquo;
        </p>
        <span className="inline-block text-[0.68em] px-[0.5em] py-[0.2em] rounded bg-blue-500/15 text-blue-300 border border-blue-500/20 font-medium">
          Source: Refund Policy &sect;3.1
        </span>
      </div>
    ),
  },
  {
    id: 'card-4',
    title: 'Confidence Meter',
    footer: 'Threshold &gt; 85% Auto-Send',
    content: (
      <div className="space-y-[0.5em]">
        <div className="flex items-center justify-between text-[0.78em]">
          <span className="text-zinc-400">Match score</span>
          <span className="text-emerald-400 font-bold">94%</span>
        </div>
        <div className="w-full h-[0.45em] rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" />
        </div>
      </div>
    ),
  },
  {
    id: 'card-5',
    title: 'Live Chat Timer',
    footer: 'Auto-handoff on expiration',
    content: (
      <div className="flex items-center gap-[0.7em]">
        <div className="relative w-[2.6em] h-[2.6em] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeDasharray="75 25"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[0.65em] font-bold text-violet-300">
            08:42
          </span>
        </div>
        <div>
          <p className="text-[0.78em] font-medium text-white">Active Session</p>
          <p className="text-[0.68em] text-zinc-400">10-Min Session Window</p>
        </div>
      </div>
    ),
  },
  {
    id: 'card-6',
    title: 'Priority Engine',
    footer: 'Real-time Sentiment & SLA Triage',
    content: (
      <div className="flex flex-col gap-[0.35em]">
        <div className="flex items-center gap-[0.4em] text-[0.72em] text-red-300 font-medium">
          <span className="w-[0.45em] h-[0.45em] rounded-full bg-red-400 animate-pulse" />
          Urgent &middot; Immediate triage
        </div>
        <div className="flex items-center gap-[0.4em] text-[0.72em] text-orange-300 font-medium">
          <span className="w-[0.45em] h-[0.45em] rounded-full bg-orange-400" />
          High &middot; &lt; 5 min SLA
        </div>
      </div>
    ),
  },
  {
    id: 'card-7',
    title: 'Approved KB Article',
    footer: 'Audited & Grounded by Admin',
    content: (
      <div className="space-y-[0.4em]">
        <p className="text-[0.75em] font-medium text-zinc-200">
          Billing Cycle &amp; Invoice Policy
        </p>
        <span className="inline-flex items-center gap-[0.3em] text-[0.68em] px-[0.55em] py-[0.2em] rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-[0.9em] h-[0.9em]" /> Approved
        </span>
      </div>
    ),
  },
  {
    id: 'card-8',
    title: 'Smart Escalation',
    footer: 'Matched by Category & Shift',
    content: (
      <div className="space-y-[0.4em]">
        <p className="text-[0.75em] text-zinc-300">Connecting you to a specialist&hellip;</p>
        <div className="flex items-center gap-[0.4em] pt-[0.2em]">
          <span className="w-[0.45em] h-[0.45em] rounded-full bg-violet-400 animate-ping" />
          <span className="text-[0.7em] text-violet-400 font-medium">Matching agent by skill</span>
        </div>
      </div>
    ),
  },
  {
    id: 'card-9',
    title: 'Free Agent Match',
    footer: 'Direct Call &middot; Email &middot; WhatsApp',
    content: (
      <div className="flex items-center gap-[0.6em]">
        <div className="w-[2.2em] h-[2.2em] rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <User className="w-[1.2em] h-[1.2em] text-emerald-400" />
        </div>
        <div>
          <p className="text-[0.8em] font-bold text-white">Priya Sharma</p>
          <span className="text-[0.68em] text-emerald-400 flex items-center gap-[0.3em]">
            <span className="w-[0.4em] h-[0.4em] rounded-full bg-emerald-400" /> Available now
          </span>
        </div>
      </div>
    ),
  },
];

function TunnelCardItem({
  card,
  index,
  total,
  smooth,
  isMobile,
  cardWidth,
  farZ,
  nearZ,
}: {
  card: TunnelCardData;
  index: number;
  total: number;
  smooth: MotionValue<number>;
  isMobile: boolean;
  cardWidth: number;
  farZ: number;
  nearZ: number;
}) {
  // Card timing: start = (i/total) * (1 - 0.55), end = start + 0.55
  const start = (index / total) * 0.45;
  const end = start + 0.55;

  const cardZ = useTransform(smooth, [start, end], [farZ, nearZ]);
  const cardOpacity = useTransform(
    smooth,
    [start, start + 0.18 * 0.55, start + 0.82 * 0.55, end],
    [0, 1, 1, 0]
  );

  const angle = (index * 137.508 * Math.PI) / 180;
  const radius = isMobile ? 160 : 310 + (index % 3) * 55;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * (radius * 0.58);
  const cardFontSize = cardWidth / 17;

  return (
    <motion.div
      className="absolute"
      style={{
        transformStyle: 'preserve-3d',
        x,
        y,
        z: cardZ,
        opacity: cardOpacity,
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          width: `${cardWidth}px`,
          fontSize: `${cardFontSize}px`,
        }}
        className="aspect-[4/5] rounded-[1.2em] p-[0.9em] bg-zinc-950/90 backdrop-blur-xl border border-white/10 ring-1 ring-violet-500/20 shadow-[0_1em_2.5em_rgba(0,0,0,0.6)] flex flex-col justify-between select-none"
      >
        {/* Header */}
        <div className="flex items-center gap-[0.5em] pb-[0.6em] border-b border-white/8">
          <div className="w-[0.55em] h-[0.55em] rounded-full bg-violet-400 shadow-[0_0_0.6em_rgba(167,139,250,0.7)]" />
          <span className="text-[0.92em] font-bold text-white tracking-tight truncate">
            {card.title}
          </span>
        </div>

        {/* Content body */}
        <div className="flex-1 flex flex-col justify-center py-[0.5em]">
          {card.content}
        </div>

        {/* Footer */}
        {card.footer && (
          <div className="pt-[0.5em] border-t border-white/6 flex items-center justify-between text-[0.68em] text-zinc-400">
            <span className="truncate">{card.footer}</span>
            <span className="text-violet-400 font-mono">#{index + 1}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PerspectiveTunnelHero({
  brandName = 'SupportPilot',
  eyebrow = 'AI Customer Support',
  tagline = 'Smart classification, KB-grounded drafts, and live free-teammate handoff.',
  cards = DEFAULT_CARDS,
  primaryCta = { label: 'Try Live Chat', href: '/chat' },
  secondaryCta = { label: 'View Dashboard', href: '/dashboard' },
}: TunnelHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // FIX 2: Scroll progress: 0 at start, 1 at end
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.0001,
  });

  // FIX 3: Title visible from the very first frame
  const titleOpacity = useTransform(smooth, [0, 0.8, 0.95], [1, 1, 0]);
  const titleScale = useTransform(smooth, [0, 1], [1, 1.12]);
  const promptOpacity = useTransform(smooth, [0, 0.1], [1, 0]);

  // FIX 5: Card sizing & depth parameters
  const cardWidth = isMobile ? 190 : 250;
  const farZ = isMobile ? -1200 : -1500;
  const nearZ = isMobile ? 220 : 300; // reduced closest depth so cards don't explode into camera

  const memoCards = useMemo(() => cards, [cards]);

  if (reducedMotion) {
    return (
      <section className="relative min-h-[90vh] flex items-center justify-center py-24 px-4 bg-[#09090b]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-400 font-semibold mb-3">
            {eyebrow}
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300 mb-6">
            {brandName}
          </h1>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            {tagline}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href={primaryCta.href}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-white shadow-lg transition-transform hover:scale-105"
            >
              {primaryCta.label}
            </Link>
            <Link
              href={secondaryCta.href}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 text-gray-200 font-semibold transition-colors"
            >
              {secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    /* FIX 1: Parent section has tall height; child data-hero-stage is sticky */
    <section ref={sectionRef} className="relative h-[260svh] md:h-[300svh]">
      <div
        data-hero-stage
        className="sticky top-0 h-svh w-full overflow-hidden bg-[#09090b] flex items-center justify-center"
        style={{ perspective: isMobile ? '900px' : '1200px' }}
      >
        {/* Ambient background dots & glow */}
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-cyan-500/8 blur-[120px] pointer-events-none" />

        {/* Concentric perspective rings */}
        {[340, 560, 800, 1100].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/[0.03] pointer-events-none"
            style={{ width: size, height: size }}
          />
        ))}

        {/* FIX 1 & 4: 3D Cards Layer (z-10, passes behind title) */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {memoCards.map((card, i) => (
            <TunnelCardItem
              key={card.id}
              card={card}
              index={i}
              total={memoCards.length}
              smooth={smooth}
              isMobile={isMobile}
              cardWidth={cardWidth}
              farZ={farZ}
              nearZ={nearZ}
            />
          ))}
        </div>

        {/* Radial vignette behind title so text remains ultra-legible */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.85)_0%,rgba(9,9,11,0.45)_50%,transparent_80%)] pointer-events-none z-15" />

        {/* FIX 3: Central Brand Title & CTAs (z-20, visible immediately at progress 0, pt-16 for navbar) */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 pt-16 pointer-events-none">
          <motion.div
            style={{
              scale: titleScale,
              opacity: titleOpacity,
            }}
            className="max-w-3xl mx-auto flex flex-col items-center"
          >
            <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-violet-400 font-semibold mb-3">
              {eyebrow}
            </p>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-4 select-none"
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #d8b4fe 30%, #818cf8 60%, #67e8f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 45px rgba(139,92,246,0.35))',
              }}
            >
              {brandName}
            </h1>

            <p className="text-sm md:text-base text-zinc-300 max-w-xl mx-auto font-light leading-relaxed mb-6">
              {tagline}
            </p>

            {/* Clickable Action Buttons (z-30, pointer-events-auto) */}
            <div className="flex items-center justify-center gap-3 flex-wrap pointer-events-auto z-30">
              <Link
                href={primaryCta.href}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-sm text-white transition-all duration-200 hover:scale-105 shadow-[0_0_25px_rgba(124,58,237,0.4)] active:scale-95"
              >
                {primaryCta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={secondaryCta.href}
                className="px-6 py-3 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-violet-500/40 font-medium text-sm text-zinc-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {secondaryCta.label}
              </Link>
            </div>

            {/* Scroll hint: visible at 0, fades out by 0.1 */}
            <motion.div
              style={{ opacity: promptOpacity }}
              className="mt-6 flex items-center justify-center gap-1.5 text-zinc-400 text-[11px] uppercase tracking-widest pointer-events-none"
            >
              <span>Scroll to explore</span>
              <span className="animate-bounce">↓</span>
            </motion.div>
          </motion.div>
        </div>

        {/* FIX 4: Bottom gradient fade for seamless handoff to next section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none z-20" />
      </div>
    </section>
  );
}
