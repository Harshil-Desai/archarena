export function NodeFragment({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 80" style={{ width: "100%", height: "auto", opacity: 0.55, ...style }} fill="none">
      <line x1="40" y1="40" x2="80" y2="40" stroke="url(#g1)" strokeWidth="1" strokeDasharray="3 3"/>
      <line x1="120" y1="40" x2="160" y2="40" stroke="url(#g1)" strokeWidth="1" strokeDasharray="3 3"/>
      <circle cx="30" cy="40" r="5" fill="var(--bg-3)" stroke="var(--line-3)"/>
      <rect x="85" y="28" width="30" height="24" rx="4" fill="var(--bg-3)" stroke="var(--accent)" strokeOpacity="0.6"/>
      <circle cx="170" cy="40" r="5" fill="var(--bg-3)" stroke="var(--signal)" strokeOpacity="0.6"/>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.2"/>
          <stop offset="1" stopColor="var(--signal)" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
