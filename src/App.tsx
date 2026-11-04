import { Link, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from './store/SettingsContext';
import { AppLayout } from './components/AppLayout';
import { usePageMeta } from './hooks';
import Landing from './pages/Landing';
import Docs from './pages/Docs';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Customers from './pages/Customers';
import Settings from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="transacoes" element={<Transactions />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SettingsProvider>
  );
}

function NotFound() {
  usePageMeta('Página não encontrada — PULSE OS', 'O endereço solicitado não existe no PULSE OS.');
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="label">Erro 404</p>
      <h1 className="font-display text-4xl font-bold">Esta página não existe</h1>
      <p className="max-w-md text-muted">Verifique o endereço ou volte para o painel de demonstração.</p>
      <div className="flex gap-3">
        <Link to="/app" className="btn btn-primary px-5 py-2.5">
          Ir para o painel
        </Link>
        <Link to="/" className="btn btn-ghost px-5 py-2.5">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
