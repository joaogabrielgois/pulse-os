import {
  type Channel,
  type Customer,
  type DailyMetric,
  type Dataset,
  type Segment,
  type Transaction,
  type TxStatus,
} from '../types';
import { addDays, diffDays, parseISO } from '../lib/dates';
import { round2 } from '../lib/format';
import { createRng } from './random';

/**
 * DADOS SIMULADOS. Este gerador cria uma empresa fictícia para demonstração.
 * Nenhum valor corresponde a vendas, clientes ou finanças reais.
 */

export const ANCHOR_DATE = '2026-10-31';
export const HISTORY_DAYS = 365;
export const CUSTOMER_COUNT = 480;
const SEED = 20261031;
export const START_DATE = addDays(ANCHOR_DATE, -(HISTORY_DAYS - 1));

export const PRODUCTS = [
  { name: 'Assinatura Essencial', price: 49, weight: 30 },
  { name: 'Assinatura Pro', price: 129, weight: 24 },
  { name: 'Assinatura Scale', price: 299, weight: 9 },
  { name: 'Relatório avulso', price: 79, weight: 14 },
  { name: 'Automação extra', price: 39, weight: 10 },
  { name: 'Treinamento de equipe', price: 249, weight: 5 },
  { name: 'Integração via API', price: 179, weight: 8 },
] as const;

const CHANNEL_WEIGHTS: ReadonlyArray<readonly [Channel, number]> = [
  ['Busca orgânica', 24],
  ['Redes sociais', 20],
  ['Anúncios pagos', 18],
  ['E-mail', 14],
  ['Indicação', 10],
  ['Direto', 14],
];

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius',
];
const LAST_NAMES = [
  'Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Estevam', 'Freitas', 'Gomes', 'Holanda', 'Ito', 'Jardim',
  'Lima', 'Moraes', 'Nascimento', 'Oliveira', 'Pereira', 'Queiroz', 'Rocha', 'Santos', 'Teixeira', 'Vieira',
];
const CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador',
  'Recife', 'Fortaleza', 'Florianópolis', 'Goiânia', 'Manaus', 'Belém',
];

const pad = (value: number, size: number) => String(value).padStart(size, '0');

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');

interface PurchaseSummary {
  count: number;
  total: number;
  last: string | null;
}

/** Segmento derivado do histórico de compras (regras documentadas no README). */
export function classifySegment(summary: PurchaseSummary | undefined): Segment {
  if (!summary || summary.count === 0) return 'Novo';
  if (summary.total >= 1500) return 'VIP';
  if (summary.last && diffDays(summary.last, ANCHOR_DATE) > 60) return 'Em risco';
  if (summary.count >= 3) return 'Recorrente';
  return 'Novo';
}

export function generateDataset(): Dataset {
  const rng = createRng(SEED);

  // 1) Clientes. Alguns foram criados antes da janela de análise.
  const customers: Customer[] = [];
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const offset = rng.int(-330, HISTORY_DAYS - 1);
    customers.push({
      id: `CL-${pad(i + 1, 4)}`,
      name: `${first} ${last}`,
      email: `${slug(first)}.${slug(last)}${i + 1}@demo.pulse.test`,
      city: rng.pick(CITIES),
      channel: rng.weighted(CHANNEL_WEIGHTS),
      segment: 'Novo',
      createdAt: addDays(START_DATE, offset),
    });
  }

  // 2) Transações dia a dia, com tendência de crescimento, sazonalidade semanal e ruído.
  const transactions: Transaction[] = [];
  const productWeights = PRODUCTS.map((p) => [p, p.weight] as const);
  let sequence = 0;

  for (let day = 0; day < HISTORY_DAYS; day++) {
    const date = addDays(START_DATE, day);
    const weekday = new Date(parseISO(date)).getUTCDay();
    const growth = 1 + (day / HISTORY_DAYS) * 0.55;
    const season = 1 + Math.sin(day / 37) * 0.12;
    const weekend = weekday === 0 || weekday === 6 ? 0.72 : 1;
    const expected = 9 * growth * season * weekend;
    const count = Math.max(1, Math.round(expected * (0.85 + rng.next() * 0.3)));

    const eligible = customers.filter((c) => c.createdAt <= date);
    if (eligible.length === 0) continue;

    for (let k = 0; k < count; k++) {
      const customer = rng.pick(eligible);
      const product = rng.weighted(productWeights);
      const isRecent = diffDays(date, ANCHOR_DATE) <= 4;
      const roll = rng.next();

      let status: TxStatus;
      if (isRecent && roll < 0.35) status = 'Pendente';
      else if (roll < 0.92) status = 'Pago';
      else if (roll < 0.96) status = 'Reembolsado';
      else status = 'Falhou';

      transactions.push({
        id: `TX-${pad(++sequence, 6)}`,
        date,
        customerId: customer.id,
        product: product.name,
        amount: product.price,
        status,
        channel: rng.chance(0.7) ? customer.channel : rng.weighted(CHANNEL_WEIGHTS),
      });
    }
  }

  // 3) Segmentos derivados do histórico real de compras pagas.
  const summaries = new Map<string, PurchaseSummary>();
  for (const t of transactions) {
    if (t.status !== 'Pago') continue;
    const s = summaries.get(t.customerId) ?? { count: 0, total: 0, last: null };
    s.count += 1;
    s.total += t.amount;
    if (!s.last || t.date > s.last) s.last = t.date;
    summaries.set(t.customerId, s);
  }
  for (const customer of customers) {
    customer.segment = classifySegment(summaries.get(customer.id));
  }

  // 4) Métricas diárias: receita e pedidos vêm das transações; sessões seguem a conversão.
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const t of transactions) {
    if (t.status !== 'Pago') continue;
    const agg = byDay.get(t.date) ?? { revenue: 0, orders: 0 };
    agg.revenue += t.amount;
    agg.orders += 1;
    byDay.set(t.date, agg);
  }

  const daily: DailyMetric[] = [];
  for (let day = 0; day < HISTORY_DAYS; day++) {
    const date = addDays(START_DATE, day);
    const agg = byDay.get(date) ?? { revenue: 0, orders: 0 };
    const conversion = 0.024 + rng.next() * 0.014 + (day / HISTORY_DAYS) * 0.004;
    const sessions = Math.max(agg.orders, Math.round(agg.orders / conversion));
    daily.push({
      date,
      revenue: round2(agg.revenue),
      orders: agg.orders,
      sessions,
      conversionRate: sessions > 0 ? agg.orders / sessions : 0,
    });
  }

  return { anchorDate: ANCHOR_DATE, startDate: START_DATE, customers, transactions, daily };
}
