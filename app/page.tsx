import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import FeatureBento from '@/components/landing/FeatureBento';
import StatsStrip from '@/components/landing/StatsStrip';
import TeamSection from '@/components/landing/TeamSection';
import FooterCTA from '@/components/landing/FooterCTA';

export default function HomePage() {
  return (
    <main className="relative bg-[#09090b] min-h-screen overflow-x-clip">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <StatsStrip />
      <FeatureBento />
      <TeamSection />
      <FooterCTA />
    </main>
  );
}

