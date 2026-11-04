# PULSE OS

Painel de analytics **demonstrativo** para pequenos negócios e operações digitais, construído com
React, TypeScript, Vite, Tailwind CSS e Recharts.

> **Aviso:** o PULSE OS é um produto fictício. Todos os dados exibidos são **simulados** e não representam
> vendas, clientes ou finanças reais. Não há autenticação nem backend nesta versão.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Requisitos](#requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Scripts](#scripts)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Arquitetura](#arquitetura)
- [Dados simulados](#dados-simulados)
- [Integração com API real](#integração-com-api-real)
- [Verificação](#verificação)
- [Acessibilidade e SEO](#acessibilidade-e-seo)
- [Implantação na Vercel](#implantação-na-vercel)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Funcionalidades

**Landing page (`/`)**
- Hero com dashboard animado e interativo (passe o cursor sobre o gráfico).
- Recursos, casos de uso com abas, preços ilustrativos (rotulados como demonstração), FAQ e CTA.
- Metadados, Open Graph, JSON-LD, `robots.txt` e `sitemap.xml`.

**Painel (`/app`)**
1. **Visão geral:** cinco KPIs com variação frente ao período anterior, gráfico de receita, receita por canal,
   carteira por segmento e tabela de apoio para o gráfico.
2. **Filtros de período:** 7 dias, 30 dias, 90 dias, 12 meses e **personalizado** (com validação de datas,
   limite de 365 dias e mensagens de erro acessíveis).
3. **Transações:** busca tolerante a acentos, filtro por status e intervalo de datas, ordenação por coluna
   (`aria-sort`), paginação configurável e exportação CSV dos resultados filtrados.
4. **Clientes:** busca, filtros de segmento e canal, ordenação, lista com seleção e painel de detalhes com
   histórico das últimas transações.
5. **Exportação CSV:** separador `;`, BOM UTF-8 e escape correto, prontos para o Excel em português.
6. **Tema claro/escuro:** aplicado antes do primeiro paint (sem "piscar") e persistido no `localStorage`.
7. **Configurações:** tema, período padrão, linhas por página, formatação abreviada, animações e
   restauração dos padrões com confirmação.
8. **Estados:** carregamento (skeleton), erro, vazio, período inválido e feedback após exportação.

**Documentação (`/docs`):** primeiros passos, definições de KPIs, exportação, integração e limites.

---

## Requisitos

- Node.js **20 ou superior** (recomendado: 22 LTS)
- npm 10+

## Instalação e execução

```bash
# 1. Instale as dependências
npm install

# 2. (Opcional) crie o arquivo de ambiente
cp .env.example .env

# 3. Execute em desenvolvimento
npm run dev          # http://localhost:5173

# 4. Verifique tipos, gere a build de produção e pré-visualize
npm run build
npm run preview
```

## Scripts

| Script           | Função                                                              |
| ---------------- | ------------------------------------------------------------------- |
| `npm run dev`    | Servidor de desenvolvimento do Vite                                 |
| `npm run typecheck` | Verificação de tipos com TypeScript em modo estrito             |
| `npm run build`  | `typecheck` seguido da build de produção em `dist/`                 |
| `npm run preview`| Serve a build localmente                                            |
| `npm run verify` | Testa a lógica de domínio (dados, KPIs, filtros, CSV, preferências) |

## Variáveis de ambiente

Arquivo `.env.example`:

| Variável            | Padrão                                  | Descrição |
| ------------------- | --------------------------------------- | --------- |
| `VITE_DATA_SOURCE`  | `demo`                                  | Fonte de dados. `demo` usa os dados simulados. Outros valores exibem o estado de erro "não implementada" até que um provedor seja criado. |
| `VITE_SITE_URL`     | `https://pulse-os-demo.vercel.app`      | URL pública do site. Atualize também `index.html` e `public/sitemap.xml` ao mudar de domínio. |

Variáveis `VITE_*` são **públicas** (incorporadas à build). Nunca coloque segredos nelas.

---

## Estrutura do projeto

```
pulse-os/
├── index.html                 # SEO, Open Graph, JSON-LD e script anti-flash do tema
├── public/                    # favicon, robots.txt, sitemap.xml
├── scripts/verify.ts          # verificação automatizada da lógica (npm run verify)
├── src/
│   ├── main.tsx               # ponto de entrada (BrowserRouter)
│   ├── App.tsx                # rotas
│   ├── index.css              # tokens de tema (variáveis CSS), componentes e movimento
│   ├── types.ts               # tipos de domínio e preferências
│   ├── data/                  # camada de dados — sem React
│   │   ├── random.ts          # PRNG determinístico (mulberry32)
│   │   ├── generate.ts        # gerador da empresa simulada
│   │   ├── analytics.ts       # KPIs, séries, breakdowns, filtros, ordenação, paginação
│   │   └── provider.ts        # contrato AnalyticsProvider e fonte demo
│   ├── lib/                   # utilidades puras
│   │   ├── dates.ts           # datas ISO em UTC
│   │   ├── format.ts          # moeda, números, variações (pt-BR)
│   │   ├── csv.ts             # geração e download de CSV
│   │   ├── storage.ts         # preferências com validação
│   │   └── text.ts            # normalização para busca e classes
│   ├── store/                 # estado global via Context
│   │   ├── SettingsContext.tsx
│   │   └── DataContext.tsx    # loading / ready / error
│   ├── hooks/index.ts         # useCountUp, usePageMeta, useInView
│   ├── components/
│   │   ├── ui.tsx             # Card, KpiCard, SegmentedControl, Pagination, campos, estados
│   │   ├── charts.tsx         # gráficos Recharts acessíveis e temáticos
│   │   ├── AppLayout.tsx      # cabeçalho, navegação e aviso de demonstração
│   │   ├── WithData.tsx       # trata loading e erro antes de renderizar
│   │   └── Logo.tsx
│   └── pages/
│       ├── Landing.tsx        # landing page
│       ├── HeroDashboard.tsx  # pré-visualização animada do hero
│       ├── Dashboard.tsx      # visão geral
│       ├── Transactions.tsx
│       ├── Customers.tsx
│       ├── Settings.tsx
│       └── Docs.tsx
├── vercel.json                # build, rewrites de SPA e cabeçalhos de segurança
└── tailwind.config.js         # cores ligadas a variáveis CSS (suporte a tema)
```

## Arquitetura

- **Separação em camadas.** `data/` e `lib/` são funções puras, sem React e sem acesso ao DOM (exceto
  `csv.ts` e `storage.ts`, que tocam o navegador apenas dentro de funções). `components/` e `pages/`
  apenas apresentam o resultado.
- **Contrato de dados.** A interface depende de `AnalyticsProvider.loadDataset(): Promise<Dataset>`.
  Trocar a demo por uma API é uma mudança localizada em `provider.ts`.
- **Tema por variáveis CSS.** As cores do Tailwind apontam para `rgb(var(--c-*) / <alpha-value>)`.
  Trocar o tema é apenas trocar um atributo em `<html>`, sem recompilar nem duplicar classes.
- **Preferências validadas.** `sanitizeSettings` valida cada campo lido do `localStorage`; valores corrompidos
  voltam ao padrão sem quebrar a aplicação.
- **Recharts com paleta por tema** e um resumo textual em `role="img"` em cada gráfico, além de uma
  tabela alternativa no gráfico de receita.

## Dados simulados

O gerador cria, de forma **determinística** (semente fixa), uma empresa fictícia com:

- **480 clientes** com nomes, cidades e e-mails `@demo.pulse.test` (domínio reservado para testes).
- **Cerca de 3.000 transações** em 365 dias, com tendência de crescimento, sazonalidade semanal e ruído.
- **Métricas diárias derivadas das transações:** receita e pedidos vêm das compras pagas; sessões são
  estimadas a partir de uma taxa de conversão. Por isso, a soma dos KPIs é sempre consistente com as
  transações.
- **Segmentos calculados pelo histórico:** VIP (total pago ≥ R$ 1.500), Em risco (última compra há mais de
  60 dias), Recorrente (3 ou mais compras) e Novo (demais casos).

Como a semente é fixa, os números são reproduzíveis: a mesma build sempre mostra os mesmos valores.

## Integração com API real

1. Implemente o contrato em `src/data/provider.ts`:

   ```ts
   export const apiProvider: AnalyticsProvider = {
     async loadDataset() {
       const res = await fetch(`${import.meta.env.VITE_API_URL}/metricas`);
       if (!res.ok) throw new Error('Falha ao carregar métricas');
       return (await res.json()) as Dataset; // tipo definido em src/types.ts
     },
   };
   ```

2. Substitua a seleção em `resolveProvider` para usar o novo provedor conforme `VITE_DATA_SOURCE`.
3. Para autenticação, use um provedor dedicado (Clerk, Auth0, Supabase Auth, entre outros). **Não** implemente
   login caseiro, e nunca confie em validações feitas apenas no navegador.
4. Se o dataset ficar grande, mova `summarize`, `buildSeries` e os filtros para o servidor e mantenha a
   mesma assinatura de resposta. As funções em `analytics.ts` já servem de referência de regras de negócio.

## Verificação

```bash
npm run verify
```

O script testa, sem navegador:

- determinismo do gerador e consistência entre transações e métricas diárias;
- regras de segmentação;
- períodos, período anterior e agregação das séries;
- validação de datas (inexistentes, invertidas, acima de 365 dias, fora da base);
- busca, filtros, ordenação e paginação de transações e clientes;
- escape de CSV, sanitização de preferências e formatadores pt-BR.

Na última execução de referência: **56 de 56 verificações aprovadas**.

Além disso, `npm run typecheck` verifica os tipos de todo o projeto em modo `strict`. Esse passo depende da instalação completa das dependências (`npm install`).

## Acessibilidade e SEO

- Navegação por teclado com foco visível, link "Pular para o conteúdo" e `aria-current` via `NavLink`.
- Tabelas com `caption`, `scope` e `aria-sort`; ordenação por botões nos cabeçalhos.
- Gráficos com `role="img"` e `aria-label` descritivo, mais tabela alternativa.
- Formulários com `label` associado, `aria-invalid` e `aria-describedby` nos erros.
- Respeito a `prefers-reduced-motion` e a uma opção própria de desativar animações.
- Paletas de contraste definidas para os dois temas. **Recomenda-se uma auditoria com ferramenta dedicada** (por exemplo, axe DevTools ou Lighthouse) antes do lançamento.
- SEO: título e descrição por página, Open Graph, JSON-LD (`SoftwareApplication`), `robots.txt`,
  `sitemap.xml` e URLs legíveis.

> **Observação de SEO:** a aplicação é uma SPA. Para indexação completa da landing, considere
> pré-renderizar `/`, `/docs` e `/app` (com uma ferramenta de pré-renderização para Vite ou migrando para
> Next.js/Astro quando o produto real for lançado).

## Implantação na Vercel

### Opção A: pelo painel (recomendada)

1. Envie o projeto para um repositório no GitHub, GitLab ou Bitbucket.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. A Vercel detecta **Vite**. Confirme:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Em **Environment Variables**, adicione as variáveis do `.env.example` se quiser sobrescrever os padrões.
5. Clique em **Deploy**.

O arquivo `vercel.json` já configura as reescritas de SPA (todas as rotas servem `index.html`) e
cabeçalhos básicos de segurança (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`).

### Opção B: pela CLI

```bash
npm i -g vercel
vercel login
vercel          # primeiro deploy (preview)
vercel --prod   # produção
```

### Domínio próprio

No painel da Vercel, em **Settings → Domains**, adicione seu domínio. Depois, atualize `VITE_SITE_URL`,
a `<link rel="canonical">` e o `og:url` em `index.html`, além de `public/sitemap.xml` e `public/robots.txt`.

## Limitações conhecidas

- **Sem backend, banco ou autenticação.** A demonstração é pública por design; dados e preferências ficam no navegador.
- **Dados simulados.** Não há cálculo fiscal, contábil ou de conciliação real.
- **Fonte externa.** As fontes Syne, Hanken Grotesk e JetBrains Mono são carregadas do Google Fonts. Sem
  acesso à rede, o painel usa as fontes de sistema como fallback.
- **Latência simulada.** A fonte demo aguarda 350 ms para exibir os estados de carregamento.
- **Exportações CSV** são geradas no navegador e incluem apenas dados simulados.
- **Preços da landing** são ilustrativos e não constituem oferta.
