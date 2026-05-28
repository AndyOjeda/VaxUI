import { api } from '../services/api';
import type { Payment } from '../types';

function sortPayments(list: Payment[]) {
  const pending = list.filter((p) => p.status !== 'paid').sort((a, b) => a.due_date.localeCompare(b.due_date));
  const paid = list.filter((p) => p.status === 'paid').sort((a, b) => a.due_date.localeCompare(b.due_date));
  return [...pending, ...paid];
}

const paymentsCache = new Map<string, Payment[]>();
let recurringPromise: Promise<Set<string>> | null = null;

export function cacheKey(month: number, year: number) {
  return `${year}-${month}`;
}

export function getCachedPayments(month: number, year: number) {
  return paymentsCache.get(cacheKey(month, year));
}

export function invalidatePaymentsCache() {
  paymentsCache.clear();
  recurringPromise = null;
}

export async function fetchRecurringConcepts(): Promise<Set<string>> {
  if (!recurringPromise) {
    recurringPromise = api.get<Payment[]>('/api/payments/recurring').then(
      (r) => new Set(r.map((x) => x.concept)),
    );
  }
  return recurringPromise;
}

export async function fetchPaymentsMonth(month: number, year: number): Promise<Payment[]> {
  const key = cacheKey(month, year);
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  const list = await api.get<Payment[]>(`/api/payments?${params}`);
  const sorted = sortPayments(list);
  paymentsCache.set(key, sorted);
  return sorted;
}

export function prefetchPaymentsMonth(month: number, year: number) {
  const key = cacheKey(month, year);
  if (paymentsCache.has(key)) return;
  fetchPaymentsMonth(month, year).catch(() => {});
}

export function shiftMonth(month: number, year: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function prefetchAdjacentMonths(month: number, year: number) {
  const prev = shiftMonth(month, year, -1);
  const next = shiftMonth(month, year, 1);
  prefetchPaymentsMonth(prev.month, prev.year);
  prefetchPaymentsMonth(next.month, next.year);
}

export { sortPayments };
