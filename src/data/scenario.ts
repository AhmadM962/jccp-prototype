// The demo organisation's profile inputs (brief §6). The evidence plan and the collection ledger are derived from the
// engine's coverage record (src/lib/plan.ts); nothing about them is typed here.

import { DEFAULT_SECTOR_ID } from './sectors';

/** Architecture toggles are tri-state. Ambiguity must never shrink the denominator:
 *  'unknown' is treated exactly like 'yes' for scoping, and the affected controls are
 *  flagged for verification during collection. */
export type Ternary = 'yes' | 'no' | 'unknown';

/** What the assessment records about an applicability variable. The engine's output names the variables an organisation
 *  declared "no" (each exclusion cites its flag) and nothing about the rest: those are `unrecorded` — in scope, and not
 *  recorded as declined — rather than a declaration of "yes" the data does not carry. */
export type Declared = Ternary | 'unrecorded';

export interface OrgProfile {
  orgName: string;
  /** sector id — see data/sectors.ts. Drives the regulator label. */
  sector: string;
  sizeBand: string;
  endpoints: number;
  servers: number;
  users: number;
  hostingModel: 'gov-private-cloud' | 'own-datacentre' | 'third-party-jordan' | 'foreign-cloud';
  namedAttestation: string;
  /** The five measured JNCSF applicability variables (38 controls gated in total). */
  inHouseDevelopment: Declared;
  outsourcedDevelopment: Declared;
  mobileDevices: Declared;
  wirelessNetwork: Declared;
  remoteAccess: Declared;
  /** NOT a JNCSF scoping condition — cloud is governed separately by the MoDEE cloud
   *  policy, so this never changes the applicable count. Kept only to drive the
   *  profile-challenge demo (a declaration the system cross-checks against evidence). */
  usesCloud: Ternary;
  /** subjects the org to CICSC (405 controls) in addition to JNCSF — separate framework,
   *  NOT a JNCSF applicability condition, so it does not change the 557 count. */
  operatesCriticalInfrastructure: boolean;
  pdplHoldings: {
    health: boolean;
    biometric: boolean;
    financial: boolean;
    religiousOrPolitical: boolean;
  };
}

export const defaultProfile: OrgProfile = {
  orgName: 'Ministry of Digital Services',
  sector: DEFAULT_SECTOR_ID, // Government Services → no regulator designated
  sizeBand: '250–1000 staff',
  endpoints: 400,
  servers: 38,
  users: 620,
  hostingModel: 'gov-private-cloud',
  namedAttestation: '',
  // A government ministry with no in-house software development: excludes exactly the
  // 19 in_house_development controls, and nothing else.
  inHouseDevelopment: 'no',
  outsourcedDevelopment: 'unrecorded',
  mobileDevices: 'unrecorded',
  wirelessNetwork: 'unrecorded',
  remoteAccess: 'unrecorded',
  usesCloud: 'yes',
  operatesCriticalInfrastructure: false,
  pdplHoldings: {
    health: false,
    biometric: false,
    financial: false,
    religiousOrPolitical: false,
  },
};

// Denominator model: every control starts in scope; each toggle answered "no" removes
// the controls it gates. 576 total, 38 conditional on these five variables (93% of the
// framework is universal) — the default profile above removes 19, leaving 557 applicable.
export const BASELINE_APPLICABLE = 576;
export const TOTAL_CONTROLS = 576;

/** in scope = 'yes' or 'unknown'; only an explicit 'no' can remove controls */
const inScope = (t: Declared) => t !== 'no';

export interface ProfileDelta {
  key: keyof OrgProfile;
  label: string;
  /** delta applied when the toggle is in scope ('yes' or 'unknown') */
  inScopeDelta: number;
  /** delta applied when the toggle is an explicit 'no' */
  noDelta: number;
}

// The five real applicability variables, with measured control counts (brief: 19 + 9 + 4
// + 4 + 2 = 38 of 576 controls are conditional). "Operational technology", "cloud
// services" and "cross-border processing" were candidates that did not survive contact
// with the framework text — OT and cloud are governed by separate instruments (CICSC and
// the MoDEE cloud policy respectively), so JNCSF does not gate on them.
export const PROFILE_DELTAS: ProfileDelta[] = [
  { key: 'inHouseDevelopment', label: 'In-house software development', inScopeDelta: 0, noDelta: -19 },
  { key: 'outsourcedDevelopment', label: 'Outsourced development', inScopeDelta: 0, noDelta: -9 },
  { key: 'mobileDevices', label: 'Mobile devices', inScopeDelta: 0, noDelta: -4 },
  { key: 'wirelessNetwork', label: 'Wireless network', inScopeDelta: 0, noDelta: -4 },
  { key: 'remoteAccess', label: 'Remote access', inScopeDelta: 0, noDelta: -2 },
];

export function computeApplicable(p: OrgProfile): number {
  let n = BASELINE_APPLICABLE;
  for (const d of PROFILE_DELTAS) {
    const t = p[d.key] as Declared;
    n += inScope(t) ? d.inScopeDelta : d.noDelta;
  }
  return n;
}

/** Number of controls currently held in scope only by an 'unknown' answer — flagged for
 *  verification during collection. */
export function unknownScopedControls(p: OrgProfile): number {
  let n = 0;
  for (const d of PROFILE_DELTAS) {
    if ((p[d.key] as Ternary) === 'unknown') n += Math.abs(d.inScopeDelta || d.noDelta);
  }
  return n;
}

export const HOSTING_LABEL: Record<OrgProfile['hostingModel'], string> = {
  'gov-private-cloud': 'MoDEE Government Private Cloud',
  'own-datacentre': 'Own data centre',
  'third-party-jordan': 'Third-party hosting in Jordan',
  'foreign-cloud': 'Foreign cloud',
};
