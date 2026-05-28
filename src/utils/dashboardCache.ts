import { api } from '../services/api';
import { cacheMonthOverview } from './monthsOverviewCache';
import type { DashboardHome } from '../types';

const cache = new Map<string, DashboardHome>();
let inflight: Promise<DashboardHome> | null = null;

function homeKey(year: number, month: number) {
  return `${year}-${month}`;
}

export function getCachedDashboardHome(year?: number, month?: number): DashboardHome | undefined {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  return cache.get(homeKey(y, m));
}

export function invalidateDashboardCache() {
  cache.clear();
  inflight = null;
}

export async function fetchDashboardHome(
  year?: number,
  month?: number,
  opts?: { force?: boolean },
): Promise<DashboardHome> {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const key = homeKey(y, m);

  if (!opts?.force) {
    const hit = cache.get(key);
    if (hit) return hit;
    if (inflight) return inflight;
  }

  const request = api
    .get<DashboardHome>(`/api/dashboard/home?month=${m}&year=${y}`)
    .then((data) => {
      cache.set(key, data);
      cacheMonthOverview(data.month_goal);
      return data;
    })
    .finally(() => {
      if (inflight === request) inflight = null;
    });

  inflight = request;
  return request;
}

export function prefetchDashboardHome() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (cache.has(homeKey(y, m))) return;
  fetchDashboardHome(y, m).catch(() => {});
}
