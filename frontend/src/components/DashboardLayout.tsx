"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";
import { Logo } from "@/components/Logo";
import { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { 
  FileEdit, 
  FolderKanban, 
  Users, 
  BarChart3, 
  LogOut, 
  Plus,
  ShieldCheck,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from "gsap";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
      lerp: 0.08, 
      wheelMultiplier: 1.0,
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [pathname]);

  const fetchOrgId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        setOrgId(userId);
      } else if (data?.org_id) {
        setOrgId(data.org_id);
      } else {
        setOrgId(userId);
      }
    } catch {
      setOrgId(userId);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    document.documentElement.setAttribute('data-theme', 'dark');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchOrgId(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchOrgId(session.user.id);
      } else {
        setOrgId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (mounted && session && orgId) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".content-anim",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", clearProps: "all" }
        );
        // Animate all surface-cards nicely
        gsap.fromTo(".surface-card",
          { opacity: 0, y: 30, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: "power4.out", delay: 0.1, clearProps: "all" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [mounted, session, orgId]);

  if (!mounted) return null;
  if (!session) return <Auth />;

  if (!orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4 bg-[#09090b]">
        <div className="flex flex-col items-center">
          <Logo className="w-10 h-10 mb-4" />
          <div className="text-xs font-mono tracking-wider uppercase text-zinc-400 animate-pulse">Initializing Workspace...</div>
        </div>
      </div>
    );
  }

  const navigateTo = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Proposal Studio", path: "/", icon: FileEdit },
    { label: "Proposals Repository", path: "/projects", icon: FolderKanban },
    { label: "Client Accounts", path: "/clients", icon: Users },
    { label: "Revenue Analytics", path: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#09090b] text-[#f4f4f5] antialiased" ref={containerRef}>
      
      {/* Top Enterprise Navigation Header */}
      <header className="h-14 border-b border-[#27272a] bg-[#0c0c0e] z-50 shrink-0 px-4 md:px-6 flex items-center justify-between">
        
        {/* Left: Organization & Logo */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigateTo("/")}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <Logo className="w-6 h-6" />
            <span className="font-semibold text-sm text-white tracking-tight">BidForge</span>
          </div>

          <div className="h-4 w-px bg-[#27272a] hidden sm:block" />

          {/* Org Selector Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-xs font-medium text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="truncate max-w-[120px]">Enterprise Workspace</span>
            <ChevronDown size={12} className="text-zinc-500" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {navLinks.map((link) => {
              const active = pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigateTo(link.path)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                    active 
                      ? "bg-[#18181b] text-white border border-[#27272a]" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]"
                  }`}
                >
                  <link.icon size={13} className={active ? "text-white" : "text-zinc-400"} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions, Compliance & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Security Status */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-[#121215] border border-[#27272a]">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>SOC2 Verified</span>
          </div>

          {/* New Proposal Shortcut Button */}
          <button 
            onClick={() => navigateTo("/")}
            className="px-3 py-1.5 rounded-md bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus size={13} className="stroke-[2.5]" />
            <span className="hidden sm:inline">New Proposal</span>
          </button>


          {/* Sign Out */}
          <button 
            onClick={() => supabase.auth.signOut()}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={15} />
          </button>

          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-[#27272a] bg-[#0c0c0e] px-4 py-3 flex flex-col gap-1 z-40"
          >
            {navLinks.map((link) => {
              const active = pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigateTo(link.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-left transition-colors ${
                    active ? "bg-[#18181b] text-white font-semibold" : "text-zinc-400 hover:text-white hover:bg-[#121215]"
                  }`}
                >
                  <link.icon size={15} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Deep Aesthetic Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="radial-glow"></div>
          <div className="absolute inset-0 animated-grid-bg opacity-30"></div>
        </div>

        <div id="scroll-wrapper" className="flex-1 overflow-y-auto relative z-10 w-full h-full">
          <div id="scroll-content" className="min-h-full pb-16 w-full px-4 md:px-8 content-anim">
            <div className="max-w-7xl mx-auto pt-6">
              {children}
            </div>
          </div>
        </div>
      </main>

      <Toaster 
        theme="dark" 
        position="bottom-right"
        toastOptions={{
          style: {
            backgroundColor: '#121215',
            border: '1px solid #27272a',
            color: '#f4f4f5',
            borderRadius: '8px',
            fontSize: '12.5px'
          }
        }}
      />
    </div>
  );
}
