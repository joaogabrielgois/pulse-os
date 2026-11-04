import { useState } from 'react';
import type { Settings as SettingsShape, ThemeMode } from '../types';
import { PRESET_LABELS, type RangePreset } from '../data/analytics';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../lib/storage';
import { useSettings } from '../store/SettingsContext';
import { usePageMeta } from '../hooks';
import { Button, Card, Notice, SegmentedControl, Toggle } from '../components/ui';

export default function Settings() {
  usePageMeta('Configurações — PULSE OS', 'Preferências do painel: tema, período padrão, paginação e animações.');
  const { settings, update, reset } = useSettings();
  const [status, setStatus] = useState<{ tone: 'success' | 'neutral'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const flash = (text: string) => {
    setStatus({ tone: 'success', text });
    window.setTimeout(() => setStatus(null), 2600);
  };

  const change = (patch: Partial<SettingsShape>, label: string) => {
    update(patch);
    flash(`${label} atualizado e salvo neste navegador.`);
  };

  const doReset = () => {
    reset();
    setConfirmReset(false);
    flash('Preferências restauradas para o padrão.');
  };

  const periodOptions = (Object.keys(PRESET_LABELS) as RangePreset[]).map((value) => ({
    value,
    label: PRESET_LABELS[value],
  }));
  const themeOptions: ReadonlyArray<{ value: ThemeMode; label: string }> = [
    { value: 'dark', label: 'Escuro' },
    { value: 'light', label: 'Claro' },
  ];
  const pageSizeOptions: ReadonlyArray<{ value: string; label: string }> = [
    { value: '10', label: '10 linhas' },
    { value: '20', label: '20 linhas' },
    { value: '50', label: '50 linhas' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Preferências do painel. Ficam salvas apenas no seu navegador (localStorage) e não são enviadas a nenhum servidor.
        </p>
      </header>

      {status && <Notice tone={status.tone}>{status.text}</Notice>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Aparência" subtitle="Tema aplicado imediatamente em todo o site.">
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              <span className="label">Tema</span>
              <SegmentedControl
                label="Tema"
                options={themeOptions}
                value={settings.theme}
                onChange={(theme) => change({ theme }, 'Tema')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="label">Período padrão ao abrir o painel</span>
              <SegmentedControl
                label="Período padrão"
                options={periodOptions}
                value={settings.defaultPeriod}
                onChange={(defaultPeriod) => change({ defaultPeriod }, 'Período padrão')}
              />
            </div>
          </div>
        </Card>

        <Card title="Tabelas e dados" subtitle="Como listas e números são apresentados.">
          <div className="flex flex-col gap-2">
            <span className="label">Linhas por página</span>
            <SegmentedControl
              label="Linhas por página"
              options={pageSizeOptions}
              value={String(settings.pageSize)}
              onChange={(v) => change({ pageSize: Number(v) as SettingsShape['pageSize'] }, 'Linhas por página')}
            />
          </div>
          <div className="mt-6">
            <Toggle
              id="compact-numbers"
              label="Valores abreviados nos gráficos"
              description="Mostra R$ 12,4 mil em vez de R$ 12.415,00 nos eixos e cards."
              checked={settings.compactNumbers}
              onChange={(compactNumbers) => change({ compactNumbers }, 'Formatação de números')}
            />
            <Toggle
              id="animations"
              label="Animações"
              description="Desative para reduzir movimento. Também respeita a preferência do sistema por menos movimento."
              checked={settings.animations}
              onChange={(animations) => change({ animations }, 'Animações')}
            />
          </div>
        </Card>
      </div>

      <Card title="Restaurar padrões" subtitle="Remove as preferências salvas deste navegador.">
        <div className="flex flex-wrap items-center gap-3">
          {confirmReset ? (
            <>
              <span className="text-sm text-muted">Confirmar a restauração?</span>
              <Button variant="danger" onClick={doReset}>
                Sim, restaurar
              </Button>
              <Button onClick={() => setConfirmReset(false)}>Cancelar</Button>
            </>
          ) : (
            <Button onClick={() => setConfirmReset(true)}>Restaurar padrões</Button>
          )}
        </div>
        <p className="mt-4 text-xs text-muted">
          Chave de armazenamento: <code className="num">{SETTINGS_KEY}</code> · padrão atual: tema {DEFAULT_SETTINGS.theme}, período {PRESET_LABELS[DEFAULT_SETTINGS.defaultPeriod as RangePreset]}.
        </p>
      </Card>

      <p className="text-xs text-muted">
        Limpar os dados do navegador também remove estas preferências. Nenhuma informação pessoal é coletada nesta demonstração.
      </p>
    </div>
  );
}
