import type { ReactNode } from 'react';

/** How trustworthy the figures inside a region are.
 *  measured     — read from the engine's own output for this assessment (a golden file). It must say where in that
 *                 file it comes from (`from`), and the file's name and SHA-256 are shown at the top of the page.
 *  illustrative — fixture data, or a projection: the shape is real, the number is a worked example
 *  planned      — not built; the region shows intended design only */
export type Tier = 'measured' | 'illustrative' | 'planned';

export const TIER_MEANING: Record<Tier, string> = {
  measured: 'Read from the engine’s output for this assessment; the file and its SHA-256 are shown at the top of the page',
  illustrative: 'Fixture data; the shape is real, the number is a worked example',
  planned: 'Not built; the screen shows intended design only',
};

const DOT: Record<Tier, string> = {
  measured: 'bg-emerald-500',
  illustrative: 'bg-amber-500',
  planned: 'bg-slate-400',
};

type Common = {
  note?: ReactNode;
  children: ReactNode;
  as?: 'div' | 'span';
  className?: string;
};

/** `measured` cannot be claimed without saying where in the engine's output the figures are read from: `from` is a
 *  dotted path into the active assessment (e.g. "after.views.unweighted"), and a test holds every one to the data. */
export type ProvenanceProps = Common & ({ tier: 'illustrative' | 'planned'; from?: undefined } | { tier: 'measured'; from: string });

export function Provenance({ tier, from, note, children, as = 'div', className = '' }: ProvenanceProps) {
  const Tag = as;
  return (
    <Tag
      data-tier={tier}
      data-source={from}
      className={`relative ${tier === 'planned' ? 'opacity-[0.85]' : ''} ${className}`}
    >
      <span
        data-tier-chip={tier}
        title={from ? `${TIER_MEANING[tier]} (${from})` : TIER_MEANING[tier]}
        className={`${
          as === 'span' ? 'mr-1.5 align-middle' : 'absolute -top-2.5 right-3 z-[1]'
        } inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-px text-[10px] font-medium leading-4 text-slate-600 shadow-sm`}
      >
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[tier]}`} />
        {tier}
      </span>
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

/** The figures of a state: MEASURED when they are the engine's assessed state (after the upload, no analyst override),
 *  otherwise a projection (before the upload: rule R's projection of the engine's data, not an engine run; with an
 *  override: the engine's figure moved by an analyst, which the assessment file does not contain). */
export function StateProvenance({
  uploaded,
  overridesActive = 0,
  from,
  note,
  children,
  as = 'div',
  className = '',
}: {
  uploaded: boolean;
  overridesActive?: number;
  /** where in the assessment file the figures are read from */
  from: string;
  note?: ReactNode;
  children: ReactNode;
  as?: 'div' | 'span';
  className?: string;
}) {
  if (uploaded && overridesActive === 0) {
    return (
      <Provenance tier="measured" from={from} note={note} as={as} className={className}>
        {children}
      </Provenance>
    );
  }
  return (
    <Provenance
      tier="illustrative"
      as={as}
      className={className}
      note={
        <>
          {uploaded
            ? 'Includes analyst overrides, which the assessment file does not contain.'
            : 'Before the upload: a projection (rule R), not an engine run.'}
          {note ? <> {note}</> : null}
        </>
      }
    >
      {children}
    </Provenance>
  );
}
