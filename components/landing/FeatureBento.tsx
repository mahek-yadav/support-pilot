'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Tag, BookOpen, Clock, Users, LayoutDashboard, BarChart2 } from 'lucide-react';

const features = [
  {
    icon: Tag,
    title: 'Smart Classification',
    desc: '8 categories, instant',
    gradient: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/20 hover:border-violet-500/50',
    iconColor: 'text-violet-400',
    glow: 'hover:shadow-violet-500/10',
    size: 'md:col-span-2',
  },
  {
    icon: BookOpen,
    title: 'KB-Only Answers',
    desc: 'No hallucinations, ever',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
    iconColor: 'text-cyan-400',
    glow: 'hover:shadow-cyan-500/10',
    size: '',
  },
  {
    icon: Clock,
    title: '10-Min Live Chat',
    desc: 'Timed AI sessions',
    gradient: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20 hover:border-blue-500/50',
    iconColor: 'text-blue-400',
    glow: 'hover:shadow-blue-500/10',
    size: '',
  },
  {
    icon: Users,
    title: 'Free-Agent Handoff',
    desc: 'Real human, right now',
    gradient: 'from-green-500/20 to-green-500/5',
    border: 'border-green-500/20 hover:border-green-500/50',
    iconColor: 'text-green-400',
    glow: 'hover:shadow-green-500/10',
    size: '',
  },
  {
    icon: LayoutDashboard,
    title: 'Ticket Dashboard',
    desc: 'Kanban + analytics',
    gradient: 'from-orange-500/20 to-orange-500/5',
    border: 'border-orange-500/20 hover:border-orange-500/50',
    iconColor: 'text-orange-400',
    glow: 'hover:shadow-orange-500/10',
    size: '',
  },
  {
    icon: BarChart2,
    title: 'Confidence Score',
    desc: 'Transparent AI trust',
    gradient: 'from-pink-500/20 to-pink-500/5',
    border: 'border-pink-500/20 hover:border-pink-500/50',
    iconColor: 'text-pink-400',
    glow: 'hover:shadow-pink-500/10',
    size: 'md:col-span-2',
  },
];

export default function FeatureBento() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need,{' '}
            <span className="text-gradient">nothing you don't</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${f.size} rounded-2xl p-6 bg-gradient-to-br ${f.gradient} border ${f.border} transition-all duration-300 hover:shadow-2xl ${f.glow} cursor-default group`}
              >
                <div className="mb-4">
                  <Icon className={`w-7 h-7 ${f.iconColor} group-hover:scale-110 transition-transform duration-200`} />
                </div>
                <p className="font-semibold text-white text-sm">{f.title}</p>
                <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

