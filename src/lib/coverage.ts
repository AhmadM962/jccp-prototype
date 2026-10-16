// Coverage + gap-taxonomy helpers, from the exact figures in src/data/ministry.ts.

import { controls } from '../data/controls';
import { MINISTRY } from '../data/ministry';
import { stateFor } from './views';
import { TOTALS } from '../data/capabilities';
import { assuranceLabel } from './assurance';

export interface CoverageBreakdown {
  /** artifact-backed verdicts: Compliant + Gap */
  evidenced: number;
  /** Partial controls (testimony or documents cap them below Compliant) */
  testimonyOnly: number;
  /** Unknown because evidence was not provided or could not be collected — the organisation's */
  unevidenced: number;
  /** Unknown because no evidence requirement has been authored — the tool's limitation */
  unauthored: number;
  /** structurally unreachable — none for this profile */
  uncollectable: number;
  applicable: number;
}

export const coverageBreakdown = (uploaded: boolean): CoverageBreakdown => {
  const s = stateFor(uploaded);
  const uncollectable = s.views.unweighted.width.uncollectable[0];
  return {
    evidenced: s.green + s.red,
    testimonyOnly: s.yellow,
    unevidenced: s.unknown - s.unknownUnauthored - uncollectable,
    unauthored: s.unknownUnauthored,
    uncollectable,
    applicable: s.views.unweighted.applicable,
  };
};

/** Unknown controls the evidence bundle resolves. An upload can only move controls that have an
 *  authored evidence requirement, so the story is told inside the authored scope: the rest cannot move. */
export const unknownResolvedByUpload = () => {
  const b = MINISTRY.before.views.authored_scope;
  const a = MINISTRY.after.views.authored_scope;
  return { resolved: b.unknown - a.unknown, from: b.unknown, to: a.unknown, scope: a.applicable };
};

/** Sample controls whose snapshot the upload changes: `changed: true`. */
export const seededChangedCount = () => ({
  changed: controls.filter((c) => c.changed).length,
  seeded: controls.length,
});

export const completenessStatement = (uploaded: boolean) => {
  const s = stateFor(uploaded);
  const u = s.views.unweighted;
  const uncollectable = u.width.uncollectable[0];
  return {
    covered: u.known,
    applicable: u.applicable,
    unknown: s.unknown,
    unauthored: s.unknownUnauthored,
    unevidenced: s.unknown - s.unknownUnauthored - uncollectable,
    uncollectable,
    assurance: assuranceLabel((uploaded ? TOTALS.after : TOTALS.before).assurance),
  };
};
