"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Briefcase } from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface Client {
  name: string;
  proposals_count: number;
}

export default function ClientsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetch("http://localhost:8000/dashboard/clients", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(data => {
        setClients(data);
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
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
          <p className="text-sm text-zinc-400">Organizations you have generated proposals for.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/20 rounded-xl bg-white/5">
          <p className="text-sm text-zinc-400">No clients found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((c, i) => (
            <div key={i} className="glass-panel glass-panel-hover rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.2)] rounded text-[10px] font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-1">{c.name}</h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Briefcase size={14} />
                {c.proposals_count} Proposal{c.proposals_count !== 1 ? 's' : ''} Generated
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
