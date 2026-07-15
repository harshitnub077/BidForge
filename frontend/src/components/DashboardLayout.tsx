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
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
      style={{
        backgroundColor: active ? 'var(--color-surface-2)' : 'transparent',
        color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        border: active ? '1px solid var(--color-hairline)' : '1px solid transparent',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-ink)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted)'; } }}
    >
      <Icon size={16} style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-faint)' }} />
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
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4" style={{ backgroundColor: 'var(--color-canvas)' }}>
        {authError ? (
          <div className="max-w-md p-6 rounded-xl text-center surface-card" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#fca5a5' }}>Database Error</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(252,165,165,0.7)' }}>{authError}</p>
            <button className="premium-btn btn-secondary" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Logo className="w-10 h-10 mb-6 animate-pulse-glow" />
            <div className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--color-ink-faint)' }}>Initializing Workspace…</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ color: 'var(--color-ink)' }}>
      {/* ── Sidebar ── */}
      <aside className="w-60 flex flex-col border-r" style={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-hairline)' }}>
        <div className="h-14 flex items-center px-5 border-b" style={{ borderColor: 'var(--color-hairline)' }}>
          <div className="flex items-center gap-2.5">
            <Logo className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>BidForge</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={pathname === "/"} onClick={() => router.push("/")} />
          <NavItem icon={FolderKanban} label="Projects" active={pathname === "/projects"} onClick={() => router.push("/projects")} />
          <NavItem icon={Users} label="Clients" active={pathname === "/clients"} onClick={() => router.push("/clients")} />
          <NavItem icon={BarChart3} label="Analytics" active={pathname === "/analytics"} onClick={() => router.push("/analytics")} />
        </div>
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
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
            className="w-full mt-3 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--color-accent-muted)',
              color: '#a5b4fc',
              border: '1px solid rgba(94,106,210,0.2)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(94,106,210,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-muted)'}
          >
            <Sparkles size={13} /> Upgrade to Pro
          </button>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full mt-2 py-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--color-ink-faint)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-ink)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-ink-faint)'}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 border-b shrink-0"
          style={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-hairline)' }}>
          <h1 className="text-sm font-medium capitalize" style={{ color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
            {pathname === "/" ? "Create New Proposal" : pathname.substring(1)}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ backgroundColor: 'var(--color-surface-3)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-hairline)' }}>
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[13px]" style={{ color: 'var(--color-ink-muted)' }}>{session.user.email}</span>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 relative" style={{ backgroundColor: 'var(--color-canvas)' }}>
          {children}
        </div>
      </main>

      <Toaster 
        theme="dark" 
        position="bottom-right"
        toastOptions={{
          style: {
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-ink)',
          }
        }}
      />
    </div>
  );
}
