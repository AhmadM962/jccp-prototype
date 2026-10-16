// The six JNCSF capabilities plus before/after per-capability and portfolio stats. Since Round 2
// every figure here is computed from the exact fractions in ministry.ts (the engine's shape for
// this profile); none is typed in. Every per-capability row reconciles exactly to the portfolio
// TOTALS at the bottom of this file (asserted in tests).

import { APPLICABLE_CONTROLS, EXCLUDED_COUNT, TOTAL_CONTROLS } from './figures';
import { MINISTRY, type CapabilityFigures, type StateFigures } from './ministry';

export interface CapabilityStat {
  applicable: number;
  /** controls with a verdict (Compliant, Partial or Gap) */
  evidenced: number;
  /** controls with at least one authored evidence requirement */
  authored: number;
  /** of the Unknown: no evidence requirement authored — the tool's limitation */
  unknownUnauthored: number;
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  /** coverage percent, pre-computed and shown verbatim */
  coveragePct: number;
  /** compliance interval, pre-computed, [lower, upper] as percentages */
  interval: [number, number];
}

export interface Capability {
  id: 'arch' | 'dev' | 'del' | 'ops' | 'found' | 'natl';
  name: string;
  shortName: string;
  totalControls: number;
  /** national obligation — structurally unassessable at org level */
  organisationallyAssessable: boolean;
  before?: CapabilityStat;
  after?: CapabilityStat;
}


const pct = (n: number, d: number) => (n * 100) / d;

/** Unweighted interval and coverage for a capability's controls, from its credit numerator. */
function capStat(c: CapabilityFigures): CapabilityStat {
  const num = c.creditNumerator[0] / c.creditNumerator[1];
  const known = c.applicable - c.unknown;
  return {
    applicable: c.applicable,
    evidenced: known,
    authored: c.authored,
    unknownUnauthored: c.unknownUnauthored,
    green: c.green,
    yellow: c.yellow,
    red: c.red,
    unknown: c.unknown,
    coveragePct: pct(known, c.applicable),
    interval: [pct(num, c.applicable), pct(num + c.unknown, c.applicable)],
  };
}

const NAMES: Record<Exclude<Capability['id'], 'natl'>, { name: string; shortName: string; totalControls: number }> = {
  arch: { name: 'Security in Architecture & Portfolio', shortName: 'Architecture & Portfolio', totalControls: 25 },
  dev: { name: 'Security in Development', shortName: 'Development', totalControls: 69 },
  del: { name: 'Security in Delivery', shortName: 'Delivery', totalControls: 44 },
  ops: { name: 'Security in Operations', shortName: 'Operations', totalControls: 299 },
  found: { name: 'Foundational Capabilities', shortName: 'Foundational', totalControls: 139 },
};

export const capabilities: Capability[] = [
  ...(['arch', 'dev', 'del', 'ops', 'found'] as const).map((id) => ({
    id,
    ...NAMES[id],
    organisationallyAssessable: true,
    before: capStat(MINISTRY.before.capabilities[id]),
    after: capStat(MINISTRY.after.capabilities[id]),
  })),
  {
    id: 'natl',
    name: 'Security in National Cyber Responsibility',
    shortName: 'National Cyber Responsibility',
    totalControls: 0,
    organisationallyAssessable: false,
  },
];

export const capabilityById = (id: string) => capabilities.find((c) => c.id === id);

function stateTotals(s: StateFigures) {
  const u = s.views.unweighted;
  const num = s.creditNumerator[0] / s.creditNumerator[1];
  return {
    evidenced: u.known,
    green: s.green,
    yellow: s.yellow,
    red: s.red,
    unknown: s.unknown,
    unknownUnauthored: s.unknownUnauthored,
    coveragePct: pct(u.known, u.applicable),
    interval: [pct(num, u.applicable), pct(num + s.unknown, u.applicable)] as [number, number],
    widthPts: pct(s.unknown, u.applicable),
  };
}

// Portfolio totals for the demonstration organisation (a government ministry): the framework is 93%
// universal — only 38 of 576 controls are conditional on the five applicability variables — and this
// organisation excludes exactly the 19 in_house_development controls, leaving 557 of 576 applicable.
export const TOTALS = {
  totalControls: TOTAL_CONTROLS,
  notApplicable: EXCLUDED_COUNT,
  applicable: APPLICABLE_CONTROLS,
  before: { ...stateTotals(MINISTRY.before), assurance: 'L1' },
  after: { ...stateTotals(MINISTRY.after), assurance: 'L2' },
};
