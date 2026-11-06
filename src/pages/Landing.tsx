import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroDashboard } from './HeroDashboard';
import heroPhoto from './pulse-hero.jpg';
import { Logo } from '../components/Logo';
import { Reveal } from '../components/ui';
import { usePageMeta } from '../hooks';
import { cx } from '../lib/text';

const FEATURES = [
  {
    title: 'Painel de KPIs',
    text: 'Receita, pedidos, ticket médio, conversão e clientes ativos, sempre comparados com o período anterior.',
  },
  {
    title: 'Conversão por canal',
    text: 'Descubra de onde vêm as vendas: busca, redes, anúncios, e-mail, indicações e acessos diretos.',
  },
  {
    title: 'Carteira segmentada',
    text: 'VIP, recorrentes, novos e clientes em risco, calculados a partir do histórico real de compras.',
  },
  {
    title: 'Transações pesquisáveis',
    text: 'Busca tolerante a acentos, filtros de status e datas, ordenação por coluna e paginação.',
  },
  {
    title: 'Exportação em CSV',
    text: 'Leve qualquer lista filtrada para o Excel em pt-BR, com separador e codificação corretos.',
  },
  {
    title: 'Preferências locais',
    text: 'Tema claro ou escuro, período padrão e formatação salvos no seu navegador, sem cadastro.',
  },
];

const USE_CASES = [
  {
    id: 'loja',
    label: 'Lojas online',
    problem: 'Quer saber qual campanha realmente vende e onde o carrinho abandona.',
    shows: 'Receita por canal, taxa de conversão semanal e ticket médio por produto.',
    sample: { metric: 'Conversão', value: '3,1%', note: 'exemplo ilustrativo' },
  },
  {
    id: 'assinatura',
    label: 'Assinaturas',
    problem: 'Precisa identificar clientes que estão perdendo interesse antes de cancelar.',
    shows: 'Segmento "Em risco", compras recentes por cliente e receita por plano.',
    sample: { metric: 'Clientes em risco', value: '43', note: 'exemplo ilustrativo' },
  },
  {
    id: 'servicos',
    label: 'Serviços',
    problem: 'Acompanha vendas de consultorias e pacotes sem planilhas espalhadas.',
    shows: 'Pedidos pagos, pendentes e reembolsados em uma única tabela pesquisável.',
    sample: { metric: 'Pendentes', value: '12', note: 'exemplo ilustrativo' },
  },
  {
    id: 'marketplace',
    label: 'Marketplaces',
    problem: 'Vende em pequena escala e precisa de números claros para decidir o próximo passo.',
    shows: 'Visão geral com comparação de período e exportação para compartilhar com a equipe.',
    sample: { metric: 'Ticket médio', value: 'R$ 96', note: 'exemplo ilustrativo' },
  },
];

const PLANS = [
  {
    name: 'Essencial',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para quem está começando a medir o negócio.',
    items: ['Painel de KPIs', 'Transações e clientes', 'Exportação CSV', 'Histórico de 12 meses'],
    featured: false,
  },
  {
    name: 'Crescimento',
    price: 'R$ 129',
    period: '/mês',
    description: 'Para operações com canais e equipes em expansão.',
    items: ['Tudo do Essencial', 'Análise por canal', 'Segmentação de clientes', 'Preferências por equipe'],
    featured: true,
  },
  {
    name: 'Escala',
    price: 'Sob consulta',
    period: '',
    description: 'Para volumes altos e integrações personalizadas.',
    items: ['Tudo do Crescimento', 'Conexão com API própria', 'Limites ampliados', 'Suporte prioritário'],
    featured: false,
  },
];

