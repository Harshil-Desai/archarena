interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="col" style={{ width: "100%", gap: 8 }}>
      {label && (
        <div className="row between" style={{ fontSize: 11, color: "var(--text-3)" }}>
          <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>{label}</span>
          <span className="mono" style={{ color: "var(--text-2)" }}>{value}</span>
        </div>
      )}
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
