export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Forward-pointing Arrow / Chevron (Dark/Light adaptive) */}
      <path 
        d="M40 30 L110 30 L180 100 L110 170 L40 170 L110 100 Z" 
        fill="var(--color-ink)" 
      />
      
      {/* Interlocking Accent Triangle (Vercel Blue) */}
      <path 
        d="M40 30 L110 100 L40 170 Z" 
        fill="var(--color-accent)" 
      />
    </svg>
  );
}
