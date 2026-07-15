"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, Zap, FileText } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";



export default function AnalyticsPage() {
  const [session, setSession] = useState<Session | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetch("http://localhost:8000/dashboard/analytics", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [session]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-[1200px] mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-hairline)' }}>
          <BarChart3 size={18} style={{ color: 'var(--color-ink-muted)' }} />
        </div>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>Track your proposal generation metrics.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-card p-6 h-28 flex flex-col justify-between">
              <div className="w-24 h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
              <div className="w-16 h-8 rounded animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
            </div>
          ))}
        </div>
      ) : !analytics ? (
        <div className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>Failed to load analytics.</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
        >
          <div className="surface-card surface-card-hover p-6">
            <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--color-ink-faint)' }}>
              <FileText size={15} />
              <h3 className="text-[11px] font-medium uppercase tracking-wider">Total Proposals</h3>
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>{analytics.total_proposals}</div>
            <p className="text-xs font-medium mt-2 flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              <TrendingUp size={13} /> +12% this month
            </p>
          </div>

          <div className="surface-card surface-card-hover p-6">
            <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--color-ink-faint)' }}>
              <Zap size={15} />
              <h3 className="text-[11px] font-medium uppercase tracking-wider">Time Saved</h3>
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
              {analytics.total_proposals * 4} <span className="text-base font-medium" style={{ color: 'var(--color-ink-faint)' }}>hrs</span>
            </div>
            <p className="text-xs font-medium mt-2" style={{ color: 'var(--color-ink-faint)' }}>
              Based on avg 4 hours per proposal
            </p>
          </div>

          <div className="surface-card surface-card-hover p-6" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--color-accent)' }}>
              <BarChart3 size={15} />
              <h3 className="text-[11px] font-medium uppercase tracking-wider">Proposals Won</h3>
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>{analytics.won_proposals}</div>
            <p className="text-xs font-medium mt-2" style={{ color: 'var(--color-accent)' }}>
              Record wins in the Dashboard
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Charts ── */}
      {!loading && analytics && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          <div className="surface-card p-6">
            <h3 className="text-[11px] font-medium uppercase tracking-wider mb-6" style={{ color: 'var(--color-ink-faint)' }}>Generation Trends</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProposals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070f3" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0070f3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-hairline)', borderRadius: '6px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--color-ink)' }}
                  />
                  <Area type="monotone" dataKey="proposals" stroke="#0070f3" strokeWidth={2} fillOpacity={1} fill="url(#colorProposals)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card p-6">
            <h3 className="text-[11px] font-medium uppercase tracking-wider mb-6" style={{ color: 'var(--color-ink-faint)' }}>Win Rate by Month</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-hairline)', borderRadius: '6px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--color-ink)' }}
                  />
                  <Bar dataKey="wins" fill="#0070f3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
