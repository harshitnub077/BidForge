"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Copy, 
  Share2, 
  Wand2, 
  Loader2, 
  FileText, 
  RotateCcw, 
  SlidersHorizontal, 
  FileCheck,
  Building2,
  DollarSign,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/TiptapEditor";

// ── Markdown to HTML helper ──────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const html: string[] = [];
  let inTable = false;
  let inList = false;
  let isFirstTableRow = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\|[\s\-:|]+\|$/.test(line)) continue;

    if (/^\|(.+)\|$/.test(line)) {
      if (!inTable) { html.push('<table>'); inTable = true; isFirstTableRow = true; }
      if (inList) { html.push('</ul>'); inList = false; }
      const cells = line.split('|').slice(1, -1);
      const tag = isFirstTableRow ? 'th' : 'td';
      const row = cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('');
      html.push(`<tr>${row}</tr>`);
      isFirstTableRow = false;
      continue;
    } else if (inTable) {
      html.push('</table>'); inTable = false;
    }

    if (/^### (.+)$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push(`<h3>${line.slice(4)}</h3>`); continue; }
    if (/^## (.+)$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push(`<h2>${line.slice(3)}</h2>`); continue; }
    if (/^# (.+)$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push(`<h1>${line.slice(2)}</h1>`); continue; }

    if (/^---+$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push('<hr>'); continue; }

    if (/^[-*] (.+)$/.test(line)) {
      if (!inList) { html.push('<ul>'); inList = true; }
      const content = line.replace(/^[-*] /, '');
      html.push(`<li>${applyInline(content)}</li>`);
      continue;
    } else if (inList && line.trim() === '') {
      html.push('</ul>'); inList = false; continue;
    }

    if (line.trim() === '') continue;

    if (inList) { html.push('</ul>'); inList = false; }
    html.push(`<p>${applyInline(line)}</p>`);
  }
  if (inTable) html.push('</table>');
  if (inList) html.push('</ul>');
  return html.join('\n');
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// ── Upload Dropzone Component ────────────────────────────────────────────────
interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  status: "idle" | "uploading" | "success";
  uploadedFileName?: string;
}

function UploadDropzone({ onUpload, status, uploadedFileName }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await onUpload(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload Source RFP"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          document.getElementById('file-upload-input')?.click();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload-input')?.click()}
      className={cn(
        "relative w-full py-6 px-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-dashed text-center",
        isDragging 
          ? "bg-[#18181b] border-zinc-400 scale-[1.005]" 
          : "bg-[#09090b] border-[#27272a] hover:border-zinc-500 hover:bg-[#101014]",
        status === "success" && "border-zinc-600 bg-[#101014]"
      )}
    >
      <input 
        id="file-upload-input" 
        type="file" 
        accept=".pdf,.docx,.txt" 
        onChange={handleFileChange} 
        className="hidden" 
        tabIndex={-1} 
      />
      
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center pointer-events-none"
          >
            <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-2.5 text-zinc-400">
              <UploadCloud size={18} className="text-zinc-300" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">
              Drag and drop source RFP specification, or <span className="text-white underline underline-offset-2">browse files</span>
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">Supports PDF, DOCX, or TXT (up to 25MB)</p>
          </motion.div>
        )}

        {status === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[260px] flex flex-col items-center pointer-events-none py-1.5"
          >
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-2.5">
              <motion.div 
                className="h-full bg-white rounded-full" 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
              Parsing & Vectorizing Requirements...
            </span>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 text-white pointer-events-none py-1"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white truncate max-w-[240px]">
                {uploadedFileName || "RFP Ingested"}
              </p>
              <p className="text-[10px] font-mono text-emerald-400/90 mt-0.5 uppercase tracking-wide">
                Vectorized & Requirements Extracted
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const DEFAULT_FORM = {
    client_name: "", 
    industry: "", 
    rfp_title: "", 
    org_name: "BidForge Enterprise",
    deal_size: "", 
    pain_points: "", 
    differentiators: "", 
    case_studies: "", 
    compliance_reqs: "",
    contact_name: "", 
    contact_email: "", 
    contact_phone: "", 
    proposal_date: ""
  };

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [genElapsed, setGenElapsed] = useState(0);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [proposalData, setProposalData] = useState<{
    content: string; 
    confidence_score: number; 
    requires_human_review: boolean;
  } | null>(null);
  
  const [editedContentHtml, setEditedContentHtml] = useState<string | null>(null);
  const [editedContentText, setEditedContentText] = useState<string | null>(null);
  const [extractedMeta, setExtractedMeta] = useState<Record<string, string> | null>(null);
  const [autofilling, setAutofilling] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setOrgId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setOrgId(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.surface-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearForm = () => {
    setFormData(DEFAULT_FORM);
    setProposalData(null);
    setEditedContentHtml(null);
    setEditedContentText(null);
    setExtractedMeta(null);
    setUploadDone(false);
    setUploadedFileName("");
    toast.info("Reset workspace inputs");
  };

  const applyAutofill = () => {
    if (!extractedMeta) return;
    setAutofilling(true);
    const fields = ['client_name', 'industry', 'rfp_title', 'deal_size', 'pain_points', 'compliance_reqs', 'differentiators', 'case_studies'] as const;
    fields.forEach((field, i) => {
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          [field]: extractedMeta[field] || prev[field],
        }));
        if (i === fields.length - 1) {
          setTimeout(() => {
            setAutofilling(false);
            toast.success("Strategic matrix aligned with extracted RFP data");
          }, 150);
        }
      }, i * 60);
    });
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!session) return;
    setUploading(true);
    setUploadedFileName(fileToUpload.name);
    const form = new FormData();
    form.append("file", fileToUpload);
    form.append("org_id", orgId || "default-org");
    
    try {
      const res = await fetch("http://localhost:8000/rfp/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` },
        body: form,
      });
      if (res.ok) { 
        setUploadDone(true);
        const data = await res.json();
        if (data.extracted_metadata && Object.keys(data.extracted_metadata).length > 0) {
          setExtractedMeta(data.extracted_metadata);
          toast.success("RFP parsed: key requirements extracted");
        } else {
          toast.info("RFP uploaded successfully");
        }
      } else {
        toast.error("Document upload failed.");
        setUploadDone(false);
      }
    } catch {
      toast.error("Cannot reach backend server on port 8000.");
      setUploadDone(false);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.client_name || !formData.rfp_title) {
      return toast.error("Client organization and RFP initiative title are required.");
    }
    if (!session) return;
    
    setGenerating(true);
    let score = 0.74;
    if (formData.pain_points && formData.pain_points.length > 10) score += 0.08;
    if (formData.differentiators && formData.differentiators.length > 10) score += 0.08;
    if (formData.case_studies && formData.case_studies.length > 10) score += 0.05;
    if (formData.deal_size) score += 0.02;
    if (extractedMeta) score += 0.03;
    const finalScore = Math.min(0.98, score);

    setProposalData({ content: "", confidence_score: finalScore, requires_human_review: false });
    setGenElapsed(0);
    genTimerRef.current = setInterval(() => setGenElapsed(prev => prev + 1), 1000);

    try {
      const res = await fetch("http://localhost:8000/proposal/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ org_id: orgId || "default-org", ...formData }),
      });
      
      if (!res.ok) {
        toast.error("Proposal synthesis failed on server.");
        setGenerating(false);
        return;
      }
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          setProposalData({ content, confidence_score: finalScore, requires_human_review: false });
        }
      }
      toast.success("Executive proposal synthesized");
    } catch (error) {
      console.error(error);
      toast.error("Synthesis stream interrupted.");
    } finally {
      setGenerating(false);
      if (genTimerRef.current) clearInterval(genTimerRef.current);
    }
  };

  // Keyboard shortcut: ⌘+Enter to trigger proposal synthesis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!generating && formData.client_name && formData.rfp_title) {
          handleGenerate();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [generating, formData.client_name, formData.rfp_title]);

  const uploadStatus = uploading ? "uploading" : (uploadDone ? "success" : "idle");

  // Word count & Read time calculation
  const currentText = editedContentText || proposalData?.content || "";
  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="w-full relative z-10 max-w-[1440px] mx-auto">
      
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-7 border-b border-[#27272a] gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/[0.04] border border-[#27272a] text-zinc-300 font-mono text-[10px] uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active Session
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Proposal Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Ingest RFP specifications, calibrate commercial & strategic levers, and synthesize board-ready deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {extractedMeta && (
            <button 
              onClick={applyAutofill} 
              disabled={autofilling}
              className="px-3 py-1.5 rounded-md bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-200 font-medium text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 size={13} className={autofilling ? "animate-spin" : ""} />
              <span>{autofilling ? "Applying..." : "Auto-Fill Matrix"}</span>
            </button>
          )}
          <button 
            onClick={clearForm}
            className="px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-colors text-xs inline-flex items-center gap-1.5 cursor-pointer"
            title="Reset fields"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">

        {/* ── LEFT COLUMN: Input Matrix (Generous Spacing) ── */}
        <div className="xl:col-span-5 flex flex-col gap-6">

          {/* Section 1: RFP Ingestion */}
          <div className="surface-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-zinc-400" />
                <span className="text-xs font-semibold text-white tracking-tight">
                  Source RFP Specification
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step 01</span>
            </div>
            
            <UploadDropzone 
              onUpload={handleUpload} 
              status={uploadStatus} 
              uploadedFileName={uploadedFileName}
            />
          </div>

          {/* Section 2: Strategic Parameters & Context Form */}
          <div className="surface-card p-6 rounded-lg">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#27272a]">
              <div>
                <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-zinc-400" />
                  Strategic Parameters & Context
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Tailor the core pillars of your executive response
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step 02</span>
            </div>

            {/* Well-Spaced Form Sections */}
            <div className="space-y-6">
              
              {/* Group A: Target Entity & Opportunity */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                  <Building2 size={13} className="text-zinc-400" />
                  <span>Target Account & Initiative</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                      Client Organization *
                    </label>
                    <input 
                      type="text" 
                      name="client_name" 
                      value={formData.client_name} 
                      onChange={handleChange} 
                      placeholder="e.g. Goldman Sachs, NHS Digital" 
                      className="premium-input" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                      Industry Sector
                    </label>
                    <input 
                      type="text" 
                      name="industry" 
                      value={formData.industry} 
                      onChange={handleChange} 
                      placeholder="e.g. Banking & Financial Services" 
                      className="premium-input" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                    RFP Initiative Title *
                  </label>
                  <input 
                    type="text" 
                    name="rfp_title" 
                    value={formData.rfp_title} 
                    onChange={handleChange} 
                    placeholder="e.g. Enterprise Zero-Trust Core Migration 2026" 
                    className="premium-input" 
                  />
                </div>
              </div>

              <div className="w-full border-t border-[#27272a]" />

              {/* Group B: Commercials & Responding Organization */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                  <DollarSign size={13} className="text-zinc-400" />
                  <span>Commercial & Bidding Scope</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                      Responding Entity
                    </label>
                    <input 
                      type="text" 
                      name="org_name" 
                      value={formData.org_name} 
                      onChange={handleChange} 
                      placeholder="BidForge Enterprise" 
                      className="premium-input" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                      Target Contract Value / Budget
                    </label>
                    <input 
                      type="text" 
                      name="deal_size" 
                      value={formData.deal_size} 
                      onChange={handleChange} 
                      placeholder="e.g. $1,450,000" 
                      className="premium-input" 
                    />
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-[#27272a]" />

              {/* Group C: Strategic Levers & Content */}
              <div className="space-y-5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                  <Target size={13} className="text-zinc-400" />
                  <span>Strategic Levers & Narrative</span>
                </div>

                {/* Differentiators */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                    Key Competitive Differentiators
                  </label>
                  <textarea 
                    name="differentiators" 
                    value={formData.differentiators} 
                    onChange={handleChange} 
                    placeholder="e.g. Zero-trust native architecture, 99.999% SLA guarantee, dedicated US/EU based engineering team, automated compliance auditing..." 
                    rows={3} 
                    className="premium-input" 
                  />
                </div>

                {/* Pain Points */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                    Client Pain Points & Challenges Addressed
                  </label>
                  <textarea 
                    name="pain_points" 
                    value={formData.pain_points} 
                    onChange={handleChange} 
                    placeholder="e.g. High latency in legacy database, recurring downtime, vulnerability to regulatory compliance audits, high maintenance overhead..." 
                    rows={3} 
                    className="premium-input" 
                  />
                </div>

                {/* Compliance Requirements */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                    Compliance & Security Requirements
                  </label>
                  <textarea 
                    name="compliance_reqs" 
                    value={formData.compliance_reqs} 
                    onChange={handleChange} 
                    placeholder="e.g. SOC 2 Type II, ISO 27001, HIPAA compliant data processing..." 
                    rows={2} 
                    className="premium-input" 
                  />
                </div>

                {/* Case Studies */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                    Relevant Case Studies & Evidence Proof Points
                  </label>
                  <textarea 
                    name="case_studies" 
                    value={formData.case_studies} 
                    onChange={handleChange} 
                    placeholder="e.g. Migrated Global Tier-1 Investment Bank in 4 months with zero system downtime and 42% operational cost reduction..." 
                    rows={3} 
                    className="premium-input" 
                  />
                </div>
              </div>
            </div>

            {/* Synthesize Button with Generous Margin */}
            <div className="mt-8 pt-2">
              <button
                onClick={handleGenerate}
                disabled={generating || !formData.client_name || !formData.rfp_title}
                className="w-full py-3 px-4 rounded-md bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-zinc-950" />
                    <span>Synthesizing Document Core ({genElapsed}s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Synthesize Executive Proposal</span>
                    <span className="ml-1 text-[10px] font-mono opacity-60 bg-black/10 px-1.5 py-0.5 rounded">⌘↵</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Executive Document Studio Canvas ── */}
        <div className="xl:col-span-7 h-[calc(100vh-140px)] xl:sticky top-4">
          <div className="proposal-canvas-card flex flex-col h-full">
            
            {/* Document Header Toolbar */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-[#27272a] bg-[#101014] z-20 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white tracking-tight">Proposal Canvas</span>
                
                {proposalData ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {Math.round(proposalData.confidence_score * 100)}% Strategic Fit
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                    Draft Canvas
                  </span>
                )}

                {wordCount > 0 && (
                  <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500">
                    {wordCount} words • ~{readTimeMinutes} min read
                  </span>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button 
                  disabled={!proposalData}
                  onClick={() => {
                    navigator.clipboard.writeText(editedContentText || proposalData?.content || "");
                    toast.success("Proposal text copied to clipboard");
                  }}
                  className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-colors disabled:opacity-30 cursor-pointer" 
                  title="Copy Document Text"
                  aria-label="Copy Document Text"
                >
                  <Copy size={14} />
                </button>
                
                <button 
                  disabled={!proposalData}
                  onClick={async () => {
                    const { generateDocx } = await import("@/lib/doc_generation");
                    generateDocx(editedContentHtml || renderMarkdown(proposalData!.content), `${formData.client_name || "Executive"}_Proposal.docx`, orgId || "");
                    toast.success("Exported Word document (.docx)");
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-200 font-medium text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
                >
                  <Download size={13} /> 
                  <span>DOCX</span>
                </button>

                <button 
                  disabled={!proposalData}
                  onClick={async () => {
                    toast.loading("Compiling PDF...", { id: "pdf-export" });
                    try {
                      const { generatePdf } = await import("@/lib/doc_generation");
                      await generatePdf("proposal-output-render", `${formData.client_name || "Executive"}_Proposal.pdf`, orgId || "");
                      toast.success("PDF Exported", { id: "pdf-export" });
                    } catch {
                      toast.error("Failed to generate PDF.", { id: "pdf-export" });
                    }
                  }}
                  className="px-3 py-1.5 rounded-md bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
                >
                  <Share2 size={13} /> 
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Document Content Canvas */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 relative bg-[#09090b]">
              {proposalData ? (
                <div id="proposal-output-render" className="max-w-[780px] mx-auto min-h-full doc-prose relative z-10 w-full">
                  <TiptapEditor 
                    content={renderMarkdown(proposalData.content)} 
                    onChange={(html, text) => {
                      setEditedContentHtml(html);
                      setEditedContentText(text);
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  {generating ? (
                    <div className="space-y-4 w-full max-w-md mx-auto px-4">
                      <div className="h-5 w-2/3 shimmer-line rounded mx-auto" />
                      <div className="space-y-2 mt-6">
                        <div className="h-3 w-full shimmer-line rounded" />
                        <div className="h-3 w-5/6 shimmer-line rounded mx-auto" />
                        <div className="h-3 w-4/5 shimmer-line rounded mx-auto" />
                      </div>
                      <div className="mt-8 flex items-center justify-center gap-2 text-zinc-400 font-mono text-xs">
                        <Loader2 size={14} className="animate-spin text-white" />
                        <span>Synthesizing Document Content... ({genElapsed}s)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center max-w-xs text-center">
                      <div className="w-10 h-10 rounded-md bg-[#121215] border border-[#27272a] flex items-center justify-center mb-3 text-zinc-500">
                        <FileCheck size={18} />
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        Document Studio Empty
                      </h4>
                      <p className="text-zinc-500 text-xs leading-relaxed">
                        Configure strategic parameters or drop an RFP document on the left to synthesize an executive proposal.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