const FAQ = [
  {
    q: 'Os dados exibidos são reais?',
    a: 'Não. Toda a demonstração usa uma empresa fictícia com dados simulados e determinísticos, gerados no seu navegador. Nenhum número representa vendas, clientes ou finanças reais.',
  },
  {
    q: 'Preciso criar uma conta?',
    a: 'Não. A demonstração é pública e não exige login. Quando houver um produto em produção, a autenticação será feita por um provedor dedicado, e não por uma simulação.',
  },
  {
    q: 'Posso conectar minha própria API?',
    a: 'A arquitetura separa a interface da fonte de dados por meio de um contrato simples (AnalyticsProvider). Basta implementar esse contrato para trocar os dados simulados pelos seus. Veja a documentação.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. O painel se adapta a telas pequenas, com navegação horizontal e tabelas com rolagem controlada.',
  },
  {
    q: 'Meus filtros e preferências são salvos?',
    a: 'As preferências de tema, período padrão e formatação ficam salvas no localStorage do seu navegador. Nada é enviado a servidores nesta demonstração.',
  },
];

export default function Landing() {
  usePageMeta(
    'PULSE OS — Analytics para pequenos negócios (demonstração)',
    'Painel de analytics demonstrativo com KPIs, conversão por canal, carteira de clientes e exportação CSV. Dados simulados.',
  );

  return (
    <div className="min-h-dvh">
      <Header />
      <main id="conteudo">
        <Hero />
        <Features />
        <UseCases />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PULSE OS — início">
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight">PULSE OS</span>
        </Link>
        <nav aria-label="Seções" className="hidden items-center gap-6 text-sm text-muted lg:flex">
          <a href="#recursos" className="transition hover:text-fg">Recursos</a>
          <a href="#casos" className="transition hover:text-fg">Casos de uso</a>
          <a href="#precos" className="transition hover:text-fg">Preços</a>
          <a href="#faq" className="transition hover:text-fg">Perguntas</a>
          <Link to="/docs" className="transition hover:text-fg">Documentação</Link>
        </nav>
        <Link to="/app" className="btn btn-primary px-4 py-2 text-sm">
          Explorar demo
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <img src={heroPhoto} alt="" fetchPriority="high" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[560px] bg-grid opacity-50" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-accent" aria-hidden="true" />
            Demonstração pública · dados simulados
          </span>
          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.02] md:text-6xl lg:text-7xl">
            O pulso do seu negócio,{' '}
            <span className="text-gradient">em um único painel.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            O PULSE OS reúne receita, conversão, canais e clientes em uma visão clara. Filtre períodos, pesquise
            transações, segmente a carteira e exporte tudo para CSV.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/app" className="btn btn-primary px-6 py-3">
              Explorar o produto →
            </Link>
            <Link to="/docs" className="btn btn-ghost px-6 py-3">
              Ver documentação
            </Link>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-6">
            <Stat label="Indicadores" value="5 KPIs" />
            <Stat label="Canais" value="6 origens" />
            <Stat label="Segmentos" value="4 perfis" />
          </dl>
        </div>

        <div className="animate-rise" style={{ animationDelay: '150ms' }}>
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="num mt-1.5 text-base font-medium text-fg">{value}</dd>
    </div>
  );
}

