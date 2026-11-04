import { useEffect, useMemo, useState } from 'react';
import type { Dataset, SortDir, TxStatus } from '../types';
import { TX_STATUSES } from '../types';
import {
  paginate,
  queryTransactions,
  validateCustomRange,
  type TxRow,
  type TxSortKey,
} from '../data/analytics';
import { addDays, formatDateBR } from '../lib/dates';
import { decimalBR, downloadTextFile, toCsv } from '../lib/csv';
import { formatCurrency, formatInt } from '../lib/format';
import { cx } from '../lib/text';
import { useSettings } from '../store/SettingsContext';
import { usePageMeta } from '../hooks';
import { WithData } from '../components/WithData';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Notice,
  Pagination,
  SelectField,
  TextField,
  type Tone,
} from '../components/ui';

export default function Transactions() {
  usePageMeta('Transações — PULSE OS', 'Tabela de transações simuladas com busca, filtros, ordenação e exportação.');
  return <WithData>{(data) => <TransactionsView data={data} />}</WithData>;
}

const STATUS_TONE: Record<TxStatus, Tone> = {
  Pago: 'success',
  Pendente: 'warning',
  Reembolsado: 'neutral',
  Falhou: 'danger',
};

const STATUS_OPTIONS: ReadonlyArray<{ value: TxStatus | 'Todos'; label: string }> = [
  { value: 'Todos', label: 'Todos os status' },
  ...TX_STATUSES.map((s) => ({ value: s, label: s })),
];

const COLUMNS: ReadonlyArray<{ key: TxSortKey; label: string; align?: 'right'; defaultDir: SortDir }> = [
  { key: 'id', label: 'ID', defaultDir: 'asc' },
  { key: 'date', label: 'Data', defaultDir: 'desc' },
  { key: 'customer', label: 'Cliente', defaultDir: 'asc' },
  { key: 'amount', label: 'Valor', align: 'right', defaultDir: 'desc' },
  { key: 'status', label: 'Status', defaultDir: 'asc' },
];

function TransactionsView({ data }: { data: Dataset }) {
  const { settings } = useSettings();
  const bounds = { min: data.startDate, max: data.anchorDate };
  const customersById = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TxStatus | 'Todos'>('Todos');
  const [start, setStart] = useState(() => addDays(data.anchorDate, -89));
  const [end, setEnd] = useState(data.anchorDate);
  const [sortKey, setSortKey] = useState<TxSortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ tone: 'neutral' | 'success' | 'danger'; text: string } | null>(null);

  const validation = validateCustomRange(start, end, bounds);

  const rows: TxRow[] = useMemo(
    () =>
      validation.ok
        ? queryTransactions(data, customersById, { range: { start, end }, search, status, sortKey, sortDir })
        : [],
    [data, customersById, start, end, search, status, sortKey, sortDir, validation.ok],
  );

  // Volta à primeira página quando qualquer filtro muda.
  useEffect(() => setPage(1), [search, status, start, end, sortKey, sortDir, settings.pageSize]);

  const pageInfo = paginate(rows, page, settings.pageSize);

  const toggleSort = (key: TxSortKey, defaultDir: SortDir) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(defaultDir);
    }
  };

  const defaultStart = addDays(data.anchorDate, -89);
  const clearFilters = () => {
    setSearch('');
    setStatus('Todos');
    setStart(defaultStart);
    setEnd(data.anchorDate);
  };

  const exportCsv = () => {
    if (rows.length === 0) {
      setMessage({ tone: 'danger', text: 'Não há transações nos filtros atuais para exportar.' });
      return;
    }
    const csv = toCsv(
      ['ID', 'Data', 'Cliente', 'Produto', 'Canal', 'Valor (R$)', 'Status'],
      rows.map((t) => [t.id, formatDateBR(t.date), t.customerName, t.product, t.channel, decimalBR(t.amount), t.status]),
    );
    downloadTextFile(`pulse-os-transacoes-${start}_${end}.csv`, csv);
    setMessage({ tone: 'success', text: `${rows.length} transações exportadas em CSV (dados simulados).` });
  };

  const hasFilters = search.trim() !== '' || status !== 'Todos' || start !== defaultStart || end !== data.anchorDate;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Transações</h1>
          <p className="mt-1 text-sm text-muted">
            {formatInt(data.transactions.length)} transações simuladas. Pesquise, filtre, ordene e exporte.
          </p>
        </div>
        <Button variant="primary" onClick={exportCsv} disabled={!validation.ok}>
          Exportar CSV
        </Button>
      </header>

      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de transações">
          <div className="flex flex-col gap-1.5 xl:col-span-2">
            <label htmlFor="tx-search" className="label">
              Buscar
            </label>
            <input
              id="tx-search"
              type="search"
              className="input"
              placeholder="ID, cliente, produto ou canal"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SelectField
            id="tx-status"
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
          <TextField
            id="tx-start"
            type="date"
            label="De"
            value={start}
            min={bounds.min}
            max={bounds.max}
            onChange={(e) => setStart(e.target.value)}
            error={validation.errors.start}
          />
          <TextField
            id="tx-end"
            type="date"
            label="Até"
            value={end}
            min={bounds.min}
            max={bounds.max}
            onChange={(e) => setEnd(e.target.value)}
            error={validation.errors.end ?? validation.errors.general}
          />
        </form>
        {hasFilters && (
          <div className="mt-4">
            <Button className="px-3 py-1.5 text-xs" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>

      <Card
        subtitle={
          validation.ok
            ? `${formatInt(rows.length)} resultado(s) · ordenado por ${COLUMNS.find((c) => c.key === sortKey)?.label.toLowerCase()} (${sortDir === 'asc' ? 'crescente' : 'decrescente'})`
            : undefined
        }
      >
        {!validation.ok ? (
          <EmptyState
            title="Período inválido"
            description={validation.errors.general ?? 'Corrija as datas do filtro para ver as transações.'}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhuma transação encontrada"
            description="Nenhum registro corresponde aos filtros. Tente outro termo de busca ou um período maior."
            action={<Button onClick={clearFilters}>Limpar filtros</Button>}
          />
        ) : (
          <>
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Lista de transações simuladas, ordenável por coluna</caption>
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr className="border-b border-border">
                    {COLUMNS.map((col) => {
                      const active = sortKey === col.key;
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                          className={cx('px-3 py-3 font-medium', col.align === 'right' && 'text-right')}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key, col.defaultDir)}
                            className={cx(
                              'inline-flex items-center gap-1.5 rounded transition hover:text-fg',
                              active && 'text-accent',
                            )}
                          >
                            {col.label}
                            <span aria-hidden="true">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                          </button>
                        </th>
                      );
                    })}
                    <th scope="col" className="px-3 py-3 font-medium">Produto</th>
                  </tr>
                </thead>
                <tbody>
                  {pageInfo.items.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 transition hover:bg-surface2/50">
                      <td className="num px-3 py-3 text-muted">{t.id}</td>
                      <td className="num px-3 py-3">{formatDateBR(t.date)}</td>
                      <td className="px-3 py-3">
                        <span className="text-fg">{t.customerName}</span>
                        <span className="block text-xs text-muted">{t.channel}</span>
                      </td>
                      <td className="num px-3 py-3 text-right text-fg">{formatCurrency(t.amount)}</td>
                      <td className="px-3 py-3">
                        <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-muted">{t.product}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pageInfo.page}
              totalPages={pageInfo.totalPages}
              totalItems={pageInfo.totalItems}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
