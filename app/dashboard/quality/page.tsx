'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Play,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { evalSet } from '@/data/evalSet';

export default function QualityPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useDemoMode, setUseDemoMode] = useState(true);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleRunEvaluation = async () => {
    setRunning(true);
    setProgress(15);
    setMetrics(null);

    try {
      setProgress(40);
      const res = await fetch('/api/eval/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceDemoMode: useDemoMode }),
      });
      setProgress(85);
      const data = await res.json();
      setMetrics(data);
      setResults(data.results || []);
      setProgress(100);
    } catch (err) {
      console.error('Eval error:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const headers = [
      'ID',
      'Query',
      'Expected Category',
      'Actual Category',
      'Category Match',
      'Expected Behavior',
      'Actual Behavior',
      'Verified KB',
      'Response Time (ms)',
      'Status',
    ];

    const rows = results.map((r) => [
      r.id,
      `"${r.query.replace(/"/g, '""')}"`,
      r.expectedCategory,
      r.actualCategory,
      r.categoryMatch ? 'TRUE' : 'FALSE',
      r.expectedBehavior,
      r.actualBehavior,
      r.verified ? 'TRUE' : 'FALSE',
      r.responseTimeMs,
      r.passed ? 'PASS' : 'FAIL',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `supportpilot_quality_eval_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      {/* Top Navbar */}
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between glass">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
          </Link>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              SupportPilot Quality &amp; Evaluation Suite
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-medium">
                28 Benchmark Cases
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Deterministic verification, refusal of out-of-scope questions, and category accuracy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs px-3 py-1.5 rounded-lg glass border border-white/10 hover:border-white/20 text-zinc-300 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Control Bar */}
        <div className="glass rounded-2xl p-5 border border-white/8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">Automated Pipeline Benchmark</h2>
            <p className="text-xs text-zinc-400">
              Evaluates Classification &rarr; KB Retrieval &rarr; Drafting &rarr; Entity Verification across 28 labeled queries.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useDemoMode}
                onChange={(e) => setUseDemoMode(e.target.checked)}
                className="rounded border-zinc-700 text-violet-600 focus:ring-0"
              />
              <span>Demo Mode (Deterministic local engine, avoids rate limits)</span>
            </label>

            <button
              onClick={handleRunEvaluation}
              disabled={running}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <Play className={cn('w-3.5 h-3.5', running && 'animate-spin')} />
              {running ? 'Evaluating Pipeline…' : 'Run Evaluation'}
            </button>

            {results.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl glass border border-white/10 hover:border-white/20 text-xs font-medium text-zinc-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {running && (
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Metrics Cards */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            <div className="glass rounded-xl p-4 border border-emerald-500/20 bg-emerald-950/10">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Overall Pass Rate</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.accuracyPct}%</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{metrics.passedCount} / {metrics.total} passed</p>
            </div>

            <div className="glass rounded-xl p-4 border border-white/8">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Category Accuracy</p>
              <p className="text-2xl font-black text-violet-400 mt-1">{metrics.categoryAccuracy}%</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">8 support categories</p>
            </div>

            <div className="glass rounded-xl p-4 border border-white/8">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">KB Verified Rate</p>
              <p className="text-2xl font-black text-cyan-400 mt-1">{metrics.verificationRate}%</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Zero ungrounded figures</p>
            </div>

            <div className="glass rounded-xl p-4 border border-white/8">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Refusal of Out-Of-Scope</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{metrics.correctRefusalRate}%</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Weather/crypto/medical</p>
            </div>

            <div className="glass rounded-xl p-4 border border-white/8">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Avg Latency</p>
              <p className="text-2xl font-black text-zinc-200 mt-1">{metrics.avgResponseTimeMs} ms</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Per evaluation turn</p>
            </div>
          </motion.div>
        )}

        {/* Results Table */}
        <div className="glass rounded-2xl border border-white/8 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/8 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Test Case Results ({results.length > 0 ? results.length : evalSet.length} Cases)
            </h3>
            <span className="text-[11px] text-zinc-500">
              Grounding &middot; Refusal &middot; Escalation &middot; Category
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/8 text-zinc-400 bg-white/[0.01]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID &amp; STATUS</th>
                  <th className="py-3 px-4 font-semibold">CUSTOMER QUERY</th>
                  <th className="py-3 px-4 font-semibold">EXPECTED CATEGORY</th>
                  <th className="py-3 px-4 font-semibold">ACTUAL BEHAVIOR</th>
                  <th className="py-3 px-4 font-semibold">KB VERIFICATION</th>
                  <th className="py-3 px-4 font-semibold text-right">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(results.length > 0 ? results : evalSet).map((item: any) => {
                  const isRun = 'passed' in item;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isRun ? (
                            item.passed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                                <CheckCircle className="w-3 h-3 text-emerald-400" /> PASS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 font-semibold">
                                <XCircle className="w-3 h-3 text-red-400" /> FAIL
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                              PENDING
                            </span>
                          )}
                          <span className="text-zinc-300">{item.id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-medium text-white truncate">{item.query}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{item.description}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/10 text-zinc-300">
                          {item.expectedCategory}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap capitalize">
                        {isRun ? (
                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-md font-medium border',
                              item.actualBehavior === 'answer'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : item.actualBehavior === 'refuse'
                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            )}
                          >
                            {item.actualBehavior}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">{item.expectedBehavior}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isRun ? (
                          item.verified ? (
                            <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                              <CheckCircle className="w-3 h-3" /> Grounded
                            </span>
                          ) : (
                            <span className="text-red-400 text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Unverified claims
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-500">&mdash;</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-zinc-400 whitespace-nowrap">
                        {isRun ? `${item.responseTimeMs} ms` : '&mdash;'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

