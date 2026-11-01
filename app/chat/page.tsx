'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle,
  XCircle,
  Zap,
  ChevronRight,
  RotateCcw,
  UserCheck,
  Star,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import TimerRing from '@/components/chat/TimerRing';
import EscalationScreen from '@/components/chat/EscalationScreen';
import { Message, Category, TeamMember } from '@/types';
import { categoryColors, cn } from '@/lib/utils';

const SESSION_MINUTES = 10;
const DEMO_SECONDS = 30;

const STARTER_PROMPTS = [
  "How long do refunds take to process?",
  "I can't log into my account",
  "How do I cancel my subscription?",
  "Where is my package right now?",
  "What are your pricing plans?",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

interface ChatBubbleProps {
  msg: Message;
  isLatestAI?: boolean;
  onSolve?: () => void;
  onNotSolved?: () => void;
  onEscalate?: () => void;
  resolved?: boolean;
}

function ChatBubble({
  msg,
  isLatestAI,
  onSolve,
  onNotSolved,
  onEscalate,
  resolved,
}: ChatBubbleProps) {
  const isAI = msg.role === 'ai';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center my-2"
      >
        <span className="text-xs text-zinc-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">
          {msg.content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn('flex gap-3', isAI ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md',
          isAI
            ? 'bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white'
            : 'bg-zinc-800 border border-white/10 text-zinc-300'
        )}
      >
        {isAI ? <Zap className="w-4 h-4" /> : '👤'}
      </div>

      <div
        className={cn(
          'max-w-[82%] space-y-1.5',
          isAI ? 'items-start' : 'items-end flex flex-col'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isAI
              ? 'glass border border-white/10 text-zinc-100 rounded-tl-sm shadow-sm'
              : 'bg-violet-600 text-white rounded-tr-sm shadow-md'
          )}
        >
          {msg.content}
        </div>

        {/* Classification Chip & Confidence */}
        {msg.classification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 flex-wrap text-[10px]"
          >
            <span
              className={cn(
                'px-2 py-0.5 rounded-full border font-medium',
                categoryColors[msg.classification.category] ||
                  'bg-zinc-800 border-zinc-700 text-zinc-300'
              )}
            >
              {msg.classification.category}
            </span>
            <span className="text-zinc-500">
              {Math.round(msg.classification.confidence * 100)}% match
            </span>
          </motion.div>
        )}

        {/* Source Engine, Verification Chip & KB Source chips */}
        {isAI && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {/* Clear Source Label: Gemini AI vs Demo Response vs Fallback Response */}
            <span
              className={cn(
                'text-[9px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1.5 shadow-sm',
                msg.engine === 'gemini'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : msg.engine === 'demo'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  msg.engine === 'gemini'
                    ? 'bg-emerald-400 animate-pulse'
                    : msg.engine === 'demo'
                    ? 'bg-blue-400'
                    : 'bg-amber-400'
                )}
              />
              {msg.engine === 'gemini'
                ? 'Gemini AI'
                : msg.engine === 'demo'
                ? 'Demo Response'
                : 'Fallback Response'}
            </span>

            {/* Verification Status */}
            {msg.verified ? (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                ✓ Verified against NovaShop KB
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 font-medium">
                Unverified response
              </span>
            )}

            {/* KB Source IDs */}
            {msg.kbSources && msg.kbSources.length > 0 && msg.kbSources.map((src, i) => (
              <span
                key={i}
                className="text-[9px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium"
              >
                📚 Source: {src}
              </span>
            ))}
          </div>
        )}

        {/* Follow-up Action Chips (After each AI response) */}
        {isAI && isLatestAI && !resolved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-1.5 pt-2"
          >
            <button
              onClick={onSolve}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all active:scale-95"
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              That solved it
            </button>
            <button
              onClick={onNotSolved}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all active:scale-95"
            >
              <XCircle className="w-3 h-3 text-amber-400" />
              Not solved
            </button>
            <button
              onClick={onEscalate}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-all active:scale-95"
            >
              <UserCheck className="w-3 h-3 text-violet-400" />
              Talk to a person
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        "Hi! I'm SupportPilot AI 👋 How can I help you today? I answer using only our approved knowledge base.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Conversation tracking
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [noAnswerCount, setNoAnswerCount] = useState(0);
  const [lastCategory, setLastCategory] = useState<Category>('Other');

  // Session & Timer
  const [sessionActive, setSessionActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isServerDemoMode, setIsServerDemoMode] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ keyPresent: boolean; model: string; ok: boolean; errorCode?: number | string } | null>(null);

  useEffect(() => {
    fetch('/api/ai-status')
      .then((r) => r.json())
      .then((data) => {
        setAiStatus(data);
        if (!data.ok) setIsServerDemoMode(true);
      })
      .catch(() => setIsServerDemoMode(true));
  }, []);

  const totalSeconds = demoMode ? DEMO_SECONDS : SESSION_MINUTES * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  // States
  const [escalated, setEscalated] = useState(false);
  const [availableAgent, setAvailableAgent] = useState<TeamMember | null>(null);
  const [resolved, setResolved] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingSaved, setRatingSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Session Timer countdown
  useEffect(() => {
    if (!sessionActive || resolved || escalated) return;
    setRemainingSeconds(demoMode ? DEMO_SECONDS : SESSION_MINUTES * 60);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTriggerEscalation('Session time expired without resolution.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive, demoMode, resolved, escalated]);

  // Hand off to human
  const handleTriggerEscalation = useCallback(
    async (reason: string) => {
      try {
        const res = await fetch('/api/escalate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            category: lastCategory,
            reason,
          }),
        });
        const data = await res.json();
        setAvailableAgent(data.agent);
      } catch {
        // Fallback agent
      }
      setEscalated(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          content: `🔄 Escalating session: ${reason}`,
          timestamp: new Date(),
        },
      ]);
    },
    [ticketId, lastCategory]
  );

  // Send message multi-turn
  const sendMessage = useCallback(
    async (text?: string) => {
      const query = (text ?? input).trim();
      if (!query || isTyping) return;
      setInput('');

      if (!sessionActive) setSessionActive(true);

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'customer',
        content: query,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            message: query,
            unresolvedCount,
            noAnswerCount,
          }),
        });

        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();

        if (data.ticketId) setTicketId(data.ticketId);
        if (data.isDemoMode !== undefined) setIsServerDemoMode(data.isDemoMode);
        if (data.classification?.category) setLastCategory(data.classification.category);
        if (data.unresolvedCount !== undefined) setUnresolvedCount(data.unresolvedCount);
        if (data.noAnswerCount !== undefined) setNoAnswerCount(data.noAnswerCount);

        setIsTyping(false);

        // Add AI message
        const aiMsg: Message = {
          id: data.message?.id || `ai-${Date.now()}`,
          role: 'ai',
          content: data.message?.text || 'Here is what our knowledge base says.',
          timestamp: new Date(),
          classification: data.classification,
          kbSources: data.message?.sourceArticleIds || [],
          confidence: data.classification?.confidence || 0.9,
          verified: data.message?.verified ?? data.verification?.verified ?? false,
          verificationNotes: data.message?.verificationNotes,
          engine: data.engine || data.message?.engine || (data.isDemoMode ? 'fallback' : 'gemini'),
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Auto escalate if server pipeline determined escalation is needed
        if (data.shouldEscalate) {
          setAvailableAgent(data.assignedAgent);
          setEscalated(true);
        }
      } catch (err) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            role: 'ai',
            content:
              "I'm currently unable to access the knowledge base. Let me connect you directly to our human support team.",
            timestamp: new Date(),
          },
        ]);
        handleTriggerEscalation('Service connection error');
      }
    },
    [input, isTyping, sessionActive, ticketId, unresolvedCount, noAnswerCount, handleTriggerEscalation]
  );

  // Handle "That solved it"
  const handleMarkSolved = async () => {
    setResolved(true);
    if (ticketId) {
      try {
        await fetch('/api/tickets/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId }),
        });
      } catch {
        // Continue
      }
    }
  };

  // Handle "Not solved"
  const handleNotSolved = () => {
    const nextCount = unresolvedCount + 1;
    setUnresolvedCount(nextCount);
    if (nextCount >= 2) {
      handleTriggerEscalation('Customer indicated not solved twice.');
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          content:
            "I'm sorry that didn't fully resolve it. Feel free to type more details, or click 'Talk to a person' anytime.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Handle star rating
  const handleRating = async (stars: number) => {
    setRating(stars);
    setRatingSaved(true);
    if (ticketId) {
      try {
        await fetch('/api/tickets/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, rating: stars }),
        });
      } catch {
        // Continue
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Find last AI message id to anchor action chips
  const lastAIMessageId = [...messages].reverse().find((m) => m.role === 'ai')?.id;

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-2 font-medium">
              Live Support &middot; Multi-turn AI
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Chat with <span className="text-gradient">SupportPilot</span>
            </h1>
          </motion.div>

          {/* Chat widget container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            style={{ minHeight: 560 }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                  <Zap className="w-4 h-4 text-white" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#09090b] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">SupportPilot AI Assistant</p>
                    {aiStatus?.ok && !isServerDemoMode ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AI: Gemini (Live)
                      </span>
                    ) : aiStatus?.errorCode === 429 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1.5" title="Google Gemini Free Tier daily quota of 20 requests was exceeded. Using local verified extractive fallback.">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Fallback Mode (Gemini Quota 429)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Demo Mode (Local Fallback)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Answers come from our approved knowledge base. You can ask for a person anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Demo timer switch button */}
                {!sessionActive && (
                  <button
                    onClick={() => setDemoMode(!demoMode)}
                    className={cn(
                      'text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium',
                      demoMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20'
                    )}
                  >
                    {demoMode ? '⚡ Demo 30s Timer' : '🕙 10-Min Session'}
                  </button>
                )}
                {sessionActive && !resolved && !escalated && (
                  <TimerRing
                    totalSeconds={totalSeconds}
                    remainingSeconds={remainingSeconds}
                  />
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto" style={{ height: 380 }}>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  isLatestAI={msg.id === lastAIMessageId}
                  onSolve={handleMarkSolved}
                  onNotSolved={handleNotSolved}
                  onEscalate={() => handleTriggerEscalation('Customer requested human specialist.')}
                  resolved={resolved}
                />
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="glass border border-white/10 rounded-2xl rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Starter Suggestion Chips (Before first user question) */}
            {messages.length <= 1 && !isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 pb-3 flex flex-wrap gap-1.5"
              >
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full glass border border-white/10 hover:border-violet-500/40 text-zinc-300 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                  >
                    {prompt} <ChevronRight className="w-3 h-3 text-zinc-500" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Resolved Confirmation & Rating Card */}
            {resolved && !escalated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 pb-4 text-center"
              >
                <div className="glass rounded-xl p-5 border border-emerald-500/20 bg-emerald-950/20">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-300">Issue Resolved! 🎉</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Thank you for using SupportPilot. How was your experience?
                  </p>

                  {/* 1–5 Star Rating */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className="p-1 text-zinc-500 hover:text-amber-400 transition-colors"
                      >
                        <Star
                          className={cn(
                            'w-5 h-5 transition-transform hover:scale-125',
                            rating && rating >= star
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-zinc-600'
                          )}
                        />
                      </button>
                    ))}
                  </div>

                  {ratingSaved && (
                    <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                      Thank you for your {rating}-star rating!
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setResolved(false);
                      setSessionActive(false);
                      setTicketId(null);
                      setRating(null);
                      setRatingSaved(false);
                      setMessages([
                        {
                          id: 'welcome',
                          role: 'ai',
                          content: "Hi! I'm SupportPilot AI 👋 How can I help you today?",
                          timestamp: new Date(),
                        },
                      ]);
                      setRemainingSeconds(totalSeconds);
                    }}
                    className="mt-4 flex items-center gap-1.5 text-xs mx-auto px-3.5 py-1.5 rounded-full glass border border-white/10 hover:border-white/20 text-zinc-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Start new session
                  </button>
                </div>
              </motion.div>
            )}

            {/* Input Bar (Always Enabled for Free Typing) */}
            {!resolved && !escalated && (
              <div className="px-5 py-4 border-t border-white/8 flex gap-3 bg-zinc-950/30">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                  placeholder="Ask a question or follow-up… (e.g. 'how long does that take?')"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 transition-colors"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl bg-violet-600 disabled:opacity-40 hover:bg-violet-500 transition-all flex items-center justify-center flex-shrink-0 hover:scale-105 disabled:scale-100 shadow-[0_0_15px_rgba(124,58,237,0.35)]"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {/* Escalation Overlay */}
            <AnimatePresence>
              {escalated && (
                <EscalationScreen
                  agent={availableAgent}
                  category={lastCategory}
                  ticketId={ticketId || undefined}
                  onDismiss={() => setEscalated(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-center text-xs text-zinc-500 mt-4 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-violet-400" />
            Strict zero-hallucination KB answers &middot; Auto-handoff to free specialist
          </p>
        </div>
      </div>
    </div>
  );
}
