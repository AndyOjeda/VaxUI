import './ProgressRing.css';

interface ProgressRingProps {
  percent: number;
  size?: number;
  label?: string;
}

export function ProgressRing({ percent, size = 72, label }: ProgressRingProps) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(percent, 0), 100);
  const offset = c - (pct / 100) * c;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring-label">
        <strong>{pct.toFixed(0)}%</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
