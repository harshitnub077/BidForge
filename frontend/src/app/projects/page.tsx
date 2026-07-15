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
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1200px] mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          <FolderKanban size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Project History</h1>
          <p className="text-sm text-zinc-400">View and manage all generated proposals.</p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-xl overflow-hidden p-6 flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full h-12 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5 glass-panel">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-base text-white font-medium mb-1">No Projects Found</p>
          <p className="text-sm text-zinc-400">Generate your first proposal to see it here.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-white/5 border-b border-white/10 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <tr>
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
              className="divide-y divide-white/5"
            >
              {proposals.map((p) => (
                <motion.tr variants={itemVariants} key={p.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <FileText size={14} className="text-indigo-400" />
                    {p.rfp_source || "Untitled"}
                  </td>
                  <td className="px-6 py-4">{p.content_json?.client_name || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md text-xs font-medium capitalize">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-500" />
                    {new Date(p.generated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-zinc-500 hover:text-white p-1 transition-colors">
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
