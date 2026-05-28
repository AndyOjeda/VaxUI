import type { MonthOverview } from '../types';

const GOAL_BASE = 2_000_000;

/** Mes inicial visible en Metas: mes actual si es el año en curso; enero si es otro año. */
export function goalsVisibleFromMonth(year: number, now = new Date()): number {
  const currentYear = now.getFullYear();
  if (year < currentYear) return 1;
  if (year > currentYear) return 1;
  return now.getMonth() + 1;
}

export function buildMonthsRange(
  year: number,
  fromMonth: number,
  toMonth: number,
  data: MonthOverview[],
): MonthOverview[] {
  const byMonth = new Map(data.map((m) => [m.month, m]));
  const start = Math.max(1, Math.min(fromMonth, 12));
  const end = Math.max(start, Math.min(toMonth, 12));
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const month = start + i;
    const existing = byMonth.get(month);
    if (existing) return existing;
    const suggested = String(GOAL_BASE);
    return {
      month,
      year,
      label: `${month}/${year}`,
      profit: '0',
      margin_percent: '0',
      sales_count: 0,
      payments_total: '0',
      payments_pending: '0',
      base_profit: String(GOAL_BASE),
      suggested_goal: suggested,
      goal_id: null,
      business_id: null,
      target_amount: suggested,
      remaining: suggested,
      percent_complete: '0',
      is_custom_goal: false,
    };
  });
}

/** @deprecated Usar buildMonthsRange para Metas */
export function buildTwelveMonths(year: number, data: MonthOverview[]): MonthOverview[] {
  return buildMonthsRange(year, 1, 12, data);
}
