/** Marca do produto: uma linha de pulso dentro de um quadrado com brilho ciano. */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="rgb(var(--c-surface-2))" stroke="rgb(var(--c-accent) / 0.45)" />
      <path
        d="M5 17h5l2.2-6 4 12 3.2-9.5 2.3 3.5H27"
        fill="none"
        stroke="rgb(var(--c-accent))"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
