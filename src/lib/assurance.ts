// The assurance level of the assessment, and the measurement behind it, from the engine's distribution in
// src/data/ministry.ts. Nothing here is typed in: every count, total and threshold a screen shows is
// read from that block, and the headline is recomputed with the engine's rule so a test can hold the two
// together.
//
// The rule (engine scoring.py): the headline is the highest level L such that the share of settled
// (non-Unknown) verdicts at L or above meets a disclosed threshold. It is not "the level of the best
// evidence collected": collecting machine evidence moves verdicts out of Unknown, and the level rises only
// if enough of the verdicts then rest on it.

import { ASSURANCE, type Frac } from '../data/ministry';
import { ASSURANCE_LEVELS } from './scoring';

export type AssuranceId = (typeof ASSURANCE_LEVELS)[number]['id'];

const HIGHEST_FIRST: readonly AssuranceId[] = ['L3', 'L2', 'L1', 'L0'];

/** Verdicts at `level` or above, and the verdicts there are in all. */
export const atOrAbove = (level: AssuranceId): number => {
  let n = 0;
  for (const l of HIGHEST_FIRST) {
    n += ASSURANCE.distribution[l];
    if (l === level) break;
  }
  return n;
};
export const settledVerdicts = (): number => HIGHEST_FIRST.reduce((n, l) => n + ASSURANCE.distribution[l], 0);

/** count/total >= threshold, exactly (no float comparison). */
export const meetsThreshold = (count: number, total: number, threshold: Frac): boolean =>
  count * threshold[1] >= total * threshold[0];

/** The engine's rule, recomputed from the distribution. */
export const headlineLevel = (): AssuranceId => {
  const total = settledVerdicts();
  return HIGHEST_FIRST.find((l) => meetsThreshold(atOrAbove(l), total, ASSURANCE.proportionThreshold)) ?? 'L0';
};

/** Whole-number percentage, rounded DOWN: a figure below the threshold must never be displayed as equal to it. */
export const pctDown = (count: number, total: number): number => Math.floor((count * 100) / total);

/** What the evidence behind a verdict must be, for it to count towards a level. */
const COUNTS_TOWARDS: Record<'L1' | 'L2' | 'L3', string> = {
  L1: 'documented, tool-evidenced or analyst-signed',
  L2: 'tool-evidenced or analyst-signed',
  L3: 'analyst-signed',
};

export interface AssuranceMeasurement {
  /** the level reported */
  level: AssuranceId;
  /** the next level up, which was not reached (undefined at L3) */
  next?: 'L2' | 'L3';
  /** verdicts that count towards `next`, of `total`, as a whole-number percentage rounded down */
  count: number;
  total: number;
  measuredPct: number;
  /** the disclosed threshold, as a whole-number percentage */
  thresholdPct: number;
  /** how a verdict qualifies for `next`, e.g. "tool-evidenced or analyst-signed" */
  qualifies: string;
}

export const assuranceMeasurement = (): AssuranceMeasurement => {
  const level = ASSURANCE.reported as AssuranceId;
  const total = settledVerdicts();
  const thresholdPct = Math.round((ASSURANCE.proportionThreshold[0] * 100) / ASSURANCE.proportionThreshold[1]);
  const next = level === 'L1' ? 'L2' : level === 'L2' ? 'L3' : undefined;
  const count = next ? atOrAbove(next) : atOrAbove(level);
  return {
    level,
    next,
    count,
    total,
    measuredPct: pctDown(count, total),
    thresholdPct,
    qualifies: next ? COUNTS_TOWARDS[next] : COUNTS_TOWARDS.L3,
  };
};

export const assuranceLabel = (id: AssuranceId): string => {
  const l = ASSURANCE_LEVELS.find((x) => x.id === id)!;
  return `${l.id} — ${l.name}`;
};

/** "37 of 52 verdicts (71%) are tool-evidenced or analyst-signed; L2 needs 80%." */
export const assuranceReason = (): string => {
  const m = assuranceMeasurement();
  return m.next
    ? `${m.count} of ${m.total} verdicts (${m.measuredPct}%) are ${m.qualifies}; ${m.next} needs ${m.thresholdPct}%.`
    : '';
};
