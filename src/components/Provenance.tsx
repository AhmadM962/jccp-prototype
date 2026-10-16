import type { ReactNode } from 'react';

/** How trustworthy the figures inside a region are.
 *  measured     — produced by the real assessment engine (chip hidden)
 *  illustrative — fixture data; the shape is real, the number is a worked example
 *  planned      — not built; the region shows intended design only */
export type Tier = 'measured' | 'illustrative' | 'planned';

export const TIER_MEANING: Record<Tier, string> = {
  measured: 'Produced by the real assessment engine',
  illustrative: 'Fixture data; the shape is real, the number is a worked example',
  planned: 'Not built; the screen shows intended design only',
};

const DOT: Record<Tier, string> = {
  measured: 'bg-emerald-500',
  illustrative: 'bg-amber-500',
  planned: 'bg-slate-400',
};

export function Provenance({
  tier,
  note,
  children,
  as = 'div',
  className = '',
}: {
  tier: Tier;
  note?: ReactNode;
  children: ReactNode;
  as?: 'div' | 'span';
  className?: string;
}) {
  const Tag = as;
  return (
    <Tag
      data-tier={tier}
      className={`relative ${tier === 'planned' ? 'opacity-[0.85]' : ''} ${className}`}
    >
      {tier !== 'measured' && (
        <span
          data-tier-chip={tier}
          title={TIER_MEANING[tier]}
          className="absolute -top-2.5 right-3 z-[1] inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-px text-[10px] font-medium leading-4 text-slate-600 shadow-sm"
        >
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[tier]}`} />
          {tier}
        </span>
      )}
      {children}
      {note && <span className="mt-1 block text-[11px] text-slate-500">{note}</span>}
    </Tag>
  );
}

/** Persistent legend for the top bar. */
export function TierLegend() {
  const tiers: Tier[] = ['measured', 'illustrative', 'planned'];
  return (
    <div
      data-testid="tier-legend"
      className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
      aria-label="Data provenance legend"
    >
      <span className="hidden font-semibold lg:inline">Data:</span>
      {tiers.map((t) => (
        <span key={t} title={TIER_MEANING[t]} className="inline-flex items-center gap-1">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[t]}`} />
          <span className="hidden sm:inline">{t}</span>
          <span className="sr-only sm:hidden">{t}</span>
        </span>
      ))}
    </div>
  );
}
