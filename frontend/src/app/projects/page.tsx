"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FolderKanban, FileText, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

interface Proposal {
  id: string;
  rfp_source: string;
  status: string;
  generated_at: string;
  content_json: { client_name: string };
}

export default function ProjectsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetch("http://localhost:8000/dashboard/projects", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(data => {
        setProposals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [session]);

  const updateStatus = async (proposalId: string, newStatus: string) => {
    if (!session) return;
    
    // Optimistic update
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: newStatus } : p));
    
    try {
      await fetch(`http://localhost:8000/dashboard/projects/${proposalId}/status`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

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
          <FolderKanban size={18} style={{ color: 'var(--color-ink-muted)' }} />
        </div>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>Project History</h1>
          <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>View and manage all generated proposals.</p>
        </div>
      </div>

      {loading ? (
        <div className="surface-card overflow-hidden p-6 flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full h-11 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-surface-2)' }} />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-24 surface-card relative overflow-hidden" style={{ borderStyle: 'dashed' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative overflow-hidden group"
            style={{ backgroundColor: 'var(--color-surface-1)', border: '1px solid var(--color-hairline)', boxShadow: 'var(--glass-shadow)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="w-7 h-7 transition-transform duration-500 group-hover:scale-110 group-hover:text-indigo-400" style={{ color: 'var(--color-ink-muted)' }} />
          </div>
          <p className="text-base font-semibold mb-1 tracking-tight" style={{ color: 'var(--color-ink)' }}>No Projects Found</p>
          <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>Generate your first proposal to see it here.</p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-left text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            <thead style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-hairline)' }}>
              <tr className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ink-faint)' }}>
                <th className="px-6 py-4">RFP Title</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Generated Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {proposals.map((p) => (
                <motion.tr variants={itemVariants} key={p.id}
                  className="transition-colors group cursor-default"
                  style={{ borderBottom: '1px solid var(--color-hairline)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-6 py-4 font-medium flex items-center gap-3 transition-colors group-hover:text-[var(--color-ink)]" style={{ color: 'var(--color-ink)' }}>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-3)' }}>
                      <FileText size={14} style={{ color: 'var(--color-ink-muted)' }} />
                    </div>
                    {p.rfp_source || "Untitled"}
                  </td>
                  <td className="px-6 py-4 transition-colors group-hover:text-[var(--color-ink)]">{p.content_json?.client_name || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold capitalize outline-none cursor-pointer transition-colors"
                      style={{ 
                        backgroundColor: p.status === 'won' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'lost' ? 'rgba(244, 63, 94, 0.1)' : 'var(--color-surface-2)', 
                        color: p.status === 'won' ? '#10b981' : p.status === 'lost' ? '#f43f5e' : 'var(--color-ink-muted)', 
                        border: p.status === 'won' ? '1px solid rgba(16, 185, 129, 0.2)' : p.status === 'lost' ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid var(--color-hairline)' 
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 transition-colors group-hover:text-[var(--color-ink)]">
                    <div className="flex items-center gap-2">
                       <Calendar size={13} style={{ color: 'var(--color-ink-faint)' }} />
                       {new Date(p.generated_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => alert(`View Proposal ID: ${p.id} \n\nContent: ${p.content_json?.client_name}`)}
                      className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--color-ink-faint)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.backgroundColor = 'var(--color-surface-3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-ink-faint)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
