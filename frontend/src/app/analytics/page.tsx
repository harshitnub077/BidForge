"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, Zap, FileText } from "lucide-react";
import { Session } from "@supabase/supabase-js";

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-2 text-zinc-400 mb-4">
              <FileText size={16} />
              <h3 className="text-sm font-medium uppercase tracking-wider">Total Proposals</h3>
            </div>
            <div className="text-4xl font-bold text-white">{analytics.total_proposals}</div>
            <p className="text-xs text-indigo-400 font-medium mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> +12% this month
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-2 text-zinc-400 mb-4">
              <Zap size={16} />
              <h3 className="text-sm font-medium uppercase tracking-wider">Time Saved</h3>
            </div>
            <div className="text-4xl font-bold text-white">{analytics.total_proposals * 4} <span className="text-lg text-zinc-500 font-medium">hrs</span></div>
            <p className="text-xs text-zinc-500 font-medium mt-2">
              Based on avg 4 hours per proposal
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 bg-indigo-500/10 border-indigo-500/30 text-white">
            <div className="flex items-center gap-2 text-indigo-300 mb-4">
              <BarChart3 size={16} />
              <h3 className="text-sm font-medium uppercase tracking-wider">Proposals Won</h3>
            </div>
            <div className="text-4xl font-bold">{analytics.won_proposals}</div>
            <p className="text-xs text-indigo-400 font-medium mt-2">
              Record wins in the Dashboard
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
