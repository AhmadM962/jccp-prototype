// The scope-exclusion register now comes from the engine's golden output (CURRENT.exclusions): which controls are
// excluded, the flag that excluded them and the engine's own justification. The hand-entered register that used to
// live here listed different controls (58-80) and invented justifications; it is gone.
//
// What remains is the one figure that was never the engine's: a typical Not-Applicable rate for a same-size entity.
// The engine was supplied NO sector baseline (its `na_rate_above_baseline` check is `not_assessed`), so this number
// is shown only on the Organisation Profile screen's live scoping, where it is marked illustrative.
export const SECTOR_BASELINE = {
  /** illustrative: not supplied to the engine */
  naRatePct: 5,
};
