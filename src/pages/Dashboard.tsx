import { useMemo, useState } from 'react';
import type { Dataset, DateRange, PeriodKey } from '../types';
import {
  PRESET_LABELS,
  buildSeries,
  channelBreakdown,
  inRange,
  presetRange,
  previousRange,
  segmentBreakdown,
  summarize,
  validateCustomRange,
  MAX_CUSTOM_DAYS,
  type RangePreset,
} from '../data/analytics';
import { addDays, formatDateBR } from '../lib/dates';
import { decimalBR, downloadTextFile, toCsv } from '../lib/csv';
import { formatCurrency, formatDelta, formatInt, formatPercent } from '../lib/format';
import { useSettings } from '../store/SettingsContext';
import { usePageMeta } from '../hooks';
import { WithData } from '../components/WithData';
import { Button, Card, EmptyState, KpiCard, SegmentedControl, TextField } from '../components/ui';
import { ChannelChart, RevenueChart, SegmentDonut } from '../components/charts';

export default function Dashboard() {
  usePageMeta('Visão geral — PULSE OS', 'Painel com KPIs, receita, conversão e carteira de clientes (dados simulados).');
  return <WithData>{(data) => <DashboardView data={data} />}</WithData>;
}

const PERIOD_OPTIONS: ReadonlyArray<{ value: PeriodKey; label: string }> = [
  ...(Object.keys(PRESET_LABELS) as RangePreset[]).map((value) => ({ value, label: PRESET_LABELS[value] })),
  { value: 'custom', label: 'Personalizado' },
];

