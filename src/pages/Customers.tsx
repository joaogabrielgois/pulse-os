import { useMemo, useState } from 'react';
import { CHANNELS, SEGMENTS, type Channel, type Dataset, type Segment, type SortDir, type Transaction } from '../types';
import {
  buildCustomerRows,
  buildCustomerStats,
  paginate,
  queryCustomers,
  type CustSortKey,
  type CustomerRow,
} from '../data/analytics';
import { formatDateBR } from '../lib/dates';
import { decimalBR, downloadTextFile, toCsv } from '../lib/csv';
import { formatCurrency, formatInt, initials } from '../lib/format';
import { cx } from '../lib/text';
import { usePageMeta } from '../hooks';
import { WithData } from '../components/WithData';
import { Badge, Button, Card, EmptyState, Notice, Pagination, SelectField, type Tone } from '../components/ui';

export default function Customers() {
  usePageMeta('Clientes — PULSE OS', 'Carteira de clientes simulada com segmentos, filtros e detalhes por cliente.');
  return <WithData>{(data) => <CustomersView data={data} />}</WithData>;
}

const SEGMENT_TONE: Record<Segment, Tone> = {
  VIP: 'accent',
  Recorrente: 'success',
  Novo: 'neutral',
  'Em risco': 'danger',
};

const SEGMENT_OPTIONS: ReadonlyArray<{ value: Segment | 'Todos'; label: string }> = [
  { value: 'Todos', label: 'Todos os segmentos' },
  ...SEGMENTS.map((s) => ({ value: s, label: s })),
];
const CHANNEL_OPTIONS: ReadonlyArray<{ value: Channel | 'Todos'; label: string }> = [
  { value: 'Todos', label: 'Todos os canais' },
  ...CHANNELS.map((c) => ({ value: c, label: c })),
];
const SORT_OPTIONS: ReadonlyArray<{ value: `${CustSortKey}:${SortDir}`; label: string }> = [
  { value: 'revenue:desc', label: 'Maior receita' },
  { value: 'orders:desc', label: 'Mais pedidos' },
  { value: 'lastPurchase:desc', label: 'Compra mais recente' },
  { value: 'lastPurchase:asc', label: 'Sem compra há mais tempo' },
  { value: 'name:asc', label: 'Nome (A–Z)' },
];

const PAGE_SIZE = 12;

