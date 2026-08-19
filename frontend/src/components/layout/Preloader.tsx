"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Sparkles } from "lucide-react";

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isDone, setIsDone] = useState(true); // Default true to prevent SSR block

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Run only once per browser session
    const hasLoaded = sessionStorage.getItem("bidforge_preloader_seen");
    if (hasLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDone(true);
      return;
    }

    setIsDone(false);

    // Hard safety fallback timer to ensure screen is never stuck
    const safetyTimer = setTimeout(() => {
      sessionStorage.setItem("bidforge_preloader_seen", "true");
      setIsDone(true);
    }, 1800);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem("bidforge_preloader_seen", "true");
          setIsDone(true);
        }
      });

      // Quick cinematic boot sequence
      tl.fromTo(
        textRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.1 }
      )
      .to(textRef.current, {
        y: -15,
        opacity: 0,
        duration: 0.35,
        ease: "power3.in"
      }, "+=0.2")
      .to(containerRef.current, {
        y: "-100%",
        duration: 0.5,
        ease: "expo.inOut"
      });
    }, containerRef);

    return () => {
      clearTimeout(safetyTimer);
      ctx.revert();
    };
  }, []);

  if (isDone) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#050505] pointer-events-none"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
      <div 
        ref={textRef} 
        className="flex items-center gap-3 text-white font-heading text-lg md:text-xl tracking-widest uppercase opacity-0"
      >
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
        <span>Forging Intelligence</span>
      </div>
    </div>
  );
}

