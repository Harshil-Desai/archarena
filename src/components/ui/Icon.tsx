"use client";

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, strokeWidth = 1.6, className = "", style = {} }: IconProps) {
  const s = size;
  const p = {
    width: s, height: s, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, className, style,
  };
  switch (name) {
    case "arrow-right":    return <svg {...p}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>;
    case "arrow-up-right": return <svg {...p}><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>;
    case "check":          return <svg {...p}><path d="M20 6L9 17l-5-5"/></svg>;
    case "x":              return <svg {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case "play":           return <svg {...p}><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg>;
    case "pause":          return <svg {...p}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>;
    case "lock":           return <svg {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>;
    case "sparkles":       return <svg {...p}><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z"/><path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/></svg>;
    case "bolt":           return <svg {...p}><path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z"/></svg>;
    case "clock":          return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "trophy":         return <svg {...p}><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 4h3v3a3 3 0 01-3 3M7 4H4v3a3 3 0 003 3"/></svg>;
    case "chart":          return <svg {...p}><path d="M3 3v18h18"/><path d="M7 15l4-4 4 4 5-6"/></svg>;
    case "history":        return <svg {...p}><path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.5"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/></svg>;
    case "home":           return <svg {...p}><path d="M3 10l9-7 9 7v10a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2V10z"/></svg>;
    case "settings":       return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1A1.7 1.7 0 008 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H2a2 2 0 010-4h.1A1.7 1.7 0 003.6 8a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H8a1.7 1.7 0 001-1.5V2a2 2 0 014 0v.1A1.7 1.7 0 0014 3.6a1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V8a1.7 1.7 0 001.5 1H22a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    case "menu":           return <svg {...p}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
    case "chat":           return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    case "database":       return <svg {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></svg>;
    case "server":         return <svg {...p}><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 8h.01M7 17h.01"/></svg>;
    case "globe":          return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>;
    case "cube":           return <svg {...p}><path d="M12 3l9 5v8l-9 5-9-5V8l9-5z"/><path d="M3 8l9 5 9-5M12 13v10"/></svg>;
    case "queue":          return <svg {...p}><rect x="3" y="5" width="5" height="14" rx="1"/><rect x="10" y="5" width="5" height="14" rx="1"/><rect x="17" y="5" width="4" height="14" rx="1"/></svg>;
    case "filter":         return <svg {...p}><path d="M4 5h16l-6 8v5l-4 2v-7L4 5z"/></svg>;
    case "shield":         return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/></svg>;
    case "mic":            return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 19v3"/></svg>;
    case "search":         return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case "grid":           return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "plus":           return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "minus":          return <svg {...p}><path d="M5 12h14"/></svg>;
    case "focus":          return <svg {...p}><path d="M4 4h4M16 4h4M4 20h4M16 20h4M4 4v4M20 4v4M4 16v4M20 16v4"/></svg>;
    case "send":           return <svg {...p}><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>;
    case "copy":           return <svg {...p}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
    case "share":          return <svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>;
    case "download":       return <svg {...p}><path d="M12 3v13M5 12l7 7 7-7M5 21h14"/></svg>;
    case "spark":          return <svg {...p}><path d="M3 17l5-5 4 4 9-9"/></svg>;
    case "rewind":         return <svg {...p}><path d="M11 19L2 12l9-7v14z"/><path d="M22 19V5l-9 7 9 7z"/></svg>;
    case "user":           return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
    case "sun":            return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "moon":           return <svg {...p}><path d="M21 13a9 9 0 11-10-10 7 7 0 0010 10z"/></svg>;
    case "logo":           return (
      <svg {...p}>
        <path d="M4 20L12 4l8 16"/>
        <path d="M7.5 14h9"/>
        <circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="4"  cy="20" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="20" cy="20" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    );
    case "github": return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} style={style}>
        <path d="M12 .5C5.73.5.9 5.34.9 11.62c0 4.9 3.16 9.05 7.55 10.52.55.1.75-.24.75-.53v-1.86c-3.07.67-3.72-1.48-3.72-1.48-.5-1.28-1.23-1.62-1.23-1.62-1-.7.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15 1 1.72 2.62 1.22 3.26.93.1-.74.4-1.22.72-1.5-2.45-.28-5.03-1.23-5.03-5.47 0-1.2.43-2.2 1.14-2.97-.11-.28-.5-1.4.1-2.93 0 0 .93-.3 3.05 1.13a10.55 10.55 0 015.55 0c2.12-1.43 3.05-1.13 3.05-1.13.6 1.53.22 2.65.1 2.93.72.77 1.14 1.77 1.14 2.97 0 4.25-2.59 5.18-5.05 5.46.4.35.76 1.03.76 2.08v3.08c0 .3.2.63.76.52A11.13 11.13 0 0023.1 11.62C23.1 5.34 18.27.5 12 .5z"/>
      </svg>
    );
    case "google": return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} style={style}>
        <path d="M22 12.2c0-.8-.07-1.37-.22-1.97H12v3.58h5.75c-.12.98-.77 2.45-2.22 3.44l-.02.13 3.22 2.5.22.02C20.97 17.77 22 15.2 22 12.2z" fill="#4285F4"/>
        <path d="M12 22c2.92 0 5.37-.96 7.15-2.6l-3.4-2.65c-.9.64-2.13 1.08-3.75 1.08a6.5 6.5 0 01-6.14-4.5l-.13.02-3.34 2.6-.05.12C4.13 19.58 7.77 22 12 22z" fill="#34A853"/>
        <path d="M5.86 13.33A6.5 6.5 0 015.5 12c0-.46.08-.91.19-1.33L5.67 10.5 2.29 7.88l-.11.05a10 10 0 000 8.14l3.68-2.74z" fill="#FBBC05"/>
        <path d="M12 5.38c2.07 0 3.46.9 4.26 1.64l3.11-3.03C17.37 2.26 14.92 1.25 12 1.25 7.77 1.25 4.13 3.67 2.18 7.93l3.67 2.74A6.53 6.53 0 0112 5.38z" fill="#EA4335"/>
      </svg>
    );
    default: return <svg {...p}><circle cx="12" cy="12" r="3"/></svg>;
  }
}
