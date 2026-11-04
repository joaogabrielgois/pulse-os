import { useMemo, useRef, useState } from 'react';
import { ANCHOR_DATE } from '../data/generate';
import { buildSeries, presetRange, summarize, type RangePreset } from '../data/analytics';
import { DataProvider, useDataState } from '../store/DataContext';
import { useCountUp } from '../hooks';
import { formatCurrency, formatPercent } from '../lib/format';
import { formatDateBR } from '../lib/dates';
import { cx } from '../lib/text';

/**
 * Pré-visualização interativa exibida na landing page.
 * Usa os mesmos dados simulados do painel, então os números são coerentes com o produto.
 */
export function HeroDashboard() {
  return (
    <DataProvider>
      <HeroInner />
    </DataProvider>
  );
}

const PRESETS: ReadonlyArray<{ value: RangePreset; label: string }> = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

const W = 640;
const H = 220;
const PAD = 14;

function HeroInner() {
  const state = useDataState();
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const model = useMemo(() => {
    if (state.status !== 'ready') return null;
    const range = presetRange(preset, ANCHOR_DATE);
    const series = buildSeries(state.data, range);
    const summary = summarize(state.data, range);
    const max = Math.max(...series.map((p) => p.revenue), 1);
    const step = series.length > 1 ? (W - PAD * 2) / (series.length - 1) : 0;
    const points = series.map((p, i) => ({
      x: PAD + i * step,
      y: H - PAD - (p.revenue / max) * (H - PAD * 2),
      point: p,
    }));
    const line = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
    const lastX = points.length > 0 ? points[points.length - 1].x : W - PAD;
    const area = `${line} L${lastX.toFixed(1)},${H} L${PAD},${H} Z`;
    return { range, series, summary, points, line, area };
  }, [state, preset]);

  const revenueTarget = model?.summary.revenue ?? 0;
  const conversionTarget = model?.summary.conversionRate ?? 0;
  const animatedRevenue = useCountUp(revenueTarget);
  const animatedConversion = useCountUp(conversionTarget * 100, 1100);

  const onPointerMove = (clientX: number) => {
    if (!model || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (model.points.length - 1)));
  };

  const active = model && hover !== null ? model.points[hover] : null;

  return (
    <div className="glass relative overflow-hidden p-5 md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Dados simulados · atualizado no navegador
        </div>
        <div role="group" aria-label="Período da prévia" className="inline-flex rounded-lg border border-border bg-surface2/60 p-0.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={preset === p.value}
              onClick={() => setPreset(p.value)}
              className={cx(
                'rounded-md px-2.5 py-1 text-xs font-medium transition',
                preset === p.value ? 'bg-accent text-bg' : 'text-muted hover:text-fg',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-surface2/50 p-3.5">
          <p className="label">Receita</p>
          <p className="num mt-2 text-xl font-semibold text-fg md:text-2xl" aria-live="polite">
            {model ? formatCurrency(animatedRevenue, true) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-surface2/50 p-3.5">
          <p className="label">Conversão</p>
          <p className="num mt-2 text-xl font-semibold text-accent md:text-2xl">
            {model ? formatPercent(animatedConversion / 100) : '—'}
          </p>
        </div>
      </div>

      <div className="relative mt-5 h-56">
        {state.status === 'loading' && <div className="h-full animate-pulse rounded-xl bg-surface2/60" aria-hidden="true" />}
        {model && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-full w-full touch-none select-none"
            role="img"
            aria-label={`Receita de ${formatDateBR(model.range.start)} a ${formatDateBR(model.range.end)}, total ${formatCurrency(model.summary.revenue)}. Passe o cursor para ver valores diários.`}
            onPointerMove={(e) => onPointerMove(e.clientX)}
            onPointerLeave={() => setHover(null)}
            onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
          >
            <defs>
              <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)} stroke="rgb(var(--c-border))" strokeDasharray="3 6" />
            ))}
            <path d={model.area} fill="url(#hero-area)" className="fade-in" />
            <path
              key={`${preset}-line`}
              d={model.line}
              pathLength={1}
              fill="none"
              stroke="rgb(var(--c-accent))"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="draw-line"
            />
            {active && (
              <g>
                <line x1={active.x} x2={active.x} y1={PAD} y2={H} stroke="rgb(var(--c-accent))" strokeOpacity="0.35" />
                <circle cx={active.x} cy={active.y} r="5" fill="rgb(var(--c-accent))" stroke="rgb(var(--c-bg))" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}

        {active && (
          <div
            className="num pointer-events-none absolute -top-1 rounded-lg border border-border bg-surface/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur"
            style={{ left: `clamp(0%, calc(${(active.x / W) * 100}% - 60px), calc(100% - 130px))` }}
          >
            <span className="block text-muted">{formatDateBR(active.point.key)}</span>
            <span className="text-fg">{formatCurrency(active.point.revenue)}</span>
          </div>
        )}
      </div>

      <div className="relative mt-3 flex justify-between text-[11px] text-muted">
        <span>{model ? formatDateBR(model.range.start) : ''}</span>
        <span>{model ? `${model.summary.orders} pedidos pagos` : ''}</span>
        <span>{model ? formatDateBR(model.range.end) : ''}</span>
      </div>
    </div>
  );
}
