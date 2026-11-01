'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: 24800, label: 'Tickets Classified', suffix: '+' },
  { value: 94, label: 'Resolution Rate', suffix: '%' },
  { value: 38, label: 'Avg Response Time', suffix: 's' },
  { value: 99.9, label: 'Uptime', suffix: '%', decimals: 1 },
];

function Counter({ target, suffix, decimals = 0, active }: { target: number; suffix: string; decimals?: number; active: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const duration = 2000;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(parseFloat(start.toFixed(decimals)));
      }
    }, step);
    return () => clearInterval(timer);
  }, [active, target, decimals]);

  return (
    <span className="text-3xl md:text-4xl font-black text-gradient">
      {decimals ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      {/* Animated gradient line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div ref={ref} className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <Counter target={stat.value} suffix={stat.suffix} decimals={stat.decimals} active={inView} />
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

