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
        <div className="text-center py-20 surface-card" style={{ borderStyle: 'dashed' }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-accent-muted)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Sparkles className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-ink)' }}>No Projects Found</p>
          <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>Generate your first proposal to see it here.</p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-left text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            <thead style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-hairline)' }}>
              <tr className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-faint)' }}>
                <th className="px-6 py-3.5">RFP Title</th>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Generated Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {proposals.map((p) => (
                <motion.tr variants={itemVariants} key={p.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--color-hairline)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-6 py-3.5 font-medium flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                    <FileText size={14} style={{ color: 'var(--color-accent)' }} />
                    {p.rfp_source || "Untitled"}
                  </td>
                  <td className="px-6 py-3.5">{p.content_json?.client_name || "Unknown"}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-1 rounded-md text-[11px] font-medium capitalize"
                      style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 flex items-center gap-2">
                    <Calendar size={13} style={{ color: 'var(--color-ink-faint)' }} />
                    {new Date(p.generated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button className="p-1 transition-colors" style={{ color: 'var(--color-ink-faint)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-ink)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-ink-faint)'}>
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
