# Round 3 report — grounding the prototype in the engine's output

Branch `round-3/measured`, from `round-2/unauthored`. One commit per task, plus the carry-over commit the Round 2 close asked for. Not merged.

```
3213edd  Round 3 carry-over: the before-state says it sits on the threshold
655aa05  Round 3 Task 1: the generator reads all three goldens
3f1d6b7  Round 3 Task 2: all applicable controls, and the end of "the sample"
fe9d3f7  Round 3 Task 3: `measured` enters the vocabulary
44b5b02  Round 3 Task 4: remediation from the engine's ranking
b5b5748  Round 3 Task 5: the profile switcher chooses among the three real assessments
```

(`git log --oneline round-2/unauthored..HEAD`)

---

## 0. What is now `measured`, and what is not — by screen

**How to read the tiers.** `measured` means: the figure on the screen is read from one of the three golden files, and the element names the path it is read from (`data-source`; a test resolves every one of them against all three profiles). `illustrative` means: invented or carried by the prototype for the demonstration, marked on the element. `planned` means: something the system will do that the prototype does not. Before the evidence upload, the screens show **rule R's projection** of the engine's data (the verdicts that rest on testimony or documents): that is arithmetic on the golden, not an engine run, so it is marked `illustrative` with the reason on screen. After the upload, the same elements are `measured`. An analyst override moves a region back to `illustrative` (the golden does not contain the override).

Marks as the source has them (`grep -n 'tier="' src/screens/*.tsx`, `grep -c StateProvenance`):

