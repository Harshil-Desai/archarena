interface ChipProps {
  tone?: "default" | "accent" | "easy" | "med" | "hard";
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Chip({ tone = "default", children, style }: ChipProps) {
  const cls = tone === "accent" ? "chip chip-accent"
    : tone === "easy" ? "chip chip-easy"
    : tone === "med"  ? "chip chip-med"
    : tone === "hard" ? "chip chip-hard"
    : "chip";
  return <span className={cls} style={style}>{children}</span>;
}
