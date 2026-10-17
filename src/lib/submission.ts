// The two payloads the Integrations screen puts side by side, built from the active assessment. The local one is the
// appliance's full response for a control: the whole claim, raw fields included. The one that crosses to NCSC carries
// verdicts, counts and hashes. A field is "raw" if it carries a locator, an identifier, a respondent or verbatim text.

import { CURRENT, type Claim } from '../data/current';
import { TOTALS } from '../data/capabilities';
import { assuranceLabel } from './assurance';
import { realGaps } from './narrative';

/** The claim fields that are raw evidence or point at it. They exist on the appliance and nowhere else. */
export const RAW_KEYS = ['locator', 'sourceRef', 'respondentRole', 'contradictedBy', 'reasoning', 'population', 'exceptionPopulation', 'runId', 'pathLabel', 'signalKey'] as const;

/** The claim shown as the local `GET /controls/{id}` response: one that carries raw fields, if the assessment has one. */
export function sampleClaim(): Claim {
  const gaps = realGaps();
  return (gaps.find((g) => g.claim.contradicted?.length && g.runId) ?? gaps.find((g) => g.claim.contradicted?.length) ?? gaps[0])?.claim ?? CURRENT.claims[0];
}

export const localControlResponse = (): { status: number; body: { control: string; claim: Claim } } => {
  const c = sampleClaim();
  return { status: 200, body: { control: c.id, claim: c } };
};

/** `GET /assessment/current`: every claim, in full. Only its size is shown. */
export const localAssessmentBytes = (): number => new TextEncoder().encode(JSON.stringify({ source: CURRENT.source, claims: CURRENT.claims, ranking: CURRENT.ranking, coverage: CURRENT.coverage })).length;

/** The signed OSCAL submission that crosses: verdicts, counts, hashes, and the assurance level inside it. */
export function crossingPayload(entityName?: string) {
  const t = TOTALS.after;
  const verdicts = CURRENT.claims
    .filter((c) => c.state !== 'unknown')
    .map((c) => ({ 'target-id': c.id, state: c.state, 'evidence-class': c.evidenceClass, ...(c.gapBasis ? { 'gap-basis': c.gapBasis } : {}) }));
  return {
    'assessment-results': {
      metadata: { title: 'JNCSF assessment results', 'oscal-version': '1.1.2', ...(entityName ? { 'entity-name': entityName } : {}) },
      'jccp:coverage-metadata': {
        'assurance-level': assuranceLabel(t.assurance),
        framework: `${CURRENT.framework.name} ${CURRENT.framework.version}`,
        'controls-applicable': CURRENT.totals.applicable,
        'verdicts-by-state': { compliant: CURRENT.after.green, partial: CURRENT.after.yellow, gap: CURRENT.after.red, unknown: CURRENT.after.unknown },
        'compliance-interval': { lower: t.interval[0] / 100, upper: t.interval[1] / 100 },
        'width-points-by-cause': {
          unauthored: (CURRENT.after.views.unweighted.width.unauthored[0] * 100) / CURRENT.after.views.unweighted.width.unauthored[1],
          unevidenced: (CURRENT.after.views.unweighted.width.unevidenced[0] * 100) / CURRENT.after.views.unweighted.width.unevidenced[1],
          uncollectable: (CURRENT.after.views.unweighted.width.uncollectable[0] * 100) / CURRENT.after.views.unweighted.width.uncollectable[1],
        },
      },
      findings: verdicts,
      'jccp:commitment': { algorithm: 'sha256', 'inputs-sha256': CURRENT.source.sha256 },
      'jccp:signature': { algorithm: 'Ed25519', status: 'planned: not signed in this prototype' },
    },
  };
}

export const bytesOf = (x: unknown): number => new TextEncoder().encode(JSON.stringify(x)).length;
