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
| `923ce9c` | This report |
| `84fcdc5` | Round 1 follow-up after review — §8 |
| next commit | Closing follow-up — §9 (supersedes parts of §8.2, §8.4 as marked) |

Baseline before any change: `npm ci` exit 0 and `npm run build` exit 0 on `origin/master`.
Final state (after §8 and §9): `npm run build` exit 0; `npm test` 8 files, 84 tests, all passing. The appendices hold the full outputs.
(Before the first follow-up it was 5 files / 55 tests; after it, 7 files / 72.)

---

## 1. Claims and the command that proves each

Run everything from the repo root. `T` means `npx vitest run <file>`.

| # | Claim | Command |
|---|---|---|
| 0.1 | Build passes | `npm run build; echo $?` → `0` |
| 0.2 | 84 tests pass in 8 files | `npm test` → `Test Files 8 passed (8)`, `Tests 84 passed (84)` |
| 0.3 | Test deps are exact-pinned; 104 packages added, none removed, none changed in version/resolved/integrity (but see §9.6: 14 entries lost a `libc` field) | `grep -E '"(vitest\|jsdom\|@testing-library/[a-z-]+)"' package.json` shows no `^`/`~`; `git diff 685315c..feba4ba --stat -- package-lock.json` |
| 0.4 | CI runs tests before build | `grep -n "needs: test" .github/workflows/deploy.yml` |
| 1.1 | Six canonical figures exist, each with a source comment | `cat src/data/figures.ts` |
| 1.2 | New literal `557` outside the allow-list fails the guard | append `const x = 557;` to `src/lib/coverage.ts`, `T src/__tests__/no_duplicate_figures.test.ts` → `src/lib/coverage.ts: literal 557 appears 1x, allow-list permits 0x`; reverted |
| 1.3 | Guard passes on the committed tree | `T src/__tests__/no_duplicate_figures.test.ts` → 3 passed |
| 2.1 | Every one of the 13 screens renders a chip; none renders `measured` | `T src/__tests__/provenance.test.tsx` → 18 passed (`it.each` over 13 screens) |
| 2.2 | Legend is in the top bar | `grep -n TierLegend src/components/layout/TopBar.tsx` |
| 3.1 | Banned strings are gone from `src/` | `grep -rn "no data is stored\|Nothing you do here is saved\|0 errors" src \| grep -v __tests__ \| wc -l` → `0` |
| 3.2 | 0.8→0.85, 0.6→0.5, 0.3→0.25, 0.1→0.1; a `claimed` share is capped at 0.5 | `T src/__tests__/truthfulness.test.tsx` ("yellowWeightForShare follows the quartile table", "a claimed share is capped…") |
| 3.2 | A caller exists in `src/screens/` | `grep -n yellowWeightForShare src/screens/*.tsx` → `06_ControlDetail.tsx` |
| 3.3 | OSCAL line replaced and card is `planned` | `grep -n "Validation runs in the assessment engine" src/screens/08_Export.tsx` |
| 3.4 | Property test over all 32 subsets fails before the fix and passes after | §3 below; `T src/__tests__/projection.test.tsx` |
| 3.4 | Floor is 7.0 pts (39 uncollectable of 557 applicable) | `T src/__tests__/truthfulness.test.tsx` ("floor is computed from the uncollectable count") |
| 3.5 | Chat quotes live figures; illustrative answers are marked | `T src/__tests__/truthfulness.test.tsx` (tests with `evidenceUploaded` false and true) |
| 4.1 | 148 of 207 Unknown resolved; 25 of the 48 controls in the sample changed | `T src/__tests__/consistency.test.tsx` ("the three sources…", asserts 207, 59, 148, 25, 48) |
| 4.1 | Literal 90 gone from dashboard copy | `T src/__tests__/consistency.test.tsx` (test "the literal 90 is gone from the dashboard copy") |
| 4.2 | Gap-reason rows reconcile to 207 before / 59 after | `T src/__tests__/consistency.test.tsx` ("rows reconcile to TOTALS before and after") |
| 4.3 | `startTour` keeps a profile field | `T src/__tests__/consistency.test.tsx` (startTour tests); the mutation check (old `startTour` restored, test failed) was run once, §9.5 |
| F.2 | 13 routes render headless with no React warnings | Playwright scripts in the scratchpad (not committed; established once, §9.5), §4 below |
| 8.1 | Gap-reason chart card is `illustrative` | `npx vitest run src/__tests__/followup.test.tsx` (test "its card sits inside an illustrative region") |
| 8.2 | Share basis is data on exactly 3 controls, and the cap reads it | `grep -n "share:" src/data/controls.ts`; `followup.test.tsx` (data and "cap reads the basis" groups) |
| 8.2 | Old evidence-class proxy would fail the new tests | mutation run (established once, §9.5); 3 tests fail |
| 8.3 | Tour line, OSCAL icon fixed | `grep -rn "No data was collected or transmitted" src` → no match; `truthfulness.test.tsx` 3.1 and 3.3 |
| 8.4 | Runtime guard stops an inconsistent interval before it renders | `display_guard.test.tsx`; mutation run removing the guard fails 2 tests (established once, §9.5) |
| 9.1 | 394 is `claimed` after upload; its capped text renders | `T src/__tests__/followup.test.tsx` ("after the upload 102 and 459 are measured counts; 394 stays claimed") |
| 9.2 | A guard failure withholds the figure, keeps the page, logs the guard; ordinary errors are not swallowed | `T src/__tests__/followup.test.tsx src/__tests__/display_guard.test.tsx src/__tests__/boundary_app.test.tsx` |
| 9.3 | "seeded controls changed" is gone from the dashboard | `T src/__tests__/consistency.test.tsx` ("the dashboard names 148 of 207…") |
| 9.4 | 49 = sum of five `controlsUnlocked`; 20 = 59 − 39; all five resolve exactly 20 | `T src/__tests__/consistency.test.tsx` ("fixture: the five Remediation artifacts…") |
| 9.6 | Lockfile: 104 added, 0 removed, 14 entries changed (metadata only) | `node docs/evidence/lockdiff.js 685315c feba4ba` |
| F.3 | Changed files re-read from disk with their markers present | scratchpad script (established once, §9.5); counts are in each follow-up's reply |

