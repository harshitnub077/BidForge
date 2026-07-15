"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";
import { Logo } from "@/components/Logo";
import { Session } from "@supabase/supabase-js";
import { 
  LayoutDashboard, FolderKanban, Users, BarChart3, Settings, 
  UploadCloud, Sparkles, CheckCircle2, Download, Copy, Share2, Wand2, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import TiptapEditor from "@/components/TiptapEditor";

// ── Markdown renderer ──────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const html: string[] = [];
  let inTable = false;
  let inList = false;
  let isFirstTableRow = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip separator rows in tables (|---|---|)
    if (/^\|[\s\-:|]+\|$/.test(line)) continue;

    // Table rows
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

    // Headers
    if (/^### (.+)$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push(`<h3>${line.slice(4)}</h3>`); continue; }
    if (/^## (.+)$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push(`<h2>${line.slice(3)}</h2>`); continue; }
    if (/^# (.+)$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push(`<h1>${line.slice(2)}</h1>`); continue; }

    // Horizontal rule
    if (/^---+$/.test(line)) { if (inList) { html.push('</ul>'); inList = false; } html.push('<hr>'); continue; }

    // List items
    if (/^[-*] (.+)$/.test(line)) {
      if (!inList) { html.push('<ul>'); inList = true; }
      const content = line.replace(/^[-*] /, '');
      html.push(`<li>${applyInline(content)}</li>`);
      continue;
    } else if (inList && line.trim() === '') {
      html.push('</ul>'); inList = false; continue;
    }

    // Empty line
    if (line.trim() === '') continue;

    // Paragraph
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

// ── Premium Field Component ────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  multi?: boolean;
  type?: string;
  isAiFilling?: boolean;
}

function Field({ label, name, value, onChange, placeholder, multi, type = "text", isAiFilling }: FieldProps) {
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 5 }, show: { opacity: 1, y: 0 } }}
      className="flex flex-col gap-2 w-full relative z-10"
    >
      <label htmlFor={name} className="text-[14px] font-medium ml-1" style={{ color: 'var(--color-ink-muted)' }}>
        {label}
      </label>
      <div className="relative">
        {isAiFilling && (
          <motion.div
            layoutId={`ai-highlight-${name}`}
            className="absolute inset-0 rounded-xl bg-indigo-500/20 z-0"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {multi ? (
          <textarea
            id={name} name={name} value={value} onChange={onChange} placeholder={placeholder}
            className={cn(
              "premium-input min-h-[140px] resize-y"
            )}
          />
        ) : (
          <input
            id={name} type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
            className="premium-input"
          />
        )}
      </div>
    </motion.div>
  );
}

// ── Upload Dropzone Component ─────────────────────────────────────────────────────────
interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  status: "idle" | "uploading" | "success";
  setStatus: (status: "idle" | "uploading" | "success") => void;
}