function CustomersView({ data }: { data: Dataset }) {
  const rows = useMemo(
    () => buildCustomerRows(data, buildCustomerStats(data.transactions)),
    [data],
  );

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment | 'Todos'>('Todos');
  const [channel, setChannel] = useState<Channel | 'Todos'>('Todos');
  const [sort, setSort] = useState<`${CustSortKey}:${SortDir}`>('revenue:desc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const [sortKey, sortDir] = sort.split(':') as [CustSortKey, SortDir];

  const filtered = useMemo(
    () => queryCustomers(rows, { search, segment, channel, sortKey, sortDir }),
    [rows, search, segment, channel, sortKey, sortDir],
  );

  const pageInfo = paginate(filtered, page, PAGE_SIZE);
  const selected: CustomerRow | undefined =
    filtered.find((c) => c.id === selectedId) ?? rows.find((c) => c.id === selectedId);

  const recentTx = useMemo<Transaction[]>(() => {
    if (!selected) return [];
    return data.transactions
      .filter((t) => t.customerId === selected.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 6);
  }, [data.transactions, selected]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      setMessage({ tone: 'danger', text: 'Nenhum cliente nos filtros atuais para exportar.' });
      return;
    }
    const csv = toCsv(
      ['ID', 'Nome', 'E-mail', 'Cidade', 'Canal', 'Segmento', 'Pedidos', 'Receita (R$)', 'Última compra'],
      filtered.map((c) => [
        c.id,
        c.name,
        c.email,
        c.city,
        c.channel,
        c.segment,
        c.orders,
        decimalBR(c.revenue),
        c.lastPurchase ? formatDateBR(c.lastPurchase) : 'sem compra',
      ]),
    );
    downloadTextFile(`pulse-os-clientes-${data.anchorDate}.csv`, csv);
    setMessage({ tone: 'success', text: `${filtered.length} clientes exportados em CSV (dados simulados).` });
  };

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Clientes</h1>
          <p className="mt-1 text-sm text-muted">
            {formatInt(data.customers.length)} clientes simulados · segmentos calculados pelo histórico de compras.
          </p>
        </div>
        <Button variant="primary" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </header>

      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cust-search" className="label">
              Buscar
            </label>
            <input
              id="cust-search"
              type="search"
              className="input"
              placeholder="Nome, e-mail, cidade ou ID"
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
            />
          </div>
          <SelectField id="cust-segment" label="Segmento" value={segment} onChange={resetPage(setSegment)} options={SEGMENT_OPTIONS} />
          <SelectField id="cust-channel" label="Canal de aquisição" value={channel} onChange={resetPage(setChannel)} options={CHANNEL_OPTIONS} />
          <SelectField
            id="cust-sort"
            label="Ordenar por"
            value={sort}
            onChange={resetPage(setSort)}
            options={SORT_OPTIONS}
          />
        </div>
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {formatInt(filtered.length)} cliente(s) encontrado(s)
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Ajuste a busca ou os filtros de segmento e canal para ver resultados."
              action={
                <Button
                  onClick={() => {
                    setSearch('');
                    setSegment('Todos');
                    setChannel('Todos');
                    setPage(1);
                  }}
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <>
              <ul className="divide-y divide-border/60" aria-label="Lista de clientes">
                {pageInfo.items.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        aria-pressed={active}
                        className={cx(
                          'flex w-full flex-wrap items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface2/60',
                          active && 'bg-surface2 shadow-[inset_0_0_0_1px_rgb(var(--c-accent)/0.4)]',
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                          {initials(c.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-fg">{c.name}</span>
                          <span className="block truncate text-xs text-muted">
                            {c.city} · {c.channel}
                          </span>
                        </span>
                        <Badge tone={SEGMENT_TONE[c.segment]}>{c.segment}</Badge>
                        <span className="num w-28 text-right text-sm text-fg">{formatCurrency(c.revenue)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Pagination
                page={pageInfo.page}
                totalPages={pageInfo.totalPages}
                totalItems={pageInfo.totalItems}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>

        <aside aria-label="Detalhes do cliente" className="xl:sticky xl:top-40 xl:self-start">
          {selected ? (
            <Card>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
                  {initials(selected.name)}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-fg">{selected.name}</h2>
                  <p className="truncate text-sm text-muted">{selected.email}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone={SEGMENT_TONE[selected.segment]}>{selected.segment}</Badge>
                <Badge>{selected.channel}</Badge>
                <Badge>{selected.city}</Badge>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4">
                <Stat label="Receita total" value={formatCurrency(selected.revenue)} />
                <Stat label="Pedidos pagos" value={formatInt(selected.orders)} />
                <Stat
                  label="Ticket médio"
                  value={selected.orders > 0 ? formatCurrency(selected.revenue / selected.orders) : '—'}
                />
                <Stat label="Cliente desde" value={formatDateBR(selected.createdAt)} />
                <Stat label="Primeira compra" value={selected.firstPurchase ? formatDateBR(selected.firstPurchase) : '—'} />
                <Stat label="Última compra" value={selected.lastPurchase ? formatDateBR(selected.lastPurchase) : '—'} />
              </dl>

              <h3 className="label mb-3 mt-7">Últimas transações</h3>
              {recentTx.length === 0 ? (
                <p className="text-sm text-muted">Este cliente ainda não possui transações.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentTx.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-fg">{t.product}</span>
                        <span className="num text-xs text-muted">
                          {formatDateBR(t.date)} · {t.id}
                        </span>
                      </span>
                      <span className="num shrink-0 text-fg">{formatCurrency(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : (
            <Card>
              <EmptyState
                title="Selecione um cliente"
                description="Escolha um cliente na lista para ver o perfil, o histórico de compras e o segmento."
              />
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface2/40 p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-1 text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}
