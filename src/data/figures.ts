// Canonical figures for the prototype. Round 1 only introduces this file; the existing
// call sites still carry their own literals (frozen by src/__tests__/no_duplicate_figures.test.ts).
// Later rounds replace those literals with imports from here.
//
// Every value below was copied from an existing literal in this repository — none is new.
// (Round 2 removed UNCOLLECTABLE_COUNT: the engine reports 0 uncollectable controls for this
// profile; the old 39 is gone with the fixture it belonged to. See src/data/profiles (read through src/data/current.ts).)

/** All JNCSF controls. Source: `TOTAL_CONTROLS` / `BASELINE_APPLICABLE` (src/data/scenario.ts) and the
 *  framework total the engine reports. */
export const TOTAL_CONTROLS = 576;

/** Controls in scope for the demo organisation (576 − 19). Source: `TOTALS.applicable`
 *  (src/data/capabilities.ts:93) and `REQUEST_PLAN_SUMMARY.applicable` (src/data/scenario.ts:174). */
export const APPLICABLE_CONTROLS = 557;

/** Controls marked Not Applicable for the demo organisation. Source: `TOTALS.notApplicable`
 *  (src/data/capabilities.ts:92) and the 19 rows of `EXCLUSIONS` (src/data/exclusions.ts:27-45). */
export const EXCLUDED_COUNT = 19;

/** Controls in the CICSC (critical-infrastructure) framework. Source: the Profile screen text
 *  `CICSC (405 controls, 3 implementation levels)` (src/screens/01_Profile.tsx:184). */
export const CICSC_CONTROLS = 405;

/** CICSC Level 1 (mandatory) controls. Source: `Level 1 (135 controls) mandatory`
 *  (src/screens/01_Profile.tsx:201-205). */
export const CICSC_LEVEL1_CONTROLS = 135;
