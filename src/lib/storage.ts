import type { Settings } from '../types';

export const SETTINGS_KEY = 'pulse-os:settings:v1';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  defaultPeriod: '30d',
  pageSize: 10,
  animations: true,
  compactNumbers: true,
};

const PERIODS: Settings['defaultPeriod'][] = ['7d', '30d', '90d', '365d'];
const PAGE_SIZES: Settings['pageSize'][] = [10, 20, 50];

/**
 * Valida qualquer valor vindo do localStorage. Campos inválidos voltam ao padrão,
 * então uma preferência corrompida nunca quebra a aplicação.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    theme: input.theme === 'light' || input.theme === 'dark' ? input.theme : DEFAULT_SETTINGS.theme,
    defaultPeriod: PERIODS.includes(input.defaultPeriod as Settings['defaultPeriod'])
      ? (input.defaultPeriod as Settings['defaultPeriod'])
      : DEFAULT_SETTINGS.defaultPeriod,
    pageSize: PAGE_SIZES.includes(input.pageSize as Settings['pageSize'])
      ? (input.pageSize as Settings['pageSize'])
      : DEFAULT_SETTINGS.pageSize,
    animations: typeof input.animations === 'boolean' ? input.animations : DEFAULT_SETTINGS.animations,
    compactNumbers:
      typeof input.compactNumbers === 'boolean' ? input.compactNumbers : DEFAULT_SETTINGS.compactNumbers,
  };
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return sanitizeSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Armazenamento indisponível (modo privado, cota cheia): o app segue sem persistir.
  }
}
