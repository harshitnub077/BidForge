"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

interface GlassToggleProps {
  isOn: boolean;
  onToggle: () => void;
  isThemeToggle?: boolean;
}

export function GlassToggle({ isOn, onToggle, isThemeToggle }: GlassToggleProps) {
  return (
    <div
      className="relative flex items-center cursor-pointer w-[60px] h-8 rounded-full p-1 shrink-0 overflow-hidden"
      onClick={onToggle}
      style={{
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-hairline)",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.1), inset 0 -1px 1px rgba(255,255,255,0.5)",
      }}
    >
      {/* Active Glow Background inside track */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{
          opacity: isOn && !isThemeToggle ? 1 : 0,
          background: "linear-gradient(90deg, rgba(45,212,191,0.2) 0%, transparent 100%)",
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Theme Toggle Track Backgrounds */}
      {isThemeToggle && (
        <>
          <motion.div
            className="absolute inset-0 bg-blue-900/20"
            initial={false}
            animate={{ opacity: isOn ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.div
            className="absolute inset-0 bg-amber-400/10"
            initial={false}
            animate={{ opacity: isOn ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          />
        </>
      )}

      <motion.div
        className="w-6 h-6 rounded-full flex items-center justify-center relative z-10 overflow-hidden"
        initial={false}
        animate={{
          x: isOn ? 28 : 0,
          rotate: isOn ? 360 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        style={{
          backgroundColor: isThemeToggle ? (isOn ? "rgba(10, 10, 15, 0.9)" : "rgba(255, 255, 255, 0.9)") : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid var(--color-hairline)",
          boxShadow: isOn && !isThemeToggle
            ? "inset 0 3px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(0,0,0,0.05), 0 0 12px rgba(45, 212, 191, 0.4)"
            : "inset 0 3px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        {isThemeToggle ? (
          <AnimatePresence mode="wait">
            {isOn ? (
              <motion.div
                key="moon"
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-300 fill-indigo-400/30" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400/50" />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="absolute top-[15%] left-[20%] w-[30%] h-[30%] bg-white rounded-full opacity-60 blur-[1px]"></div>
        )}
      </motion.div>
    </div>
  );
}
