'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Tag,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Edit2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { sampleTickets } from '@/data/tickets';
import { teamMembers as fallbackTeam, getAgentStatus, toSupportAgent } from '@/data/team';
import TeamLanyardRail from '@/components/ui/team-lanyard-rail';
import { kbArticles as fallbackKb } from '@/data/kb';
import { categoryColors, priorityColors, cn, formatRelative } from '@/lib/utils';
import { Ticket, TicketStatus } from '@/types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const navItems = [
  { id: 'tickets', label: 'Tickets', icon: LayoutDashboard },
  { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'analytics', label: 'Analytics & Logs', icon: BarChart2 },
  { id: 'quality', label: 'Quality & Eval', icon: ShieldCheck },
];

// ─── Ticket status styling ───────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  Open: { label: 'Open', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', icon: Clock },
  'In Progress': { label: 'In Progress', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30', icon: TrendingUp },
  Resolved: { label: 'Resolved', color: 'text-green-400 bg-green-500/15 border-green-500/30', icon: CheckCircle },
  Escalated: { label: 'Escalated', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30', icon: AlertTriangle },
  Closed: { label: 'Closed', color: 'text-gray-400 bg-gray-500/15 border-gray-500/30', icon: XCircle },
};

const CATEGORY_COLORS: Record<string, string> = {
  Billing: '#eab308',
  'Technical Support': '#3b82f6',
  'Refund/Return': '#f97316',
  'Account & Login': '#8b5cf6',
  'Shipping/Delivery': '#22c55e',
  'Product Info': '#06b6d4',
  'Feedback/Complaint': '#ec4899',
  Other: '#a1a1aa',
};

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#f4f4f5',
  fontSize: 12,
};

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('tickets');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Live Database States
  const [tickets, setTickets] = useState<any[]>(sampleTickets);
  const [kbList, setKbList] = useState<any[]>(fallbackKb);
  const [teamList, setTeamList] = useState<any[]>(fallbackTeam);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    total: sampleTickets.length,
    open: sampleTickets.filter((t) => t.status === 'Open').length,
    escalated: sampleTickets.filter((t) => t.status === 'Escalated').length,
    resolved: sampleTickets.filter((t) => t.status === 'Resolved').length,
    avgConfidence: 0.91,
    categoryData: [],
  });
  const [loading, setLoading] = useState(true);

  // Drawer & Filter States
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketFilter, setTicketFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live data from Prisma database
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/data');
      if (!res.ok) throw new Error('Failed to load data');
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
      if (data.kbArticles) setKbList(data.kbArticles);
      if (data.agents) {
        // Map agents to TeamMember format
        const mapped = data.agents.map((a: any) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          specialty: a.specialty,
          status: a.status,
          shift: { start: a.shiftStart, end: a.shiftEnd },
          phone: a.phone,
          email: a.email,
          whatsapp: a.whatsapp,
          avatar: a.image,
          bio: a.bio || '',
        }));
        setTeamList(mapped);
      }
      if (data.eventLogs) setEventLogs(data.eventLogs);
      if (data.analytics) setAnalytics(data.analytics);
    } catch {
      // Fallbacks already in place
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Update Agent Status via Database
  const handleAgentStatusChange = async (agentId: string, status: string) => {
    setTeamList((prev) =>
      prev.map((m) => (m.id === agentId ? { ...m, status: status as any } : m))
    );
    try {
      await fetch('/api/dashboard/agent/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, status }),
      });
    } catch {
      // Handled
    }
  };

  // Update Ticket Status via Database
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
    }
    try {
      await fetch('/api/dashboard/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', ticketId, status: newStatus }),
      });
    } catch {
      // Handled
    }
  };

  // Approve & Send AI Draft
  const handleApproveAndSend = async (ticketId: string, draftText: string) => {
    handleUpdateTicketStatus(ticketId, 'Resolved');
    try {
      await fetch('/api/dashboard/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approveAndSend', ticketId, aiDraft: draftText }),
      });
      setSelectedTicket(null);
      loadDashboardData();
    } catch {
      // Handled
    }
  };

  // KB Article Mutations (Add / Edit / Delete)
  const handleCreateKbArticle = async (newArticle: any) => {
    try {
      const res = await fetch('/api/dashboard/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newArticle }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch {
      // Handled
    }
  };

  const handleDeleteKbArticle = async (articleId: string) => {
    setKbList((prev) => prev.filter((a) => a.id !== articleId));
    try {
      await fetch('/api/dashboard/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: articleId }),
      });
    } catch {
      // Handled
    }
  };

  // Top Stats
  const stats = [
    {
      label: 'Total Tickets',
      value: tickets.length,
      icon: LayoutDashboard,
      color: 'text-violet-400',
    },
    {
      label: 'Open / In Progress',
      value: tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length,
      icon: Clock,
      color: 'text-blue-400',
    },
    {
      label: 'Escalated',
      value: tickets.filter((t) => t.status === 'Escalated').length,
      icon: AlertTriangle,
      color: 'text-orange-400',
    },
    {
      label: 'Resolved',
      value: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
  ];

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesFilter =
      ticketFilter === 'All' ||
      t.status === ticketFilter ||
      (ticketFilter === 'Active' && (t.status === 'Open' || t.status === 'In Progress'));
    const matchesSearch =
      (t.subject || t.body || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 68 }}
        className="flex-shrink-0 glass border-r border-white/8 flex flex-col py-6 overflow-hidden select-none"
      >
        <div className="px-4 mb-8 flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
          >
            <Zap className="w-4 h-4 text-white" />
          </Link>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-sm tracking-tight whitespace-nowrap text-white"
            >
              Support<span className="text-violet-400">Pilot</span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium',
                activeView === id
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_12px_rgba(124,58,237,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="px-3 pt-4 border-t border-white/5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 rounded-xl glass border border-white/10 hover:border-white/20 flex justify-center transition-colors text-zinc-400 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Header & Live Stats Strip */}
        <div className="border-b border-white/8 px-6 py-4 bg-zinc-950/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-white capitalize">{activeView} Overview</h1>
              <p className="text-xs text-zinc-500">Live PostgreSQL Database via Prisma</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass border border-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5 bg-white/[0.01]"
                >
                  <div className="p-2 rounded-lg glass border border-white/8">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Views */}
        <div className="p-6 flex-1">
          <AnimatePresence mode="wait">
            {activeView === 'tickets' && (
              <motion.div
                key="tickets"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['All', 'Open', 'In Progress', 'Escalated', 'Resolved'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setTicketFilter(tab)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all whitespace-nowrap',
                          ticketFilter === tab
                            ? 'bg-violet-600 text-white border-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                            : 'glass border-white/8 text-zinc-400 hover:text-white'
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tickets…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Tickets Table */}
                <div className="glass rounded-2xl border border-white/8 overflow-hidden shadow-xl">
                  <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold text-zinc-400 border-b border-white/8 bg-white/[0.02]">
                    <div className="col-span-2">ID & TIME</div>
                    <div className="col-span-4">SUBJECT / QUERY</div>
                    <div className="col-span-2">CATEGORY</div>
                    <div className="col-span-2">PRIORITY & SENTIMENT</div>
                    <div className="col-span-2 text-right">STATUS & ACTION</div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {filteredTickets.map((t) => {
                      const sc = statusConfig[t.status] || statusConfig['Open'];
                      const StatusIcon = sc.icon;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/[0.02] cursor-pointer transition-colors text-xs"
                        >
                          <div className="col-span-2 space-y-0.5">
                            <p className="font-mono text-zinc-300 font-semibold">{t.id.slice(0, 8)}</p>
                            <p className="text-[10px] text-zinc-500">
                              {formatRelative(new Date(t.createdAt))}
                            </p>
                          </div>

                          <div className="col-span-4 pr-3">
                            <p className="font-medium text-white truncate">{t.subject || t.body}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{t.body || t.summary}</p>
                          </div>

                          <div className="col-span-2">
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-md border font-medium',
                                (categoryColors as Record<string, string>)[t.category] || 'bg-zinc-800 text-zinc-300'
                              )}
                            >
                              {t.category}
                            </span>
                          </div>

                          <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-md border',
                                (priorityColors as Record<string, string>)[t.priority] || 'border-zinc-700 text-zinc-400'
                              )}
                            >
                              {t.priority}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {Math.round((t.confidence || 0.9) * 100)}% match
                            </span>
                          </div>

                          <div className="col-span-2 flex justify-end items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border font-medium',
                                sc.color
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredTickets.length === 0 && (
                      <div className="py-12 text-center text-zinc-500 text-xs">
                        No tickets matching current filters.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Knowledge Base View */}
            {activeView === 'kb' && (
              <motion.div
                key="kb"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Approved Knowledge Base</h2>
                    <p className="text-xs text-zinc-400">
                      This is the ONLY source our Gemini AI assistant is permitted to use for drafting replies.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kbList.map((article) => (
                    <div
                      key={article.id}
                      className="glass rounded-xl p-4 border border-white/8 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-bold text-white leading-snug">{article.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 flex-shrink-0">
                            {article.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
                          {article.content}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {(article.keywords || []).slice(0, 3).map((kw: string) => (
                            <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              #{kw}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDeleteKbArticle(article.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Team View */}
            {activeView === 'team' && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Live Team Lanyard Badges</h2>
                  <p className="text-xs text-zinc-400">
                    Interactive badge rail reflecting live team status from PostgreSQL. Pull down to stretch, click to flip.
                  </p>
                </div>

                {/* Team Lanyard Rail Component */}
                <div className="glass rounded-2xl border border-white/8 p-4 overflow-visible">
                  <TeamLanyardRail
                    items={teamList.map((m) => toSupportAgent(m))}
                    autoplay={false}
                  />
                </div>

                {/* Manager Availability Status Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">Agent Availability Controls</h3>
                    <span className="text-xs text-zinc-500">Persisted directly in Supabase</span>
                  </div>

                  <div className="glass rounded-2xl border border-white/8 overflow-hidden shadow-xl">
                    <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold text-zinc-400 border-b border-white/8 bg-white/[0.02]">
                      <div className="col-span-4">AGENT</div>
                      <div className="col-span-3">SPECIALTY</div>
                      <div className="col-span-2">SHIFT</div>
                      <div className="col-span-3 text-right">LIVE STATUS</div>
                    </div>

                    <div className="divide-y divide-white/5">
                      {teamList.map((member) => (
                        <div
                          key={member.id}
                          className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="col-span-4 flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-9 h-9 rounded-xl object-cover border border-white/10"
                            />
                            <div>
                              <p className="text-sm font-medium text-white">{member.name}</p>
                              <p className="text-xs text-zinc-500">{member.role}</p>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                              {member.specialty}
                            </span>
                          </div>

                          <div className="col-span-2 text-xs text-zinc-400">
                            {member.shift.start} &ndash; {member.shift.end}
                          </div>

                          <div className="col-span-3 flex justify-end items-center gap-1.5">
                            {(['available', 'busy', 'offline'] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleAgentStatusChange(member.id, st)}
                                className={cn(
                                  'text-[11px] px-2.5 py-1 rounded-lg border font-medium capitalize transition-all',
                                  member.status === st
                                    ? st === 'available'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                                      : st === 'busy'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300'
                                )}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analytics View */}
            {activeView === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-white">Live Performance Analytics</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Distribution Donut */}
                  <div className="glass rounded-2xl p-5 border border-white/8">
                    <p className="text-sm font-medium text-white mb-4">Tickets by Category</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={analytics.categoryData?.length ? analytics.categoryData : [
                            { name: 'Billing', value: 5 },
                            { name: 'Technical Support', value: 4 },
                            { name: 'Refund/Return', value: 3 },
                            { name: 'Account & Login', value: 3 },
                            { name: 'Shipping/Delivery', value: 2 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(analytics.categoryData || []).map((entry: any, i: number) => (
                            <Cell
                              key={i}
                              fill={CATEGORY_COLORS[entry.name] || '#8b5cf6'}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Volume Bar */}
                  <div className="glass rounded-2xl p-5 border border-white/8">
                    <p className="text-sm font-medium text-white mb-4">Support Inquiries Volume</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={[
                          { day: 'Mon', tickets: 18 },
                          { day: 'Tue', tickets: 24 },
                          { day: 'Wed', tickets: 31 },
                          { day: 'Thu', tickets: 22 },
                          { day: 'Fri', tickets: 29 },
                          { day: 'Sat', tickets: 14 },
                          { day: 'Sun', tickets: 9 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                        <Bar dataKey="tickets" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Audit & Security Event Logs Table */}
                <div className="glass rounded-2xl border border-white/8 overflow-hidden shadow-xl mt-6">
                  <div className="p-4 border-b border-white/8 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Security, PII &amp; Verification Audit Logs
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Row-Level Secured event logs captured in PostgreSQL
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Live Telemetry
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-white/8 text-zinc-400 bg-white/[0.01]">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">EVENT TYPE</th>
                          <th className="py-2.5 px-4 font-semibold">TICKET ID</th>
                          <th className="py-2.5 px-4 font-semibold">DETAILS</th>
                          <th className="py-2.5 px-4 font-semibold text-right">TIME</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(eventLogs.length > 0 ? eventLogs : [
                          { id: 'ev-1', type: 'pii_masked', ticketId: 'tkt-102', details: 'Masked card_number and cvv before LLM transmission', createdAt: new Date() },
                          { id: 'ev-2', type: 'verification_failed', ticketId: 'tkt-108', details: 'Initial draft contained unsupported duration figure; re-drafted', createdAt: new Date() },
                          { id: 'ev-3', type: 'prompt_injection', ticketId: 'tkt-114', details: 'Prompt extraction attack blocked; answered strictly from KB', createdAt: new Date() },
                        ]).map((log: any) => (
                          <tr key={log.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-mono">
                              <span
                                className={cn(
                                  'text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase',
                                  log.type === 'pii_masked'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : log.type === 'prompt_injection'
                                    ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                    : log.type === 'verification_failed'
                                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                )}
                              >
                                {log.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-400">
                              {log.ticketId || 'System'}
                            </td>
                            <td className="py-3 px-4 text-zinc-300 max-w-md truncate">
                              {log.details}
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-500 text-[11px] whitespace-nowrap">
                              {formatRelative(new Date(log.createdAt))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quality View */}
            {activeView === 'quality' && (
              <motion.div
                key="quality"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="glass rounded-2xl p-6 border border-white/8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        Automated AI Evaluation &amp; Benchmark Suite
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Runs 28 labeled evaluation cases against the end-to-end pipeline to verify classification accuracy, grounding, refusal of out-of-scope questions, and safe human handoff.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/quality"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-md transition-all hover:scale-105"
                    >
                      Open Full Quality Studio &rarr;
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Ticket Detail Drawer */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="w-full max-w-lg glass border-l border-white/10 h-full p-6 overflow-y-auto space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500 font-mono mb-1">{selectedTicket.id}</p>
                  <h3 className="font-bold text-lg text-white leading-tight">
                    {selectedTicket.subject || 'Customer Support Request'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 rounded-lg glass border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border font-medium',
                    (categoryColors as Record<string, string>)[selectedTicket.category] || 'bg-zinc-800 text-zinc-300'
                  )}
                >
                  {selectedTicket.category}
                </span>
                <span
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border',
                    (priorityColors as Record<string, string>)[selectedTicket.priority] || 'border-zinc-700 text-zinc-400'
                  )}
                >
                  {selectedTicket.priority} Priority
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-zinc-400">
                  Confidence: {Math.round((selectedTicket.confidence || 0.9) * 100)}%
                </span>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Customer Query</p>
                <div className="glass rounded-xl p-4 border border-white/8 text-sm text-zinc-200 leading-relaxed">
                  {selectedTicket.body || selectedTicket.summary}
                </div>
              </div>

              {/* Message Thread History & Verification Telemetry */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">
                    Conversation Thread & Engine Metadata
                  </p>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {selectedTicket.messages.map((m: any, idx: number) => (
                      <div
                        key={m.id || idx}
                        className={cn(
                          'p-3 rounded-xl border text-xs leading-relaxed',
                          m.role === 'customer'
                            ? 'bg-zinc-900 border-white/5 text-zinc-300'
                            : 'glass border-violet-500/20 bg-violet-950/10 text-zinc-200'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5 text-[10px]">
                          <span className="font-semibold uppercase tracking-wider text-zinc-400">
                            {m.role === 'customer' ? 'Customer' : 'AI Assistant'}
                          </span>
                          {m.role === 'ai' && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono">
                                Engine: {m.engine || 'Gemini'}
                              </span>
                              {m.verified ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                                  ✓ Verified
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                  Fallback
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <p>{m.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.aiDraft && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">AI Drafted Reply</p>
                  <div className="glass rounded-xl p-4 border border-violet-500/20 bg-violet-950/15 text-sm text-zinc-200 leading-relaxed space-y-2">
                    <p>{selectedTicket.aiDraft}</p>
                    <div className="pt-2 border-t border-white/5 flex gap-2 justify-end">
                      <button
                        onClick={() => handleApproveAndSend(selectedTicket.id, selectedTicket.aiDraft)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve & Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="pt-4 border-t border-white/8 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Status: {selectedTicket.status}</span>
                <div className="flex gap-2">
                  {selectedTicket.status !== 'Escalated' && (
                    <button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Escalated')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                    >
                      Escalate to Agent
                    </button>
                  )}
                  {selectedTicket.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Resolved')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
