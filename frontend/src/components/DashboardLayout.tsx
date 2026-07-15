"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";
import { Logo } from "@/components/Logo";
import { GlassToggle } from "@/components/ui/GlassToggle";
import { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, FolderKanban, Users, BarChart3, Settings, Sparkles, PanelLeftClose, PanelLeftOpen, Search
} from "lucide-react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active = false, onClick, isCollapsed = false }: NavItemProps & { isCollapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-lg text-[13px] font-medium transition-all duration-150`}
      style={{
        backgroundColor: active ? 'var(--color-surface-2)' : 'transparent',
        color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        border: active ? '1px solid var(--color-hairline)' : '1px solid transparent',
      }}
      title={isCollapsed ? label : undefined}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-ink)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted)'; } }}
    >
      <Icon size={16} style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-faint)' }} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);
  
  const pathname = usePathname();
  const router = useRouter();

  // Lenis Smooth Scroll Setup
  useEffect(() => {
    const wrapper = document.getElementById('scroll-wrapper');
    const content = document.getElementById('scroll-content');
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper: wrapper,
      content: content,
      lerp: 0.08, // Adjust for how "buttery" the scroll is (lower is smoother)
      wheelMultiplier: 1.2,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [pathname]); // Re-init on page change if necessary, or just run once

  const fetchOrgId = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('org_id').eq('id', userId).single();
    if (error) setAuthError(error.message);
    else if (data) setOrgId(data.org_id);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <motion.aside 
        id="sidebar-navigation"
        aria-label="Sidebar"
        initial={false}
        animate={{ width: isCollapsed ? 68 : 240 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="flex flex-col border-r shrink-0 overflow-hidden" 
        style={{ 
          backgroundColor: 'var(--color-surface-1)', 
          borderColor: 'var(--color-hairline)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)'
        }}
      >
        <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'px-5'} border-b shrink-0`} style={{ borderColor: 'var(--color-hairline)' }}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Logo className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>BidForge</span>}
          </div>
        </div>
        <nav aria-label="Main Navigation" className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={pathname === "/"} onClick={() => router.push("/")} isCollapsed={isCollapsed} />
          <NavItem icon={FolderKanban} label="Projects" active={pathname === "/projects"} onClick={() => router.push("/projects")} isCollapsed={isCollapsed} />
          <NavItem icon={Users} label="Clients" active={pathname === "/clients"} onClick={() => router.push("/clients")} isCollapsed={isCollapsed} />
          <NavItem icon={BarChart3} label="Analytics" active={pathname === "/analytics"} onClick={() => router.push("/analytics")} isCollapsed={isCollapsed} />
        </nav>
        <div className="p-3 border-t shrink-0 flex flex-col items-center" style={{ borderColor: 'var(--color-hairline)' }}>
          <NavItem icon={Settings} label="Settings" isCollapsed={isCollapsed} />
          
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
            title={isCollapsed ? "Upgrade to Pro" : undefined}
            className={`w-full mt-3 py-2 ${isCollapsed ? 'px-0 justify-center' : 'px-3 justify-center gap-2'} rounded-lg text-xs font-semibold transition-all flex items-center`}
            style={{
              backgroundColor: 'var(--color-accent-muted)',
              color: '#a5b4fc',
              border: '1px solid rgba(94,106,210,0.2)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(94,106,210,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-muted)'}
          >
            <Sparkles size={13} className="shrink-0" /> {!isCollapsed && "Upgrade"}
          </button>

          <button 
            onClick={() => supabase.auth.signOut()}
            title={isCollapsed ? "Sign out" : undefined}
            className={`w-full mt-2 py-2 text-xs font-medium transition-colors ${isCollapsed ? 'text-center' : ''}`}
            style={{ color: 'var(--color-ink-faint)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-ink)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-ink-faint)'}
          >
            {isCollapsed ? "Out" : "Sign out"}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Topbar */}
        <div className="shrink-0 z-10 w-full bg-[var(--color-canvas)] border-b border-[var(--color-hairline)]">
          <header role="banner" className="h-14 flex items-center justify-between px-6 max-w-[1448px] mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-ink-muted)' }}
              aria-expanded={!isCollapsed}
              aria-controls="sidebar-navigation"
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--color-hairline)' }} />
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-medium" style={{ color: 'var(--color-ink-muted)' }}>BidForge Workspace</span>
              <span style={{ color: 'var(--color-ink-faint)' }}>/</span>
              <span className="font-medium" style={{ color: 'var(--color-ink)' }}>{pathname === "/" ? "New Proposal" : pathname.substring(1)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[var(--color-surface-1)] border border-[var(--color-hairline)] rounded-md px-2.5 py-1.5 text-xs w-48 shadow-inner hover:border-[var(--color-hairline-strong)] transition-colors cursor-text" style={{ color: 'var(--color-ink-muted)' }}>
              <Search size={14} style={{ color: 'var(--color-ink-faint)' }} />
              <span>Search projects...</span>
              <div className="ml-auto flex gap-1">
                <kbd className="rounded px-1 py-0.5 text-[9px] font-sans border shadow-sm" style={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-hairline)', color: 'var(--color-ink-faint)' }}>⌘</kbd>
                <kbd className="rounded px-1 py-0.5 text-[9px] font-sans border shadow-sm" style={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-hairline)', color: 'var(--color-ink-faint)' }}>K</kbd>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mr-2">
              <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: 'var(--color-ink-faint)' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              <GlassToggle isOn={isDark} onToggle={() => setIsDark(!isDark)} isThemeToggle />
            </div>

            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm cursor-pointer hover:ring-2 hover:ring-var(--color-ink-faint)/20 transition-all"
              style={{ backgroundColor: 'var(--color-surface-3)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-hairline)' }}>
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
          </header>
        </div>

        {/* Dynamic Content */}
        <div id="scroll-wrapper" className="flex-1 overflow-y-auto p-6 relative bg-transparent">
          <div id="scroll-content">
            {children}
          </div>
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
