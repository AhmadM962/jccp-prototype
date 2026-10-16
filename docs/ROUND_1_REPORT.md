# Round 1 report — make every statement on screen true

Branch `round-1/truthfulness`, based on master `685315c`. Not merged.

| Commit | Task |
|---|---|
| `feba4ba` | Task 0 — vitest harness, CI `test` job gating `build` |
| `ffe9876` | Task 1 — `src/data/figures.ts` + duplicate-literal guard |
| `aef6376` | Task 2 — provenance tiers (`measured` / `illustrative` / `planned`) |
| `17fc381` | Task 3 — the five false statements |
| `91a10d9` | Task 4 — three smaller inconsistencies |
| `3fd3bbc` | Task 2 follow-up — chip overlapped the `.json` links (found by the headless render) |

Baseline before any change: `npm ci` exit 0 and `npm run build` exit 0 on `origin/master`.
Final state: `npm run build` exit 0; `npm test` 5 files, 55 tests, all passing. Full outputs are pasted in the session transcript and
reproduced by the commands below.

---

## 1. Claims and the command that proves each

Run everything from the repo root. `T` means `npx vitest run <file>`.

| # | Claim | Command |
|---|---|---|
| 0.1 | Build passes | `npm run build; echo $?` → `0` |
| 0.2 | 55 tests pass in 5 files | `npm test` → `Test Files 5 passed (5)`, `Tests 55 passed (55)` |
| 0.3 | Test deps are exact-pinned, no existing package changed | `grep -E '"(vitest\|jsdom\|@testing-library/[a-z-]+)"' package.json` shows no `^`/`~`; `git diff 685315c..feba4ba --stat -- package-lock.json` |
| 0.4 | CI runs tests before build | `grep -n "needs: test" .github/workflows/deploy.yml` |
| 1.1 | Six canonical figures exist, each with a source comment | `cat src/data/figures.ts` |
| 1.2 | New literal `557` outside the allow-list fails the guard | append `const x = 557;` to `src/lib/coverage.ts`, `T src/__tests__/no_duplicate_figures.test.ts` → `src/lib/coverage.ts: literal 557 appears 1x, allow-list permits 0x`; reverted |
| 1.3 | Guard passes on the committed tree | `T src/__tests__/no_duplicate_figures.test.ts` → 3 passed |
| 2.1 | Every one of the 13 screens renders a chip; none renders `measured` | `T src/__tests__/provenance.test.tsx` → 18 passed (`it.each` over 13 screens) |
| 2.2 | Legend is in the top bar | `grep -n TierLegend src/components/layout/TopBar.tsx` |
| 3.1 | Banned strings are gone from `src/` | `grep -rn "no data is stored\|Nothing you do here is saved\|0 errors" src \| grep -v __tests__ \| wc -l` → `0` |
| 3.2 | 0.8→0.85, 0.6→0.5, 0.3→0.25, 0.1→0.1, testimony cap 0.5 | probe run during this report: `[0.85,0.5,0.25,0.1]` and `yellowWeightForShare(0.8,true)=0.5`; also `T src/__tests__/truthfulness.test.tsx` |
| 3.2 | A caller exists in `src/screens/` | `grep -n yellowWeightForShare src/screens/*.tsx` → `06_ControlDetail.tsx` |
| 3.3 | OSCAL line replaced and card is `planned` | `grep -n "Validation runs in the assessment engine" src/screens/08_Export.tsx` |
| 3.4 | Property test over all 32 subsets fails before the fix and passes after | §3 below; `T src/__tests__/projection.test.tsx` |
| 3.4 | Floor is 7.0 pts (39 uncollectable of 557 applicable) | probe: `bandFloorPts(557, 39)` = `7.001795332136446` |
| 3.5 | Chat quotes live figures; illustrative answers are marked | `T src/__tests__/truthfulness.test.tsx` (tests with `evidenceUploaded` false and true) |
| 4.1 | 148 of 207 Unknown resolved; 25 of 48 seeded controls changed | probe: `resolved {148, 207, 59}`, `changed {25, 48}` |
| 4.1 | Literal 90 gone from dashboard copy | `T src/__tests__/consistency.test.tsx` (test "the literal 90 is gone from the dashboard copy") |
| 4.2 | Gap-reason rows reconcile to 207 before / 59 after | probe: `before 207`, `after 59`, rows listed in §5 |
| 4.3 | `startTour` keeps a profile field | `T src/__tests__/consistency.test.tsx` (startTour tests); mutation check: restoring the old `startTour` failed it |
| F.2 | 13 routes render headless with no React warnings | Playwright script in scratchpad (not committed), §4 below |
| F.3 | 32 changed files re-read from disk with their markers present | `python3 verify.py` (scratchpad) → `files in diff vs master: 32 … problems: 0` |

