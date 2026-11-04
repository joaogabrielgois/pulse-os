// Verificação automatizada da lógica de domínio. Execute com: npm run verify
// Não depende de navegador: testa dados, KPIs, filtros, validação, CSV e preferências.

import { generateDataset, classifySegment, ANCHOR_DATE, START_DATE } from '../src/data/generate';
import {
  summarize,
  presetRange,
  previousRange,
  rangeLength,
  buildSeries,
  channelBreakdown,
  buildCustomerStats,
  buildCustomerRows,
  queryTransactions,
  queryCustomers,
  validateCustomRange,
  paginate,
} from '../src/data/analytics';
import { toCsv } from '../src/lib/csv';
import { sanitizeSettings, DEFAULT_SETTINGS } from '../src/lib/storage';
import { formatDelta, formatCurrency } from '../src/lib/format';
import { isValidISO, addDays } from '../src/lib/dates';
import { createRng } from '../src/data/random';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n1. Gerador pseudoaleatório');
{
  const a = createRng(42);
  const b = createRng(42);
  const seqA = Array.from({ length: 5 }, () => a.next());
  const seqB = Array.from({ length: 5 }, () => b.next());
  check('mesma semente gera mesma sequência', seqA.every((v, i) => v === seqB[i]));
  check('valores estão em [0, 1)', seqA.every((v) => v >= 0 && v < 1));
}

console.log('\n2. Dataset simulado');
const dataset = generateDataset();
const again = generateDataset();
check('geração é determinística (mesmo JSON)', JSON.stringify(dataset) === JSON.stringify(again));
check('365 dias de métricas diárias', dataset.daily.length === 365);
check('cobre de START_DATE até ANCHOR_DATE', dataset.daily[0].date === START_DATE && dataset.daily.at(-1)?.date === ANCHOR_DATE);
check('480 clientes', dataset.customers.length === 480);
check('há transações (> 2.000)', dataset.transactions.length > 2000, `total=${dataset.transactions.length}`);
check('IDs de transação únicos', new Set(dataset.transactions.map((t) => t.id)).size === dataset.transactions.length);
check('toda transação aponta para cliente existente', (() => {
  const ids = new Set(dataset.customers.map((c) => c.id));
  return dataset.transactions.every((t) => ids.has(t.customerId));
})());
check('nenhuma compra antes da criação do cliente', (() => {
  const created = new Map(dataset.customers.map((c) => [c.id, c.createdAt]));
  return dataset.transactions.every((t) => t.date >= (created.get(t.customerId) ?? ''));
})());
check('e-mails são fictícios (.test)', dataset.customers.every((c) => c.email.endsWith('@demo.pulse.test')));

const sumPaidTx = dataset.transactions
  .filter((t) => t.status === 'Pago')
  .reduce((s, t) => s + t.amount, 0);
const sumDaily = dataset.daily.reduce((s, d) => s + d.revenue, 0);
check('receita diária bate com transações pagas (consistência)', Math.abs(sumPaidTx - sumDaily) < 0.01, `${sumPaidTx} vs ${sumDaily}`);

const everyConversionValid = dataset.daily.every((d) => d.conversionRate >= 0 && d.conversionRate <= 1 && d.sessions >= d.orders);
check('conversão em [0,1] e sessões ≥ pedidos', everyConversionValid);

console.log('\n3. Segmentação');
check('regra VIP: total ≥ 1500', classifySegment({ count: 5, total: 1500, last: ANCHOR_DATE }) === 'VIP');
check('regra Em risco: última compra há > 60 dias', classifySegment({ count: 2, total: 200, last: addDays(ANCHOR_DATE, -90) }) === 'Em risco');
check('regra Recorrente: ≥ 3 compras recentes', classifySegment({ count: 3, total: 300, last: ANCHOR_DATE }) === 'Recorrente');
check('sem compras → Novo', classifySegment(undefined) === 'Novo');

console.log('\n4. Períodos e comparações');
const r30 = presetRange('30d', ANCHOR_DATE);
check('preset 30d tem 30 dias', rangeLength(r30) === 30);
const prev30 = previousRange(r30);
check('período anterior é contíguo e do mesmo tamanho', rangeLength(prev30) === 30 && prev30.end === addDays(r30.start, -1));
const k7 = summarize(dataset, presetRange('7d', ANCHOR_DATE));
const k30 = summarize(dataset, r30);
const k365 = summarize(dataset, presetRange('365d', ANCHOR_DATE));
check('receita 7d ≤ 30d ≤ 365d', k7.revenue <= k30.revenue && k30.revenue <= k365.revenue);
check('ticket médio = receita / pedidos', Math.abs(k30.averageTicket - k30.revenue / k30.orders) < 0.01);
check('KPIs de 365d equivalem ao total do dataset', Math.abs(k365.revenue - Math.round(sumDaily * 100) / 100) < 0.01);

const series30 = buildSeries(dataset, r30);
check('série de 30 dias usa granularidade diária', series30.length === 30);
const series365 = buildSeries(dataset, presetRange('365d', ANCHOR_DATE));
check('série de 12 meses agrega em blocos (≤ 53 pontos)', series365.length > 0 && series365.length <= 53, `pontos=${series365.length}`);
check('soma da série agregada = receita total', Math.abs(series365.reduce((s, p) => s + p.revenue, 0) - k365.revenue) < 0.5);

