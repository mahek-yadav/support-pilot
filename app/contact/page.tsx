'use client';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import FooterCTA from '@/components/landing/FooterCTA';

const contactMethods = [
  { icon: Mail, label: 'Email', value: 'support@supportpilot.com', href: 'mailto:support@supportpilot.com', color: 'text-blue-400' },
  { icon: Phone, label: 'Phone', value: '+1 (800) 555-0199', href: 'tel:+18005550199', color: 'text-green-400' },
  { icon: MessageCircle, label: 'Live Chat', value: 'Chat with AI now', href: '/chat', color: 'text-violet-400' },
  { icon: MapPin, label: 'HQ', value: 'San Francisco, CA 94105', href: '#', color: 'text-orange-400' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-3">Contact</p>
            <h1 className="text-4xl font-black mb-3">
              We're here to <span className="text-gradient">help</span>
            </h1>
            <p className="text-gray-400">Reach out via any channel — we respond fast.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Contact methods */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {contactMethods.map((m, i) => {
                const Icon = m.icon;
                return (
                  <a
                    key={i}
                    href={m.href}
                    className="flex items-center gap-4 glass rounded-xl p-4 border border-white/8 hover:border-violet-500/30 transition-all group"
                  >
                    <div className="p-3 rounded-xl glass border border-white/8">
                      <Icon className={`w-5 h-5 ${m.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{m.label}</p>
                      <p className="text-sm font-medium group-hover:text-violet-300 transition-colors">{m.value}</p>
                    </div>
                  </a>
                );
              })}
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <form className="glass rounded-2xl p-6 border border-white/8 space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Name</label>
                    <input type="text" placeholder="Jane Smith" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
                    <input type="email" placeholder="you@email.com" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Subject</label>
                  <input type="text" placeholder="How can we help?" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Message</label>
                  <textarea rows={5} placeholder="Describe your issue or question…" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 resize-none" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium text-sm transition-colors glow-violet">
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
      <FooterCTA />
    </div>
  );
}