| Screen | `measured` (after the upload) | Not measured |
|---|---|---|
| **Organisation Profile** | The assessment selector (the three assessments, their applicable/excluded counts and source files; path `totals`). The CICSC line: derived from the golden's `cicsc_boundary`, with its basis. | Every input on the form (size, hosting, counts, cloud, PDPL holdings) and the "Live scoping" panel: `illustrative`. The live count agrees with the golden's applicable count for each assessment (tested) but is computed from the toggles. Sector N/A baseline: invented (`SECTOR_BASELINE`). |
| **Evidence Request Plan** | Nothing carries a `measured` mark. The summary sentence's figures (applicable, authored scope, unauthored) are read from the active assessment. | The 22 artifacts, their systems, owners, commands, effort and `controlsUnlocked`: `illustrative`; the collector buttons: `planned`. These counts were not touched (see §3, item 4). |
| **Intake** | Nothing carries a `measured` mark. | Slots, bundle, module ledger, ingestion, interviews, review queue, extracted claims: `illustrative` / `planned`. Contradicted-testimony entries elsewhere (Control Detail) are the golden's. |
| **Compliance Dashboard** | Interval, coverage, assurance level and its boundary line, width by cause, the four views, per-capability figures, partial credit by basis, the Unknowns by reason, the scope-exclusions card, the demotion checks (the engine's own `detail` strings). | Before the upload: the same elements, `illustrative` (rule R). Always: the Trend card (quarter labels), Top-3 risks, the worked-example evidence dates, and the framework-wide authoring figures (from the engine's `reports/`, not from a golden). |
| **Gap Matrix** | All applicable controls (557 / 576 / 544) with the golden's state, reason, gap basis, partial basis, path label and run id; filters over them. | Before the upload: `illustrative` (rule R). Control text for the controls the prototype does not hold: not shown (§4). |
| **Control Detail** | The verdict and everything that explains it: evidence class and kind, gap reason and basis, run id (absence Gaps), partial basis and share, enforcement and population statements, the engine's reasoning string, contradicted testimony, overruled documents, credit, weight basis; the control's ranked action and ATT&CK exposure (`ranking.items`). | Catalogue text for the seed controls, worked-example evidence and interview quotes, the worked-example ATT&CK chain and population figures, the worked-example signals: `illustrative`, with a note saying so on the element. |
| **Remediation & Requests** | The whole ranked list (`ranking.items`): rank, control, action type, description, magnitude (exact fraction and points), effort, tie-group size, ATT&CK exposure including `suppressed_count`; the exclusion lists with their reasons; the artifacts (signals the engine's evidence requests name), what each unlocks (computed), and the projection. | Before the upload the screen shows nothing of the engine's and says why (§3, item 5). The interval projection's *position* is arithmetic on the golden, not an engine run. |
| **OSCAL Export** | The preview documents are built from the active assessment (interval, counts, scope boundary, per-control findings). | Signing, validation and the export action: `planned`; the model cards carry `illustrative` / `planned` marks as the source has them; nothing is signed. |
| **Compliance Chat** | Nothing carries a `measured` mark. | `planned` (no LLM) and `illustrative` (canned answers). Some answers quote live figures (tested: the score answer matches the dashboard). |
| **Scope Exclusions** | The whole register (19 / 0 / 32 rows): control, capability, triggering flag and value, reason, the engine's justification; the not-applicable rate; the engine's N/A-baseline check. | Nothing. |
| **Roles & Access, Tasks, National Rollup, Authoring Coverage** | Nothing. | `illustrative`. The Authoring figures are the engine's report figures, pinned by tests, but they are not read from a golden. |

Nothing is marked `measured` unless it traces to a golden file: `provenance.test.tsx` resolves every `data-source` path against all three profiles, and fails an unresolved one.

---

## 1. The tasks

### Task 1 — the generator (`655aa05`)
`docs/evidence/derive_profiles.py` (renamed from `derive_ministry_figures.py`) reads `government_ministry.json`, `bank.json` and `utility_with_ot.json` and writes `src/data/profiles/{ministry,bank,utility}.ts`: every figure, every claim, each file's SHA-256. The stamp is on screen (source file, full hash, and how to check it). Asserts in the generator: rule R, the assurance premises, the outside-scope controls, the demotion premises.

```
sha256sum /home/user/jccp/backend/tests/golden/*.json
85cdfc75…c691c  bank.json
b4d05dfd…a6625  government_ministry.json
ce2299be…6d611  utility_with_ot.json
```
These equal the `sha256` in each generated module (`grep -o '"sha256": *"[0-9a-f]*"' src/data/profiles/*.ts`).

Tests (`profiles.test.tsx`, `regenerate.test.ts`): each module carries its hash; the three differ; byte-identical regeneration. The regeneration test needs the engine checkout, so it is opt-in:
```
ENGINE_ROOT=/home/user/jccp npx vitest run src/__tests__/regenerate.test.ts    → 1 passed
```
It is skipped in a plain `npm test` (1 skipped in the totals).

### Task 2 — every control (`3f1d6b7`)
The 48 seeds are gone. The Gap Matrix lists every applicable control (557 for the ministry); Control Detail reads the same record. Absence Gaps show their run id. Invented material stays `illustrative`, marked on the element.

### Task 3 — `measured` (`fe9d3f7`)
`measured` is in the vocabulary and in the legend. The Round 1 "nothing is measured" test now asserts the opposite where it is true, and a test that nothing carries `measured` without tracing to a golden.

### Task 4 — Remediation (`44b5b02`)
Replaced the hand-entered plan with `ranking.items`. Items sharing a magnitude share a rank, and the screen shows them as a group: **15 items share rank 1** (ministry), under the engine's own tie-order note. Each card: action type, description, effort, magnitude (`125/623` and its points), unweighted magnitude, the signal it asks for, and the ATT&CK exposure with `N suppressed`. A "Not ranked" card shows `unauthored_excluded` (491 controls, with the reason), `uncollectable_excluded` and `conflicting_evidence_excluded`, and says "none" when a list is empty.

The "What you didn't provide" tab: an artifact is a signal the engine's evidence requests name (10 for the ministry); what it unlocks is **computed** as an intersection (`resolvedBy`: a control is resolved when every signal it requests is provided), never typed. `providedRequests` now holds signal keys. The hand-entered lists are deleted (`remediation.ts` keeps only the national rollup).

### Task 5 — the switcher (`b5b5748`)
The Organisation Profile screen opens with the three assessments; choosing one makes it the active assessment (`selectProfile`), saves the choice, and re-renders the whole app from it. See §2 for how, and §3 for what the brief got wrong.

---

## 2. How the switch works, and the guard that keeps it working

The data layer holds the active assessment outside React (`activeProfile()`), and `CURRENT` is a handle on it. Anything fixed at import would stay the ministry's after a switch, so each such value was converted to `lazyByProfile(...)` (built the first time each assessment asks, then kept): the capability table, the portfolio `TOTALS`, the risk-weight tables, the request-plan summary and the tour text. `APPLICABLE_CONTROLS` and `EXCLUDED_COUNT` no longer exist as constants (557 and 19 were the ministry's; the counts are 557/576/544 and 19/0/32). `App` re-keys its tree on the assessment, so every screen, the sidebar and the top bar start fresh and drop local state about the old one.

`selectProfile` also drops what was held against the previous assessment: provided artifacts, analyst overrides, the scoping decision, reviewed exclusions. It sets the organisation profile from the assessment's output (`src/data/orgProfiles.ts`): the sector (matched by its Arabic name against the designation list), the applicability variables the exclusions name as declared "no", and CICSC.

