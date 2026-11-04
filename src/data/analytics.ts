// Funções puras sobre o Dataset. Sem React, sem efeitos colaterais: fáceis de testar e de trocar por API real.

import {
  CHANNELS,
  SEGMENTS,
  type Channel,
  type Customer,
  type Dataset,
  type DateRange,
  type Segment,
  type SortDir,
  type Transaction,
  type TxStatus,
} from '../types';
import { addDays, diffDays, isValidISO, shortDate } from '../lib/dates';
import { round2 } from '../lib/format';
import { normalizeText } from '../lib/text';

export type RangePreset = '7d' | '30d' | '90d' | '365d';

export const PRESET_DAYS: Record<RangePreset, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
export const PRESET_LABELS: Record<RangePreset, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  '365d': '12 meses',
};
export const MAX_CUSTOM_DAYS = 365;

export function presetRange(preset: RangePreset, anchor: string): DateRange {
  return { start: addDays(anchor, -(PRESET_DAYS[preset] - 1)), end: anchor };
}

export function rangeLength(range: DateRange): number {
  return diffDays(range.start, range.end) + 1;
}

export function inRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

/** Período imediatamente anterior, com a mesma duração, para comparação. */
export function previousRange(range: DateRange): DateRange {
  const length = rangeLength(range);
  return { start: addDays(range.start, -length), end: addDays(range.start, -1) };
}

export interface RangeValidation {
  ok: boolean;
  errors: { start?: string; end?: string; general?: string };
}

