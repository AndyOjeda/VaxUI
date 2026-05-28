import { api } from '../services/api';

export function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    num || 0,
  );
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthYear(month: number, year: number) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function formatPercent(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${(num || 0).toFixed(1)}%`;
}

/** Parsea "1.000.000" o "100000" a número */
export function parseMoneyInput(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '');
  return Number(cleaned) || 0;
}

/** Formatea número como "1.000.000" (es-CO sin símbolo) */
export function formatMoneyInput(value: number): string {
  if (!value) return '';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
}

export function formatMonthName(month: number) {
  const name = new Date(2000, month - 1, 1).toLocaleDateString('es-CO', { month: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function calcVentaDirecta(buyPrice: number, sellPrice: number) {
  const profit = sellPrice - buyPrice;
  const marginPercent = buyPrice > 0 ? (profit / buyPrice) * 100 : 0;
  return { profit, marginPercent };
}

export async function ensureDefaultBusiness(): Promise<number> {
  const list = await api.get<{ id: number }[]>('/api/businesses');
  if (list[0]) return list[0].id;
  const created = await api.post<{ id: number }>('/api/businesses', {
    name: 'Mi tienda de celulares',
    description: 'Compra, venta y cambio de celulares',
  });
  return created.id;
}
