"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, Zap, FileText } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const chartData = [
  { name: 'Jan', proposals: 4, wins: 2 },
  { name: 'Feb', proposals: 7, wins: 3 },
  { name: 'Mar', proposals: 5, wins: 2 },
  { name: 'Apr', proposals: 12, wins: 5 },
  { name: 'May', proposals: 15, wins: 8 },
  { name: 'Jun', proposals: 22, wins: 14 },
];

export default function AnalyticsPage() {
  const [session, setSession] = useState<Session | null>(null);
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
    <div className="max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          <BarChart3 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-zinc-400">Track your proposal generation metrics.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400">Loading analytics...</div>
      ) : !analytics ? (
        <div className="text-sm text-zinc-400">Failed to load analytics.</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 text-zinc-400 mb-4 relative z-10">
              <FileText size={16} />
              <h3 className="text-sm font-medium uppercase tracking-wider">Total Proposals</h3>
            </div>
            <div className="text-4xl font-bold text-white relative z-10">{analytics.total_proposals}</div>
            <p className="text-xs text-indigo-400 font-medium mt-2 flex items-center gap-1 relative z-10">
              <TrendingUp size={14} /> +12% this month
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 text-zinc-400 mb-4 relative z-10">
              <Zap size={16} />
              <h3 className="text-sm font-medium uppercase tracking-wider">Time Saved</h3>
            </div>
            <div className="text-4xl font-bold text-white relative z-10">{analytics.total_proposals * 4} <span className="text-lg text-zinc-500 font-medium">hrs</span></div>
            <p className="text-xs text-zinc-500 font-medium mt-2 relative z-10">
              Based on avg 4 hours per proposal
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 bg-indigo-500/10 border-indigo-500/30 text-white relative overflow-hidden group shadow-[0_0_20px_rgba(99,102,241,0.1)]">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 text-indigo-300 mb-4 relative z-10">
              <BarChart3 size={16} />
              <h3 className="text-sm font-medium uppercase tracking-wider">Proposals Won</h3>
            </div>
            <div className="text-4xl font-bold relative z-10">{analytics.won_proposals}</div>
            <p className="text-xs text-indigo-400 font-medium mt-2 relative z-10">
              Record wins in the Dashboard
            </p>
          </div>

        </motion.div>
      )}

      {/* ── Charts ── */}
      {!loading && analytics && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Area Chart */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-medium text-white mb-6 uppercase tracking-wider">Generation Trends</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProposals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="proposals" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProposals)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-medium text-white mb-6 uppercase tracking-wider">Win Rate by Month</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="wins" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}
