'use client';

import React from 'react';
import PerspectiveTunnelHero from '@/components/ui/perspective-tunnel-hero';

export default function HeroSection() {
  return (
    <PerspectiveTunnelHero
      brandName="SupportPilot"
      eyebrow="AI Customer Support"
      tagline="Smart classification, KB-grounded drafts, and live free-teammate handoff."
      primaryCta={{ label: 'Try Live Chat', href: '/chat' }}
      secondaryCta={{ label: 'View Dashboard', href: '/dashboard' }}
    />
  );
}
