'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerRingProps {
  totalSeconds: number;
  remainingSeconds: number;
}

export default function TimerRing({ totalSeconds, remainingSeconds }: TimerRingProps) {
  const progress = remainingSeconds / totalSeconds;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const color = progress > 0.5 ? '#8b5cf6' : progress > 0.2 ? '#f59e0b' : '#ef4444';
  const urgent = progress < 0.2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative w-24 h-24 ${urgent ? 'animate-pulse' : ''}`}>
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          {/* Progress ring */}
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            animate={{ strokeDashoffset: offset, stroke: color }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white leading-none">{timeStr}</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-wider">left</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Session</span>
    </div>
  );
}

