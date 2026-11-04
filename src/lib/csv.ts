// CSV com separador ";" e BOM UTF-8, o formato que o Excel em pt-BR abre corretamente.

type Cell = string | number;

function escapeCell(value: Cell): string {
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(';'));
  return '\uFEFF' + lines.join('\r\n');
}

/** Valor decimal com vírgula, como usado no Brasil. */
export function decimalBR(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
