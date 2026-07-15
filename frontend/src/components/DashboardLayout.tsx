"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";
import { Logo } from "@/components/Logo";
import { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, FolderKanban, Users, BarChart3, Settings, Sparkles
} from "lucide-react";
import { Toaster, toast } from "sonner";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      active ? 'bg-white/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`}>
      <Icon size={18} className={active ? 'text-white drop-shadow-md' : 'text-zinc-500'} />
      {label}
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  const fetchOrgId = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('org_id').eq('id', userId).single();
    if (error) setAuthError(error.message);
    else if (data) setOrgId(data.org_id);
  };

  useEffect(() => {
    setMounted(true);
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
    <div className="min-h-screen bg-transparent flex text-white">
      {/* ── Sidebar Nav ── */}
      <aside className="w-64 glass-panel rounded-r-2xl my-2 ml-2 flex flex-col z-20">
        <div className="h-14 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6" />
            <span className="font-semibold text-white tracking-tight text-base">BidForge</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={pathname === "/"} onClick={() => router.push("/")} />
          <NavItem icon={FolderKanban} label="Projects" active={pathname === "/projects"} onClick={() => router.push("/projects")} />
          <NavItem icon={Users} label="Clients" active={pathname === "/clients"} onClick={() => router.push("/clients")} />
          <NavItem icon={BarChart3} label="Analytics" active={pathname === "/analytics"} onClick={() => router.push("/analytics")} />
        </div>
        <div className="p-3 border-t border-white/5">
          <NavItem icon={Settings} label="Settings" />
          
          <button 
            onClick={async () => {
              try {
                const res = await fetch("http://localhost:8000/billing/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
                  body: JSON.stringify({ org_id: orgId || "pending", plan: "pro" })
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              } catch (e) {
                toast.error("Failed to create checkout session");
              }
            }}
            className="w-full mt-4 py-2 px-3 bg-gradient-to-r from-amber-200 to-yellow-400 hover:from-amber-300 hover:to-yellow-500 text-yellow-900 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles size={14} /> Upgrade to Pro
          </button>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full mt-2 py-2 text-xs font-medium text-zinc-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Topbar */}
        <header className="h-14 glass-panel rounded-b-2xl mx-4 border-t-0 flex items-center justify-between px-6 relative z-20">
          <h1 className="text-sm font-medium text-white capitalize">
            {pathname === "/" ? "Create New Proposal" : pathname.substring(1)}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-xs shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-zinc-400">{session.user.email}</span>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* We pass session and orgId down via Context or cloneElement if needed, 
              but since we're using Supabase client directly in pages, we can just render children. */}
          {children}
        </div>
      </main>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