## 2. Files changed

`git diff --stat 685315c..HEAD` → 32 files, +2460 / −207 (package-lock.json is 1458 of those lines: 104 added packages plus the metadata change described in §9.6).

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
| `src/screens/04_Dashboard.tsx` | `See the 90 promoted controls in the Gap Matrix` | Round 1: `See the {changed} of {seeded} seeded controls changed by the upload in the Gap Matrix`. After review (§9.3): `See the {changed} of the {seeded} controls in this sample that the upload changed in the Gap Matrix` (25 of the 48) |
| `src/screens/03_Intake.tsx` | `148 evidence gaps closed` | `{resolved} Unknown controls resolved ({from} → {to})` (148, 207 → 59) |
| `src/screens/04_Dashboard.tsx` (both interval cards) | — | added, tier `illustrative`: `The aggregate here applies a flat 0.5 to every Partial. Per-control quartile credit is shown on each control's page.` |
| `src/screens/06_ControlDetail.tsx` | no credit statement | Round 1: `Deployment share N% — partial credit C (quartile) for this control.` (brief's wording). After the §8.2 follow-up the basis follows the share: `Deployment share N% (claimed\|measured) — partial credit C (quartile) for this control.` |
| `src/data/controls.ts` | `{ reason: 'not_provided', before: 117, after: 7 }` | `after: 5`, plus new `{ reason: 'module_failed', before: 0, after: 2 }` |
| `src/store/useAssessment.ts` | `startTour: () => set({ ...initial, tourActive: true, tourStep: 0 })` | `startTour` sets only `tourActive`, `tourStep: 0` and `role` (owner unless already owner/analyst) |

Proposed text, not from the brief (flagged per rule 4):
- 3.2, control not currently Yellow: `… would earn partial credit C (…) if Partial; this control is currently <State>, so none applies.`
- 3.2, testimony cap: `(second quartile; capped because the share rests on testimony alone)`.
- 3.4 caption on Remediation: `Best case — all resolved controls pass`, shown only when something is resolved.
- 4.1 phrasing above (the brief said "name each precisely", not what to call them).

## 3. Task 3.4 — failing, then passing

Test: `src/__tests__/projection.test.tsx`. It renders Remediation for each of the 32 subsets of the five artifacts and reads the DOM.

Before the fix (captured output, committed as `docs/evidence/task3.4_projection_before_fix.txt`): `Tests 1 failed (1)`, `expected [ …(55) ] to deeply equal []`. Examples:
- `{req-siem}: hero width 7.7 != subline width 9.2`
- `{req-linux,req-priv}: lower 76.6 > upper 75.7`
- `{req-siem,req-linux,req-priv,req-backup}: lower 78.9 > upper 73.3`
- a negative hero width of −5.6

Breakdown of the 55 (`grep -c "hero width .* != subline" docs/evidence/task3.4_projection_before_fix.txt` → 31; `grep -c "lower .* > upper"` → 12; `grep -c "negative"` → 12; 31 + 12 + 12 = 55).

After the fix (`docs/evidence/task3.4_projection_after_fix.txt`): `✓ src/__tests__/projection.test.tsx (1 test)`, `Tests 1 passed (1)`.

Fix: the pool is capped at collectable Unknowns (`max(0, unknown − uncollectable)`); `assertInterval` throws if lower > upper; hero and subline read one `hero` object; the floor comes from `bandFloorPts` in both places.

## 4. Headless render of the 13 routes

Playwright-core (installed outside the repo, so `package.json` is untouched) with `/opt/pw-browsers/chromium-1194`, against `npm run dev`. Tasks was visited with a persisted `role: contributor`; the other twelve as owner. The tour gate was suppressed with `jccp-tour-seen=1`.

- All 13 routes landed on their own hash and rendered an `h1`. Chips per route: Profile 2, RequestPlan 5, Intake 5, Dashboard 9, GapMatrix 1, ControlDetail 1, Remediation 1, Export 13, Chat 1, Exclusions 4, Admin 1, Tasks 1, Rollup 1.
- Console messages: only the two React Router v7 future-flag warnings on every route (pre-existing, not touched), and one `404` on the first route. `curl -I /favicon.ico` also returns 404 and `index.html` has no icon link, so this is consistent with a missing favicon; I did not catch the request URL, so that attribution is unconfirmed.
- No React warnings, no page errors.
- The render found one real defect in my own Task 2 work: on Export, the `planned` chip covered the `.json` links. Fixed in `3fd3bbc` and re-rendered; the chip now sits inline.
- Under jsdom (vitest) Recharts prints "width(0) and height(0)" warnings, because jsdom has no layout. They do not occur in the real browser run above.

## 5. 4.2 arithmetic

`GAP_REASON_BREAKDOWN` rows (before → after): not_provided 117→5, uncollectable_by_design 39→39, insufficient_signal 23→3, declined 15→5, insufficient_permission 8→3, module_failed 0→2, stale 5→2, not_requested 0→0. Sums: 207 before, 59 after (test, §9.5). 148 resolved = 207 − 59.
**Correction (from review):** I wrote here that the `not_provided` → `module_failed` assumption was "an inference, not something the data states". That was wrong for the two seeded controls: `src/data/controls.ts:131-132` (JNCSF-173 and JNCSF-179) are both `before: ['unknown','none','not_provided']`, `after: ['unknown','none','module_failed']`. I had been reading `GAP_REASON_BREAKDOWN`, an aggregate over 207/59 controls, which is a different population from the 48 seeds and genuinely does not say.
What stays a choice, not a derivation: how many of the 59 Unknowns after the upload are `module_failed` across the whole framework. The data fixes only the 2 seeded ones (8 seeded Unknowns after upload, 2 of them `module_failed`; see §8.1). Taking 2 from `not_provided` (7 → 5) keeps the total at 59. The comment at `GAP_REASON_BREAKDOWN` now says so.

## 6. What I did not do, and why

Rule 1 (do only what the brief asks) — these are false-ish or inconsistent and I left them:
- ~~`src/tour/steps.ts:304`: the tour's closing text says "No data was collected or transmitted".~~ Fixed in the §8 follow-up, on instruction.
- Chat answers Q2 and Q4 make state claims I did not verify against the engine.
- `unparseable` is missing from the gap-reason breakdown.
- The Intake banner still carries literal figures; the literal `5` in "Provide 5 more artifacts" is unchanged.
- `src/data/scenario.ts` "Corroborating 90 claims" is a different 90 (an ingestion-animation line, tier `planned`). Left as is; a comment now says it is unrelated to the dashboard figures (§8.3).
- Fixture inconsistency: five Remediation artifacts claim 49 unlocked controls against a pool of 20 collectable Unknowns. Not fixed (fixture, Round 3); the pool cap keeps the projection honest. Named precisely in §9.4.
- ~~The green check icon on the OSCAL line.~~ Replaced with a neutral mark in the §8 follow-up, on instruction.
- The 38 existing literal hits (13 files) stay in the frozen allow-list, tagged `// TODO round 3:`.
- Dependency upgrades: none.

## 7. Things wrong or ambiguous in the brief

1. "Set `YELLOW_QUARTILE` to 0.85 / 0.5 / 0.25 / 0.1" was already the case — a no-op. The real defect was that nothing called it. Also, the share argument had to change from percent to a 0–1 fraction to match the test values (0.8→0.85).
2. "Cap testimony-only shares at the second quartile": the data had no "testimony-only" flag, so I used the control's effective evidence class as a proxy. Review found the proxy wrong in one direction (an artifact can prove a control exists while the share is only claimed); it is replaced by a data field in §8.2.
3. The brief frames 3.4 as one impossible projection. The 32-subset test found 55 separate failures before the fix, including 12 subsets where lower > upper, so it was a family of defects, not one.
4. The brief says to throw in `boundedScore` if lower > upper. I added it, but it does not guard the 3.4 bug, because that bug is in `projectProvision` (which feeds `boundedScore` already-inconsistent counts). I added the assertion in `projectProvision` as well.
5. The inventory (`docs/PROTOTYPE_INVENTORY.md`) is already on master via PR #2, so "read it first" needed no branch work.
6. The brief did not list `@testing-library/dom`, but `@testing-library/react` 16 needs it as a peer. Added, exact-pinned at 10.4.2.
7. `vite.config.ts` now imports `defineConfig` from `vitest/config` instead of `vite` (required for the `test` key to type-check).
8. `startTour` also switches a non-owner/analyst role to owner, because the tour cannot run on screens those roles cannot open. The brief said only "do not wipe the store".

---


---

## 8. Follow-up after review (one commit on this branch)

Rulings received; each is answered below with the file and line where it landed.

### 8.1 Gap-reason chart (ruling "4.2")
- Comment at the `GAP_REASON_BREAKDOWN` definition (`src/data/controls.ts:237`): the `module_failed` count is chosen to be consistent with the seeded controls and not derived from any source.
- The chart card ("Why controls are unevidenced", `src/screens/04_Dashboard.tsx:490-532`) was already wrapped in `<Provenance tier="illustrative">`. Now guarded by a test: `followup.test.tsx` › "its card sits inside an illustrative region".
- The reviewer's figures check out: 48 seeds, 8 with `state: unknown` after upload, 2 of those `module_failed` (JNCSF-173, JNCSF-179). Now committed as a test (§9.5).

### 8.2 Share basis moved into the data (ruling "Q1") — two deviations, please confirm
Done: `ShareBasis = 'measured' | 'claimed'` (`controls.ts:23`); the quartile cap now reads it (`yellowWeightForShare(share, basis)`, `src/lib/scoring.ts`), not the evidence class; Control Detail shows the basis beside the share and reads it from the data (`src/screens/06_ControlDetail.tsx:117`).

**Deviation 1 — the field is on the snapshot, not on `Control`.** The ruling asked for `deploymentShareBasis` on the `Control` type with "today's values identical". Both cannot hold. The old proxy depended on the upload state, and all three seeded shares flip with it: testimonial before upload (claimed), artifact after (measured). A single per-control value must either cap JNCSF-459 after upload (today it earns 0.85 uncapped) or leave JNCSF-102 uncapped before upload, where it is an interview claim ("Around 80%", `evidence.ts:28`). I put the field on `ControlSnapshot` (`before` / `after`), the same place `evidenceClass` lives. Seeded values first reproduced the old proxy exactly (claimed before, measured after, for all three). **Superseded in §9.1:** 394 is now `claimed` after the upload.

**Deviation 2 — the field is seeded on 3 controls, not 48.** Only JNCSF-102, -394 and -459 carry a `deploymentSharePct` (`grep -n "share:" src/data/controls.ts`). A basis on a control with no share would describe nothing. A data test enforces both directions: exactly those three carry a basis, and no other control does.

Also in the data layer: a test states the ruling's "sound one way" rule as an invariant on the data, not as logic: a share beside `none` or `testimonial` evidence must be recorded `claimed`.

Analyst override: see §9.1. It is a fix, not a side effect: an analyst signing a state says nothing about how the share was learned, so a claimed share stays claimed under an override. The old proxy treated an overridden control as `analyst_signed` and was wrong. Test: "an analyst override does not turn a claimed share into a measured one".

Basis for the 394 seed: first seeded `measured` after the upload because the old proxy gave that, with a flag that its record says only "Coverage ~80%". Reversed on review; see §9.1.

Proposed text changed (rule 4, flagged): the basis now appears in the sentence, and the capped reason is reworded because "rests on testimony alone" is no longer the rule. See the verbatim strings in the reply.

### 8.3 The three items I had left alone
1. Tour closing line (`src/tour/steps.ts:304`): "No data was collected or transmitted." → "Nothing is transmitted, and your progress is kept in this browser only." (proposed wording; same construction as 3.1). The 3.1 test now also bans the old string and checks the new one is present. I grepped `src/` for other instances (`grep -rniE "no data|nothing (is|was|you do).*(saved|stored|collected|transmitted)|not (saved|stored)|transmitted|collected or"`): only this one and the already-correct WelcomeGate line matched.
2. OSCAL line (`src/screens/08_Export.tsx:155-156`): the green `BadgeCheck` and `text-emerald-700` are now a slate `Info` mark and `text-slate-500`. Test asserts no green class and no check icon on that line. The Signed-package card beside it still has a green `ShieldCheck`; it sits inside the `planned` region and I left it (not named in the ruling).
3. "Corroborating 90 claims": untouched, with a one-line comment at `src/data/scenario.ts:209`.

### 8.4 Runtime assertion on the displayed interval — where it is and what it covers
New `assertDisplayedInterval(lower, upper, width, where)` (`src/lib/scoring.ts:57`). It throws unless lower ≤ upper and, when a width is passed, |width − (upper − lower)| ≤ 1e-6.

Called from **`ScoreInterval`** (`src/components/ScoreInterval.tsx:35-37`) for the band itself, the ghost band and the `animateFrom` band. Every interval drawn on screen goes through that component: the Remediation hero and its ghost (worst case), and the three Dashboard call sites (executive card, main card, per-capability rows).

What this covers, path by path:
- **Remediation hero:** `hero.lower` / `hero.upper` / `hero.width` all go in as props, so a width that does not match the band throws. The subline's "Band width falls to X pts" reads the same `hero.width`; both are in one render, and a throw in `ScoreInterval` prevents the commit, so the subline cannot reach the screen with a different number.
- **Dashboard:** `eff.lowerPct`, `eff.upperPct`, `eff.widthPts` from `dashboardView` → `boundedScore`.
- **Not covered:** text built from numbers that never pass through `ScoreInterval` (the per-artifact "best case … / worst case …" lines at `07_Remediation.tsx:139-140` and Chat quotes). Those are guarded only upstream by `assertInterval` in `projectProvision` and `boundedScore` (`scoring.ts:75,113,114`), which checks lower ≤ upper but not widths.

Why the earlier placement was not enough: the Round 1 `assertInterval` calls sit in the library, upstream of the screen. They catch an inverted interval but cannot catch a width that disagrees with the band, which was the larger part of the 3.4 failure (31 of the 55 failures were hero-width ≠ subline-width).

Tests: unit tests of the function; `ScoreInterval` throws for an inverted band, a wrong width, an inverted ghost; and `display_guard.test.tsx` corrupts `projectProvision`'s width (mocked) and shows the Remediation screen throws "Displayed interval inconsistent in ScoreInterval" (and does not throw when uncorrupted; the test opens the second tab, otherwise it would pass vacuously — my first version did exactly that and failed, which is how I found it).

Mutation checks (files copied aside and restored byte-identical):
- Guard calls removed from `ScoreInterval` → 2 tests fail (the `ScoreInterval` test and the Remediation one).
- Old evidence-class proxy put back into `06_ControlDetail.tsx` → 3 tests fail (artifact + claimed capped; testimonial + measured not capped; override).

**Resolved in §9.2:** the app had no error boundary (`grep -rn "ErrorBoundary\|componentDidCatch" src` → no matches at the time), so a guard throw blanked the whole page. A boundary now withholds the figure with an honest message instead.

### 8.5 Verification
- `npx tsc --noEmit` exit 0; `npm run build` exit 0; `npm test` 7 files, 72 tests (55 + 13 `followup` + 2 `display_guard` + 2 added to `truthfulness`).
- Headless render again (dev server, Playwright-core, scratchpad scripts): all 13 routes, 0 console errors or React warnings beyond the React Router future-flag notices; plus dashboard before/after upload (owner and executive), Remediation tab B with nothing and with all 5 artifacts provided ("20 controls become known. Band width falls to 7.0 pts"), Control Detail 102 before/after and 459 after, Export, Rollup as regulator. The new guard did not throw on any of them. The Control Detail text read from the real page:
  - 102 before: `Deployment share 80% (claimed) — partial credit 0.5 (second quartile; capped because the share is claimed, not measured) for this control.`
  - 102 after: `Deployment share 80% (measured) — would earn partial credit 0.85 (top quartile) if Partial; this control is currently Gap, so none applies.`
  - 459 after: `Deployment share 78% (measured) — partial credit 0.85 (top quartile) for this control.`
- Disk re-read: see the reply for the file count.


---

## 9. Closing follow-up (second review round)

### 9.1 JNCSF-394 is `claimed` after the upload
Seeded `shareBasis: { before: 'claimed', after: 'claimed' }` (`src/data/controls.ts`, seed comment above `const seeds`). Its evidence record says only "Coverage ~80%" (`evidence.ts:109`): a tilde and no denominator, so nobody counted. 102 (410/512) and 459 (484/620) are counts and stay `measured` after. Seeding 394 `measured` only because the old proxy did was reasoning from the artefact being replaced.
Effect on screen: after the upload JNCSF-394 reads `Deployment share 80% (claimed) — would earn partial credit 0.5 (second quartile; capped because the share is claimed, not measured) if Partial; this control is currently Compliant, so none applies.` It is the one control whose share stays capped after the upload.
Tests (`followup.test.tsx`): the old "seeds reproduce the proxy" test is replaced by three that say why they no longer should: every share is claimed before; after the upload exactly `{102: measured, 394: claimed, 459: measured}`; and 394 renders the capped text above while holding artifact evidence. Mutation: seeding 394 `measured` again fails 2 of them.
**Analyst override (correcting §8.2):** I described the override result as a behaviour change. It is a fix. An analyst signing a *state* says nothing about how the *share* was learned, and the system cannot know whether they measured it, so a claimed share staying claimed is correct. The old proxy (override ⇒ `analyst_signed` ⇒ uncapped) was wrong.

### 9.2 The error boundary (replaces the "observation, not fixed" in §8.4)
The guard is unchanged: it still throws. What changed is what catches the throw.
- `src/components/FigureBoundary.tsx` shows, verbatim: *This figure could not be displayed because it failed an internal consistency check. The assessment data is unchanged; the number was withheld rather than shown unverified.* (exported as `WITHHELD_MESSAGE`; `role="alert"`, `data-where` carries the guard).
- It catches **only** `IntervalConsistencyError` (new, `src/lib/scoring.ts`; thrown by `assertInterval` and `assertDisplayedInterval`, carries `where`). Any other error is rethrown, so an ordinary bug is not hidden behind a message about consistency.
- It logs `[consistency] figure withheld by guard "<where>": <message>` via `console.error` from `componentDidCatch`.
- It retries when the figure's inputs change (`resetKey`), so the demo recovers after the next action.
- **Figure level:** `ScoreInterval` now wraps its band in the boundary (`src/components/ScoreInterval.tsx`). Only the band, its caption and its subline are replaced; the card, the other cards and the navigation keep rendering. Seen in a real browser with the Remediation width deliberately corrupted: message in place of the band, sidebar and "The band cannot fall below 7.0 pts…" note still there, guard logged.
- **Screen level (my addition, please confirm):** `src/App.tsx` wraps the routes in the same boundary. The figure-level boundary cannot catch a guard that fires while a screen is *deriving* its numbers (`boundedScore` inside `dashboardView`, `projectProvision` in Remediation's `useMemo`): those throw in the screen's own render, above any `ScoreInterval`, and would still blank the page. At screen level the sidebar, top bar and banner stay and the screen shows the same message. Without it the white screen survives on that path.
- Tests: `followup.test.tsx` (withheld message, no number rendered, `where` logged, ordinary errors rethrown, siblings kept, retry on `resetKey`), `display_guard.test.tsx` (Remediation: figure withheld, no "Band width falls to", card and floor note still present, guard logged), `boundary_app.test.tsx` (App with `boundedScore` forced to fail: message shown, banner and `<nav>` intact, guard logged).
- Mutation checks, each restored byte-identical (`cmp`): App-level boundary removed → 1 test fails; rethrow removed → 1 fails; `resetKey` retry removed → 1 fails; 394 reverted → 2 fail. **The rethrow mutation first survived**: my `silenced` test helper was declared `async`, so an assertion failing inside it became an unhandled rejection instead of a test failure, which made all three `FigureBoundary` tests vacuous. Found by the mutation run; fixed before commit.
- In dev mode React also reports the caught error to `window.onerror`, so Playwright shows it as a page error even though the page keeps rendering. The `console.error` line with the guard name is the intended log.

### 9.3 Regulator-facing wording
`See the {changed} of {seeded} seeded controls changed by the upload in the Gap Matrix` → `See the {changed} of the {seeded} controls in this sample that the upload changed in the Gap Matrix` (`src/screens/04_Dashboard.tsx`; renders "See the 25 of the 48 controls in this sample that the upload changed"). The sample-versus-framework distinction is kept: the line above it says 148 of 207 (framework-wide), this one says 25 of 48 (the sample). Test also asserts the string `seeded controls changed` is gone.
Other on-screen uses of "seeded" that I did **not** change (they pre-date Round 1; flagging for your call): `src/screens/05_GapMatrix.tsx:151` ("… seeded shown"), `:177` ("No seeded controls match the current filters."), `src/screens/10_Exclusions.tsx:95` ("… shown of N seeded"). The Gap Matrix one is where the changed link above lands, so the vocabulary now differs by one click.

### 9.4 "49 vs 20 collectable Unknowns" — named precisely
- **49** = the sum of `controlsUnlocked` over the five artifacts in `evidenceRequests` (`src/data/remediation.ts:83-87`): siem 8 + linux 18 + priv 14 + backup 5 + lms 4.
- **20** = the Unknowns the upload leaves that *can* be collected: `TOTALS.after.unknown` (59, `src/data/capabilities.ts`) − `UNCOLLECTABLE_COUNT` (39, `src/data/controls.ts:255`).
- Which is wrong: neither number alone. The *sum* is not meaningful: 49 > 20, so the five artifacts' sets must overlap (18 + 14 = 32 already exceeds 20). The 20 reconciles to `TOTALS` and is asserted throughout; the five counts are free-standing hand-entered numbers, so they are the unreliable side, though the data does not say which artifact is overstated.
- How it feeds the floor: the floor (39/557 = 7.0 pts) does not use 49. It holds because `projectProvision` caps the pool at 20. Uncapped, providing all five would resolve 49 and leave 59 − 49 = 10 Unknowns, a width of 1.8 pts, below the 7.0 floor: that was the impossible projection fixed in 3.4. Computed: `node -e 'const A=557,U=59,F=39;console.log(U-F, 8+18+14+5+4, U-49, (U-49)/A*100, F/A*100)'` → `20 49 10 1.7953321364452424 7.001795332136446`.
- Committed as tests (`consistency.test.tsx`, "fixture: the five Remediation artifacts claim more than the Unknown pool…"): both numbers, and that providing all five resolves exactly the pool with the band stopping at the floor.
- Whether it dissolves in Round 3: owner ruling in the Round 2 brief: yes. Controls-unlocked becomes a computed intersection of what each requested signal serves with the applicable set, instead of five hand-entered integers. Both committed tests stay and become the regression check when the computation lands.

### 9.5 Which claims are guarded, and which were established once
Every figure in §1 that previously rested on a deleted probe is now covered by a committed test:
- 3.2 quartile values, `claimed` cap: `truthfulness.test.tsx` and `followup.test.tsx`.
- 3.4 floor 7.0: `truthfulness.test.tsx` ("floor is computed from the uncollectable count").
- 4.1 148 / 207 / 59 / 25 / 48: `consistency.test.tsx` ("the three sources…", now also asserts 207 and 59 individually).
- 4.2 207 → 59 reconcile: `consistency.test.tsx` ("rows reconcile to TOTALS…").
- 8.1 "8 of 48 seeds Unknown after upload, 2 `module_failed` (JNCSF-173, -179), both `not_provided` before": new, `consistency.test.tsx` ("the seeded sample behind the 4.2 choice").
- 4.2 49 vs 20: new (§9.4).

**Established once, not guarded by any committed test** (say so rather than imply otherwise):
- Baseline: `npm ci` and `npm run build` exit 0 on `origin/master` before any change.
- The 3.4 failing-then-passing outputs. The failing run was against pre-fix code that no longer exists in the history, so it cannot be re-run from HEAD. The captured outputs are committed as `docs/evidence/task3.4_projection_before_fix.txt` and `…after_fix.txt`; the 31 + 12 + 12 = 55 breakdown is a `grep -c` over the first file.
- All Playwright renders (13 routes; post-upload dashboards; Remediation with 0 and 5 artifacts; the withheld-figure screenshot). The scripts live in the scratchpad and are not committed because Playwright is not a dependency of this repo and adding one was not asked for. The `404` on first load is *consistent with* a missing favicon (`curl /favicon.ico` → 404, no icon link in `index.html`); I never captured the request URL.
- Every mutation check (guard removed, proxy restored, `startTour` restored, boundary pieces removed, 394 reverted): run once, files restored byte-identical. Their purpose was to show the new tests bite; they are not themselves tests.
- The disk re-read check ("N files with markers present"): a scratchpad script, not committed.
- Lockfile: see 9.6.

### 9.6 Lockfile — stated precisely
Reproduce with `node docs/evidence/lockdiff.js 685315c feba4ba`: `{"added":104,"removed":0,"changedEntries":14,"changedVersionResolvedOrIntegrity":0}`.
- 104 packages were added and none removed.
- **No existing package changed `version`, `resolved` or `integrity`.**
- 14 existing optional platform packages (13 `@rollup/rollup-linux-*` and `@napi-rs/lzma-linux-x64-gnu`) no longer carry a `libc` metadata field: npm 10.9.4 normalised its own file format when it rewrote the lockfile. That is the package manager's formatting, not a package change.
- Deliberately **not** reverted (owner ruling): putting the field back would be undone by the next `npm ci`/`npm install`.
(Earlier text in this report that called the lockfile "purely additive" or "no existing package changed" was imprecise; this section is the correct statement.)

### 9.7 Verification
`npx tsc --noEmit` exit 0; `npm run build` exit 0; `npm test` 8 files, 84 tests (72 + 2 `boundary_app` + 6 `followup` + 4 `consistency`). Re-render: 13 routes, 0 console errors or React warnings beyond the React Router future-flag notices, on the committed code. Disk re-read: see the reply for the count.

## Appendix — final `npm run build` (exit 0)

```

> jccp-prototype@0.1.0 build
> tsc --noEmit && vite build

vite v5.4.21 building for production...
transforming...
✓ 2777 modules transformed.
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
dist/assets/index-DXfkbSVv.js                              261.23 kB │ gzip:  71.69 kB
dist/assets/charts-rE-ahWxC.js                             392.54 kB │ gzip: 106.59 kB
✓ built in 7.13s
```

## Appendix — final `npm test` (exit 0)

```

> jccp-prototype@0.1.0 test
> vitest run


 RUN  v2.1.9 /home/user/jccp-prototype

stderr | src/__tests__/followup.test.tsx > share basis is a fact in the data > so one control still shows a capped share after the upload (394, which has artifact evidence)
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/__tests__/followup.test.tsx > 4.2 the gap-reason chart is tagged illustrative > its card sits inside an illustrative region
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/followup.test.tsx (19 tests) 470ms
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

 ✓ src/__tests__/truthfulness.test.tsx (23 tests) 572ms
stderr | src/__tests__/consistency.test.tsx > 4.1 90 vs 148 vs 25 — each figure computed from its own source and named precisely > the dashboard names 148 of 207 Unknown controls and 25 of the 48 controls in this sample
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

 ✓ src/__tests__/consistency.test.tsx (16 tests) 489ms
 ✓ src/__tests__/no_duplicate_figures.test.ts (3 tests) 238ms
stderr | src/__tests__/display_guard.test.tsx > Remediation reaches the screen only through the guard > shows the band when the width agrees with it
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/__tests__/display_guard.test.tsx (2 tests) 250ms
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

 ✓ src/__tests__/provenance.test.tsx (18 tests) 670ms
stderr | src/__tests__/boundary_app.test.tsx > the app keeps its chrome when a derivation guard fires > renders the Dashboard normally when nothing is wrong
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

 ✓ src/__tests__/boundary_app.test.tsx (2 tests) 228ms
stderr | src/__tests__/projection.test.tsx > projected interval, all 32 subsets of the five artifacts > always shows lower ≤ upper, width ≥ 0, and the same width in hero and subline
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/__tests__/projection.test.tsx (1 test) 1308ms
   ✓ projected interval, all 32 subsets of the five artifacts > always shows lower ≤ upper, width ≥ 0, and the same width in hero and subline 1307ms

 Test Files  8 passed (8)
      Tests  84 passed (84)
   Start at  20:56:59
   Duration  7.14s (transform 1.69s, setup 1.51s, collect 6.80s, tests 4.22s, environment 4.10s, prepare 784ms)

```