/** Valida um período personalizado com mensagens em português, prontas para exibir. */
export function validateCustomRange(
  start: string,
  end: string,
  bounds: { min: string; max: string },
): RangeValidation {
  const errors: RangeValidation['errors'] = {};
  if (!isValidISO(start)) errors.start = 'Informe uma data inicial válida.';
  if (!isValidISO(end)) errors.end = 'Informe uma data final válida.';

  if (!errors.start && !errors.end) {
    if (start > end) errors.general = 'A data inicial não pode ser posterior à final.';
    else if (diffDays(start, end) + 1 > MAX_CUSTOM_DAYS)
      errors.general = `O período máximo é de ${MAX_CUSTOM_DAYS} dias.`;
    else if (start < bounds.min || end > bounds.max)
      errors.general = `Os dados de demonstração vão de ${shortDate(bounds.min)} a ${shortDate(bounds.max)}.`;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

// ---------- KPIs ----------

export interface KpiSummary {
  revenue: number;
  orders: number;
  sessions: number;
  conversionRate: number;
  averageTicket: number;
  activeCustomers: number;
}

export function summarize(dataset: Dataset, range: DateRange): KpiSummary {
  let revenue = 0;
  let orders = 0;
  let sessions = 0;
  for (const day of dataset.daily) {
    if (!inRange(day.date, range)) continue;
    revenue += day.revenue;
    orders += day.orders;
    sessions += day.sessions;
  }
  const active = new Set<string>();
  for (const t of dataset.transactions) {
    if (t.status === 'Pago' && inRange(t.date, range)) active.add(t.customerId);
  }
  return {
    revenue: round2(revenue),
    orders,
    sessions,
    conversionRate: sessions > 0 ? orders / sessions : 0,
    averageTicket: orders > 0 ? round2(revenue / orders) : 0,
    activeCustomers: active.size,
  };
}

// ---------- Séries temporais ----------

export interface SeriesPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  conversionRate: number;
}

/** Agrupa por dia (até 31 dias), por semana (até 120) ou por bloco de 30 dias. */
export function buildSeries(dataset: Dataset, range: DateRange): SeriesPoint[] {
  const days = dataset.daily.filter((d) => inRange(d.date, range));
  const length = days.length;
  const size = length <= 31 ? 1 : length <= 120 ? 7 : 30;

  if (size === 1) {
    return days.map((d) => ({
      key: d.date,
      label: shortDate(d.date),
      revenue: d.revenue,
      orders: d.orders,
      conversionRate: d.conversionRate,
    }));
  }

  const points: SeriesPoint[] = [];
  for (let i = 0; i < days.length; i += size) {
    const chunk = days.slice(i, i + size);
    const revenue = chunk.reduce((s, d) => s + d.revenue, 0);
    const orders = chunk.reduce((s, d) => s + d.orders, 0);
    const sessions = chunk.reduce((s, d) => s + d.sessions, 0);
    points.push({
      key: chunk[0].date,
      label: shortDate(chunk[0].date),
      revenue: round2(revenue),
      orders,
      conversionRate: sessions > 0 ? orders / sessions : 0,
    });
  }
  return points;
}

// ---------- Breakdowns ----------

export interface ChannelRow {
  channel: Channel;
  revenue: number;
  orders: number;
  share: number;
}

export function channelBreakdown(dataset: Dataset, range: DateRange): ChannelRow[] {
  const totals = new Map<Channel, { revenue: number; orders: number }>(
    CHANNELS.map((c) => [c, { revenue: 0, orders: 0 }]),
  );
  for (const t of dataset.transactions) {
    if (t.status !== 'Pago' || !inRange(t.date, range)) continue;
    const entry = totals.get(t.channel);
    if (!entry) continue;
    entry.revenue += t.amount;
    entry.orders += 1;
  }
  const totalRevenue = [...totals.values()].reduce((s, v) => s + v.revenue, 0);
  return [...totals.entries()]
    .map(([channel, v]) => ({
      channel,
      revenue: round2(v.revenue),
      orders: v.orders,
      share: totalRevenue > 0 ? v.revenue / totalRevenue : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface SegmentRow {
  segment: Segment;
  count: number;
  share: number;
}

export function segmentBreakdown(customers: Customer[]): SegmentRow[] {
  const counts = new Map<Segment, number>(SEGMENTS.map((s) => [s, 0]));
  for (const c of customers) counts.set(c.segment, (counts.get(c.segment) ?? 0) + 1);
  const total = customers.length;
  return SEGMENTS.map((segment) => {
    const count = counts.get(segment) ?? 0;
    return { segment, count, share: total > 0 ? count / total : 0 };
  });
}

// ---------- Clientes ----------

export interface CustomerStats {
  orders: number;
  revenue: number;
  firstPurchase: string | null;
  lastPurchase: string | null;
}

export type CustomerRow = Customer & CustomerStats;

export function buildCustomerStats(transactions: Transaction[]): Map<string, CustomerStats> {
  const stats = new Map<string, CustomerStats>();
  for (const t of transactions) {
    if (t.status !== 'Pago') continue;
    const s = stats.get(t.customerId) ?? { orders: 0, revenue: 0, firstPurchase: null, lastPurchase: null };
    s.orders += 1;
    s.revenue = round2(s.revenue + t.amount);
    if (!s.firstPurchase || t.date < s.firstPurchase) s.firstPurchase = t.date;
    if (!s.lastPurchase || t.date > s.lastPurchase) s.lastPurchase = t.date;
    stats.set(t.customerId, s);
  }
  return stats;
}

export function buildCustomerRows(dataset: Dataset, stats: Map<string, CustomerStats>): CustomerRow[] {
  const empty: CustomerStats = { orders: 0, revenue: 0, firstPurchase: null, lastPurchase: null };
  return dataset.customers.map((c) => ({ ...c, ...(stats.get(c.id) ?? empty) }));
}

// ---------- Filtros e ordenação ----------

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

export type TxSortKey = 'date' | 'id' | 'customer' | 'amount' | 'status';

export interface TxQuery {
  range: DateRange;
  search: string;
  status: TxStatus | 'Todos';
  sortKey: TxSortKey;
  sortDir: SortDir;
}

export interface TxRow extends Transaction {
  customerName: string;
}

export function queryTransactions(
  dataset: Dataset,
  customersById: Map<string, Customer>,
  query: TxQuery,
): TxRow[] {
  const needle = normalizeText(query.search.trim());
  const rows: TxRow[] = [];
  for (const t of dataset.transactions) {
    if (!inRange(t.date, query.range)) continue;
    if (query.status !== 'Todos' && t.status !== query.status) continue;
    const customerName = customersById.get(t.customerId)?.name ?? '—';
    if (needle) {
      const haystack = normalizeText(`${t.id} ${customerName} ${t.product} ${t.channel} ${t.status}`);
      if (!haystack.includes(needle)) continue;
    }
    rows.push({ ...t, customerName });
  }

  const dir = query.sortDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    let result = 0;
    switch (query.sortKey) {
      case 'date':
        result = a.date.localeCompare(b.date);
        break;
      case 'id':
        result = a.id.localeCompare(b.id);
        break;
      case 'customer':
        result = compareText(a.customerName, b.customerName);
        break;
      case 'amount':
        result = a.amount - b.amount;
        break;
      case 'status':
        result = compareText(a.status, b.status);
        break;
    }
    return result * dir || a.id.localeCompare(b.id);
  });
  return rows;
}

export type CustSortKey = 'name' | 'revenue' | 'orders' | 'lastPurchase';

export interface CustomerQuery {
  search: string;
  segment: Segment | 'Todos';
  channel: Channel | 'Todos';
  sortKey: CustSortKey;
  sortDir: SortDir;
}

export function queryCustomers(rows: CustomerRow[], query: CustomerQuery): CustomerRow[] {
  const needle = normalizeText(query.search.trim());
  const filtered = rows.filter((c) => {
    if (query.segment !== 'Todos' && c.segment !== query.segment) return false;
    if (query.channel !== 'Todos' && c.channel !== query.channel) return false;
    if (!needle) return true;
    return normalizeText(`${c.id} ${c.name} ${c.email} ${c.city}`).includes(needle);
  });

  const dir = query.sortDir === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    let result = 0;
    switch (query.sortKey) {
      case 'name':
        result = compareText(a.name, b.name);
        break;
      case 'revenue':
        result = a.revenue - b.revenue;
        break;
      case 'orders':
        result = a.orders - b.orders;
        break;
      case 'lastPurchase':
        result = (a.lastPurchase ?? '').localeCompare(b.lastPurchase ?? '');
        break;
    }
    return result * dir || a.id.localeCompare(b.id);
  });
  return filtered;
}

// ---------- Paginação ----------

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    totalItems: items.length,
    items: items.slice(start, start + pageSize),
  };
}
