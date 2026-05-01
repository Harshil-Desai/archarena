import { Icon } from "./Icon";

interface LogoProps {
  size?: number;
  showWord?: boolean;
}

export function Logo({ size = 22, showWord = true }: LogoProps) {
  return (
    <div className="row gap-2" style={{ alignItems: "center" }}>
      <div style={{
        width: size + 4, height: size + 4,
        borderRadius: 7,
        display: "grid", placeItems: "center",
        background: "linear-gradient(135deg, color-mix(in oklch, var(--accent) 40%, var(--bg-2)), var(--bg-2))",
        border: "1px solid var(--line-2)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.3)",
        color: "var(--text-1)",
      }}>
        <Icon name="logo" size={size - 6} strokeWidth={1.8} />
      </div>
      {showWord && (
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, letterSpacing: "-0.01em", lineHeight: 1 }}>
          Arch<em style={{ fontStyle: "italic", color: "var(--accent)" }}>Arena</em>
        </span>
      )}
    </div>
  );
}
