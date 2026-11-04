// Datas são tratadas como strings ISO (YYYY-MM-DD) e operadas em UTC,
// para que o resultado não dependa do fuso horário do navegador.

export const DAY_MS = 86_400_000;

export function parseISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toISO(parseISO(iso) + days * DAY_MS);
}

/** Número de dias de `a` até `b`. Positivo quando `b` é posterior a `a`. */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(b) - parseISO(a)) / DAY_MS);
}

/** Valida formato e existência real da data (rejeita 2026-02-30). */
export function isValidISO(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toISO(parseISO(value)) === value;
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}