function SectionHeading({ id, eyebrow, title, text }: { id: string; eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="label text-accent">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-balance text-3xl font-bold md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-muted">{text}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="recursos" aria-labelledby="recursos-titulo" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHeading
          id="recursos-titulo"
          eyebrow="Recursos"
          title="Tudo o que você precisa para ler os números"
          text="Sem planilhas espalhadas. Um painel focado em decisões do dia a dia."
        />
      </Reveal>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title}>
            <article className="glass group h-full p-6 transition duration-300 hover:-translate-y-0.5 hover:border-accent/40">
              <span className="num text-xs text-accent" aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function UseCases() {
  const [active, setActive] = useState(USE_CASES[0].id);
  const current = USE_CASES.find((u) => u.id === active) ?? USE_CASES[0];

  return (
    <section id="casos" aria-labelledby="casos-titulo" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHeading
          id="casos-titulo"
          eyebrow="Casos de uso"
          title="Feito para operações pequenas e digitais"
          text="Escolha um tipo de negócio para ver o que o painel mostra em cada caso."
        />
      </Reveal>

      <Reveal className="mt-12">
        <div role="tablist" aria-label="Tipos de negócio" className="mx-auto flex max-w-full flex-wrap justify-center gap-2">
          {USE_CASES.map((u) => (
            <button
              key={u.id}
              role="tab"
              id={`tab-${u.id}`}
              aria-selected={u.id === active}
              aria-controls="caso-painel"
              type="button"
              onClick={() => setActive(u.id)}
              className={cx(
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                u.id === active ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-fg',
              )}
            >
              {u.label}
            </button>
          ))}
        </div>

        <div id="caso-painel" role="tabpanel" aria-labelledby={`tab-${current.id}`} className="glass mx-auto mt-8 grid max-w-5xl gap-8 p-6 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <h3 className="text-xl font-semibold text-fg">O desafio</h3>
            <p className="mt-2 text-muted">{current.problem}</p>
            <h3 className="mt-6 text-xl font-semibold text-fg">O que o PULSE OS mostra</h3>
            <p className="mt-2 text-muted">{current.shows}</p>
          </div>
          <div className="flex min-w-56 flex-col justify-center rounded-2xl border border-border/70 bg-surface2/50 p-6 text-center">
            <p className="label">{current.sample.metric}</p>
            <p className="num mt-3 text-4xl font-semibold text-accent">{current.sample.value}</p>
            <p className="mt-2 text-xs text-muted">{current.sample.note}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precos" aria-labelledby="precos-titulo" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHeading
          id="precos-titulo"
          eyebrow="Preços ilustrativos"
          title="Planos de exemplo para esta demonstração"
          text="Valores ilustrativos apenas para demonstrar a estrutura de uma página de preços. Não constituem oferta comercial."
        />
      </Reveal>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Reveal key={plan.name}>
            <article
              className={cx(
                'glass relative flex h-full flex-col p-7',
                plan.featured && 'border-accent/50 shadow-glow',
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-bg">
                  Destaque ilustrativo
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>
              <p className="mt-6">
                <span className="num text-3xl font-semibold text-fg">{plan.price}</span>
                <span className="text-sm text-muted">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/app" className={cx('btn mt-8', plan.featured ? 'btn-primary' : 'btn-ghost')}>
                Ver a demonstração
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted">
        Preços ilustrativos de demonstração, em reais, sem impostos. Nenhuma cobrança é feita nesta página.
      </p>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-titulo" className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHeading id="faq-titulo" eyebrow="Perguntas frequentes" title="Antes de explorar" text="Respostas diretas sobre a demonstração." />
      </Reveal>
      <div className="mt-12 space-y-3">
        {FAQ.map((item) => (
          <Reveal key={item.q}>
            <details className="glass group p-5 open:border-accent/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-fg">
                {item.q}
                <span aria-hidden="true" className="text-accent transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section aria-labelledby="cta-titulo" className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28">
      <Reveal>
        <div className="glass relative overflow-hidden px-6 py-14 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
          <h2 id="cta-titulo" className="relative text-balance text-3xl font-bold md:text-5xl">
            Veja o painel funcionando.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted">
            Filtre períodos, pesquise transações e exporte dados demonstrativos, sem criar conta.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/app" className="btn btn-primary px-7 py-3">
              Explorar o produto →
            </Link>
            <Link to="/docs" className="btn btn-ghost px-7 py-3">
              Documentação técnica
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="font-display font-bold text-fg">PULSE OS</p>
          <p className="mt-1 max-w-md text-xs">
            Produto fictício de demonstração. Todos os dados são simulados e não representam vendas, clientes ou finanças reais.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex gap-6">
          <Link to="/app" className="hover:text-fg">Painel</Link>
          <Link to="/docs" className="hover:text-fg">Documentação</Link>
          <a href="#faq" className="hover:text-fg">Perguntas</a>
        </nav>
      </div>
    </footer>
  );
}
