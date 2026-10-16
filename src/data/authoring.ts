// Authoring coverage: how much of the framework has a written evidence requirement, and what it would
// take to write the rest. Numbers only, taken from the engine's generated authoring reports; this module
// is the single place the Authoring Coverage screen reads them from. Totals are computed from the parts
// so that they cannot drift from them (asserted in tests).
//
// Tier: illustrative. These are the engine's figures, but the prototype does not read them from it.

import { capabilities } from './capabilities';
import { TOTAL_CONTROLS } from './figures';

/** Controls with at least one authored evidence path, by capability (framework-wide, all 576 controls). */
export const AUTHORED_BY_CAPABILITY = { arch: 5, dev: 4, del: 44, ops: 9, found: 4 } as const;

export const AUTHORING = {
  /** of the authored controls: those with a conclusive path (can reach Compliant) and those with only an
   *  indicative path (capped at Partial) */
  authoredConclusive: 59,
  authoredIndicativeOnly: 7,
  signals: {
    machineCollected: 70,
    documentary: 45,
    negativeCapable: 38,
  },
  /** evidence paths across the authored controls */
  paths: 125,
  /** every control counted once, by which standard's codes it carries */
  reachPartition: { both: 176, nistOnly: 227, isoOnly: 165, neither: 8 },
  /** roughly this many new documentary signals would give every unauthored control an indicative path */
  documentaryFloor: { low: 325, high: 359 },
  /** unauthored controls in the prioritised authoring queue */
  queue: 205,
} as const;

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

export const AUTHORED_CONTROLS = sum(Object.values(AUTHORED_BY_CAPABILITY));
export const UNAUTHORED_CONTROLS = TOTAL_CONTROLS - AUTHORED_CONTROLS;
export const SIGNALS_TOTAL = AUTHORING.signals.machineCollected + AUTHORING.signals.documentary;

export const REACH = (() => {
  const p = AUTHORING.reachPartition;
  const nist = p.both + p.nistOnly;
  const iso = p.both + p.isoOnly;
  const either = p.both + p.nistOnly + p.isoOnly;
  return { nist, iso, either, neither: p.neither, either_pct: (either * 100) / TOTAL_CONTROLS };
})();

export interface CapabilityAuthoring {
  id: keyof typeof AUTHORED_BY_CAPABILITY;
  name: string;
  shortName: string;
  controls: number;
  /** share of the whole framework */
  frameworkPct: number;
  authored: number;
  unauthored: number;
  authoredPct: number;
  /** every control of the capability has an authored requirement */
  complete: boolean;
}

export const CAPABILITY_AUTHORING: CapabilityAuthoring[] = (Object.keys(AUTHORED_BY_CAPABILITY) as (keyof typeof AUTHORED_BY_CAPABILITY)[]).map((id) => {
  const cap = capabilities.find((c) => c.id === id)!;
  const authored = AUTHORED_BY_CAPABILITY[id];
  return {
    id,
    name: cap.name,
    shortName: cap.shortName,
    controls: cap.totalControls,
    frameworkPct: (cap.totalControls * 100) / TOTAL_CONTROLS,
    authored,
    unauthored: cap.totalControls - authored,
    authoredPct: (authored * 100) / cap.totalControls,
    complete: authored === cap.totalControls,
  };
});