function DashboardView({ data }: { data: Dataset }) {
  const { settings } = useSettings();
  const compact = settings.compactNumbers;
  const bounds = { min: data.startDate, max: data.anchorDate };

  const [period, setPeriod] = useState<PeriodKey>(settings.defaultPeriod);
  const [customStart, setCustomStart] = useState(() => addDays(data.anchorDate, -29));
  const [customEnd, setCustomEnd] = useState(data.anchorDate);

  const validation = useMemo(
    () => (period === 'custom' ? validateCustomRange(customStart, customEnd, bounds) : null),
    [period, customStart, customEnd, bounds.min, bounds.max],
  );

  const range: DateRange | null = useMemo(() => {
    if (period === 'custom') return validation?.ok ? { start: customStart, end: customEnd } : null;
    return presetRange(period, data.anchorDate);
  }, [period, validation, customStart, customEnd, data.anchorDate]);

  if (!range) {
    return (
      <div className="space-y-6">
        <Header period={period} onPeriod={setPeriod} />
        <CustomRangeForm
          start={customStart}
          end={customEnd}
          onStart={setCustomStart}
          onEnd={setCustomEnd}
          errors={validation?.errors ?? {}}
          bounds={bounds}
        />
        <Card>
          <EmptyState
            title="Período inválido"
            description="Corrija as datas acima para atualizar os indicadores. Enquanto isso, nada é exibido para evitar números enganosos."
          />
        </Card>
      </div>
    );
  }

  const current = summarize(data, range);
  const previous = summarize(data, previousRange(range));
  const series = buildSeries(data, range);
  const channels = channelBreakdown(data, range);
  const segments = segmentBreakdown(data.customers);

  const dRevenue = formatDelta(current.revenue, previous.revenue);
  const dOrders = formatDelta(current.orders, previous.orders);
  const dTicket = formatDelta(current.averageTicket, previous.averageTicket);
  const dConv = formatDelta(current.conversionRate, previous.conversionRate);
  const dActive = formatDelta(current.activeCustomers, previous.activeCustomers);

  const periodText = `${formatDateBR(range.start)} a ${formatDateBR(range.end)}`;

  const exportSeries = () => {
    const rows = data.daily
      .filter((d) => inRange(d.date, range))
      .map((d) => [
        formatDateBR(d.date),
        decimalBR(d.revenue),
        d.orders,
        d.sessions,
        decimalBR(d.conversionRate * 100),
      ]);
    const csv = toCsv(['Data', 'Receita (R$)', 'Pedidos', 'Sessões', 'Conversão (%)'], rows);
    downloadTextFile(`pulse-os-serie-${range.start}_${range.end}.csv`, csv);
  };

  const hasSales = current.orders > 0;

  return (
    <div className="space-y-6">
      <Header period={period} onPeriod={setPeriod} />

      {period === 'custom' && (
        <CustomRangeForm
          start={customStart}
          end={customEnd}
          onStart={setCustomStart}
          onEnd={setCustomEnd}
          errors={{}}
          bounds={bounds}
        />
      )}

      <p className="text-sm text-muted">
        Período: <span className="num text-fg">{periodText}</span> · comparado com o período anterior de mesma duração.
      </p>

      <section aria-label="Indicadores principais" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard index={0} label="Receita" value={formatCurrency(current.revenue, compact)} delta={dRevenue} />
        <KpiCard index={1} label="Pedidos pagos" value={formatInt(current.orders)} delta={dOrders} />
        <KpiCard index={2} label="Ticket médio" value={formatCurrency(current.averageTicket)} delta={dTicket} />
        <KpiCard index={3} label="Taxa de conversão" value={formatPercent(current.conversionRate)} delta={dConv} hint="pedidos / sessões" />
        <KpiCard index={4} label="Clientes ativos" value={formatInt(current.activeCustomers)} delta={dActive} />
      </section>

      {!hasSales ? (
        <Card>
          <EmptyState
            title="Nenhuma venda no período"
            description="Não há pedidos pagos nas datas selecionadas. Tente um período maior ou ajuste o intervalo personalizado."
          />
        </Card>
      ) : (
        <>
          <Card
            title="Receita ao longo do tempo"
            subtitle={`Total de ${formatCurrency(current.revenue)} no período, agrupado automaticamente conforme a duração.`}
            action={
              <Button className="px-3 py-2 text-xs" onClick={exportSeries}>
                Exportar série (CSV)
              </Button>
            }
          >
            <RevenueChart
              data={series}
              summary={`Gráfico de receita de ${periodText}. Total ${formatCurrency(current.revenue)} em ${current.orders} pedidos pagos.`}
            />
            <details className="mt-4 text-sm text-muted">
              <summary className="cursor-pointer select-none text-accent hover:underline">Ver dados do gráfico em tabela</summary>
              <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-border">
                <table className="w-full text-left">
                  <caption className="sr-only">Receita e pedidos por intervalo</caption>
                  <thead className="sticky top-0 bg-surface2 text-xs uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Intervalo</th>
                      <th scope="col" className="px-3 py-2 font-medium">Receita</th>
                      <th scope="col" className="px-3 py-2 font-medium">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((p) => (
                      <tr key={p.key} className="border-t border-border/60">
                        <td className="num px-3 py-2">{p.label}</td>
                        <td className="num px-3 py-2">{formatCurrency(p.revenue)}</td>
                        <td className="num px-3 py-2">{formatInt(p.orders)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Receita por canal" subtitle="Participação de cada origem de vendas no período" className="lg:col-span-2">
              <ChannelChart
                rows={channels}
                summary={`Receita por canal: ${channels
                  .map((c) => `${c.channel} ${formatCurrency(c.revenue)} (${formatPercent(c.share)})`)
                  .join('; ')}.`}
              />
            </Card>

            <Card title="Carteira de clientes" subtitle="Segmentos de todo o histórico">
              <SegmentDonut
                rows={segments}
                summary={`Carteira de ${formatInt(data.customers.length)} clientes: ${segments
                  .map((s) => `${s.segment} ${formatInt(s.count)}`)
                  .join(', ')}.`}
              />
              <ul className="mt-4 space-y-2 text-sm">
                {segments.map((s) => (
                  <li key={s.segment} className="flex items-center justify-between">
                    <span className="text-muted">{s.segment}</span>
                    <span className="num text-fg">
                      {formatInt(s.count)} · {formatPercent(s.share)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Header({ period, onPeriod }: { period: PeriodKey; onPeriod: (p: PeriodKey) => void }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Visão geral</h1>
        <p className="mt-1 text-sm text-muted">Indicadores de vendas, conversão e clientes de uma empresa fictícia.</p>
      </div>
      <SegmentedControl label="Filtro de período" options={PERIOD_OPTIONS} value={period} onChange={onPeriod} />
    </div>
  );
}

function CustomRangeForm({
  start,
  end,
  onStart,
  onEnd,
  errors,
  bounds,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  errors: { start?: string; end?: string; general?: string };
  bounds: { min: string; max: string };
}) {
  return (
    <form
      className="glass grid gap-4 p-4 sm:grid-cols-2 md:p-5"
      aria-label="Período personalizado"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      <TextField id="custom-start" type="date" label="Data inicial" value={start} min={bounds.min} max={bounds.max} onChange={(e) => onStart(e.target.value)} error={errors.start} />
      <TextField id="custom-end" type="date" label="Data final" value={end} min={bounds.min} max={bounds.max} onChange={(e) => onEnd(e.target.value)} error={errors.end} />
      {errors.general ? (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {errors.general}
        </p>
      ) : (
        <p className="text-xs text-muted sm:col-span-2">
          Máximo de {MAX_CUSTOM_DAYS} dias. Dados disponíveis de {formatDateBR(bounds.min)} a {formatDateBR(bounds.max)}.
        </p>
      )}
    </form>
  );
}