const channels = channelBreakdown(dataset, r30);
const shareSum = channels.reduce((s, c) => s + c.share, 0);
check('participação por canal soma 100%', Math.abs(shareSum - 1) < 0.001 || k30.revenue === 0, `soma=${shareSum}`);
check('canais ordenados por receita (desc)', channels.every((c, i) => i === 0 || channels[i - 1].revenue >= c.revenue));

console.log('\n5. Validação de período personalizado');
const bounds = { min: dataset.startDate, max: dataset.anchorDate };
check('aceita período válido', validateCustomRange('2026-10-01', '2026-10-31', bounds).ok);
check('rejeita data inexistente (30/fev)', !validateCustomRange('2026-02-30', '2026-03-01', bounds).ok);
check('rejeita início após fim', validateCustomRange('2026-10-10', '2026-10-01', bounds).errors.general !== undefined);
check('rejeita período > 365 dias', validateCustomRange('2024-01-01', '2026-10-31', { min: '2020-01-01', max: '2026-10-31' }).errors.general !== undefined);
check('rejeita datas fora da base', validateCustomRange('2020-01-01', '2020-02-01', bounds).errors.general !== undefined);
check('isValidISO recusa formato errado', !isValidISO('31/10/2026'));

console.log('\n6. Transações: busca, filtro, ordenação e paginação');
const customersById = new Map(dataset.customers.map((c) => [c.id, c]));
const baseQuery = { range: r30, search: '', status: 'Todos' as const, sortKey: 'date' as const, sortDir: 'desc' as const };
const allRows = queryTransactions(dataset, customersById, baseQuery);
check('lista respeita o período', allRows.every((t) => t.date >= r30.start && t.date <= r30.end));
check('ordenação por data decrescente', allRows.every((t, i) => i === 0 || allRows[i - 1].date >= t.date));
const byAmount = queryTransactions(dataset, customersById, { ...baseQuery, sortKey: 'amount', sortDir: 'asc' });
check('ordenação por valor crescente', byAmount.every((t, i) => i === 0 || byAmount[i - 1].amount <= t.amount));
const firstName = allRows[0]?.customerName.split(' ')[0] ?? '';
const searched = queryTransactions(dataset, customersById, { ...baseQuery, search: firstName.toUpperCase() });
check('busca é case-insensitive e encontra por nome', searched.length > 0 && searched.every((t) => t.customerName.toLowerCase().includes(firstName.toLowerCase())));
const pendentes = queryTransactions(dataset, customersById, { ...baseQuery, status: 'Pendente' });
check('filtro por status', pendentes.every((t) => t.status === 'Pendente'));
const noMatch = queryTransactions(dataset, customersById, { ...baseQuery, search: 'zzz-inexistente' });
check('busca sem resultados retorna lista vazia', noMatch.length === 0);
const page2 = paginate(allRows, 2, 10);
check('paginação retorna página correta', page2.page === 2 && page2.items.length === 10);
check('paginação limita página fora do intervalo', paginate(allRows, 999, 10).page === paginate(allRows, 999, 10).totalPages);

console.log('\n7. Clientes');
const stats = buildCustomerStats(dataset.transactions);
const rows = buildCustomerRows(dataset, stats);
const vipRows = queryCustomers(rows, { search: '', segment: 'VIP', channel: 'Todos', sortKey: 'revenue', sortDir: 'desc' });
check('filtro por segmento VIP', vipRows.every((c) => c.segment === 'VIP'));
check('ordenação por receita decrescente', vipRows.every((c, i) => i === 0 || vipRows[i - 1].revenue >= c.revenue));
const totalOrdersFromCustomers = rows.reduce((s, c) => s + c.orders, 0);
const totalPaidTx = dataset.transactions.filter((t) => t.status === 'Pago').length;
check('pedidos por cliente somam o total de pagos', totalOrdersFromCustomers === totalPaidTx);

console.log('\n8. CSV');
const csv = toCsv(['Nome', 'Obs'], [['Ana; "Silva"', 'linha\nnova'], ['Bruno', 'ok']]);
check('CSV começa com BOM UTF-8', csv.charCodeAt(0) === 0xfeff);
check('campo com ";" e aspas é escapado', csv.includes('"Ana; ""Silva"""'));
check('campo com quebra de linha é escapado', csv.includes('"linha\nnova"'));

console.log('\n9. Preferências (localStorage sanitizado)');
const corrupted = sanitizeSettings({ theme: 'neon', pageSize: 999, defaultPeriod: '1y', animations: 'sim', compactNumbers: false });
check('tema inválido volta ao padrão', corrupted.theme === DEFAULT_SETTINGS.theme);
check('tamanho de página inválido volta ao padrão', corrupted.pageSize === DEFAULT_SETTINGS.pageSize);
check('período inválido volta ao padrão', corrupted.defaultPeriod === DEFAULT_SETTINGS.defaultPeriod);
check('valor booleano válido é preservado', corrupted.compactNumbers === false);
check('entrada nula não quebra', sanitizeSettings(null).theme === 'dark');

console.log('\n10. Formatadores');
const d = formatDelta(120, 100);
check('variação positiva formatada em pt-BR', d.label === '+20,0%' && d.direction === 'up');
check('variação negativa', formatDelta(80, 100).direction === 'down');
check('variação com base zero', formatDelta(5, 0).label === 'novo');
check('moeda em BRL', formatCurrency(1234.5).includes('R$') && formatCurrency(1234.5).includes('1.234,50'));

console.log(`\nResultado: ${passed} aprovados, ${failed} reprovados.`);
if (failed > 0) process.exit(1);
