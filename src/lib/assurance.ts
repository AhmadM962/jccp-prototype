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

/** What the evidence behind a verdict must be, for it to count towards a level: how a verdict is described
 *  ("are ...") and what it rests on ("rest on ..."). One table, so the two phrasings cannot drift apart. */
const COUNTS_TOWARDS: Record<'L1' | 'L2' | 'L3', { are: string; restOn: string }> = {
  L1: { are: 'documented, tool-evidenced or analyst-signed', restOn: 'documents, tool evidence or an analyst\u2019s signature' },
  L2: { are: 'tool-evidenced or analyst-signed', restOn: 'tool evidence or an analyst\u2019s signature' },
  L3: { are: 'analyst-signed', restOn: 'an analyst\u2019s signature' },
};

/** Each level is defined by the threshold rule, not by what is missing: the headline is `L` when at least the
 *  threshold share of verdicts are at `holds` or above and fewer than the threshold share are at `fails` or above. */
const RULE: Record<AssuranceId, { holds: 'L1' | 'L2' | 'L3' | null; fails: 'L1' | 'L2' | 'L3' | null }> = {
  L0: { holds: null, fails: 'L1' },
  L1: { holds: 'L1', fails: 'L2' },
  L2: { holds: 'L2', fails: 'L3' },
  L3: { holds: 'L3', fails: null },
};

const thresholdPct = (): number => Math.round((ASSURANCE.proportionThreshold[0] * 100) / ASSURANCE.proportionThreshold[1]);

/** The sentence a reader sees for a level. The threshold is read from the data. */
export const levelDefinition = (id: AssuranceId): string => {
  const { holds, fails } = RULE[id];
  const t = thresholdPct();
  if (holds && fails) return `At least ${t}% of verdicts rest on ${COUNTS_TOWARDS[holds].restOn}, but fewer than ${t}% rest on ${COUNTS_TOWARDS[fails].restOn}.`;
  if (holds) return `At least ${t}% of verdicts rest on ${COUNTS_TOWARDS[holds].restOn}.`;
  return `Fewer than ${t}% of verdicts rest on ${COUNTS_TOWARDS[fails!].restOn}.`;
};

/** Whether the level's definition is true of the engine's distribution. Exactly one level's is. */
export const levelHolds = (id: AssuranceId): boolean => {
  const { holds, fails } = RULE[id];
  const total = settledVerdicts();
  const meets = (l: 'L1' | 'L2' | 'L3') => meetsThreshold(atOrAbove(l), total, ASSURANCE.proportionThreshold);
  return (holds === null || meets(holds)) && (fails === null || !meets(fails));
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
  const next = level === 'L1' ? 'L2' : level === 'L2' ? 'L3' : undefined;
  const count = next ? atOrAbove(next) : atOrAbove(level);
  return {
    level,
    next,
    count,
    total,
    measuredPct: pctDown(count, total),
    thresholdPct: thresholdPct(),
    qualifies: (next ? COUNTS_TOWARDS[next] : COUNTS_TOWARDS.L3).are,
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
