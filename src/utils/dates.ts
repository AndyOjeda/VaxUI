/** Días restantes del mes (incluye hoy). Para meses pasados devuelve 1. */
export function daysLeftInMonth(year: number, month: number, now = new Date()): number {
  const lastDay = new Date(year, month, 0).getDate();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 1;
  }
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) {
    return lastDay;
  }
  return Math.max(1, lastDay - now.getDate() + 1);
}

export function dailyTarget(remaining: number, year: number, month: number, now = new Date()): number {
  const days = daysLeftInMonth(year, month, now);
  return remaining > 0 ? remaining / days : 0;
}
