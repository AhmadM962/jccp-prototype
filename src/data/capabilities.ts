// The six JNCSF capabilities (brief §5.1) plus before/after fixture stats (§6.2, §6.3).
// Figures below are the measured before/after tables — every per-capability row
// reconciles exactly to the portfolio TOTALS at the bottom of this file.

export interface CapabilityStat {
  applicable: number;
  evidenced: number;
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

export const capabilities: Capability[] = [
  {
    id: 'arch',
    name: 'Security in Architecture & Portfolio',
    shortName: 'Architecture & Portfolio',
    totalControls: 25,
    organisationallyAssessable: true,
    before: { applicable: 25, evidenced: 15, green: 10, yellow: 3, red: 2, unknown: 10, coveragePct: 60.0, interval: [46.0, 86.0] },
    after: { applicable: 25, evidenced: 23, green: 15, yellow: 5, red: 3, unknown: 2, coveragePct: 92.0, interval: [70.0, 78.0] },
  },
  {
    id: 'dev',
    name: 'Security in Development',
    shortName: 'Development',
    totalControls: 69,
    organisationallyAssessable: true,
    before: { applicable: 50, evidenced: 30, green: 20, yellow: 6, red: 4, unknown: 20, coveragePct: 60.0, interval: [46.0, 86.0] },
    after: { applicable: 50, evidenced: 45, green: 30, yellow: 9, red: 6, unknown: 5, coveragePct: 90.0, interval: [69.0, 79.0] },
  },
  {
    id: 'del',
    name: 'Security in Delivery',
    shortName: 'Delivery',
    totalControls: 44,
    organisationallyAssessable: true,
    before: { applicable: 44, evidenced: 32, green: 22, yellow: 6, red: 4, unknown: 12, coveragePct: 72.7, interval: [56.8, 84.1] },
    after: { applicable: 44, evidenced: 42, green: 28, yellow: 9, red: 5, unknown: 2, coveragePct: 95.5, interval: [73.9, 78.4] },
  },
  {
    id: 'ops',
    name: 'Security in Operations',
    shortName: 'Operations',
    totalControls: 299,
    organisationallyAssessable: true,
    before: { applicable: 299, evidenced: 192, green: 135, yellow: 36, red: 21, unknown: 107, coveragePct: 64.2, interval: [51.2, 87.0] },
    after: { applicable: 299, evidenced: 272, green: 188, yellow: 54, red: 30, unknown: 27, coveragePct: 91.0, interval: [71.9, 80.9] },
  },
  {
    id: 'found',
    name: 'Foundational Capabilities',
    shortName: 'Foundational',
    totalControls: 139,
    organisationallyAssessable: true,
    before: { applicable: 139, evidenced: 81, green: 58, yellow: 15, red: 8, unknown: 58, coveragePct: 58.3, interval: [47.1, 88.8] },
    after: { applicable: 139, evidenced: 116, green: 84, yellow: 22, red: 10, unknown: 23, coveragePct: 83.5, interval: [68.3, 84.9] },
  },
  {
    id: 'natl',
    name: 'Security in National Cyber Responsibility',
    shortName: 'National Cyber Responsibility',
    totalControls: 0,
    organisationallyAssessable: false,
  },
];

export const capabilityById = (id: string) => capabilities.find((c) => c.id === id);

// Portfolio-level fixture totals (brief §6.1–6.3). The framework is 93% universal — only
// 38 of 576 controls are conditional on the five applicability variables — and this
// government-ministry demo organisation excludes exactly the 19 in_house_development
// controls, leaving 557 of 576 applicable.
export const TOTALS = {
  totalControls: 576,
  notApplicable: 19,
  applicable: 557,
  before: {
    evidenced: 350,
    green: 245,
    yellow: 66,
    red: 39,
    unknown: 207,
    coveragePct: 62.8,
    interval: [49.9, 87.1] as [number, number],
    widthPts: 37.2,
    assurance: 'L1',
  },
  after: {
    evidenced: 498,
    green: 345,
    yellow: 99,
    red: 54,
    unknown: 59,
    coveragePct: 89.4,
    interval: [70.8, 81.4] as [number, number],
    widthPts: 10.6,
    assurance: 'L2',
    gapsClosed: 148,
  },
};
