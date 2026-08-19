export function Logo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="7" fill="#ffffff" />
      <path 
        d="M9 9H17.5C19.9853 9 22 11.0147 22 13.5C22 15.9853 19.9853 18 17.5 18H9V9Z" 
        fill="#09090b" 
      />
      <path 
        d="M9 16H18.5C20.9853 16 23 18.0147 23 20.5C23 22.9853 20.9853 25 18.5 25H9V16Z" 
        fill="#09090b" 
        fillOpacity="0.85"
      />
    </svg>
  );
}