**A guard, because this is the kind of defect that comes back.** `switch.test.tsx` parses every non-test source file and fails on any top-level `const X = …` whose initializer reads `CURRENT`, `activeProfile` or `PROFILES`, unless it is a function or a `lazyByProfile(...)`. Positive control: appending `export const STALE = CURRENT.totals.applicable;` to a library file fails it.

---

## 3. Where the brief was wrong, or where I could not do what it says

1. **Task 5: "the CICSC notice appears for the profile whose golden declares it, not otherwise."** All three goldens declare it: `cicsc_boundary.applies` is true in each, basis `sector_designation` (government services, financial and banking, energy). With the real data the notice therefore appears in all three, and the "not otherwise" case cannot be shown from them. I tested it on a copy of the bank assessment with `applies` set to false (no notice on either dashboard view or on the Profile screen) and with the real data (notice, in the owner and executive views, before and after the upload). Separately: the notice used to depend on a toggle the user flipped, which contradicts the engine's rule that the boundary is *derived* from the sector and never declared (CLAUDE.md, *CICSC boundary*). I replaced the toggle with the derived value, read-only. Say if you wanted the toggle kept.
2. **Task 4: "the five hand-entered artifacts".** The engine's evidence requests name ten signals for the ministry (nine for the bank, ten for the utility). And the 49-vs-14 overlap cannot arise from the derived data: in all three assessments every evidence request names exactly one signal (`[1,1,…]` over 14 / 11 / 12 requests), so the per-artifact counts partition the pool and sum to it. I kept the regression test but made it say what is true: it asserts the sum equals the pool in each assessment, and tests `resolvedBy` as an intersection on a synthetic two-signal case, so the trap stays covered if a framework ever asks for two signals.
3. **Task 5: "keep two-stage scoping challenge and contradiction detection."** Kept and tested on all three assessments. The *contradiction* itself (declaring no cloud against evidence of cloud) is illustrative; the goldens carry no cloud declaration.
4. **Task 4: "no hand-entered artifact counts."** True of Remediation. The Request Plan screen (22 artifacts, each with a `controlsUnlocked`) and the Tasks screen still carry hand-entered counts; they were outside the brief and are `illustrative`. They now disagree with Remediation, which counts what the engine actually asks for. Proposal: derive the Request Plan from the same `ranking.items`, or mark it as a worked example.
5. **Remediation now shows nothing before the upload.** The ranking is computed on the assessed state; before the upload there is nothing of the engine's to show, and rule R has no ranking. The screen says so and links to Intake. This is a behaviour change (the old screen showed a plan before the upload). Say if you want a pre-upload view.
6. **The goldens carry no declared applicability variables, only exclusions.** A variable no exclusion names is shown as "Yes" on the Profile screen, which is all the output says about it (its controls are in scope); it could have been "Don't know". Stated in `orgProfiles.ts`.
7. **Task 2: vocabulary with no component.** As expected, 557 real rows surfaced states the old components could not show: the three gap bases, the partial basis and share, enforcement and population statements, contradicted testimony, overruled documents, evidence kind, weight basis. Each now has an element on Control Detail (or the row); `ControlRow` carries them as `data-` attributes so tests hold the screen to the data.

---

## 4. Decisions that are yours

- **Control text.** The golden carries no control text, and text may not cross from the engine repository. The prototype holds text for 48 controls, in each of the three assessments; for the other 509 of the ministry's 557 (528 of the bank's 576, 496 of the utility's 544) a row says "Control text is not held in this prototype". Options: leave it; load the catalogue under a brief that says it may cross; or show the id alone.
- **Names.** The ministry keeps the Round 1 name "Ministry of Digital Services". The bank and the utility are named by their labels ("Bank", "Utility with operational technology"); the goldens do not name an organisation.
- **The Chat/tour/Top-3 contradictions (§5).** Proposals only.

---

## 5. What still contradicts the measured state

The prototype's narrative was written around invented numbers. These screens show text that disagrees with what is now measured. I did not rewrite them: replacement text is content, and yours.

| Where | What it says | What is measured |
|---|---|---|
| Guided tour, "Ranked by value" | "Fixing multi-factor authentication for 43 privileged accounts resolves 11 controls at once — and removes exposure to three named attack techniques." | No ranked item's description mentions multi-factor authentication in any of the three assessments (0 of 47 / 44 / 45). Rank 1 holds 15 items (ministry), 12 (bank), 13 (utility), all of equal magnitude. |
| Tour, Top-3 risks, Chat, interviews, evidence quotes | A story about JNCSF-102, -307 and -435 failing. | In all three assessments JNCSF-102 is Compliant (`green`), and JNCSF-307 and JNCSF-435 are Unknown (`unknown`): the engine has no verdict that they fail. |
| Request Plan / Tasks | 22 artifacts with per-artifact unlock counts. | The engine asks for 10 signals (ministry), and each request unlocks one control. |
| Dashboard Trend | Four collection cycles. | One assessment. |

