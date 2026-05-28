import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line,
} from 'recharts';
import { formatCurrency, formatMonthYear } from '../utils/format';
import type { MonthInvestmentSummary, MonthlySalesStat } from '../types';
import './DashboardPage.css';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <span className="chart-tooltip-label">{label}</span>}
      {payload.map((p) => (
        <strong key={p.name}>{formatCurrency(Number(p.value ?? 0))}</strong>
      ))}
    </div>
  );
}

interface DashboardChartsProps {
  monthly: MonthlySalesStat[];
  investment: MonthInvestmentSummary | null;
  month: number;
  year: number;
}

export function DashboardCharts({ monthly, investment, month, year }: DashboardChartsProps) {
  const investmentChart = investment
    ? [
        { name: 'Invertido', value: parseFloat(investment.total_cost) },
        { name: 'Ganancia', value: parseFloat(investment.total_profit) },
      ]
    : [];
  const investmentMargin = investment ? parseFloat(investment.margin_percent) : 0;

  return (
    <div className="charts-grid">
      <div className="card chart-card">
        <div className="chart-card-header">
          <h3 className="section-title">Ganancia mensual</h3>
          <span className="chart-badge">Últimos 6 meses</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-orange)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-orange)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={48} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="profit" stroke="var(--chart-orange)" strokeWidth={3} fill="url(#profitGrad)" dot={false} activeDot={{ r: 6, fill: 'var(--chart-orange)', stroke: '#fff', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="profit" stroke="var(--chart-orange-light)" strokeWidth={1} dot={false} strokeDasharray="4 4" opacity={0.4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <div className="chart-card-header chart-card-header--split">
          <h3 className="section-title">Invertido vs Ganancia</h3>
          <div className="chart-header-right">
            <span className="chart-margin-pct">{investmentMargin.toFixed(1)}%</span>
            <span className="chart-month-label">{formatMonthYear(month, year)}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={investmentChart} barCategoryGap="35%">
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8a8a9a" />
                <stop offset="100%" stopColor="#5a5a6a" />
              </linearGradient>
              <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-orange-light)" />
                <stop offset="100%" stopColor="var(--chart-orange)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={48} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
              {investmentChart.map((entry) => (
                <Cell key={entry.name} fill={entry.name === 'Ganancia' ? 'url(#gainGrad)' : 'url(#invGrad)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="pie-legend">
          <span><i style={{ background: '#8a8a9a' }} /> Invertido: {formatCurrency(investment?.total_cost ?? 0)}</span>
          <span><i style={{ background: 'var(--chart-orange)' }} /> Ganancia: {formatCurrency(investment?.total_profit ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}
