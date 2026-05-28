import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'light' | 'dark' | 'accent';
  trend?: string;
  onClick?: () => void;
}

export function KpiCard({ title, value, subtitle, icon: Icon, variant = 'light', trend, onClick }: KpiCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`card kpi-card kpi-${variant} ${onClick ? 'clickable-card' : ''}`}
      onClick={onClick}
    >
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon-wrap">
          <Icon size={18} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      {trend && <div className="kpi-trend">{trend}</div>}
      {onClick && <div className="kpi-hint">Ver detalle →</div>}
    </Tag>
  );
}
