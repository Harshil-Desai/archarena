interface VendorGlyphProps {
  id: string;
  size?: number;
  color?: string;
}

export function VendorGlyph({ id, size = 20, color }: VendorGlyphProps) {
  const s = size;
  const p = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", style: { color } };
  switch (id) {
    case "postgres":
      return <svg {...p}><path d="M6 6c0-2 2-3 4-3s3 1 3 1 1-1 3-1 4 1 4 3c0 2-1 3-1 5s1 3 1 5-1 4-3 4c-1 0-2-1-2-1s-1 2-3 2c-2 0-2-2-2-2s-1 1-2 1c-3 0-4-2-4-5s2-4 2-6-1-2-1-3z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="9" r="0.8" fill="currentColor"/></svg>;
    case "mysql":
      return <svg {...p}><path d="M3 13c2-4 6-5 9-5 4 0 6 2 8 4 1 1 1 2 0 3-2 0-3-1-4-2M4 15c2 2 5 3 8 3 3 0 5-1 6-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="16" cy="11" r="0.9" fill="currentColor"/></svg>;
    case "redis":
      return <svg {...p}><path d="M12 3l8 3.5-8 3.5-8-3.5L12 3z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3"/><path d="M4 11l8 3.5 8-3.5M4 15l8 3.5 8-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case "memcached":
      return <svg {...p}><rect x="4" y="6" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="4" y="12" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.2"/><circle cx="7" cy="8" r="0.6" fill="currentColor"/><circle cx="7" cy="14" r="0.6" fill="currentColor"/></svg>;
    case "cassandra":
      return <svg {...p}><path d="M12 3v18M4 7l16 10M4 17l16-10" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor"/></svg>;
    case "mongo":
      return <svg {...p}><path d="M12 3c3 4 5 7 5 11 0 4-2 7-5 7s-5-3-5-7c0-4 2-7 5-11zM12 3v18" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15"/></svg>;
    case "dynamo":
      return <svg {...p}><ellipse cx="12" cy="5" rx="8" ry="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5v14c0 1.4 3.5 2.5 8 2.5s8-1.1 8-2.5V5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 10l2 2 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case "kafka":
      return <svg {...p}><circle cx="6" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.2"/><circle cx="6" cy="17" r="2" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.2"/><circle cx="18" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.3"/><path d="M8 7l8 4M8 17l8-4" stroke="currentColor" strokeWidth="1.2"/></svg>;
    case "rabbit":
      return <svg {...p}><path d="M6 4v5a3 3 0 003 3M12 4v5a3 3 0 01-3 3M9 12v8a1 1 0 001 1h9a1 1 0 001-1V6a2 2 0 00-2-2h-2v8H9z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15"/></svg>;
    case "kinesis":
      return <svg {...p}><path d="M3 8c3-3 5 3 8 0s5 3 8 0M3 14c3-3 5 3 8 0s5 3 8 0M3 20c3-3 5 3 8 0s5 3 8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
    case "lambda":
      return <svg {...p}><path d="M5 4h4l7 17M12 13l-5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
    case "ec2":
      return <svg {...p}><path d="M12 3l8 4v10l-8 4-8-4V7l8-4z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15"/><path d="M4 7l8 4 8-4M12 11v10" stroke="currentColor" strokeWidth="1.2"/></svg>;
    case "k8s":
      return <svg {...p}><path d="M12 2l8 4v8l-8 6-8-6V6l8-4z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15"/><path d="M12 7l5 3-1.5 5.5h-7L7 10l5-3z" stroke="currentColor" strokeWidth="1.1"/></svg>;
    case "nginx":
      return <svg {...p}><path d="M6 20V4l12 16V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "cloudflare":
      return <svg {...p}><path d="M5 16a4 4 0 014-4 5 5 0 0110 1 3 3 0 010 6H7a3 3 0 01-2-3z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round"/></svg>;
    case "cdn":
      return <svg {...p}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2"/><path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/></svg>;
    case "apigw":
      return <svg {...p}><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.2"/><rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.2"/><rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>;
    case "varnish":
      return <svg {...p}><path d="M4 6l8-2 8 2v6c0 4-3 7-8 9-5-2-8-5-8-9V6z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15"/></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.3"/></svg>;
  }
}
