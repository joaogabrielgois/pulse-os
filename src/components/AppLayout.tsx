import { NavLink, Outlet, Link } from 'react-router-dom';
import { DataProvider } from '../store/DataContext';
import { useSettings } from '../store/SettingsContext';
import { DemoBanner, Button } from './ui';
import { cx } from '../lib/text';
import { Logo } from './Logo';

const NAV = [
  { to: '/app', label: 'Visão geral', end: true },
  { to: '/app/transacoes', label: 'Transações', end: false },
  { to: '/app/clientes', label: 'Clientes', end: false },
  { to: '/app/configuracoes', label: 'Configurações', end: false },
];

export function AppLayout() {
  return (
    <DataProvider>
      <AppChrome />
    </DataProvider>
  );
}

function AppChrome() {
  const { settings, update } = useSettings();
  const isDark = settings.theme === 'dark';

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="PULSE OS — voltar ao site">
            <Logo />
            <span className="font-display text-lg font-bold tracking-tight">PULSE OS</span>
            <span className="ml-1 hidden rounded-full border border-warning/40 px-2 py-0.5 text-[11px] font-medium text-warning sm:inline">
              demo
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              className="px-3 py-2 text-xs"
              aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
              onClick={() => update({ theme: isDark ? 'light' : 'dark' })}
            >
              {isDark ? '☀ Claro' : '☾ Escuro'}
            </Button>
            <Link to="/docs" className="btn btn-ghost hidden px-3 py-2 text-xs sm:inline-flex">
              Documentação
            </Link>
          </div>
        </div>

        <nav aria-label="Principal" className="mx-auto max-w-7xl overflow-x-auto px-4 md:px-8">
          <ul className="flex min-w-max gap-1 pb-2">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cx(
                      'inline-flex rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive ? 'bg-surface2 text-accent shadow-[inset_0_0_0_1px_rgb(var(--c-accent)/0.35)]' : 'text-muted hover:text-fg',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <DemoBanner compact />
        </div>
        <Outlet />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted md:px-8">
        PULSE OS é um produto fictício de demonstração. Nenhum dado exibido é real.
      </footer>
    </div>
  );
}
