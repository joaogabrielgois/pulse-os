import type { ReactNode } from 'react';
import type { Dataset } from '../types';
import { useDataState } from '../store/DataContext';
import { ErrorState, LoadingState } from './ui';

/** Renderiza `children` somente quando o dataset estiver pronto; cuida de loading e erro. */
export function WithData({ children }: { children: (data: Dataset) => ReactNode }) {
  const state = useDataState();
  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState message={state.message} />;
  return <>{children(state.data)}</>;
}
