// Tipos de domínio do PULSE OS. Todos os dados do app são SIMULADOS.

export const CHANNELS = [
  'Busca orgânica',
  'Redes sociais',
  'Anúncios pagos',
  'E-mail',
  'Indicação',
  'Direto',
] as const;
export type Channel = (typeof CHANNELS)[number];

export const SEGMENTS = ['VIP', 'Recorrente', 'Novo', 'Em risco'] as const;
export type Segment = (typeof SEGMENTS)[number];

export const TX_STATUSES = ['Pago', 'Pendente', 'Reembolsado', 'Falhou'] as const;
export type TxStatus = (typeof TX_STATUSES)[number];

export interface Customer {
  id: string;
  name: string;
  email: string;
  city: string;
  channel: Channel;
  segment: Segment;
  createdAt: string; // YYYY-MM-DD
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  customerId: string;
  product: string;
  amount: number; // BRL
  status: TxStatus;
  channel: Channel;
}

/** Métricas diárias. Receita e pedidos são derivados das transações pagas. */
export interface DailyMetric {
  date: string;
  revenue: number;
  orders: number;
  sessions: number;
  conversionRate: number; // 0..1
}

export interface Dataset {
  anchorDate: string; // último dia coberto pela demonstração
  startDate: string; // primeiro dia coberto
  customers: Customer[];
  transactions: Transaction[];
  daily: DailyMetric[];
}

export type PeriodKey = '7d' | '30d' | '90d' | '365d' | 'custom';

export interface DateRange {
  start: string; // inclusivo
  end: string; // inclusivo
}

export type SortDir = 'asc' | 'desc';
export type ThemeMode = 'dark' | 'light';

export interface Settings {
  theme: ThemeMode;
  defaultPeriod: Exclude<PeriodKey, 'custom'>;
  pageSize: 10 | 20 | 50;
  animations: boolean;
  compactNumbers: boolean;
}
