// Lok Mandate emblem: the whorl of an inked voter's fingertip — India's most
// recognizable (and party-neutral) symbol of a cast vote, i.e. the mandate.
// Rings use currentColor so the mark adapts to light (masthead) and dark
// (footer) backgrounds; the core curl stays brand red.
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Lok Mandate" fill="none">
      <g stroke="currentColor" strokeWidth="2.7" strokeLinecap="round">
        <path d="M22.12 29.17 A5.5 5.5 0 1 1 25.88 29.17" />
        <path d="M20.58 33.40 A10 10 0 1 1 27.42 33.40" />
        <path d="M19.04 37.63 A14.5 14.5 0 1 1 28.96 37.63" />
        <path d="M17.50 41.86 A19 19 0 1 1 30.50 41.86" />
      </g>
      <path d="M24 16.5 q4.6 2.2 2 7" stroke="#dc2626" strokeWidth="2.7" strokeLinecap="round" fill="none" />
    </svg>
  );
}
