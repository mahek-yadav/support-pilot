'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Github, Twitter, Linkedin } from 'lucide-react';

export default function FooterCTA() {
  return (
    <>
      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg" />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-4">Get started free</p>
            <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
              AI support that actually{' '}
              <span className="text-gradient">understands</span>
            </h2>
            <p className="text-gray-400 mb-10 text-sm">No API key needed to try. No setup. Just chat.</p>

            <div className="flex items-center gap-4 justify-center flex-wrap">
              <Link
                href="/chat"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-all duration-200 hover:scale-105 glow-violet"
              >
                Try Live Chat <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-8 py-4 rounded-xl glass border border-white/10 hover:border-violet-500/40 font-semibold transition-all duration-200"
              >
                View Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">SupportPilot</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/chat" className="hover:text-white transition-colors">Live Chat</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <div className="flex items-center gap-3">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg glass border border-white/5 hover:border-white/20 transition-colors" aria-label="Social link">
                <Icon className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-8">
          © 2026 SupportPilot. Built with Next.js, Framer Motion & shadcn/ui.
        </p>
      </footer>
    </>
  );
}

