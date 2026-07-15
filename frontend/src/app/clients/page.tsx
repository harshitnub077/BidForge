"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Briefcase, Building2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1200px] mx-auto"
    >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-6 h-36 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
                <div className="w-12 h-5 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="w-3/4 h-5 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5 glass-panel">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Building2 className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-base text-white font-medium mb-1">No Clients Found</p>
          <p className="text-sm text-zinc-400">Your clients will appear here after generating proposals.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {clients.map((c, i) => (
            <motion.div variants={itemVariants} key={i} className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.2)] rounded text-[10px] font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-1 relative z-10">{c.name}</h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400 relative z-10">
                <Briefcase size={14} />
                {c.proposals_count} Proposal{c.proposals_count !== 1 ? 's' : ''} Generated
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
