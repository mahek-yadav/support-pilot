'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, Tag, FileText, Users } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    label: 'Query',
    desc: 'Customer sends message',
    color: 'from-violet-500 to-violet-600',
    glow: 'shadow-violet-500/25',
  },
  {
    icon: Tag,
    label: 'Classify',
    desc: 'AI tags + prioritises',
    color: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/25',
  },
  {
    icon: FileText,
    label: 'Draft from KB',
    desc: 'Grounded in approved articles',
    color: 'from-cyan-500 to-cyan-600',
    glow: 'shadow-cyan-500/25',
  },
  {
    icon: Users,
    label: 'Escalate',
    desc: 'Route to free teammate',
    color: 'from-green-500 to-green-600',
    glow: 'shadow-green-500/25',
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="demo" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold">
            From query to resolution,{' '}
            <span className="text-gradient">in seconds</span>
          </h2>
        </motion.div>

        {/* Flow */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex flex-col md:flex-row items-center">
                {/* Step card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center text-center group"
                >
                  <div
                    className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl ${step.glow} mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#09090b] border-2 border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                      {i + 1}
                    </div>
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">{step.label}</p>
                  <p className="text-xs text-gray-500 max-w-[100px]">{step.desc}</p>
                </motion.div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={inView ? { scaleX: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.3 }}
                    className="hidden md:flex items-center mx-4"
                    style={{ originX: 0 }}
                  >
                    <div className="w-16 h-px bg-gradient-to-r from-white/20 to-white/10 relative">
                      <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-white/30 rotate-45" />
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

