import type { Dataset } from '../types';
import { generateDataset } from './generate';

/**
 * Contrato entre a interface e a fonte de dados.
 * Hoje existe apenas a fonte de demonstração. Para conectar uma API real,
 * implemente `AnalyticsProvider` (ex.: fetch para /api/metricas) e passe-o ao DataProvider.
 */
export interface AnalyticsProvider {
  loadDataset(): Promise<Dataset>;
}

let cached: Promise<Dataset> | null = null;

/** Fonte de demonstração: dados simulados gerados no navegador, com latência simulada. */
export const demoProvider: AnalyticsProvider = {
  loadDataset() {
    if (!cached) {
      cached = new Promise<Dataset>((resolve) => {
        window.setTimeout(() => resolve(generateDataset()), 350);
      });
    }
    return cached;
  },
};

/** Seleciona a fonte pela variável de ambiente. Valores não suportados geram erro visível. */
export function resolveProvider(source: string | undefined): AnalyticsProvider {
  if (!source || source === 'demo') return demoProvider;
  return {
    loadDataset: () =>
      Promise.reject(new Error(`Fonte de dados "${source}" ainda não está implementada nesta versão.`)),
  };
}
