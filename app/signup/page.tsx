'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-1 flex-col justify-center px-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">SupportPilot</span>
          </Link>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            Start resolving tickets{' '}
            <span className="text-gradient">with AI</span>
          </h2>
          <p className="text-gray-400">No API key needed. Just create an account and go.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center px-6"
      >
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1">Create account</h1>
          <p className="text-gray-400 text-sm mb-8">Start your free trial today</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">First name</label>
                <input type="text" placeholder="Jane" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Last name</label>
                <input type="text" placeholder="Smith" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Work email</label>
              <input type="email" placeholder="you@company.com" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium text-sm transition-colors glow-violet">
              Create Account
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