## 2. Files changed

`git diff --stat 685315c..HEAD` → 32 files, +2460 / −207 (package-lock.json is 1458 of those lines, all additions from the 104 new packages).

Source: `src/App.tsx`, `src/tour/WelcomeGate.tsx`, `src/lib/scoring.ts`, `src/lib/coverage.ts`, `src/data/controls.ts`, `src/data/figures.ts` (new), `src/store/useAssessment.ts`, `src/components/Provenance.tsx` (new), `src/components/layout/TopBar.tsx`, all 13 files in `src/screens/`.
Harness: `package.json`, `package-lock.json`, `vite.config.ts`, `.github/workflows/deploy.yml`, `src/test/setup.ts` (new).
Tests (new): `no_duplicate_figures.test.ts`, `provenance.test.tsx`, `truthfulness.test.tsx`, `projection.test.tsx`, `consistency.test.tsx`.

### Text replacements (before → after)

| File | Before | After |
|---|---|---|
| `src/App.tsx` | `Demonstration prototype · fictional organisation · no data is stored or transmitted.` | `Demonstration prototype · fictional organisation · nothing leaves this machine — your progress is kept in this browser only.` |
| `src/tour/WelcomeGate.tsx` | `Nothing you do here is saved or transmitted.` | `Nothing you do here is transmitted. Your progress is saved in this browser so you can pick up where you left off.` |
| `src/screens/08_Export.tsx` | `Validates against OSCAL 1.1.2 · 5 models · 557 control implementations · 0 errors` | `OSCAL 1.1.2 · 5 models · 557 control implementations. Validation runs in the assessment engine, not in this preview.` |
| `src/screens/04_Dashboard.tsx` | `to narrow this toward ~10 points.` | `to narrow this toward {fmt1(bandFloorPts(TOTALS.applicable, UNCOLLECTABLE_COUNT))} points.` (renders 7.0) |
| `src/screens/04_Dashboard.tsx` | `closed 90 evidence gaps` | `resolved ${resolved} of ${from} Unknown controls` (148 of 207) |
| `src/screens/04_Dashboard.tsx` | `See the 90 promoted controls in the Gap Matrix` | `See the {changed} of {seeded} seeded controls changed by the upload in the Gap Matrix` (25 of 48) |
| `src/screens/03_Intake.tsx` | `148 evidence gaps closed` | `{resolved} Unknown controls resolved ({from} → {to})` (148, 207 → 59) |
| `src/screens/04_Dashboard.tsx` (both interval cards) | — | added, tier `illustrative`: `The aggregate here applies a flat 0.5 to every Partial. Per-control quartile credit is shown on each control's page.` |
| `src/screens/06_ControlDetail.tsx` | no credit statement | `Deployment share N% — partial credit C (quartile) for this control.` (brief's wording) |
| `src/data/controls.ts` | `{ reason: 'not_provided', before: 117, after: 7 }` | `after: 5`, plus new `{ reason: 'module_failed', before: 0, after: 2 }` |
| `src/store/useAssessment.ts` | `startTour: () => set({ ...initial, tourActive: true, tourStep: 0 })` | `startTour` sets only `tourActive`, `tourStep: 0` and `role` (owner unless already owner/analyst) |

Proposed text, not from the brief (flagged per rule 4):
- 3.2, control not currently Yellow: `… would earn partial credit C (…) if Partial; this control is currently <State>, so none applies.`
- 3.2, testimony cap: `(second quartile; capped because the share rests on testimony alone)`.
- 3.4 caption on Remediation: `Best case — all resolved controls pass`, shown only when something is resolved.
- 4.1 phrasing above (the brief said "name each precisely", not what to call them).

## 3. Task 3.4 — failing, then passing

Test: `src/__tests__/projection.test.tsx`. It renders Remediation for each of the 32 subsets of the five artifacts and reads the DOM.

Before the fix (saved as `r1_34_before.txt`): `Tests 1 failed (1)`, `expected [ …(55) ] to deeply equal []`. Examples:
- `{req-siem}: hero width 7.7 != subline width 9.2`
- `{req-linux,req-priv}: lower 76.6 > upper 75.7`
- `{req-siem,req-linux,req-priv,req-backup}: lower 78.9 > upper 73.3`
- a negative hero width of −5.6

Breakdown of the 55 (`grep -c "hero width .* != subline" r1_34_before.txt` → 31; `grep -c "lower .* > upper"` → 12; `grep -c "negative"` → 12; 31 + 12 + 12 = 55).

After the fix (saved as `r1_34_after.txt`): `✓ src/__tests__/projection.test.tsx (1 test)`, `Tests 1 passed (1)`.

Fix: the pool is capped at collectable Unknowns (`max(0, unknown − uncollectable)`); `assertInterval` throws if lower > upper; hero and subline read one `hero` object; the floor comes from `bandFloorPts` in both places.

## 4. Headless render of the 13 routes

Playwright-core (installed outside the repo, so `package.json` is untouched) with `/opt/pw-browsers/chromium-1194`, against `npm run dev`. Tasks was visited with a persisted `role: contributor`; the other twelve as owner. The tour gate was suppressed with `jccp-tour-seen=1`.

- All 13 routes landed on their own hash and rendered an `h1`. Chips per route: Profile 2, RequestPlan 5, Intake 5, Dashboard 9, GapMatrix 1, ControlDetail 1, Remediation 1, Export 13, Chat 1, Exclusions 4, Admin 1, Tasks 1, Rollup 1.
- Console messages: only the two React Router v7 future-flag warnings on every route (pre-existing, not touched), and one `404` on the first route. `curl -I /favicon.ico` also returns 404 and `index.html` has no icon link, so this is consistent with a missing favicon; I did not catch the request URL, so that attribution is unconfirmed.
- No React warnings, no page errors.
- The render found one real defect in my own Task 2 work: on Export, the `planned` chip covered the `.json` links. Fixed in `3fd3bbc` and re-rendered; the chip now sits inline.
- Under jsdom (vitest) Recharts prints "width(0) and height(0)" warnings, because jsdom has no layout. They do not occur in the real browser run above.

## 5. 4.2 arithmetic

`GAP_REASON_BREAKDOWN` rows (before → after): not_provided 117→5, uncollectable_by_design 39→39, insufficient_signal 23→3, declined 15→5, insufficient_permission 8→3, module_failed 0→2, stale 5→2, not_requested 0→0. Sums: 207 before, 59 after (probe). 148 resolved = 207 − 59.
I took the 2 `module_failed` from `not_provided` (7 → 5) on the assumption that both seeded controls carrying it (JNCSF-173, JNCSF-179) were `not_provided` before the upload. That is an inference, not something the data states.

## 6. What I did not do, and why

Rule 1 (do only what the brief asks) — these are false-ish or inconsistent and I left them:
- `src/tour/steps.ts:304`: the tour's closing text says "No data was collected or transmitted". Not in the brief's list.
- Chat answers Q2 and Q4 make state claims I did not verify against the engine.
- `unparseable` is missing from the gap-reason breakdown.
- The Intake banner still carries literal figures; the literal `5` in "Provide 5 more artifacts" is unchanged.
- `src/data/scenario.ts:209` "Corroborating 90 claims" is a different 90 (an ingestion-animation line, tier `planned`). I did not change it.
- Fixture inconsistency: 49 vs 20 collectable Unknowns.
- The green check icon on the OSCAL line still implies a pass beside text that now says validation does not run here.
- The 38 existing literal hits (13 files) stay in the frozen allow-list, tagged `// TODO round 3:`.
- Dependency upgrades: none.

## 7. Things wrong or ambiguous in the brief

1. "Set `YELLOW_QUARTILE` to 0.85 / 0.5 / 0.25 / 0.1" was already the case — a no-op. The real defect was that nothing called it. Also, the share argument had to change from percent to a 0–1 fraction to match the test values (0.8→0.85).
2. "Cap testimony-only shares at the second quartile": the data has no "testimony-only" flag. I used the control's effective evidence class (`testimonial` or `none`) as the proxy. Please confirm.
3. The brief frames 3.4 as one impossible projection. The 32-subset test found 55 separate failures before the fix, including 12 subsets where lower > upper, so it was a family of defects, not one.
4. The brief says to throw in `boundedScore` if lower > upper. I added it, but it does not guard the 3.4 bug, because that bug is in `projectProvision` (which feeds `boundedScore` already-inconsistent counts). I added the assertion in `projectProvision` as well.
5. The inventory (`docs/PROTOTYPE_INVENTORY.md`) is already on master via PR #2, so "read it first" needed no branch work.
6. The brief did not list `@testing-library/dom`, but `@testing-library/react` 16 needs it as a peer. Added, exact-pinned at 10.4.2.
7. `vite.config.ts` now imports `defineConfig` from `vitest/config` instead of `vite` (required for the `test` key to type-check).
8. `startTour` also switches a non-owner/analyst role to owner, because the tour cannot run on screens those roles cannot open. The brief said only "do not wipe the store".

---

## Appendix — final `npm run build` (exit 0)

```

> jccp-prototype@0.1.0 build
> tsc --noEmit && vite build

vite v5.4.21 building for production...
transforming...
✓ 2776 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                              0.66 kB │ gzip:   0.35 kB
dist/assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2     10.25 kB
dist/assets/inter-greek-ext-wght-normal-DlzME5K_.woff2      11.23 kB
dist/assets/inter-cyrillic-wght-normal-DqGufNeO.woff2       18.75 kB
dist/assets/inter-greek-wght-normal-CkhJZR-_.woff2          19.00 kB
dist/assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2   25.96 kB
dist/assets/inter-latin-wght-normal-Dx4kXJAl.woff2          48.26 kB
dist/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2      85.07 kB
dist/assets/index-D20Ro45h.css                              33.46 kB │ gzip:   6.82 kB
dist/assets/motion-Ct5Xfmig.js                             115.26 kB │ gzip:  38.24 kB
dist/assets/react-Db5HS6QK.js                              164.79 kB │ gzip:  53.78 kB
dist/assets/index-REsAfgx4.js                              259.05 kB │ gzip:  70.82 kB
dist/assets/charts-rE-ahWxC.js                             392.54 kB │ gzip: 106.59 kB
✓ built in 6.95s
```

## Appendix — final `npm test` (exit 0)

```

> jccp-prototype@0.1.0 test
> vitest run


 RUN  v2.1.9 /home/user/jccp-prototype

 ✓ src/__tests__/no_duplicate_figures.test.ts (3 tests) 318ms
stderr | src/__tests__/consistency.test.tsx > 4.1 90 vs 148 vs 25 — each figure computed from its own source and named precisely > the dashboard names 148 of 207 Unknown controls and 25 of 48 seeded controls
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/consistency.test.tsx > 4.2 the gap-reason chart accounts for every Unknown > the dashboard chart subtitle total is the Unknown count (the bars themselves need a layout engine)
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/consistency.test.tsx (12 tests) 478ms
stderr | src/__tests__/truthfulness.test.tsx > 3.2 partial-credit quartile > Control Detail shows the actual credit (artifact-backed share, Partial)
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/__tests__/truthfulness.test.tsx > 3.2 partial-credit quartile > the dashboard says the aggregate applies a flat 0.5
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/truthfulness.test.tsx > 3.4 projection floor, pool and invariant > the dashboard and the projection card quote the same floor
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/truthfulness.test.tsx (21 tests) 644ms
stderr | src/__tests__/provenance.test.tsx > Provenance component > TierLegend names all three tiers, and the top bar contains it
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/__tests__/provenance.test.tsx > every screen states its provenance > 04_Dashboard renders at least one tier chip and no measured region
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/provenance.test.tsx (18 tests) 606ms
stderr | src/__tests__/projection.test.tsx > projected interval, all 32 subsets of the five artifacts > always shows lower ≤ upper, width ≥ 0, and the same width in hero and subline
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/__tests__/projection.test.tsx (1 test) 1272ms
   ✓ projected interval, all 32 subsets of the five artifacts > always shows lower ≤ upper, width ≥ 0, and the same width in hero and subline 1271ms

 Test Files  5 passed (5)
      Tests  55 passed (55)
   Start at  19:31:01
   Duration  5.55s (transform 1.62s, setup 954ms, collect 5.36s, tests 3.32s, environment 2.39s, prepare 589ms)

```
