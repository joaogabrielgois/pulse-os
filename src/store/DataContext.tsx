import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Dataset } from '../types';
import { resolveProvider, type AnalyticsProvider } from '../data/provider';

export type DataState =
  | { status: 'loading' }
  | { status: 'ready'; data: Dataset }
  | { status: 'error'; message: string };

const DataContext = createContext<DataState | null>(null);

const provider: AnalyticsProvider = resolveProvider(import.meta.env.VITE_DATA_SOURCE);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    provider
      .loadDataset()
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (!alive) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Não foi possível carregar os dados.',
        });
      });
    return () => {
      alive = false;
    };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useDataState(): DataState {
  const context = useContext(DataContext);
  if (!context) throw new Error('useDataState deve ser usado dentro de DataProvider.');
  return context;
}
