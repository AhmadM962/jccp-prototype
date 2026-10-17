// The engine's demotion checks, all of them, as published: a check that could not run is shown as
// "not assessed" (neither passed nor failed), never as a pass. Figures come from src/data/profiles (read through src/data/current.ts);
// the detail line of each check is the engine's own string.

import { CURRENT, type CheckCause, type CheckStatus, type DemotionCheck } from '../data/current';
import { fmtPct } from '../lib/frac';
import { assuranceMeasurement } from '../lib/assurance';

const CAUSE_LABEL: Record<CheckCause, string> = {
  declined_module: 'Declined module',
  unresolved_profile_challenge: 'Unresolved profile challenge',
  unusable_evidence_proportion: 'Unusable evidence',
  na_rate_above_baseline: 'N/A rate above baseline',
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  passed: 'Passed',
  triggered: 'Triggered',
  not_assessed: 'Not assessed',
};

const STATUS_STYLE: Record<CheckStatus, string> = {
  passed: 'bg-emerald-100 text-emerald-800',
  triggered: 'bg-red-100 text-red-800',
  not_assessed: 'border border-dashed border-slate-400 bg-white text-slate-600',
};

/** The detail line is the engine's own, verbatim: it is output (the check's explanation), so it crosses as data. */
export const checkDetail = (c: DemotionCheck): string => c.detail;

export default function DemotionChecks() {
  const level = assuranceMeasurement().level;
  const n = (s: CheckStatus) => CURRENT.assurance.checks.filter((c) => c.status === s).length;
  return (
    <div data-testid="demotion-checks" className="mt-3">
      <h4 className="text-xs font-semibold text-slate-800">Demotion checks</h4>
      <p data-testid="demotion-summary" className="mt-0.5 text-[11px] leading-snug text-slate-600">
        {CURRENT.assurance.demotionsApplied === 0
          ? `No demotion applied: reported ${level}, base ${CURRENT.assurance.baseLevel}.`
          : `Demoted ${CURRENT.assurance.demotionsApplied} level${CURRENT.assurance.demotionsApplied === 1 ? '' : 's'}: reported ${level}, base ${CURRENT.assurance.baseLevel}.`}{' '}
        {n('passed')} passed · {n('triggered')} triggered · {n('not_assessed')} not assessed.
      </p>
      <ul className="mt-1.5 divide-y divide-slate-100 text-[11px] leading-snug">
        {CURRENT.assurance.checks.map((c) => (
          <li key={c.cause} data-testid={`demotion-check-${c.cause}`} data-status={c.status} className="py-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-slate-800">{CAUSE_LABEL[c.cause]}</span>
              <span className={`inline-block shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 font-semibold ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
            </div>
            <div className="tnum mt-0.5 text-slate-700">
              {c.count === null || c.of === null || c.threshold === null ? (
                <span data-testid="not-measured">Measured: not measured · no threshold applied</span>
              ) : (
                <>
                  Measured <strong>{fmtPct([c.count, c.of], 1)}%</strong> · threshold <strong>{fmtPct(c.threshold, 0)}%</strong>
                </>
              )}
            </div>
            <div className="mt-0.5 text-slate-500">{checkDetail(c)}</div>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
        A check that could not run is shown as not assessed: neither passed nor failed, and not counted as a pass.
      </p>
    </div>
  );
}
