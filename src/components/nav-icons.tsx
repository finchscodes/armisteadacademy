export function GradingIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 11.5l2 2 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 16h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SocialIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8.5" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 18.5c0-2.9 2.24-5 5-5s5 2.1 5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 15.3c2.35.35 3.9 2 3.9 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BellIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5c-2.9 0-5 2.24-5 5.25v2.85c0 .7-.28 1.37-.78 1.87l-.9.9a1 1 0 0 0 .7 1.7h11.96a1 1 0 0 0 .7-1.7l-.9-.9c-.5-.5-.78-1.17-.78-1.87V8.75c0-3.01-2.1-5.25-5-5.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.75 19a2.3 2.3 0 0 0 4.5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
