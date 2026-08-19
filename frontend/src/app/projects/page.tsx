"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FolderKanban, 
  FileText, 
  Search, 
  LayoutGrid, 
  List, 
  X,
  Copy,
  Plus
} from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

interface Proposal {
  id: string;
  rfp_source: string;
  status: string;
  generated_at: string;
  content_json: { 
    client_name?: string;
    industry?: string;
    deal_size?: string;
    rfp_title?: string;
    markdown?: string;
  };
  generated_content?: string;
}

export default function ProjectsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

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
        setProposals(Array.isArray(data) ? data : []);
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
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: newStatus } : p));
    toast.success(`Proposal status updated to ${newStatus.toUpperCase()}`);
    
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
      toast.error("Failed to sync status change with server");
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = 
      (p.rfp_source || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.content_json?.client_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.content_json?.industry || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = proposals.length;
  const wonCount = proposals.filter(p => p.status === "won").length;
  const winRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;
  const activeCount = proposals.filter(p => p.status === "submitted" || p.status === "draft").length;

  return (
    <div className="w-full relative z-10">
      
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#27272a] gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Proposals Repository
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit, track, and inspect enterprise proposals across active sales cycles.
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="surface-card p-3.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Bids</span>
          <span className="text-xl font-bold text-white mt-1 block">{totalCount}</span>
        </div>
        <div className="surface-card p-3.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Win Conversion</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">{winRate}%</span>
        </div>
        <div className="surface-card p-3.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">In Pipeline</span>
          <span className="text-xl font-bold text-sky-400 mt-1 block">{activeCount}</span>
        </div>
        <div className="surface-card p-3.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Avg Turnaround</span>
          <span className="text-xl font-bold text-zinc-300 mt-1 block">1.8 days</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="surface-card p-2.5 mb-5 flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search proposals or clients..."
            className="w-full bg-[#09090b] border border-[#27272a] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["all", "draft", "submitted", "won", "lost"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                statusFilter === status 
                  ? "bg-white text-zinc-950 font-semibold" 
                  : "text-zinc-400 hover:text-white hover:bg-[#18181b]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="hidden sm:flex items-center gap-1 border-l border-[#27272a] pl-2.5">
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded text-xs transition-colors ${viewMode === "table" ? "bg-[#18181b] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Table View"
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded text-xs transition-colors ${viewMode === "grid" ? "bg-[#18181b] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Grid View"
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="surface-card p-8 text-center text-xs text-zinc-500">
          Loading proposals repository...
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="surface-card rounded-lg p-12 text-center border-dashed border-[#27272a] flex flex-col items-center">
          <FileText size={24} className="text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-white mb-1">No Proposals Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            {searchQuery || statusFilter !== "all" 
              ? "No records match the active filter parameters." 
              : "Generate an RFP response in the Proposal Studio to populate your repository."}
          </p>
          <Link href="/" className="px-3.5 py-1.5 rounded-md bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer">
            Create Proposal
          </Link>
        </div>
      ) : viewMode === "table" ? (
        /* High-Density Enterprise Table View */
        <div className="surface-card rounded-lg overflow-hidden border border-[#27272a]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#101014] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">Initiative / RFP Title</th>
                  <th className="py-2.5 px-4 font-semibold">Client Organization</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Created Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181b] text-zinc-300">
                {filteredProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-[#151518] transition-colors">
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      {p.rfp_source || "Enterprise Proposal"}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {p.content_json?.client_name || "Enterprise Account"}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={p.status || "draft"}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                        className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded border outline-none cursor-pointer ${
                          p.status === "won" 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                            : p.status === "lost" 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                            : p.status === "submitted" 
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-400" 
                            : "bg-[#18181b] border-[#27272a] text-zinc-400"
                        }`}
                      >
                        <option value="draft" className="bg-[#121215] text-zinc-300">Draft</option>
                        <option value="submitted" className="bg-[#121215] text-sky-400">Submitted</option>
                        <option value="won" className="bg-[#121215] text-emerald-400">Won</option>
                        <option value="lost" className="bg-[#121215] text-rose-400">Lost</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {p.generated_at ? new Date(p.generated_at).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedProposal(p)}
                        className="text-xs text-zinc-200 hover:text-white font-medium hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProposals.map((p) => (
            <div
              key={p.id}
              className="surface-card p-4 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm text-white truncate">
                    {p.rfp_source || "Executive Proposal"}
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 mb-3 truncate">
                  {p.content_json?.client_name || "Enterprise Account"}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#27272a]">
                  <span className="font-mono text-[11px] text-zinc-500">
                    {p.generated_at ? new Date(p.generated_at).toLocaleDateString() : "Recent"}
                  </span>
                  <select
                    value={p.status || "draft"}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="draft" className="bg-[#121215]">Draft</option>
                    <option value="submitted" className="bg-[#121215]">Submitted</option>
                    <option value="won" className="bg-[#121215]">Won</option>
                    <option value="lost" className="bg-[#121215]">Lost</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setSelectedProposal(p)}
                className="mt-3 w-full px-3 py-1.5 rounded-md bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
              >
                Inspect Deliverable
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Modal Slide-over */}
      <AnimatePresence>
        {selectedProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-2xl max-h-[85vh] bg-[#101014] border border-[#27272a] rounded-lg flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#141418]">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedProposal.rfp_source || "Proposal Preview"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Account: {selectedProposal.content_json?.client_name || "Enterprise"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#222226] transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto flex-1 text-xs text-zinc-300 space-y-4">
                <div className="p-3 rounded bg-[#09090b] border border-[#27272a] grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Record ID</span>
                    <span className="text-zinc-300 truncate block">{selectedProposal.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Stage Status</span>
                    <span className="font-semibold text-white uppercase">{selectedProposal.status}</span>
                  </div>
                </div>

                <div className="doc-prose text-zinc-300">
                  {selectedProposal.content_json?.markdown ? (
                    <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-300">
                      {selectedProposal.content_json.markdown}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-500">
                      <FileText size={28} className="mx-auto mb-2 text-zinc-600" />
                      <p>Strategic proposal deliverable indexed in repository vector database.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-[#27272a] bg-[#141418] flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="px-3 py-1.5 rounded-md bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedProposal, null, 2));
                    toast.success("Proposal metadata copied");
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy size={12} />
                  <span>Copy Metadata</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
