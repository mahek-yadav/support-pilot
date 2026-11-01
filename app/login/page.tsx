'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-1 flex-col justify-center px-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center glow-violet">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">SupportPilot</span>
          </Link>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            AI support that{' '}
            <span className="text-gradient">actually works</span>
          </h2>
          <p className="text-gray-400">Classify, draft, and escalate — all in seconds.</p>
          <div className="mt-10 space-y-3">
            {['94% resolution rate', 'KB-grounded answers', '10-min live chat sessions'].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-gray-300"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {f}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center px-6"
      >
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">SupportPilot</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">Sign in to your account</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium text-sm transition-colors glow-violet"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

