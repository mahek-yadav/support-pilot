'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, User, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { TeamMember } from '@/types';
import { teamMembers, toSupportAgent } from '@/data/team';
import TeamLanyardRail from '@/components/ui/team-lanyard-rail';

interface EscalationScreenProps {
  agent: TeamMember | null;
  category: string;
  ticketId?: string;
  onDismiss?: () => void;
}

export default function EscalationScreen({
  agent,
  category,
  ticketId,
  onDismiss,
}: EscalationScreenProps) {
  const [connecting, setConnecting] = useState(true);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  // Callback form state
  const [callbackName, setCallbackName] = useState('');
  const [callbackContact, setCallbackContact] = useState('');
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);

  const now = useMemo(() => new Date(), []);

  // Filter or arrange so matched agent is included
  const displayAgents = useMemo(() => {
    if (!agent) return teamMembers.slice(0, 3).map((m) => toSupportAgent(m, now));
    const otherAgents = teamMembers.filter((m) => m.id !== agent.id).slice(0, 2);
    const combined = [otherAgents[0], agent, otherAgents[1]].filter(Boolean);
    return combined.map((m) => toSupportAgent(m, now));
  }, [agent, now]);

  const matchedIndex = useMemo(() => {
    if (!agent) return 0;
    const found = displayAgents.findIndex((a) => a.id === agent.id);
    return found >= 0 ? found : 0;
  }, [agent, displayAgents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConnecting(false);
      const flipTimer = setTimeout(() => {
        setFlippedIndex(matchedIndex);
      }, 400);
      return () => clearTimeout(flipTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, [matchedIndex]);

  const handleRequestCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackContact.trim()) return;
    setCallbackLoading(true);

    try {
      await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticketId || `tkt-${Date.now()}`,
          name: callbackName || 'Customer',
          contact: callbackContact.trim(),
        }),
      });
      setCallbackSubmitted(true);
    } catch {
      setCallbackSubmitted(true);
    } finally {
      setCallbackLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-30 bg-[#09090b]/95 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-xl text-center my-auto">
        {/* Connecting pulse / radar animation */}
        <AnimatePresence mode="wait">
          {connecting ? (
            <motion.div
              key="connecting"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="py-12"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-violet-500/40"
                    animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
                    transition={{ duration: 1.8, delay: i * 0.45, repeat: Infinity, ease: 'easeOut' }}
                  />
                ))}
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)]">
                  <Zap className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Connecting you to a human…</h3>
              <p className="text-xs text-violet-300">
                Finding available specialist matching your <span className="font-semibold text-white">{category}</span> inquiry
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {agent ? (
                <>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-medium mb-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Free Teammate Connected
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Meet your specialist: {agent.name}
                    </h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Badge flipped to show direct Call, Email, and WhatsApp contact options.
                    </p>
                  </div>

                  {/* Controlled TeamLanyardRail */}
                  <div className="py-2">
                    <TeamLanyardRail
                      items={displayAgents}
                      autoplay={false}
                      active={matchedIndex}
                      flipped={flippedIndex}
                      onFlippedChange={(val) => setFlippedIndex(val as number | null)}
                    />
                  </div>
                </>
              ) : (
                <div className="glass rounded-2xl p-6 border border-white/10 my-4 text-center max-w-md mx-auto">
                  <Clock className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-semibold text-white">All specialists are currently on calls</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Next specialist available tomorrow at 09:00 AM. Leave your contact info for an immediate callback.
                  </p>

                  {callbackSubmitted ? (
                    <div className="mt-4 p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      Callback requested! A team member will reach out promptly.
                    </div>
                  ) : (
                    <form onSubmit={handleRequestCallback} className="mt-4 space-y-2 text-left">
                      <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={callbackName}
                        onChange={(e) => setCallbackName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Email or phone number"
                          value={callbackContact}
                          onChange={(e) => setCallbackContact(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                        />
                        <button
                          type="submit"
                          disabled={callbackLoading || !callbackContact.trim()}
                          className="px-4 py-2 rounded-lg bg-violet-600 text-xs font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
                        >
                          {callbackLoading ? 'Saving…' : 'Request'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 mt-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to AI chat
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
