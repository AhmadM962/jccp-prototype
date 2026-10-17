// The evidence plan, derived from the engine's coverage record: the signals the authored evidence paths require, which of
// them were provided, and for each one not provided the engine's reason. Nothing here is typed in: no artifact, system,
// owner, command or count. What a signal is called, and which controls need it, are the engine's.
//
// `coverage.required` is exactly `provided` ∪ `gaps` in all three assessments (tested), so a signal is either provided or
// has one recorded reason it was not.

import { CURRENT, type GapReason } from '../data/current';

export interface PlanSignal {
  signal: string;
  /** the first segment of the signal's name: `document`, `iam`, `audit`, … */
  family: string;
  /** a document the organisation supplies, rather than a state read from a system */
  documentary: boolean;
  /** the controls whose evidence requirement names this signal */
  controls: string[];
  /** `provided`, or the engine's reason it was not */
  status: 'provided' | GapReason;
}

const familyOf = (signal: string) => signal.split('.')[0];

export function planSignals(): PlanSignal[] {
  const cov = CURRENT.coverage;
  const controls = new Map<string, Set<string>>();
  const status = new Map<string, PlanSignal['status']>();
  for (const [control, signal] of cov.provided) {
    controls.set(signal, (controls.get(signal) ?? new Set()).add(control));
    status.set(signal, 'provided');
  }
  for (const g of cov.gaps) {
    const cs = controls.get(g.signalKey) ?? new Set<string>();
    for (const c of g.controls) cs.add(c);
    controls.set(g.signalKey, cs);
    status.set(g.signalKey, g.reason as GapReason);
  }
  return [...cov.required]
    .map((signal) => ({
      signal,
      family: familyOf(signal),
      documentary: familyOf(signal) === 'document',
      controls: [...(controls.get(signal) ?? [])].sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1])),
      status: status.get(signal) ?? ('not_requested' as GapReason),
    }))
    .sort((a, b) => b.controls.length - a.controls.length || a.signal.localeCompare(b.signal));
}

export interface PlanSummary {
  signals: number;
  documentary: number;
  fromSystems: number;
  /** distinct controls whose requirement names a required signal */
  controls: number;
  /** applicable controls with at least one authored evidence path */
  authoredScope: number;
  applicable: number;
  /** Unknown because no requirement is authored: the plan cannot ask about them */
  unauthored: number;
  /** the most coverage the plan can reach if every signal is provided: every control except the unauthored ones */
  maxCoveragePct: number;
  provided: number;
  notProvided: number;
}

export function planSummary(): PlanSummary {
  const sigs = planSignals();
  const a = CURRENT.after;
  const applicable = a.views.unweighted.applicable;
  return {
    signals: sigs.length,
    documentary: sigs.filter((s) => s.documentary).length,
    fromSystems: sigs.filter((s) => !s.documentary).length,
    controls: new Set(sigs.flatMap((s) => s.controls)).size,
    authoredScope: a.views.authored_scope.applicable,
    applicable,
    unauthored: a.unknownUnauthored,
    maxCoveragePct: +(((applicable - a.unknownUnauthored) * 100) / applicable).toFixed(1),
    provided: sigs.filter((s) => s.status === 'provided').length,
    notProvided: sigs.filter((s) => s.status !== 'provided').length,
  };
}

/** The engine's reasons, in words, for a required signal that was not provided. */
export const REASON_WORDS: Partial<Record<GapReason, string>> = {
  not_provided: 'not provided',
  declined: 'declined by the client',
  insufficient_permission: 'insufficient permission',
  module_failed: 'the collecting module failed',
  stale: 'stale',
  future_dated: 'future-dated',
  unparseable: 'unparseable',
  insufficient_signal: 'insufficient signal',
  uncollectable_by_design: 'uncollectable by design',
};

/** How the collection went, by signal family: the plan's ledger. A family with no problem is `complete`; a module that
 *  failed proves nothing, and its controls stay Unknown, never Gap. */
export interface FamilyRow {
  family: string;
  required: number;
  provided: number;
  byReason: Partial<Record<GapReason, number>>;
}

export function collectionLedger(): FamilyRow[] {
  const by = new Map<string, FamilyRow>();
  for (const s of planSignals()) {
    const row = by.get(s.family) ?? { family: s.family, required: 0, provided: 0, byReason: {} };
    row.required += 1;
    if (s.status === 'provided') row.provided += 1;
    else row.byReason[s.status] = (row.byReason[s.status] ?? 0) + 1;
    by.set(s.family, row);
  }
  return [...by.values()].sort((a, b) => a.family.localeCompare(b.family));
}

/** The signals the ranking's evidence requests ask for (what Remediation calls artifacts). */
export const requestedSignals = (): Set<string> =>
  new Set(CURRENT.ranking.items.filter((i) => i.actionType === 'evidence_request').flatMap((i) => i.signalsRequested));
