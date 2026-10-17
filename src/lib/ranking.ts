// The engine's ranking, and what it implies, computed from the assessment (CURRENT.ranking). Nothing here is typed in:
// an "artifact" is a signal the engine's evidence requests ask for, and the controls it unlocks are COMPUTED, as the
// controls whose every requested signal has been provided. Counts therefore cannot overlap or be added twice.

import { CURRENT, type RankItem } from '../data/current';

export type ActionType = 'fix' | 'evidence_request' | 'corroboration_request';
export const ACTION_TYPES: readonly ActionType[] = ['fix', 'evidence_request', 'corroboration_request'];

/** Items of equal magnitude share a rank; the group is a property of the data, shown as one. */
export interface RankGroup {
  rank: number;
  /** the engine's own count of items sharing this rank (checked against the items present) */
  tieGroupSize: number;
  items: RankItem[];
}

export function rankGroups(items: readonly RankItem[] = CURRENT.ranking.items): RankGroup[] {
  const by = new Map<number, RankItem[]>();
  for (const it of items) by.set(it.rank, [...(by.get(it.rank) ?? []), it]);
  return [...by.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rank, its]) => ({ rank, tieGroupSize: its[0].tieGroupSize, items: its }));
}

/** An artifact: a signal the engine asks for, and the controls that ask for it. */
export interface Artifact {
  signal: string;
  /** controls whose request names this signal */
  controls: string[];
}

export function evidenceArtifacts(items: readonly RankItem[] = CURRENT.ranking.items): Artifact[] {
  const by = new Map<string, Set<string>>();
  for (const it of items.filter((i) => i.actionType === 'evidence_request')) {
    for (const s of it.signalsRequested) by.set(s, (by.get(s) ?? new Set()).add(it.controlId));
  }
  return [...by.entries()]
    .map(([signal, cs]) => ({ signal, controls: [...cs].sort() }))
    .sort((a, b) => b.controls.length - a.controls.length || a.signal.localeCompare(b.signal));
}

/** The controls an evidence request resolves once `provided` signals are in: those whose EVERY requested signal is provided
 *  (an intersection, not a sum). A request that names no signal resolves nothing. */
export function resolvedBy(provided: readonly string[], items: readonly RankItem[] = CURRENT.ranking.items): string[] {
  const have = new Set(provided);
  return [
    ...new Set(
      items
        .filter((i) => i.actionType === 'evidence_request' && i.signalsRequested.length > 0 && i.signalsRequested.every((s) => have.has(s)))
        .map((i) => i.controlId),
    ),
  ].sort();
}

/** What the ranking could not act on, and why: the engine's own exclusion lists. */
export interface Exclusion {
  key: 'unauthored_excluded' | 'uncollectable_excluded' | 'conflicting_evidence_excluded';
  controls: readonly string[];
  reason: string;
}

export const rankingExclusions = (): Exclusion[] => [
  {
    key: 'unauthored_excluded',
    controls: CURRENT.ranking.unauthoredExcluded,
    reason: 'no evidence requirement is authored for these controls, so the ranking has nothing it could ask for or fix',
  },
  {
    key: 'uncollectable_excluded',
    controls: CURRENT.ranking.uncollectableExcluded,
    reason: 'no supported method can collect evidence for these controls',
  },
  {
    key: 'conflicting_evidence_excluded',
    controls: CURRENT.ranking.conflictingEvidenceExcluded,
    reason: 'the evidence for these controls conflicts, so no action is ranked until it is resolved',
  },
];

/** Points of the weighted interval, to two decimals. */
export const fmtPoints = (x: number): string => x.toFixed(2);
