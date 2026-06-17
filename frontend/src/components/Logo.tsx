export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Glow Definition */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#3f3f46" />
        </linearGradient>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
      </defs>

      {/* Anvil Base (Minimalist Geometric) */}
      <path 
        d="M50 80 L30 80 Q20 80 25 95 L40 130 C45 145 60 150 80 150 L120 150 C140 150 155 145 160 130 L175 95 Q180 80 170 80 L150 80" 
        stroke="url(#primaryGrad)" 
        strokeWidth="12" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="transparent"
      />
      {/* Anvil Top Plate */}
      <path 
        d="M20 70 L180 70" 
        stroke="url(#primaryGrad)" 
        strokeWidth="16" 
        strokeLinecap="round" 
      />

      {/* AI Spark (Star/Node) */}
      <g transform="translate(100, 35) scale(0.6)">
        <path 
          d="M0 -40 L10 -10 L40 0 L10 10 L0 40 L-10 10 L-40 0 L-10 -10 Z" 
          fill="url(#sparkGrad)"
          filter="url(#glow)"
        />
      </g>
    </svg>
  );
}
