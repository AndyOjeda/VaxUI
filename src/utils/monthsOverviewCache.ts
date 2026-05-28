import { api } from '../services/api';
import { goalsVisibleFromMonth } from './monthOverview';
import type { MonthOverview } from '../types';

const monthsCache = new Map<string, MonthOverview[]>();
const singleMonthCache = new Map<string, MonthOverview>();

function rangeKey(year: number, fromMonth: number) {
  return `${year}:${fromMonth}`;
}

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

export function getCachedMonthsOverview(year: number, fromMonth = 1) {
  return monthsCache.get(rangeKey(year, fromMonth));
}

export function getCachedMonthOverview(year: number, month: number) {
  return singleMonthCache.get(monthKey(year, month));
}

export function cacheMonthOverview(data: MonthOverview) {
  singleMonthCache.set(monthKey(data.year, data.month), data);
}

export function invalidateMonthsOverviewCache() {
  monthsCache.clear();
  singleMonthCache.clear();
}

export async function fetchMonthOverview(year: number, month: number): Promise<MonthOverview> {
  const data = await api.get<MonthOverview>(`/api/dashboard/months/${year}/${month}`);
  singleMonthCache.set(monthKey(year, month), data);
  return data;
}

export async function fetchMonthsOverview(
  year: number,
  fromMonth = goalsVisibleFromMonth(year),
): Promise<MonthOverview[]> {
  const params = new URLSearchParams({
    from_month: String(fromMonth),
    to_month: '12',
  });
  const data = await api.get<MonthOverview[]>(`/api/dashboard/months/${year}?${params}`);
  monthsCache.set(rangeKey(year, fromMonth), data);
  for (const m of data) {
    singleMonthCache.set(monthKey(year, m.month), m);
  }
  return data;
}

export function prefetchMonthsOverview(year?: number, fromMonth?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const from = fromMonth ?? goalsVisibleFromMonth(y, now);
  const key = rangeKey(y, from);
  if (monthsCache.has(key)) return;
  fetchMonthsOverview(y, from).catch(() => {});
}

export function prefetchCurrentMonthOverview() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = monthKey(year, month);
  if (singleMonthCache.has(key)) return;
  fetchMonthOverview(year, month).catch(() => {});
}
