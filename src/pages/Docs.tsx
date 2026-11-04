import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Logo } from '../components/Logo';
import { usePageMeta } from '../hooks';

const SECTIONS = [
  { id: 'visao-geral', title: 'Visão geral' },
  { id: 'primeiros-passos', title: 'Primeiros passos' },
  { id: 'conceitos', title: 'Conceitos e KPIs' },
  { id: 'exportacao', title: 'Exportação CSV' },
  { id: 'integracao', title: 'Integração com API real' },
  { id: 'limites', title: 'Limites da demonstração' },
];

export default function Docs() {
  usePageMeta('Documentação — PULSE OS', 'Guia rápido do PULSE OS: primeiros passos, KPIs, exportação e integração com API.');

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="PULSE OS — início">
            <Logo />
            <span className="font-display font-bold">PULSE OS</span>
            <span className="text-sm text-muted">/ docs</span>
          </Link>
          <Link to="/app" className="btn btn-primary px-4 py-2 text-sm">
            Abrir o painel
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:px-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Índice da documentação" className="lg:sticky lg:top-28 lg:self-start">
          <p className="label mb-3">Neste guia</p>
          <ul className="space-y-2 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted transition hover:text-accent">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 space-y-14">
          <header>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Documentação</h1>
            <p className="mt-4 text-lg text-muted">
              Guia simplificado do PULSE OS, um painel de analytics demonstrativo com dados simulados.
            </p>
          </header>

          <Section id="visao-geral" title="Visão geral">
            <p>
              O painel tem quatro áreas: <strong>Visão geral</strong> (KPIs, receita, canais e carteira),{' '}
              <strong>Transações</strong> (tabela pesquisável), <strong>Clientes</strong> (lista e perfil) e{' '}
              <strong>Configurações</strong> (preferências locais). Não há login nesta versão.
            </p>
          </Section>

          <Section id="primeiros-passos" title="Primeiros passos">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Abra <Code>/app</Code>. Os dados são gerados no seu navegador em cerca de 350 ms.</li>
              <li>Escolha um período nos filtros. Em "Personalizado", informe datas válidas (máximo de 365 dias).</li>
              <li>Em Transações, busque por ID, cliente, produto ou canal e clique nos cabeçalhos para ordenar.</li>
              <li>Em Configurações, ajuste o tema, o período padrão e as animações. Tudo fica salvo neste navegador.</li>
            </ol>
          </Section>

          <Section id="conceitos" title="Conceitos e KPIs">
            <dl className="space-y-4">
              <Def term="Receita">Soma dos valores das transações com status Pago no período.</Def>
              <Def term="Pedidos pagos">Quantidade de transações com status Pago.</Def>
              <Def term="Ticket médio">Receita dividida pelo número de pedidos pagos.</Def>
              <Def term="Taxa de conversão">Pedidos pagos divididos pelas sessões do período.</Def>
              <Def term="Clientes ativos">Clientes distintos com ao menos uma compra paga no período.</Def>
              <Def term="Variação">Comparação com o período anterior de mesma duração.</Def>
              <Def term="Segmentos">
                VIP (total pago ≥ R$ 1.500), Em risco (última compra há mais de 60 dias), Recorrente (3 ou mais compras)
                e Novo (demais casos).
              </Def>
            </dl>
          </Section>

          <Section id="exportacao" title="Exportação CSV">
            <p>
              Os botões de exportação respeitam os filtros ativos. Os arquivos usam <Code>;</Code> como separador e
              codificação UTF-8 com BOM, para abrir corretamente no Excel em português. Os nomes incluem o período,
              por exemplo <Code>pulse-os-transacoes-2026-08-01_2026-10-31.csv</Code>.
            </p>
          </Section>

          <Section id="integracao" title="Integração com API real">
            <p>
              A interface lê os dados por meio de um contrato. Para conectar sua própria fonte, implemente-o e
              troque o provedor em <Code>src/data/provider.ts</Code>:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface2/60 p-4 text-xs leading-relaxed">
              <code>{`export interface AnalyticsProvider {
  loadDataset(): Promise<Dataset>;
}

// Exemplo de implementação:
export const apiProvider: AnalyticsProvider = {
  async loadDataset() {
    const res = await fetch(import.meta.env.VITE_API_URL + '/metricas');
    if (!res.ok) throw new Error('Falha ao carregar métricas');
    return res.json(); // deve respeitar o tipo Dataset (src/types.ts)
  },
};`}</code>
            </pre>
            <p className="mt-4">
              Toda a lógica de KPIs, filtros e exportação está em funções puras (<Code>src/data/analytics.ts</Code>),
              independentes da fonte. Os estados de carregamento e erro já são tratados pela interface. Para a
              autenticação de usuários, use um provedor dedicado (por exemplo, Clerk, Auth0 ou Supabase Auth) em
              vez de implementar login manualmente.
            </p>
          </Section>

          <Section id="limites" title="Limites da demonstração">
            <ul className="list-disc space-y-2 pl-5">
              <li>Todos os dados são simulados e determinísticos. Nenhum valor representa vendas ou clientes reais.</li>
              <li>Não há backend, banco de dados nem autenticação. A demonstração é pública.</li>
              <li>As preferências são salvas apenas no localStorage do navegador.</li>
              <li>Os preços da landing page são ilustrativos e não constituem oferta comercial.</li>
            </ul>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-28 space-y-4 leading-relaxed text-muted">
      <h2 id={`${id}-titulo`} className="text-2xl font-bold text-fg md:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Def({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="glass p-4">
      <dt className="font-semibold text-fg">{term}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="num rounded-md border border-border bg-surface2/70 px-1.5 py-0.5 text-[0.85em] text-accent">{children}</code>;
}
