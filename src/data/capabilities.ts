// The six JNCSF capabilities (brief §5.1) plus before/after fixture stats (§6.2, §6.3).

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
    before: { applicable: 22, evidenced: 12, green: 8, yellow: 3, red: 1, unknown: 10, coveragePct: 54.5, interval: [43.2, 88.6] },
    after: { applicable: 22, evidenced: 18, green: 12, yellow: 4, red: 2, unknown: 4, coveragePct: 81.8, interval: [63.6, 81.8] },
  },
  {
    id: 'dev',
    name: 'Security in Development',
    shortName: 'Development',
    totalControls: 69,
    organisationallyAssessable: true,
    before: { applicable: 20, evidenced: 8, green: 5, yellow: 2, red: 1, unknown: 12, coveragePct: 40.0, interval: [30.0, 90.0] },
    after: { applicable: 20, evidenced: 15, green: 10, yellow: 3, red: 2, unknown: 5, coveragePct: 75.0, interval: [57.5, 82.5] },
  },
  {
    id: 'del',
    name: 'Security in Delivery',
    shortName: 'Delivery',
    totalControls: 44,
    organisationallyAssessable: true,
    before: { applicable: 40, evidenced: 32, green: 24, yellow: 6, red: 2, unknown: 8, coveragePct: 80.0, interval: [67.5, 87.5] },
    after: { applicable: 40, evidenced: 37, green: 28, yellow: 7, red: 2, unknown: 3, coveragePct: 92.5, interval: [78.8, 86.3] },
  },
  {
    id: 'ops',
    name: 'Security in Operations',
    shortName: 'Operations',
    totalControls: 299,
    organisationallyAssessable: true,
    before: { applicable: 180, evidenced: 118, green: 82, yellow: 24, red: 12, unknown: 62, coveragePct: 65.6, interval: [52.2, 86.7] },
    after: { applicable: 180, evidenced: 162, green: 112, yellow: 33, red: 17, unknown: 18, coveragePct: 90.0, interval: [71.4, 81.4] },
  },
  {
    id: 'found',
    name: 'Foundational Capabilities',
    shortName: 'Foundational',
    totalControls: 139,
    organisationallyAssessable: true,
    before: { applicable: 78, evidenced: 44, green: 31, yellow: 5, red: 8, unknown: 34, coveragePct: 56.4, interval: [42.9, 86.5] },
    after: { applicable: 78, evidenced: 72, green: 48, yellow: 13, red: 11, unknown: 6, coveragePct: 92.3, interval: [69.9, 77.6] },
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

// Portfolio-level fixture totals (brief §6.1–6.3).
export const TOTALS = {
  totalControls: 576,
  notApplicable: 236,
  applicable: 340,
  before: {
    evidenced: 214,
    green: 150,
    yellow: 40,
    red: 24,
    unknown: 126,
    coveragePct: 62.9,
    interval: [50.0, 87.1] as [number, number],
    widthPts: 37.1,
    assurance: 'L1',
  },
  after: {
    evidenced: 304,
    green: 210,
    yellow: 60,
    red: 34,
    unknown: 36,
    coveragePct: 89.4,
    interval: [70.6, 81.2] as [number, number],
    widthPts: 10.6,
    assurance: 'L2',
    gapsClosed: 90,
  },
};