Proposal for each: either mark as a worked example with the control ids it concerns (the Control Detail pages already carry such notes), or rewrite from the golden (the tour could quote the tie group and the first ranked items). Neither is done.

---

## 6. Verification

```
npm run build                      exit 0 (tsc --noEmit && vite build)
npx vitest run                     19 files passed, 1 skipped · 329 tests passed, 1 skipped
ENGINE_ROOT=/home/user/jccp npx vitest run src/__tests__/regenerate.test.ts   1 passed
git -C /home/user/jccp status --porcelain | wc -l     0   (the engine clone is untouched)
git status --short | wc -l                            0   (committed)
```

**Headless render** (Chromium, `vite preview`, 14 routes × 3 assessments × before/after the upload = 84 pages, with the assessment set through the saved state so rehydration is exercised): no page error, no console error other than the favicon request, no withheld-figure or withheld-screen guard, every page shows its own assessment's source file, none blank. Result line: `routes x profiles x states: 84 problems: []`. (The 14th route is `/control/JNCSF-139`.)

**New or rewritten tests this round that concern Tasks 4 and 5:** `ranking.test.tsx` (12), `switch.test.tsx` (23), and edits to `projection`, `consistency`, `truthfulness`, `assurance`, `display_guard`, `no_duplicate_figures`.

### Mutation checks

Each mutant was applied to the source, the covering tests were run, and the file was restored (`cmp` against a copy).

Task 4 (`ranking.ts`, `07_Remediation.tsx`) — **8 mutants, 8 killed**, after two survivors were killed with unit tests:
- `every` → `some` in `resolvedBy`; rank order reversed; the tie-group heading's count; `suppressedCount` replaced by another field; the "none —" marker for an empty list; the artifact's unlock count taken from what is provided rather than from the artifact; **(survived, now killed)** removing the "names no signal" guard; **(survived, now killed)** counting every non-fix item as an artifact.

Task 5 (`useAssessment.ts`, `lazyByProfile.ts`, `orgProfiles.ts`, `App.tsx`, `04_Dashboard.tsx`, `01_Profile.tsx`, `capabilities.ts`) — **13 mutants, 13 killed**, after three survivors were killed (the first run had 11 mutants and a guard check; the second added the strengthened tests and two more mutants):
- not calling `setActiveProfile` on select; not clearing each of the three held items (provided artifacts, overrides, the scoping decision); rehydration ignoring the saved choice; inverting the declared-"no" test; CICSC taken from a constant; the Profile CICSC note always on; the profile-note guard.
- **(survived, now killed)** removing the `key` on `App`: killed by a test that the "Fixes" tab resets after a switch.
- **(survived, now killed)** the lazy cache ignoring the active assessment: killed by a test over `TOTALS`, the capability table, the weights, the request-plan summary and the tour text, in both directions.
- **(survived, now killed)** the Executive dashboard's CICSC notice always on: only the analyst view had been rendered in the false case (the test now renders both roles). The analyst view's own notice, and `notApplicable` fixed at 19, were added in the second run and killed on first try.

**No undocumented unkillable mutant.** One mutant I wrote referred to a name that does not exist (a compile failure, not a mutant); I counted it as nothing.

---

## 7. Size

```
dist/assets/index-43JpF7Ul.js   742.14 kB │ gzip: 119.57 kB
```
The Round 2 report records `index-*.js` at 294.39 kB (gzip 80.60 kB) for the main chunk. The increase is the three generated profile modules (about 182 kB each: `wc -c src/data/profiles/*.ts`: 183185, 181820, 181733 bytes) and the tour/catalogue data. Vite warns the chunk exceeds 500 kB. Options if it matters: load the two inactive profiles on demand (dynamic import, which needs the data layer to be asynchronous), or drop per-claim reasoning strings from the bundle. Not done; the prototype is served from static files and the first load is the only cost.

---

## 8. The engine repository

Read only. `git -C /home/user/jccp status --porcelain` printed nothing at the end of the round; nothing was committed, staged, branched or modified there. Only the goldens and the engine's own generated strings crossed (the Round 3 exception); no documentation, comment or design paper did. `JCCP_NCSC_Engagement_INTERNAL.md` was not read.
