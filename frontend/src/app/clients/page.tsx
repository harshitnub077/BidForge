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
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25 } }
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-[1200px] mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-hairline)' }}>
          <Users size={18} style={{ color: 'var(--color-ink-muted)' }} />
        </div>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>Clients</h1>
          <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>Organizations you have generated proposals for.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="surface-card p-6 h-32 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
                <div className="w-12 h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
              </div>
              <div className="w-3/4 h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-24 surface-card relative overflow-hidden" style={{ borderStyle: 'dashed' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative overflow-hidden group"
            style={{ backgroundColor: 'var(--color-surface-1)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--glass-shadow)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Building2 className="w-7 h-7 transition-transform duration-500 group-hover:scale-110 group-hover:text-indigo-400" style={{ color: 'var(--color-ink-muted)' }} />
          </div>
          <p className="text-base font-semibold mb-1 tracking-tight" style={{ color: 'var(--color-ink)' }}>No Clients Found</p>
          <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>Your clients will appear here after generating proposals.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {clients.map((c, i) => (
            <motion.div variants={itemVariants} key={i} className="surface-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:border-[var(--color-hairline-strong)]" style={{ boxShadow: 'var(--glass-shadow)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline)' }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  Active
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1.5 relative z-10 tracking-tight" style={{ color: 'var(--color-ink)' }}>{c.name}</h3>
              <div className="flex items-center gap-2 text-sm relative z-10 transition-colors group-hover:text-[var(--color-ink-muted)]" style={{ color: 'var(--color-ink-faint)' }}>
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
