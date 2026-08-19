"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Briefcase, 
  Building2, 
  ArrowUpRight, 
  Search, 
  Plus
} from "lucide-react";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";

interface Client {
  name: string;
  proposals_count: number;
  industry?: string;
}

export default function ClientsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
        setClients(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [session]);

  const filteredClients = clients.filter(c => 
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClients = clients.length;
  const totalProposals = clients.reduce((acc, c) => acc + (c.proposals_count || 1), 0);

  return (
    <div className="w-full relative z-10">
      
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#27272a] gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Client Accounts
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage institutional client portfolios, historical proposals, and opportunity pipelines.
          </p>
        </div>

        <Link
          href="/"
          className="px-3 py-1.5 rounded-md bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={13} className="stroke-[2.5]" />
          <span>New Proposal</span>
        </Link>
      </header>


      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="surface-card p-3.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Active Accounts</span>
          <span className="text-xl font-bold text-white mt-1 block">{totalClients}</span>
        </div>
        <div className="surface-card p-3.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Bids Prepared</span>
          <span className="text-xl font-bold text-sky-400 mt-1 block">{totalProposals}</span>
        </div>
        <div className="surface-card p-3.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Portfolio Retention</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">94.8%</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="surface-card p-2.5 mb-5 flex items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client accounts..."
            className="w-full bg-[#09090b] border border-[#27272a] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div className="text-zinc-500 text-[11px] font-mono hidden sm:block">
          {filteredClients.length} accounts indexed
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="surface-card p-8 text-center text-xs text-zinc-500">
          Loading client accounts...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="surface-card rounded-lg p-12 text-center border-dashed border-[#27272a] flex flex-col items-center">
          <Building2 size={24} className="text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-white mb-1">No Accounts Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            {searchQuery 
              ? "No accounts match the search criteria." 
              : "Generate an RFP proposal to automatically register an account in the directory."}
          </p>
          <Link href="/" className="btn-primary text-xs">
            Open Proposal Studio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredClients.map((client, idx) => (
            <div 
              key={idx} 
              className="surface-card p-4 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-xs font-bold text-white font-mono">
                    {client.name ? client.name.substring(0, 2).toUpperCase() : "AC"}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-white truncate mb-1">
                  {client.name || "Enterprise Account"}
                </h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Briefcase size={12} className="text-zinc-500" />
                  <span>{client.proposals_count || 1} Proposal{(client.proposals_count || 1) !== 1 ? 's' : ''}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  Verified
                </span>
                <Link
                  href="/"
                  className="flex items-center gap-1 text-xs text-zinc-200 hover:text-white font-medium hover:underline"
                >
                  <span>Forge Proposal</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
