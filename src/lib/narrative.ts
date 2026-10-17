// The facts the prototype's narrative (the tour, the Chat answers, the executive summary, the testimony view) is told
// from. Every one is read from the active assessment: no control, number or quotation is typed into a story. A story
// that names a control names one of these Gaps, and says what the engine recorded about it.

import { CURRENT, type Claim, type GapBasis, type RankItem } from '../data/current';
import { controlText } from '../data/controls';

export const GAP_BASES: readonly GapBasis[] = ['absence', 'observed', 'testimonial_admission'];

/** One Gap the engine established, with the ground it rests on and its ranked fix (if any). */
export interface Gap {
  id: string;
  basis: GapBasis;
  claim: Claim;
  /** the successful module run behind an absence-based Gap */
  runId?: string;
  /** the engine's ranked fix for it */
  fix?: RankItem;
}

const num = (id: string) => Number(id.split('-')[1]);

/** Every control the engine established as a Gap, in control order. */
export function realGaps(): Gap[] {
  return CURRENT.claims
    .filter((c) => c.state === 'red')
    .map((c) => {
      if (!c.gapBasis) throw new Error(`${c.id} is a Gap with no recorded basis`);
      return { id: c.id, basis: c.gapBasis, claim: c, runId: c.runId, fix: CURRENT.ranking.items.find((i) => i.controlId === c.id && i.actionType === 'fix') };
    })
    .sort((a, b) => num(a.id) - num(b.id));
}

/** The Gaps resting on one basis. */
export const gapsByBasis = (basis: GapBasis): Gap[] => realGaps().filter((g) => g.basis === basis);

/** One Gap of a basis to tell a story about: one whose control text the prototype holds if there is one, else the first. */
export function exampleGap(basis: GapBasis): Gap | undefined {
  const gs = gapsByBasis(basis);
  return gs.find((g) => controlText(g.id)) ?? gs[0];
}

/** What the engine ranked first, and that it could not break the tie. */
export interface TieGroup {
  rank: number;
  size: number;
  items: RankItem[];
  fixes: RankItem[];
  requests: RankItem[];
  note: string;
}

export function topTie(): TieGroup | undefined {
  const items = CURRENT.ranking.items;
  if (items.length === 0) return undefined;
  const rank = Math.min(...items.map((i) => i.rank));
  const group = items.filter((i) => i.rank === rank);
  return {
    rank,
    size: group[0].tieGroupSize,
    items: group,
    fixes: group.filter((i) => i.actionType === 'fix'),
    requests: group.filter((i) => i.actionType === 'evidence_request'),
    note: CURRENT.ranking.tieOrderNote,
  };
}

/** One piece of testimony the engine weighed and went against (or alongside), with what it did with it. */
export interface Testimony {
  controlId: string;
  state: Claim['state'];
  basis: string;
  respondentRole: string;
  stance: string;
  signalKey: string;
  locator: string;
  sourceRef: string;
  contradictedBy: string;
}

/** Before an evidence bundle exists only the verdicts that rest on testimony or documents exist (rule R), so only those
 *  claims' testimony has been weighed; after it, all of it. */
export function testimonyWeighed(uploaded = true): Testimony[] {
  return CURRENT.claims.filter((c) => uploaded || c.beforeVerdict).flatMap((c) =>
    (c.contradicted ?? []).map((t) => ({
      controlId: c.id,
      state: c.state,
      basis: t.basis,
      respondentRole: t.respondentRole,
      stance: t.stance,
      signalKey: t.signalKey,
      locator: t.locator,
      sourceRef: t.sourceRef,
      contradictedBy: t.contradictedBy,
    })),
  );
}

/** "admits_non_enforcement" → "admits non-enforcement"; the engine's stance words, made readable. */
export const stanceWords = (s: string): string => s.replace('non_enforcement', 'non-enforcement').replace(/_/g, ' ');

/** The respondent roles that appear, each once, in the order they first appear. */
export const respondentRoles = (uploaded = true): string[] => [...new Set(testimonyWeighed(uploaded).map((t) => t.respondentRole))];

/** A role as an id for `data-tour`/`data-testid`: "compliance officer" → "compliance-officer". */
export const roleSlug = (r: string): string => r.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