function UploadDropzone({ onUpload, status, setStatus }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setStatus("uploading");
    await onUpload(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    await onUpload(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload RFP Document"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          document.getElementById('file-upload')?.click();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        isDragging ? "border-indigo-500 bg-indigo-500/5" : "border-[var(--color-hairline)] bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-hairline-strong)]",
        status === "success" && "border-emerald-500/50 bg-emerald-500/5"
      )}
    >
      <label className="absolute inset-0 cursor-pointer w-full h-full z-10" htmlFor="file-upload">
        <input id="file-upload" type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="hidden" tabIndex={-1} />
      </label>
      
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center pointer-events-none"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            <UploadCloud className="w-6 h-6 mb-2 transition-colors" style={{ color: 'var(--color-ink-faint)' }} />
            <p className="text-sm font-medium transition-colors" style={{ color: 'var(--color-ink-muted)' }}>Drag & drop your RFP</p>
            <p className="text-xs mt-1 transition-colors" style={{ color: 'var(--color-ink-faint)' }}>PDF or DOCX</p>
          </motion.div>
        )}

        {status === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-[200px] pointer-events-none"
          >
            <div className="h-1.5 w-full bg-[var(--color-hairline)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-500" 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
            <p className="text-xs text-center mt-3 font-medium" style={{ color: 'var(--color-ink-muted)' }}>Processing & Vectorizing...</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-emerald-400 pointer-events-none"
          >
            <CheckCircle2 className="w-6 h-6 mb-2" />
            <p className="text-sm font-medium">RFP Processed</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sidebar Nav Item ─────────────────────────────────────────────────────────
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

function NavItem({ icon: Icon, label, active = false }: NavItemProps) {
  return (
    <button      className={cn(
        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors group cursor-pointer',
        active ? 'bg-[var(--color-surface-2)] font-medium' : 'hover:bg-[var(--color-surface-1)]'
      )}
      style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
      <Icon size={18} style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-faint)' }} />
      {label}
    </button>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const STORAGE_KEY = "bidforge_form_data";
  const DEFAULT_FORM = {
    client_name: "", industry: "", rfp_title: "", org_name: "BidForge",
    differentiators: "", case_studies: "", deal_size: "", pain_points: "", compliance_reqs: "",
    contact_name: "", contact_email: "", contact_phone: "", proposal_date: ""
  };

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [proposalData, setProposalData] = useState<{
    content: string; confidence_score: number; requires_human_review: boolean;
  } | null>(null);

   
  const [extractedMeta, setExtractedMeta] = useState<Record<string, string> | null>(null);
  const [autofilling, setAutofilling] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  const fetchOrgId = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('org_id').eq('id', userId).single();
    if (error) setAuthError(error.message);
    else if (data) setOrgId(data.org_id);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchOrgId(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchOrgId(session.user.id);
      else { setOrgId(null); setAuthError(null); }
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
  };

  const clearForm = () => {
    setFormData(DEFAULT_FORM);
    setProposalData(null);
  };

  const applyAutofill = () => {
    if (!extractedMeta) return;
    setAutofilling(true);
    const fields = ['client_name', 'industry', 'rfp_title', 'deal_size', 'pain_points', 'compliance_reqs', 'differentiators', 'case_studies'] as const;
    // Animate fields filling in one by one
    fields.forEach((field, i) => {
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          [field]: extractedMeta[field] || prev[field],
        }));
        if (i === fields.length - 1) {
          setTimeout(() => setAutofilling(false), 300);
        }
      }, i * 120);
    });
  };

  const uploadStatus = uploading ? "uploading" : (uploadDone ? "success" : "idle");
  const setUploadStatus = (s: "idle" | "uploading" | "success") => {
    if (s === "idle") { setUploading(false); setUploadDone(false); }
    if (s === "uploading") { setUploading(true); setUploadDone(false); }
    if (s === "success") { setUploading(false); setUploadDone(true); }
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!session) return;
    setFile(fileToUpload);
    setUploading(true);
    const form = new FormData();
    form.append("file", fileToUpload);
    form.append("org_id", orgId || "pending");
    try {
      const res = await fetch("http://localhost:8000/rfp/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` },
        body: form,
      });
      if (res.ok) { 
        setUploadDone(true);
        const data = await res.json();
        if (data.extracted_metadata) {
          setExtractedMeta(data.extracted_metadata);
          toast.success("RFP Processed & Vectorized Successfully!");
        }
      }
      else { const d = await res.json(); toast.error("Upload failed: " + JSON.stringify(d)); setUploadDone(false); }
    } catch { toast.error("Cannot reach backend."); setUploadDone(false); }
    finally { setUploading(false); }
  };

  const handleGenerate = async () => {
    if (!formData.client_name || !formData.rfp_title) return toast.error("Client name and RFP title are required.");
    if (!session) return;
    setGenerating(true);
    // Dynamic Confidence Score Calculation
    let score = 0.65; // Base confidence
    if (formData.pain_points && formData.pain_points.length > 10) score += 0.08;
    if (formData.differentiators && formData.differentiators.length > 10) score += 0.08;
    if (formData.case_studies && formData.case_studies.length > 10) score += 0.08;
    if (formData.compliance_reqs && formData.compliance_reqs.length > 5) score += 0.04;
    if (formData.deal_size) score += 0.02;
    if (extractedMeta) score += 0.04;
    const finalScore = Math.min(0.99, score);

    setProposalData({ content: "", confidence_score: finalScore, requires_human_review: false });
    setGenElapsed(0);
    genTimerRef.current = setInterval(() => setGenElapsed(prev => prev + 1), 1000);
    try {
      const res = await fetch("http://localhost:8000/proposal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ org_id: orgId || "pending", ...formData }),
      });
      if (!res.ok) {
        toast.error("Generation failed.");
        setGenerating(false);
        return;
      }
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      
      if (reader) {
        let firstScroll = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          setProposalData({ content, confidence_score: finalScore, requires_human_review: false });
          
          if (!firstScroll && content.length > 100) {
            outputRef.current?.scrollIntoView({ behavior: 'smooth' });
            firstScroll = true;
          }
        }
        toast.success("Proposal Generated Successfully!");
      }
    } catch { toast.error("Cannot reach backend."); }
    finally {
      setGenerating(false);
      if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
    }
  };

  return (
    <div className="w-full h-full">
          
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full pb-6">

            {/* ── LEFT PANEL (Form) ── */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-5 flex flex-col gap-6"
            >

              {/* Upload Card */}
              <motion.div 
                className="surface-card p-6 rounded-lg hover:border-[var(--color-hairline-strong)] transition-colors duration-200"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">1</div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Source Document</h2>
                </div>
                
                <UploadDropzone onUpload={handleUpload} status={uploadStatus} setStatus={setUploadStatus} />
              </motion.div>

              {/* Context Card */}
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.1, staggerChildren: 0.05, delayChildren: 0.2 } }
                }}
                className="surface-card p-6 rounded-lg hover:border-[var(--color-hairline-strong)] transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">2</div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Strategic Context</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={applyAutofill} 
                      disabled={!extractedMeta || autofilling}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${autofilling ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: extractedMeta ? 'var(--color-accent-muted)' : 'var(--color-surface-2)',
                        color: extractedMeta ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                        border: extractedMeta ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--color-hairline)',
                        cursor: extractedMeta ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Wand2 size={13} className={autofilling ? 'animate-spin' : ''} />
                      {autofilling ? 'Filling...' : 'AI Autofill'}
                    </button>
                    <button onClick={clearForm} className="text-xs font-medium transition-colors" style={{ color: 'var(--color-ink-faint)' }}>
                      Reset
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-x-5">
                    <Field label="Client Name" name="client_name" value={formData.client_name} onChange={handleChange} placeholder="Acme Corp" isAiFilling={autofilling} />
                    <Field label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="SaaS" isAiFilling={autofilling} />
                  </div>
                  <Field label="RFP Title" name="rfp_title" value={formData.rfp_title} onChange={handleChange} placeholder="Q3 Platform Migration" isAiFilling={autofilling} />
                  
                  <div className="my-1" style={{ borderTop: '1px solid var(--color-hairline)' }}></div>

                  <div className="grid grid-cols-2 gap-x-5">
                    <Field label="Your Organization" name="org_name" value={formData.org_name} onChange={handleChange} placeholder="BidForge" />
                    <Field label="Deal Size" name="deal_size" value={formData.deal_size} onChange={handleChange} placeholder="$1,500,000" isAiFilling={autofilling} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-5">
                    <Field label="Contact Person" name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="John Smith" />
                    <Field label="Contact Email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="john@bidforge.com" type="email" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-5">
                    <Field label="Contact Phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="+1 (555) 123-4567" type="tel" />
                    <Field label="Proposed Meeting Date" name="proposal_date" value={formData.proposal_date} onChange={handleChange} placeholder="July 21, 2026" type="date" />
                  </div>

                  <div className="my-1" style={{ borderTop: '1px solid var(--color-hairline)' }}></div>

                  <Field label="Key Differentiators" name="differentiators" value={formData.differentiators} onChange={handleChange} placeholder="Proprietary engine, 24/7 support..." multi isAiFilling={autofilling} />
                  <Field label="Pain Points" name="pain_points" value={formData.pain_points} onChange={handleChange} placeholder="High latency, poor analytics..." multi isAiFilling={autofilling} />
                  <Field label="Compliance" name="compliance_reqs" value={formData.compliance_reqs} onChange={handleChange} placeholder="SOC 2, GDPR..." multi isAiFilling={autofilling} />
                  <Field label="Case Studies" name="case_studies" value={formData.case_studies} onChange={handleChange} placeholder="Migrated GlobalBank in 3 months..." multi isAiFilling={autofilling} />
                </div>
                
                <div className="mt-6 relative">
                  <motion.button
                    whileHover={{ scale: generating ? 1 : 1.01 }}
                    whileTap={{ scale: generating ? 1 : 0.98 }}
                    onClick={handleGenerate}
                    disabled={generating}
                    aria-busy={generating}
                    className={`
                      relative w-full overflow-hidden rounded-xl px-4 py-3 font-semibold text-sm
                      transition-all duration-300 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                      ${generating ? 'bg-[var(--color-surface-1)] cursor-not-allowed' : 'btn-primary shadow-sm'}
                    `}
                  >
                    {generating && (
                      <motion.div
                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    )}

                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-ink-faint)' }} />
                        <span style={{ color: 'var(--color-ink-muted)' }}>Synthesizing Proposal...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white transition-transform group-hover:rotate-12" />
                        <span className="text-white">Generate Proposal</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

            {/* ── RIGHT PANEL (Preview) ── */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              ref={outputRef} 
              className="lg:col-span-7 h-[calc(100vh-48px)] sticky top-6"
            >
              <motion.div 
                className="surface-card flex flex-col h-full overflow-hidden rounded-lg hover:border-[var(--color-hairline-strong)] transition-colors duration-200"
              >
                
                {/* Toolbar */}
                <div className="px-6 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Document Output</h2>
                    {proposalData && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        {Math.round(proposalData.confidence_score * 100)}% Match
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={!proposalData}
                      onClick={() => {
                        navigator.clipboard.writeText(proposalData?.content || "");
                        toast.success("Copied to clipboard!");
                      }}
                      className="p-2 rounded-lg disabled:opacity-30 transition-colors"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-hairline)', color: 'var(--color-ink-muted)' }}
                      title="Copy Markdown"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      disabled={!proposalData}
                      onClick={async () => {
                        const { generateDocx } = await import("@/lib/doc_generation");
                        generateDocx(renderMarkdown(proposalData!.content), `${formData.client_name}_Proposal.docx`, orgId || "");
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30 transition-colors"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-hairline)', color: 'var(--color-ink)' }}
                    >
                      <Download size={14} /> DOCX
                    </button>
                    <button 
                      disabled={!proposalData}
                      onClick={async () => {
                        toast.loading("Generating PDF...", { id: "pdf" });
                        try {
                          const { generatePdf } = await import("@/lib/doc_generation");
                          await generatePdf("proposal-output", `${formData.client_name}_Proposal.pdf`, orgId || "");
                          toast.success("PDF generated!", { id: "pdf" });
                        } catch (e) {
                          toast.error("Failed to generate PDF.", { id: "pdf" });
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 btn-primary rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
                    >
                      <Share2 size={14} /> PDF
                    </button>
                  </div>
                </div>

                {/* Document Body */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                  <div 
                    id="proposal-output"
                    className="max-w-[800px] mx-auto min-h-full doc-prose"
                  >
                    {proposalData ? (
                      <div className="animate-fade-in w-full h-full">
                        <TiptapEditor content={renderMarkdown(proposalData.content)} />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-20" style={{ color: 'var(--color-ink-muted)' }}>
                        {generating ? (
                          <>
                            <Logo className="w-10 h-10 mb-6 animate-pulse-glow" />
                            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink)' }}>Forging your proposal…</p>
                            <p className="text-xs mb-4" style={{ color: 'var(--color-accent)' }}>{genElapsed}s elapsed</p>
                            <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                              <span style={genElapsed >= 0 ? { color: 'var(--color-ink-muted)', fontWeight: 500 } : {}}>✦ Analyzing strategic context</span>
                              <span style={genElapsed >= 3 ? { color: 'var(--color-ink-muted)', fontWeight: 500 } : {}}>✦ Drafting executive summary</span>
                              <span style={genElapsed >= 6 ? { color: 'var(--color-ink-muted)', fontWeight: 500 } : {}}>✦ Building solution architecture</span>
                              <span style={genElapsed >= 9 ? { color: 'var(--color-ink-muted)', fontWeight: 500 } : {}}>✦ Generating pricing & timeline</span>
                              <span style={genElapsed >= 12 ? { color: 'var(--color-ink-muted)', fontWeight: 500 } : {}}>✦ Final quality review</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-hairline)' }}>
                              <Sparkles size={18} style={{ color: 'var(--color-ink-faint)' }} />
                            </div>
                            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-ink)' }}>No proposal generated</p>
                            <p className="text-sm text-center max-w-[260px]" style={{ color: 'var(--color-ink-faint)' }}>Upload an RFP and provide strategic context to generate a highly tailored proposal.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            </motion.div>

          </div>
        </div>
  );
}
