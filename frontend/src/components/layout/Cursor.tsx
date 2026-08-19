"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip on touch/coarse devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    gsap.set(follower, { xPercent: -50, yPercent: -50 });

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const mouse = { x: pos.x, y: pos.y };
    const speed = 0.2;

    const xSet = gsap.quickSetter(cursor, "x", "px");
    const ySet = gsap.quickSetter(cursor, "y", "px");
    const xSetFollower = gsap.quickSetter(follower, "x", "px");
    const ySetFollower = gsap.quickSetter(follower, "y", "px");

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      xSet(mouse.x);
      ySet(mouse.y);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const tickerCallback = () => {
      const dt = 1.0 - Math.pow(1.0 - speed, gsap.ticker.deltaRatio());
      pos.x += (mouse.x - pos.x) * dt;
      pos.y += (mouse.y - pos.y) * dt;
      xSetFollower(pos.x);
      ySetFollower(pos.y);
    };

    gsap.ticker.add(tickerCallback);

    // Event delegation for hover states
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a, button, input, select, textarea, [role='button'], .cursor-pointer");
      if (target) {
        gsap.to(cursor, { scale: 1.5, duration: 0.25 });
        gsap.to(follower, { scale: 0.5, opacity: 0, duration: 0.25 });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a, button, input, select, textarea, [role='button'], .cursor-pointer");
      if (target) {
        gsap.to(cursor, { scale: 1, duration: 0.25 });
        gsap.to(follower, { scale: 1, opacity: 1, duration: 0.25 });
      }
    };

    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseout", handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      gsap.ticker.remove(tickerCallback);
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-screen shadow-[0_0_10px_white]"
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-8 h-8 border border-white/20 rounded-full pointer-events-none z-[9998] backdrop-blur-[2px]"
      />
    </>
  );
}

