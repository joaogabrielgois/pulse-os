import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../lib/text';
import { type Direction } from '../lib/format';
import { useInView } from '../hooks';

// ---------- Superfícies ----------

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, subtitle, action, className, children }: CardProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={title ? titleId : undefined} className={cx('glass p-5 md:p-6', className)}>
      {(title || action) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && (
              <h2 id={titleId} className="text-base font-semibold text-fg md:text-lg">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

// ---------- Botões ----------

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  variant = 'ghost',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-bg shadow-glow hover:brightness-110',
    ghost: 'border border-border bg-surface2/50 text-fg hover:bg-surface2',
    danger: 'border border-danger/50 text-danger hover:bg-danger/10',
  };
  return <button type="button" className={cx('btn', variants[variant], className)} {...props} />;
}

// ---------- Seletor segmentado (filtros de período) ----------

interface SegmentedProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface2/60 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              active ? 'bg-accent text-bg shadow-glow' : 'text-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Badges e variações ----------

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'border-border text-muted',
  accent: 'border-accent/40 text-accent',
  success: 'border-success/40 text-success',
  warning: 'border-warning/40 text-warning',
  danger: 'border-danger/40 text-danger',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}

// Classes escritas por extenso: o Tailwind só gera o que encontra no código-fonte.
const DELTA_CLASSES: Record<Direction, string> = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-muted',
};
const DELTA_ARROW: Record<Direction, string> = { up: '▲', down: '▼', flat: '•' };
const DELTA_SR: Record<Direction, string> = {
  up: ' de alta em relação ao período anterior',
  down: ' de queda em relação ao período anterior',
  flat: ' sem variação em relação ao período anterior',
};

export function DeltaChip({ label, direction }: { label: string; direction: Direction }) {
  return (
    <span className={cx('num inline-flex items-center gap-1 text-xs font-medium', DELTA_CLASSES[direction])}>
      <span aria-hidden="true">{DELTA_ARROW[direction]}</span>
      {label}
      <span className="sr-only">{DELTA_SR[direction]}</span>
    </span>
  );
}

// ---------- KPIs ----------

interface KpiCardProps {
  label: string;
  value: string;
  delta?: { label: string; direction: Direction };
  hint?: string;
  index?: number;
}

export function KpiCard({ label, value, delta, hint, index = 0 }: KpiCardProps) {
  return (
    <article
      className="glass animate-rise p-4 md:p-5"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <p className="label">{label}</p>
      <p className="num mt-3 text-2xl font-semibold text-fg md:text-[1.7rem]">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta && <DeltaChip label={delta.label} direction={delta.direction} />}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    </article>
  );
}

// ---------- Estados ----------

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-accent">
        ○
      </span>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}

export function LoadingState({ label = 'Carregando dados de demonstração…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="glass p-8">
      <div className="mb-6 flex items-center gap-3 text-sm text-muted">
        <span className="h-2 w-2 animate-pulseDot rounded-full bg-accent" aria-hidden="true" />
        {label}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-surface2/70" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="glass border-danger/40 p-8 text-center">
      <h2 className="text-lg font-semibold text-danger">Não foi possível carregar os dados</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
    </div>
  );
}

export function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'danger'; children: ReactNode }) {
  const classes = { neutral: 'border-border text-muted', success: 'border-success/40 text-success', danger: 'border-danger/40 text-danger' };
  return (
    <p role="status" className={cx('rounded-xl border bg-surface2/40 px-4 py-2.5 text-sm', classes[tone])}>
      {children}
    </p>
  );
}

// ---------- Paginação ----------

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav aria-label="Paginação" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <span>
        {totalItems} {totalItems === 1 ? 'registro' : 'registros'} · página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Button className="px-3 py-1.5" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">
          ← Anterior
        </Button>
        <Button className="px-3 py-1.5" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Próxima página">
          Próxima →
        </Button>
      </div>
    </nav>
  );
}

// ---------- Campos de formulário ----------

interface FieldBaseProps {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({
  label,
  error,
  hint,
  id,
  ...props
}: FieldBaseProps & InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        className={cx('input', error && 'border-danger focus:ring-danger/30')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <span id={errorId} className="text-xs text-danger">
          {error}
        </span>
      ) : (
        hint && <span className="text-xs text-muted">{hint}</span>
      )}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} className="input appearance-none pr-8" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({ id, label, description, checked, onChange }: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-4 last:border-0">
      <div>
        <label htmlFor={id} className="font-medium text-fg">
          {label}
        </label>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full border transition',
          checked ? 'border-accent bg-accent/30' : 'border-border bg-surface2',
        )}
      >
        <span
          className={cx(
            'absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full transition-transform',
            checked ? 'translate-x-5 bg-accent' : 'translate-x-0 bg-muted',
          )}
        />
      </button>
    </div>
  );
}

// ---------- Revelação ao rolar ----------

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const [ref, visible] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cx('reveal', visible && 'reveal-visible', className)}>
      {children}
    </div>
  );
}

// ---------- Aviso de dados simulados ----------

export function DemoBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={cx(
        'flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 text-sm text-warning',
        compact ? 'py-2' : 'py-3',
      )}
    >
      <strong className="font-semibold">Demonstração</strong>
      <span className="text-fg/80">Todos os dados são simulados e não representam vendas, clientes ou finanças reais.</span>
    </div>
  );
}
