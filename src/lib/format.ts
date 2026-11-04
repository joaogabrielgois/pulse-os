const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('pt-BR');
const integerCompact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number, compact = false): string {
  return (compact ? brlCompact : brl).format(value);
}

export function formatInt(value: number, compact = false): string {
  return (compact ? integerCompact : integer).format(value);
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

export type Direction = 'up' | 'down' | 'flat';

export interface Delta {
  value: number;
  label: string;
  direction: Direction;
}

/** Variação percentual entre o período atual e o anterior. */
export function formatDelta(current: number, previous: number): Delta {
  if (previous === 0) {
    return current > 0
      ? { value: 1, label: 'novo', direction: 'up' }
      : { value: 0, label: '0,0%', direction: 'flat' };
  }
  const value = (current - previous) / previous;
  const direction: Direction = Math.abs(value) < 0.0005 ? 'flat' : value > 0 ? 'up' : 'down';
  const sign = value > 0 ? '+' : '';
  return { value, label: `${sign}${(value * 100).toFixed(1).replace('.', ',')}%`, direction };
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
