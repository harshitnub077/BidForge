"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";
import { Logo } from "@/components/Logo";
import { Session } from "@supabase/supabase-js";
import { 
  LayoutDashboard, FolderKanban, Users, BarChart3, Settings, 
  UploadCloud, Sparkles, CheckCircle2, Download, Copy, Share2, Wand2
} from "lucide-react";

// ── Markdown renderer ──────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const html: string[] = [];
  let inTable = false;
  let inList = false;
  let isFirstTableRow = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

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

// ── Field Component ────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  multi?: boolean;
  type?: string;
}

function Field({ label, name, value, onChange, placeholder, multi, type = "text" }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">{label}</label>
      {multi ? (
        <textarea 
          name={name} value={value} onChange={onChange} placeholder={placeholder} 
          className="premium-input resize-none h-20" 
        />
      ) : (
        <input 
          type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} 
          className="premium-input" 
        />
      )}
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
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      active ? 'bg-zinc-200/50 text-zinc-900 font-medium' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50'
    }`}>
      <Icon size={18} className={active ? 'text-zinc-950' : 'text-zinc-400'} />
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleUpload = async () => {
    if (!file) return alert("Please select a file.");
    if (!session) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
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
        }
      }
      else { const d = await res.json(); alert("Upload failed: " + JSON.stringify(d)); }
    } catch { alert("Cannot reach backend."); }
    finally { setUploading(false); }
  };

  const handleGenerate = async () => {
    if (!formData.client_name || !formData.rfp_title) return alert("Client name and RFP title are required.");
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
        alert("Generation failed.");
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
      }
    } catch { alert("Cannot reach backend."); }
    finally {
      setGenerating(false);
      if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
    }
  };

  if (!mounted) return null;
  if (!session) return <Auth />;

  if (!orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-zinc-950 p-4">
        {authError ? (
          <div className="max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <h3 className="text-red-400 font-semibold mb-2">Database Error</h3>
            <p className="text-sm text-red-300/80 mb-6">{authError}</p>
            <button className="premium-btn bg-white/10 hover:bg-white/20 text-white" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Logo className="w-12 h-12 mb-6 animate-pulse-glow" />
            <div className="text-sm text-zinc-500 tracking-wide uppercase">Initializing Workspace...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900">
      {/* ── Sidebar Nav ── */}
      <aside className="w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col z-20">
        <div className="h-14 flex items-center px-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6" />
            <span className="font-semibold text-zinc-900 tracking-tight text-base">BidForge</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={FolderKanban} label="Projects" />
          <NavItem icon={Users} label="Clients" />
          <NavItem icon={BarChart3} label="Analytics" />
        </div>
        <div className="p-3 border-t border-zinc-200">
          <NavItem icon={Settings} label="Settings" />
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full mt-2 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 relative z-20">
          <h1 className="text-sm font-medium text-zinc-900">Create New Proposal</h1>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-black/5 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-xs">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-zinc-400">{session.user.email}</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ── LEFT PANEL (Form) ── */}
            <div className="lg:col-span-5 flex flex-col gap-6 animate-fade-in" style={{ animationDuration: '0.5s' }}>

              {/* Upload Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center text-xs font-medium">1</div>
                  <h2 className="text-sm font-semibold text-zinc-900">Source Document</h2>
                </div>
                
                <div className={`relative border border-dashed rounded-lg p-6 text-center mb-5 transition-colors group cursor-pointer ${uploadDone ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100'}`}>
                  {uploadDone ? (
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
                  ) : (
                    <UploadCloud className="w-8 h-8 mx-auto mb-3 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                  )}
                  <div className="text-sm text-zinc-900 font-medium mb-1">
                    {uploadDone ? 'Processed & Vectorized' : 'Upload RFP (PDF, DOCX)'}
                  </div>
                  <label className="cursor-pointer text-xs font-medium text-black hover:text-zinc-600 underline underline-offset-2">
                    <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => { setFile(e.target.files?.[0] || null); setUploadDone(false); }} className="hidden" />
                    {file ? file.name : 'Browse files'}
                  </label>
                </div>
                <button 
                  onClick={handleUpload} 
                  disabled={uploading || !file} 
                  className="premium-btn w-full bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 disabled:opacity-50 shadow-sm"
                >
                  {uploading ? 'Processing...' : 'Upload File'}
                </button>
              </div>

              {/* Context Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center text-xs font-medium">2</div>
                    <h2 className="text-sm font-semibold text-zinc-900">Strategic Context</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={applyAutofill} 
                      disabled={!extractedMeta || autofilling}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        extractedMeta 
                          ? 'bg-black text-white hover:bg-zinc-800 shadow-sm' 
                          : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                      } ${autofilling ? 'animate-pulse' : ''}`}
                    >
                      <Wand2 size={13} className={autofilling ? 'animate-spin' : ''} />
                      {autofilling ? 'Filling...' : 'AI Autofill'}
                    </button>
                    <button onClick={clearForm} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                      Reset
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4">
                  <Field label="Client Name" name="client_name" value={formData.client_name} onChange={handleChange} placeholder="Acme Corp" />
                  <Field label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="SaaS" />
                </div>
                <Field label="RFP Title" name="rfp_title" value={formData.rfp_title} onChange={handleChange} placeholder="Q3 Platform Migration" />
                
                <div className="my-5 border-t border-zinc-200"></div>

                <div className="grid grid-cols-2 gap-x-4">
                  <Field label="Your Organization" name="org_name" value={formData.org_name} onChange={handleChange} placeholder="BidForge" />
                  <Field label="Deal Size" name="deal_size" value={formData.deal_size} onChange={handleChange} placeholder="$1,500,000" />
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <Field label="Contact Person" name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="John Smith" />
                  <Field label="Contact Email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="john@bidforge.com" type="email" />
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <Field label="Contact Phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="+1 (555) 123-4567" type="tel" />
                  <Field label="Proposed Meeting Date" name="proposal_date" value={formData.proposal_date} onChange={handleChange} placeholder="July 21, 2026" type="date" />
                </div>

                <div className="my-5 border-t border-zinc-200"></div>

                <Field label="Key Differentiators" name="differentiators" value={formData.differentiators} onChange={handleChange} placeholder="Proprietary engine, 24/7 support..." multi />
                <Field label="Pain Points" name="pain_points" value={formData.pain_points} onChange={handleChange} placeholder="High latency, poor analytics..." multi />
                <Field label="Compliance" name="compliance_reqs" value={formData.compliance_reqs} onChange={handleChange} placeholder="SOC 2, GDPR..." multi />
                <Field label="Case Studies" name="case_studies" value={formData.case_studies} onChange={handleChange} placeholder="Migrated GlobalBank in 3 months..." multi />
                
                <div className="mt-6 relative group">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="premium-btn w-full bg-black hover:bg-zinc-800 text-white relative z-10"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Proposal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL (Preview) ── */}
            <div ref={outputRef} className="lg:col-span-7 h-full sticky top-0 pb-6 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col h-[calc(100vh-104px)] overflow-hidden">
                
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-zinc-900">Document Output</h2>
                    {proposalData && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-zinc-700 border border-zinc-200">
                        {Math.round(proposalData.confidence_score * 100)}% Match
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={!proposalData}
                      onClick={() => navigator.clipboard.writeText(proposalData?.content || "")}
                      className="p-2 border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 transition-colors bg-white shadow-sm"
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
                      className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 transition-colors bg-white shadow-sm"
                    >
                      <Download size={14} /> DOCX
                    </button>
                    <button 
                      disabled={!proposalData}
                      onClick={async () => {
                        const { generatePdf } = await import("@/lib/doc_generation");
                        generatePdf("proposal-output", `${formData.client_name}_Proposal.pdf`, orgId || "");
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-zinc-800 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-colors shadow-sm"
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
                      <div className="animate-fade-in" dangerouslySetInnerHTML={{ __html: renderMarkdown(proposalData.content) }} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-20">
                        {generating ? (
                          <>
                            <Logo className="w-12 h-12 mb-6 animate-pulse-glow" />
                            <p className="text-sm font-medium text-zinc-900 mb-2">Forging your proposal...</p>
                            <p className="text-xs text-zinc-400 mb-4">{genElapsed}s elapsed</p>
                            <div className="flex flex-col gap-2 text-xs text-zinc-500">
                              <span className={genElapsed >= 0 ? 'text-zinc-900 font-medium' : ''}>✦ Analyzing strategic context</span>
                              <span className={genElapsed >= 3 ? 'text-zinc-900 font-medium' : ''}>✦ Drafting executive summary</span>
                              <span className={genElapsed >= 6 ? 'text-zinc-900 font-medium' : ''}>✦ Building solution architecture</span>
                              <span className={genElapsed >= 9 ? 'text-zinc-900 font-medium' : ''}>✦ Generating pricing & timeline</span>
                              <span className={genElapsed >= 12 ? 'text-zinc-900 font-medium' : ''}>✦ Final quality review</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
                              <Sparkles size={20} className="text-zinc-400" />
                            </div>
                            <p className="text-sm text-zinc-900 font-medium mb-1">No proposal generated</p>
                            <p className="text-sm text-zinc-500 text-center max-w-[250px]">Upload an RFP and provide strategic context to generate a highly tailored proposal.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
