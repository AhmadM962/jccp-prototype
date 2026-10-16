// Coverage + gap-taxonomy helpers, from the exact figures in src/data/profiles (read through src/data/current.ts).

import { controls } from '../data/controls';
import { CURRENT, type StateFigures } from '../data/current';
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
 *  authored evidence requirement, so the story is told inside the authored scope. A control outside it can still move,
 *  but only by observation (`movedOutOfUnknown`), never by a requirement being met. */
export const unknownResolvedByUpload = () => {
  const b = CURRENT.before.views.authored_scope;
  const a = CURRENT.after.views.authored_scope;
  return { resolved: b.unknown - a.unknown, from: b.unknown, to: a.unknown, scope: a.applicable };
};

/** Controls that move out of Unknown with the bundle: those inside the authored scope (the requirement exists and
 *  the evidence arrived) and those outside it (no requirement exists, but an artifact in the bundle shows the control
 *  unmet: observation, not a path). */
export const movedOutOfUnknown = () => {
  const known = (s: StateFigures) => s.views.unweighted.known;
  const inside = unknownResolvedByUpload().resolved;
  const total = known(CURRENT.after) - known(CURRENT.before);
  return { total, inside, outside: total - inside, outsideControls: CURRENT.ruleR.verdictsOutsideAuthoredScope };
};

const STATE_WORD = { green: 'Compliant', yellow: 'Partial', red: 'Gap' } as const;

/** What happened to each control outside the authored scope that moved, from the generated figures. */
export const outsideScopeSentence = (): string =>
  CURRENT.ruleR.verdictsOutsideAuthoredScope.map(
    (c) =>
      `${c.id} has no authored evidence requirement, but an artifact in the bundle ${
        c.state === 'red' ? 'shows it unmet' : 'gives it a verdict'
      }, so it moved from Unknown to ${c.state === 'red' ? 'a ' : ''}${STATE_WORD[c.state]}${c.gapBasis ? ` (${c.gapBasis})` : ''}.`,
  ).join(' ');

/** Controls whose state the upload changes (they get a verdict that they did not have), out of all applicable controls. */
export const changedControlCount = () => ({
  changed: controls().filter((c) => c.changed).length,
  applicable: controls().length,
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
