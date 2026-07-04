// Lok Mandate emblem: a red "ballot check" badge. The white check on a red
// badge reads as a cast/verified vote — i.e. the people's mandate — and works
// on both light (masthead) and dark (footer) backgrounds.
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Lok Mandate">
      <rect x="2" y="2" width="44" height="44" rx="11" fill="#dc2626" />
      <path
        d="M13.5 24.5l6.5 6.5L34.5 16.5"
        fill="none"
        stroke="#fff"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
