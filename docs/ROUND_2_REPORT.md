# Round 2 report — the unauthored gap, the width decomposition, and the four views

Branch `round-2/unauthored`, from `round-1/truthfulness` (`96dfa5e`). Not merged. In this report `$ENGINE` is a read-only
checkout of the engine repository, and `T` means `npx vitest run`.

| Commit | What |
|---|---|
| `8abb9c9` | Round 1 carry-overs (screen-boundary wording, no "seeded" on screen, lockfile statement) |
| `cd71b02` | Task 1 — `unauthored` enters the vocabulary |
| `f3a80f4` | Task 2 — the aggregate restructured to the engine's published shape |
| `b631f30` | Task 3 — the width decomposition |
| `da48ce5` | Task 4 — the four views |
| `70d491b` | Task 5 — the Authoring Coverage screen |
| `8762b5b` | this report, and `docs/evidence/verify_brief_figures.py` |
| `3c3c45d` | the Round 2 rulings: unauthored copy narrowed, assurance L1 with its measurement on screen, rule R's provenance recorded, the JNCSF-139 principle (§9) |
| next | the second ruling (§10): JNCSF-139 flipped into the upload, the ladder defined by the threshold rule, the demotion checks shown, the before badge |

## 0. How the engine repository was handled

- **Read-only, in the git sense.** `git -C $ENGINE status --porcelain` is empty after every step (checked repeatedly, last at the end of Task 5). Nothing was
  committed, staged, branched or modified there. Round 2's only output is on `round-2/unauthored` in this repository.
- **Narrow reads.** Read: the golden file for the ministry profile; the demo page (the one section on the width split, for design); `reports/authoring_potential.md`
  and `reports/generalisability.md` (to find the Task 5 figures); `JCCP_Authoring_Method.md` (only the lines that state the floor, paths and negative-capable
  counts, found by `grep` after the reports did not carry them); and four data tables: `risk_weights.csv`, `signals.csv`, `evidence_paths.csv`, `jncsf_mappings.csv`
  (to compute figures rather than copy them from prose). `JCCP_NCSC_Engagement_INTERNAL.md` was excluded by name from every search and never opened.
  Why the tables: the golden file has no capability or weight per control, which Task 2's per-capability rows and Task 4's weight table need.
- **Figures cross; text and files do not.** The numbers in `src/data/ministry.ts` and `src/data/authoring.ts` are the only engine content in the
  published code. No file was copied, no passage quoted, no prose lifted: the demo page was read for design (segment proportions, owner labels, the reason
  table beneath) and the React component was written from that.
- **One place where structure, not just numbers, crossed.** `docs/evidence/derive_ministry_figures.py` and `docs/evidence/verify_brief_figures.py` are in this repository and
  necessarily name engine file paths, JSON keys and CSV column names, because they are the commands that prove the figures. **This repository is public**, confirmed without
  credentials: `curl -s -o /dev/null -w "%{http_code}" https://github.com/AhmadM962/jccp-prototype` → `200`; the same request for the engine repository → `404` (private). Ruled acceptable for this
  content (paths, JSON keys, CSV columns) and **not for anything further**: no engine text, no engine file, no passage has crossed, and none is to. The scripts stay in `docs/evidence/`.

## 1. Claims and the command that proves each

| # | Claim | Command |
|---|---|---|
| B | Build and tests pass | `npm run build; echo $?` → `0`; `npm test` → see Appendix |
| C0.1 | The screen boundary has its own wording and the figure wording is untouched | `T src/__tests__/boundary_app.test.tsx` |
| C0.2 | No "seeded" on the Dashboard, Gap Matrix or Exclusions; the register shows `19 shown of 19` | `T src/__tests__/consistency.test.tsx` ("on-screen vocabulary") |
| C0.3 | Lockfile: 104 added, 0 removed, 0 version/resolved/integrity changes, 14 `libc` metadata lines normalised | `node docs/evidence/lockdiff.js 685315c feba4ba` |
| 1.1 | `unauthored` is first in the vocabulary, labelled, in orange (violet is the collection failures') | `T src/__tests__/unauthored.test.tsx` |
| 1.2 | An unauthored control renders no ladder, no trail, no "How to evidence this"; shows the statement | same file, "Control Detail for an unauthored control" (with a contrasting authored control) |
| 1.3 | Its reason survives the upload; the filter selects exactly the unauthored controls | same file, "the sample contains…", "the Gap Matrix filter" |
| 2.0 | **Every figure in the brief's Task 2 and Task 5 tables is right** (41 checked, computed from the data tables) | `python3 -I docs/evidence/verify_brief_figures.py $ENGINE` → `MISMATCHES: 0 of 41` |
| 2.1 | Buckets: 21 Compliant / 25 Partial / 6 Gap / 505 Unknown = 557 | `T src/__tests__/ministry.test.tsx` ("per-state counts"); derivation in §3 |
| 2.2 | 52 verdicts unweighted vs 51 over the authored scope: both right, differing by JNCSF-139 | command in §3 |
| 2.3 | The model reproduces all four published views (after state) **exactly**, from per-control data | `python3 -I docs/evidence/derive_ministry_figures.py $ENGINE src/data/ministry.ts` prints `mismatching views: 0` and refuses to write otherwise |
| 2.4 | `src/data/ministry.ts` is exactly what the generator writes | same command, then `git diff --exit-code src/data/ministry.ts` |
| 2.5 | The three width components sum exactly to the width, in both states and all four views | `T src/__tests__/ministry.test.tsx` ("the three components sum EXACTLY…") |
| 2.6 | Unevidenced reasons sum to 14 (after) and 50 (before) | same file, "unevidenced reasons…" |
| 2.7 | The upload moves exactly one control outside the authored scope, by observation: 492 unauthored controls are Unknown before and 491 after; the tool's share of the width falls by that one control in every view that contains it; the authored-scope view is unchanged | same file, "the upload moves a control outside the authored scope only by observation" |
| 2.8 | Every published view's bounds match the engine table | same file, "every published view matches the engine table" |
| 2.9 | Aggregate is tagged illustrative throughout | same file, "the whole aggregate is tagged illustrative" |
| 2.10 | Round 1 guards, duplicate-literal guard and `figures.ts` still apply | `T src/__tests__/no_duplicate_figures.test.ts display_guard.test.tsx boundary_app.test.tsx` |
| 3.1 | Three segments in proportion; "sum exactly" asserted and stated; ours/theirs labels on the right segments; reason table | `T src/__tests__/decomposition.test.tsx` |
| 3.2 | A graphic whose parts do not sum is withheld, not drawn | same file, "a graphic whose parts do not sum…" |
| 4.1 | Four views visible without interaction, each with the engine's bounds | `T src/__tests__/views.test.tsx` |
| 4.2 | `authored_scope` never appears without its label, and its numbers appear nowhere else | same file, "authored_scope never appears without its label" |
| 4.3 | The weight table sums to 331.4 / 498.4, gap 167 | same file, "the weights explain a view that exists…"; `verify_brief_figures.py` row `weighted totals` |
| 5.1 | Authoring figures; totals computed from parts; none typed in the screen | `T src/__tests__/authoring.test.tsx` |
| 5.2 | Delivery 44 of 44 leads and is *computed* complete | same file, "leads with Delivery…", "marks complete only…" |
| 5.3 | Owner and analyst can open it; executive, regulator, contributor cannot | same file, "who can open it" |
| 5.4 | All 14 screens render a chip, none `measured` | `T src/__tests__/provenance.test.tsx` |
| 6.1 | The assurance level is the engine's: the distribution is over exactly the 52 settled verdicts; the engine's rule recomputed here gives L1; 37 of 52 is below the 0.8 threshold and 49 of 52 clears it | `T src/__tests__/assurance.test.tsx` ("the assurance level is the engine's…"); the generator prints `--- assurance: … L2-or-above 37 of 52 = 0.7115… | threshold 4/5 | headline L1` and refuses to write if the distribution or the headline differs from the golden file |
| 6.2 | No screen says L2 after the upload: Dashboard card and subline, sidebar badge, Intake banner, OSCAL preview, tour step, Chat answer; the measured value and the threshold are on screen beside L1 | same file, "no screen says L2" |
| 6.3 | Rule R's two premises are asserted from the golden file and held against the figures in use: all 21 Compliants are `machine_collected`; the before-state's verdicts are exactly the engine's 15 at L0/L1, with no exception | the generator prints `--- provenance of rule R: …`; same test file, "provenance of rule R" |
| 6.4 | The unauthored statement claims only what is true of every unauthored control; the Intake line says the same | same file, "the unauthored statement claims only what is true…" |
| 7.1 | The before-state is exactly the engine's 15 L0/L1 verdicts, with no exception; the one verdict outside the authored scope is a Gap observed from an artifact, so it is Unknown before and a Gap after | the generator prints `--- provenance of rule R: … before verdicts 15 = the engine L0/L1 verdicts, no exception | verdicts outside the authored scope 1 ['JNCSF-139'] …`; same test file, "provenance of rule R" |
| 7.2 | JNCSF-139 appears in the before/after narrative (Intake banner, Dashboard interval subline), worded from the generated record, and not before the upload | same file, "JNCSF-139 is in the before/after story, not in a footnote" |
| 7.3 | Each assurance level is defined by the threshold rule, the four sentences are exact, none says what is missing, and exactly one level's definition is true of the engine's distribution: the reported one | same file, "the four definitions are the threshold rule…", "exactly one level's definition is true…" |
| 7.4 | All four demotion checks are shown in the engine's order; an assessed check carries its measured value and threshold; a check that could not run is "Not assessed", "not measured", has no threshold and is never worded as passed; the table appears only after the upload | same file, "the demotion checks are shown, all of them…"; the generator prints `--- demotion checks: …` |
| 7.5 | No screen promises that an unauthored control stays Unknown | same file, "no screen promises that an unauthored control stays Unknown" |

**Established once, not guarded by any committed test** (said plainly, as in Round 1):
- The headless renders (every route including `/authoring`, the post-upload states, three roles on `/authoring`): Playwright scripts in the scratchpad, not committed
  (Playwright is not a dependency of this repo). Result in §8.
- Every mutation check (listed in §8): run once, files restored byte-identical (`cmp`). They show the new tests bite; they are not themselves tests.
- The 41-figure verification and the regeneration check need the engine checkout, so they are commands, not tests.
- The disk re-read check: a scratchpad script; the count is in §8.

## 2. Task by task

### Carry-overs (commit `8abb9c9`)
1. **Screen boundary.** `FigureBoundary` gained `scope="screen"`; the routes use it. Wording (yours, verbatim): *This screen could not be displayed because a
   figure failed an internal consistency check. The assessment data is unchanged. Other screens are unaffected.* Sidebar and top bar still render, the catch is still
   consistency-only with the rethrow, and the same `where` is logged.
2. **"seeded"** off the screen: Gap Matrix `N of M seeded shown` → `N of M in this sample shown`; `No seeded controls match the current filters.` → `No controls in this
   sample match the current filters.`; Exclusions `Exclusions — N shown of 19 seeded` → `Exclusions — N shown of 19`. **Deviation:** the Exclusions register lists
   all 19 exclusions, so it is complete, not a sample; "in this sample" would have been false there.
3. **Lockfile** stated precisely in `docs/ROUND_1_REPORT.md` §9.6; nothing restored.
4. **49 vs 20**: your ruling is recorded in §9.4 of that report. See §6 below: Task 2 moved both numbers, so the two tests changed with them.

### Task 1 (`cd71b02`)
`GapReason` gains `unauthored`, first; label `Not yet authored — no evidence requirement defined`; orange (`orange-300/800` pill, `#c2410c` in charts), distinct from the
violet used for the organisation's collection failures. It shows in the Gap Matrix filter (listed first), on `ControlRow` and on Control Detail.
`Control.authored` is new. 21 of the 48 sample controls are unauthored (arch 3, dev 4, ops 9, found 5), Unknown for the same reason before and after the upload, never
`changed`. Selection rule: controls the engine also has no authored path for, with no remediation action or evidence record depending on them, and never more
authored controls in a capability than the framework has (`authoring.test.tsx`). Two interview claims and one remediation action stopped naming now-unauthored controls.

### Task 2 (`f3a80f4`) — see §3 for the derivation
The aggregate now has the engine's shape: `src/data/ministry.ts` (generated, exact fractions, numbers only) holds the four views, the three width components, the
unevidenced reasons and per-capability rows in both states. `TOTALS`, the capability stats, `GAP_REASON_BREAKDOWN`, coverage, the completeness statement, the
dashboard figures (and analyst overrides, re-derived exactly), the Remediation projection, the request plan and the intake all read from it.

### Task 3 (`b631f30`)
`src/components/WidthDecomposition.tsx`, under the interval on the Dashboard (owner and executive). A proportional three-segment bar; each cause labelled with whose
limitation it is, in your words (`unauthored` — the tool's limitation; `unevidenced` — the organisation's; `uncollectable` — structural); the sentence that the parts
are asserted to sum exactly, with the sum shown (`88.15 + 2.51 + 0.00 = 90.66 points`); the organisation's share by reason beneath. The sum is asserted in exact
fractions at render time: a graphic that fails is withheld through the figure boundary. The bar follows the headline under analyst overrides.
Rounding note shown on screen: the five reason rows round to 2.52 against a total of 2.51 (`0.90 + 0.54 + 0.54 + 0.36 + 0.18`), so the table says its points are rounded and
the exact fractions sum exactly.

### Task 4 (`da48ce5`)
`src/components/FourViews.tsx`: all four views in one table, visible at once, each with a band, low, high, width, controls and coverage. The `authored_scope` row is a
different colour, marked *partial view*, and always carries `Covers only applicable controls with at least one authored evidence path.`; that label is rendered by the row
itself, and a test shows its bounds appear nowhere else on the page. The old risk-weighting card (toggle, `14.9`, "30% of framework") is gone; the weight table now sits
inside this card as the explanation of the two weighted views. **I kept the headline interval card** (with the decomposition under it) rather than removing it; the table's
unweighted row is the same view.

### Task 5 (`70d491b`)
`/authoring`, sidebar entry "Authoring Coverage", owner and analyst only (others are redirected). Leads with *44 of 44 — Security in Delivery — complete*; the status
is computed from the data (`authored === controls`), not written. Then 66 of 576 authored (59 conclusive, 7 indicative only), 510 unauthored, 115 signals (70 machine-collected,
45 documentary), 38 negative-capable, 125 paths, the 205-control queue, reach through the mappings (NIST 403, ISO 341, either 568 of 576 = 98.6%, neither 8), the 325–359 documentary
floor, and a per-capability table (Operations: 299 controls, 52% of the framework, 9 authored). Tier `illustrative`. Every figure comes from `src/data/authoring.ts`, with totals
computed from the parts; a test scans the screen's source and fails if any figure appears as a literal.

## 3. Task 2 in detail

**Per-state bucket counts, derived (not taken from the brief).** From the 557 per-control claims: `Counter(state)` → green 21, yellow 25, red 6, unknown 505 (= 557).
Unknown by reason: unauthored 491, not_provided 5, declined 3, insufficient_permission 3, module_failed 2, stale 1 (= 505).

**The tension you flagged (52 vs 51) — settled from the data.** Command:

```
python3 -I - "$ENGINE/backend/tests/golden/government_ministry.json" <<'EOF'
import json, sys
d = json.load(open(sys.argv[1])); c = {x['control_id']: x for x in d['claims']}
ua = set(x if isinstance(x, str) else x['control_id'] for x in d['coverage']['unauthored_applicable'])
known = [i for i in c if c[i]['state'] != 'unknown']
print('known', len(known), '| unauthored_applicable', len(ua), '| of those with a verdict', [(i, c[i]['state'], c[i]['evidence_class']) for i in ua if c[i]['state'] != 'unknown'])
print('authored_scope known', len([i for i in known if i not in ua]), '| authored_scope applicable', len(c) - len(ua))
print('gap_reason=unauthored', sum(1 for i in c if c[i]['gap_reason'] == 'unauthored'))
EOF
```
Output: `known 52 | unauthored_applicable 492 | of those with a verdict [('JNCSF-139', 'red', 'artifact')]`, `authored_scope known 51 | authored_scope applicable 65`, `gap_reason=unauthored 491`.
**Both views are right.** 557 − 65 = 492 controls have no authored evidence path; 491 of them are Unknown for that reason; one, JNCSF-139, has no path yet carries a verdict
(Gap, artifact evidence). So 52 = 51 inside the scope + 1 outside. The numerators agree too: both are 27.15, because a Gap adds nothing. The engine reports two counts, 492 (`unauthored_applicable`) and 491 (`unauthored` in the width), and they are different on purpose: one control was observed unmet regardless of having no
path (§7, §10.1). That is not something to label or correct.

**The credit model, reproduced.** From per-control data alone, with these credits — Compliant 1, Gap 0; Partial by basis: a deployment share earns its quartile credit (0.85 / 0.5 / 0.25 / 0.1 at
≥0.75 / ≥0.5 / ≥0.25 / ≥0), capped at 0.5 when the share is only claimed, and any Partial with no share earns 0.1 — the generator reproduces
all four published views **exactly** (unweighted `543/11140`–`10643/11140`; weighted `183/3560`–`2977/3115`; derived-only `891/16570`–`7838/8285`; authored scope `543/1300`–`823/1300`; and the
weighted total weights `2492/5` and `1657/5`). It refuses to write if any differ. Two discoveries on the way: weights per control come from `risk_weights.csv`; and JNCSF-129 is a testimony-based Partial
with a claimed 0.8 share (credit 0.5), which is why its weighted contribution differs from its unweighted one.

**The before-upload state is the engine's own per-control data under one stated projection (rule R); the brief gives no figures for it.** The golden file is one completed run, so a
before-state is a selection from it, not a second run. **Rule R:** before an evidence bundle exists, only the verdicts that rest on testimony or documents exist (the engine's assurance levels
L0 and L1); verdicts resting on machine collection, absence checks or analyst attestation do not; and with nothing collected yet, every unevidenced authored control is `not_provided`. Three facts
make this a projection and not an invention. The generator **asserts all of them from the golden file** before it writes anything, they are recorded beside the figures in `src/data/ministry.ts`, and
`assurance.test.tsx` holds them against the figures the screens use:

1. **All 21 Compliant verdicts are `evidence_kind: machine_collected`; none is document-backed.** So no Compliant can exist before an upload: the before-state's 0 Compliant is derived, not assumed.
2. **The engine's `scoring.assurance.distribution` is `l0_declared 3, l1_documented 12, l2_tool_evidenced 36, l3_analyst_signed 1`, and the 3 + 12 = 15 are exactly the before-state's verdicts, with no
   exception** (the generator checks set equality, control by control, not just the count). A third assertion covers the one control with a verdict and no authored path: it is a Gap observed over an artifact, with no path and no run, so it is machine evidence (L2) and is Unknown in the before-state.

The generator prints them: `--- provenance of rule R: compliants 21 (all machine_collected) | before verdicts 15 = the engine L0/L1 verdicts, no exception | verdicts outside the authored scope 1 ['JNCSF-139'] (observed, artifact: arrive with the bundle)`.
Nothing in the before-state is the prototype's choice: it is exactly the engine's 15 L0/L1 verdicts. **JNCSF-139**, which has a verdict and no authored path, is Unknown before and a Gap after (it was kept in both
states in the first finishing commit and flipped on the owner's ruling, §10.1). Result:

| | state | green | yellow | red | unknown |
|---|---|---|---|---|---|
| | before (rule R) | 0 | 14 | 1 | 542 (= 492 unauthored + 50 not_provided) |
| | after (engine) | 21 | 25 | 6 | 505 (= 491 unauthored + 14 by reason) |

| View | before low | before high | before width | after low | after high | after width | controls |
|---|---|---|---|---|---|---|---|
| Unweighted | 0.32% | 97.63% | 97.31 | 4.87% | 95.54% | 90.66 | 557 |
| Weighted, incl. underived | 0.34% | 97.59% | 97.25 | 5.14% | 95.57% | 90.43 | 557 |
| Weighted, derived only | 0.29% | 97.06% | 96.77 | 5.38% | 94.60% | 89.23 | 390 |
| Authored scope | 2.77% | 79.69% | 76.92 | 41.77% | 63.31% | 21.54 | 65 |

The story the upload now tells: it resolves **36** of the **50** Unknown controls inside the 65-control authored scope (50 → 14); the organisation's share of the width falls from 8.98 to 2.51
points; the tool's share falls from 88.33 to 88.15, the one control observed from the bundle. Rule R takes only what the engine's data shows resting on testimony or documents; it does not invent testimony for a control whose final verdict is machine-collected, though such a control may well
have had some. **If you would rather a different before-state, it is one rule in the generator** (`before()`).

**Consequences handled deliberately.**
- *The upload moves one control outside the authored scope, by observation* (492 unauthored controls Unknown before, 491 after; the Gap is JNCSF-139; `ministry.test.tsx`). Everything else outside the authored scope is unmoved.
- *Every figure that moved stayed consistent.* The old 207 / 59 / 148, "39 structurally uncollectable" (the engine reports 0.00), the 7.0-point floor, 62.8% → 89.4% and the 93% projected coverage
  are all gone from the source (`grep -rnE '\b(207|148|350|245|345|498|62\.8|89\.4|49\.9|87\.1|70\.8|81\.4|37\.2|10\.6)\b' src | grep -v __tests__` → only a CSS-comment example and a coincidental `350`
  in the generated module).
- *The Remediation projection*: only the 14 Unknowns that have an authored requirement can be resolved by providing artifacts, so the band can never fall below `491/557` = **88.15 points**. The old
  statement was that providing five artifacts would narrow it toward 7.0 points, which is the opposite of the truth.
- *The flat-0.5 note was false* once the aggregate used the engine's credits. It now says what is true: the 25 Partials earn 6.15 in total, credited one by one (14 earn 1.80 before the upload).
- *Overrides*: an override moves one control between buckets and the unweighted interval is re-derived exactly (a Partial in or out holds the average credit of its bucket); the other three views show
  the engine verdict, and the page says so.
- *Tagged `illustrative`* throughout. `measured` is not used anywhere.

## 4. Before / after for every text change

| Where | Before | After |
|---|---|---|
| Screen boundary | (none; figure wording reused) | *This screen could not be displayed because a figure failed an internal consistency check. The assessment data is unchanged. Other screens are unaffected.* |
| Gap Matrix capability header | `N of M seeded shown` | `N of M in this sample shown`, plus `· K authored` |
| Gap Matrix empty state | `No seeded controls match the current filters.` | `No controls in this sample match the current filters.` |
| Gap Matrix (new note) | — | *The figures on each capability (applicable, authored, worst established, unestablished) are the assessment's. The controls listed under it are a worked-example sample: their individual states are illustrative and are not drawn from those figures.* |
| Exclusions title | `Exclusions — N shown of 19 seeded` | `Exclusions — N shown of 19` |
| Gap reason (new) | — | `Not yet authored — no evidence requirement defined` |
| Control Detail, unauthored (new) | (ladder, trail, "How to evidence this") | *No evidence requirement has been authored for this control.* / *The tool has not yet been told what would count as evidence that this control is met, so it did not look for that.* [*This is a limitation of the tool, not a finding about the organisation: nothing here says the control is met, and nothing says it is not.* — only while the control is Unknown] *Uploading evidence cannot establish that this control is met.* (first version ended *Uploading evidence cannot change this.*, true of 491 controls and false of JNCSF-139; narrowed in the finishing commit, §9.5) |
| Dashboard, flat-weight note | *The aggregate here applies a flat 0.5 to every Partial. Per-control quartile credit is shown on each control's page.* | *The 25 Partial controls here earn 6.15 in total, credited one by one by the engine rather than at a flat weight. A control's page shows how its own share is credited.* (14 / 1.80 before the upload) |
| Dashboard, pre-upload hint | *Provide 5 more artifacts to narrow this toward 7.0 points.* | *See what evidence would narrow this — by the evidence the plan asks for, at best to 88.3 points: the other 492 controls have no evidence requirement authored.* (88.3 = 492/557, the before-state's count; the Remediation card, which projects from the post-upload verdict, quotes 88.2 = 491/557; they differ by the one control the bundle observes) |
| Dashboard interval subline | *…resolved 148 of 207 Unknown controls.* | *…resolved 36 of the 50 Unknown controls in the authored scope. JNCSF-139 has no authored evidence requirement, but an artifact in the bundle shows it unmet, so it moved from Unknown to a Gap (observed).* |
| Dashboard pre-upload banner | *Pre-upload state — testimony only.* | *Pre-upload state — testimony and documents only.* (12 of the 15 before-verdicts rest on documents) |
| Dashboard executive subline | *`N` controls still unevidenced.* | *491 controls have no evidence requirement authored; 14 are not yet evidenced.* |
| Dashboard completeness (both views) | *`N` are unevidenced. `M` are outside the tool's collection reach.* | *505 are not established: 491 because no evidence requirement has been authored (a limitation of the tool), 14 because evidence was not provided, and 0 because they are outside the tool's collection reach.* |
| Dashboard coverage donut | `Testimony only` / `Unevidenced — collectable` / `Structurally uncollectable` | `Partial` / `Not evidenced — the organisation's` / `Not yet authored — the tool's` (new, 491) / `Structurally uncollectable` (0) |
| Dashboard capability rows | `…G · …Y · …R · N unknown` | the same, plus `· K of M authored` |
| Dashboard reasons chart title | `Why controls are unevidenced` | `Why controls are Unknown` |
| Dashboard risk card | toggle, `331.4` / `498.4`, `14.9 pts`, "30% of framework", table over 576 | replaced by the four-views card (Task 4); table over the 557 applicable; framework-wide figures stated as the other population |
| Remediation footnote | *The band cannot fall below 7.0 pts of width — the 39 structurally uncollectable controls stay Unknown regardless…* | *By the artifacts this plan asks for, the band cannot fall below 88.2 pts of width — the 491 controls with no authored evidence requirement are not what it asks about, and stay Unknown unless an artifact collected for another control happens to show one unmet.* |
| Request plan heading | *To assess your 557 applicable controls, we need 22 artifacts…* | *To assess the 65 controls that have an authored evidence requirement, we need 22 artifacts…* |
| Request plan paragraph | *…projected coverage 93%. The remaining 39 controls are structurally uncollectable and stay Unknown regardless.* | *…projected coverage 11.8%. The other 491 controls have no evidence requirement authored, so the plan cannot ask for anything that would establish that any of them is met. They stay Unknown unless an artifact collected for another control happens to show one unmet.* |
| Request plan automated subtitle | *…collected by the signed collector · covers 126 controls · ~15 min* | *…collected by the signed collector · ~15 min* (the sum of overlapping per-artifact counts is not a count of controls) |
| Intake banner | *148 Unknown controls resolved (207 → 59)* / *Interval collapses 49.9–87.1% → 70.8–81.4% · coverage 62.8% → 89.4% · assurance L1 → L2* | *36 of the 50 Unknown controls in the authored scope resolved (50 → 14)* / *Interval 0.3–97.6% → 4.9–95.5% · coverage 2.7% → 9.3%. Assurance stays at L1: 37 of 52 verdicts (71%) are tool-evidenced or analyst-signed, and L2 needs 80%. 1 control outside the authored scope also moved: JNCSF-139 has no authored evidence requirement, but an artifact in the bundle shows it unmet, so it moved from Unknown to a Gap (observed). The other 491 Unknown controls have no authored evidence requirement; an upload cannot establish that any of them is met.* |
| Dashboard assurance card, after the upload | active level **L2**; *Why L2, not L3. L3 requires analyst sign-off and every declared-estate module succeeding — the logging module failed.* / *Demotion risks: 1 declined module · N analyst overrides · N/A rate above sector baseline* | active level **L1**, with its rule definition; *The collection succeeded; the level did not rise. 37 controls moved out of Unknown (36 in the authored scope, 1 outside it), and the assessment still did not raise its own confidence: the share of verdicts that are tool-evidenced or analyst-signed is below the threshold L2 requires.* / *Measured **37 of 52 (71%)** · threshold **80%** · reported **L1*** / then the engine's **Demotion checks** table (§10.3) in the space the old line occupied |
| Dashboard executive subline, completeness statement, OSCAL `assurance-level` | *L2 — Tool-evidenced* after the upload | *L1 — Documented* in both states |
| Sidebar badge | after the upload *Evidence bundle loaded · L2*; before *Testimony only · L1* | after *Evidence bundle loaded · L1* and, beneath, *71% tool-evidenced or analyst-signed · L2 needs 80%*; before *Testimony and documents · L1* |
| Ladder definitions | L0 *Profile declared; no evidence of any kind supplied.* / L1 *Policy and testimonial evidence only; no machine-collected artifacts.* / L2 *Machine-collected artifacts corroborate a majority of controls.* / L3 *An accredited assessor has reviewed and signed the evidence set.* | the four threshold-rule sentences in §10.2, each defined by the rule and none by what is missing |
| Tour, "How the evidence was obtained" | *…“L1” means documents and interviews. “L2” means machine-collected evidence… an 85% at L1 is a weaker statement than a 72% at L2.* | *…the level is not raised by collecting evidence alone. It is the highest level at which a disclosed share of the verdicts rest on evidence of at least that strength. The collection succeeded and 36 controls moved out of Unknown, yet the level stays at L1: 37 of 52 verdicts (71%) are tool-evidenced or analyst-signed; L2 needs 80%…* (numbers computed) |
| Chat, "What's blocking L3 assurance?" | *Two things. The logging module failed… L3 requires every declared-estate module to succeed. And L3 requires an accredited assessor to review and sign…* (a rule the engine does not have) | *The level is not set by the best evidence collected: it is the highest level at which a disclosed share of the verdicts, 80%, rest on evidence of at least that strength. After the evidence bundle the assessment is reported at L1: 37 of 52 verdicts (71%) are tool-evidenced or analyst-signed; L2 needs 80%. L3 would need 80% of the verdicts analyst-signed; here that is 1 of 52.* The L3 citation now quotes the L3 rule definition |
| Intake coverage estimate | `62.8% + share × 0.85`, capped at 93 | pre-upload coverage + controls evidenced (capped at the 50 resolvable), no fudge factor |
| OSCAL preview | `controls-unevidenced: 59` (all Unknown) | `controls-unevidenced` = the organisation's share; new `controls-unauthored` |
| Tour, "Never one number" | *…before the evidence arrived it was 37.2 points wide; now it is 10.6.* | *…it was 97.1 points wide; now it is 90.7. Most of what remains is the tool's own limitation: 88.2 of those points are controls it has no evidence requirement for yet.* (computed) |
| Tour, "Coverage" | *498 of 557 controls now have evidence. The remainder splits into controls that could still be evidenced, and controls no supported method can ever reach…* | *52 of 557 controls now have a verdict. The rest are Unknown, and the dashboard says whose limitation each part is…* |
| Width decomposition, four views, Authoring screen, help text | — | new in Tasks 3–5 |

Sample states changed so overrides cannot make a bucket negative (seven seeds): JNCSF-6, -14 `before` Compliant → Unknown (not_provided); JNCSF-96, -107, -116 `before` Compliant → Partial; JNCSF-25 `before` reason `declined` → `not_provided`;
JNCSF-515 `after` Gap → Partial.

## 5. What I did not do, and why

- **Did not rewrite the 48-control sample's per-control story** (see §6, item 3). The sample is labelled a worked example on the Gap Matrix; Round 3 should replace it with the engine's data.
- **Assurance** was left at L2 in the first Round 2 commits and flagged; it is changed in the finishing commit (§9.4).
- **Did not touch the five Remediation artifacts' unlock counts** or the 22-artifact request-plan counts. They are hand-entered, overlap, and cannot be added (49 against a pool of 14); the projection caps them. They dissolve when
  the count is computed, as you ruled.
- **Did not change the Chat's other canned answers, or the per-control narrative** (102's MFA gap, 307, 435…). Chat is `planned`; the sample is illustrative. (One Chat answer did change: the assurance one, because it stated a rule the engine does not have.)
- **Did not add per-capability intervals from the engine beyond what the model derives** — they are derived from per-control data with the capability from the weight table; no capability figure was typed.
- **Did not commit the Playwright scripts**, and did not add Playwright as a dependency.
- The *before* sidebar badge and banner were changed in the second finishing commit (§10.4).
- **Did not touch anything under `$ENGINE`.**
- **Did not move the hidden `uncollectable_by_design` / `insufficient_signal` vocabulary**; they remain valid reasons with count 0 for this profile.

## 6. Things wrong or ambiguous in the brief

1. **Task 4's premise is backwards.** The brief says the current totals `331.4` / `498.4` do not match their own table, which sums to `341.4` / `514.4`, and that the gap sentence says 167 while the table says 173. The engine
   confirms **331.4, 498.4 and 167** (`verify_brief_figures.py` row `weighted totals`), and I reproduced them from the weight table over the 557 applicable controls (246 + 67 + 12 + 65 = 390 derived; 167 underived; 331.4 and 498.4;
   `ministry.test.tsx`). The prototype's *table* was the thing counted over a different population: all 576 controls (251 / 72 / 14 / 66 / 173), which does sum to 341.4 / 514.4 / 173. (Ruled afterwards: the brief was wrong on this, and the totals stand.) Neither side had an arithmetic error;
   they described different populations, and the 19 excluded controls (13 derived of total weight 10.0, 6 underived) carry the difference exactly. The fix was to count the applicable set in the table and to say what the other population is
   (it is stated on the card). Totals were **not** changed to match the old table.
2. **The brief gives no before-upload figures for the new shape.** I derived them under rule R (§3): the engine's data under one stated projection, with its two premises asserted from the golden file. The one thing that is mine is JNCSF-139 (§9.3).
3. **The 48-control sample contradicts the new aggregate, which the brief did not anticipate.** It asked for at least three unauthored seeds; but the sample's states were invented against the old fixture. Against the new
   per-capability figures: Foundational has no controls with a verdict in the engine's result (the sample had 4); Operations has 1 Gap (the sample had 4); Development has 1 Partial (the sample had a Compliant, a Partial and a Gap).
   The sample also holds 23 of the 52 verdicts in 48 of the 557 controls (`node` count over the seed lines: after-upload known 23 of 48). I did the minimum that keeps the **portfolio** consistent (so no override can make a bucket negative; §4 last paragraph), made 21 unauthored,
   and **labelled the sample on the Gap Matrix** instead of rewriting each control's narrative. The honest fix is to seed the sample from the engine's per-control data, which also breaks several demonstration flows
   (JNCSF-102 is Compliant in the engine, not a Gap); that is a Round 3 decision, and I did not take it for you. **Ten sample controls (e.g. 30, 394, 435) are shown as authored although the engine has no authored path for them**; it is said in
   the comment above the seeds.
4. **Your Round 1 ruling to leave the 49-vs-20 tests untouched could not hold.** The pool is now **14** (505 − 491 unauthored − 0 uncollectable), not 20 (59 − 39), and the floor is 88.15, not 7.0; the tests had to change with the fixture they
   describe. They are updated in place and still name both numbers (49 and 14) and still assert the cap, so they are still the regression check you wanted for Round 3.
5. **"Weighted, including underived" before the upload** exists only because the model reproduces the engine exactly; like every before-figure it is the engine's data under rule R, not a second engine run.
6. **The reasons table cannot both show 2-decimal rows and sum visibly** (2.52 vs 2.51); handled with an on-screen rounding note rather than a nudged figure.
7. **Task 5's "510 unauthored" and "66 authored" are framework-wide.** For this assessment 492 unauthored controls apply (491 Unknown, one with a verdict) and 65 authored ones do (one authored control is among the 19 excluded). Both are on the screen.
8. **A hidden figure the new screen contradicted:** `EVIDENCE_BASIS_BREAKDOWN` said 68 negative-capable; the engine's signal table says **38** (38 / 45 by rule / 31 by judgement / 1 by uncertainty = 115). Only the `1` was ever displayed. Corrected, and tied to the Authoring module by a test.
9. **"Replace the single interval"** is ambiguous. I kept the headline interval card (it carries the reveal animation, overrides and the decomposition) and replaced the risk-weighting card with the four views.

## 7. Observations about the engine repository (not fixed there, per your rule)

- **JNCSF-139** has no authored evidence path and no module run, and its claim is a Gap with `gap_basis: observed`. That is not an oddity to be labelled; it is the engine doing what it should, and the
  principle is worth stating: *Observing that a control is **unmet** does not require an authored path to prove it **met**. Evidence collected for one purpose can directly contradict another control.*
  The two counts differ for that reason and are kept distinct, not reconciled: **492 applicable controls have no authored path, 491 of them are Unknown because of it, and one was observed to fail
  regardless** (`coverage.unauthored_applicable` is the 492; the width's `unauthored` is the 491). Nothing to fix in the engine; the prototype's copy was what needed narrowing (§9.5).
- **Assurance:** the assessed state reports `l1_documented` although 36 of the 52 verdicts are machine-evidenced, and that is correct, not odd: the headline is the highest level at which the share
  of settled verdicts at that level or above meets the disclosed 0.8 threshold (`engine/scoring.py`, `_headline_level`), and 37 of 52 does not. The prototype's L2 was the false statement (§9.4).
- **Weighted coverage** in the golden file is a count (e.g. `4/39` for derived-only), not a weight share; my first model assumed weight and was wrong until compared with the published value. Worth a sentence in whatever documents the schema.

## 8. Verification

- **Mutation checks (each restored byte-identical, `cmp`):** filter ignores the gap reason → 1 test fails; ladder shown for unauthored → 1; tone not distinct → 1; an unauthored seed no longer unauthored after upload → 2;
  stale 1 → 2 in the published reasons → 2; unauthored override not moving the tool's share → 1; a Compliant sample control before the upload → 2; owner labels swapped → 1; equal-width segments → 3; sum guard removed → 1;
  authored-scope label dropped → 3; label on every row → 1; weight table counted over 576 (the original bug) → 2; Delivery 43 of 44 → 7; nav open to all roles → 3; a figure typed into the Authoring screen → 1; reach partition off by one → 2.
  *Finishing commit, 17 more, each restored byte-identical (`cmp`):* threshold `>=` → `>` → 1; percentage rounded instead of down → 1; levels scanned in the wrong order → 6; "next level" wrong → 5; Dashboard active level L2 → 1; Dashboard measurement box removed → 1; sidebar badge L2 → 2; sidebar percentage off by one → 1; Intake says assurance rises → 1; Control Detail "nothing says" clause shown for a control with a verdict → 1; old Control Detail sentence restored → 3; `TOTALS.after.assurance` L2 → 5; OSCAL preview L2 → 1; tour step says the level rises → 1; a provenance constant changed → 2; Chat answer's L3 sentence changed → 1; Chat answer's reported-level sentence changed → 1.
- **Headless render** (dev server, Playwright-core, scratchpad scripts): all 13 original routes + `/authoring` for owner and analyst + `/authoring` as executive (redirected to the Dashboard): 0 console errors or React
  warnings beyond React Router's two future-flag notices; plus the Dashboard before and after the upload (owner and executive), Remediation with 0 and 5 artifacts, Control Detail, Export, Rollup as regulator: 0 errors.
- **Finishing commit, headless render** (dev server, Playwright-core, scratchpad script, not committed): Dashboard (owner, after and before the upload; executive, after), Intake (Evidence bundle tab), Control Detail for an
  unauthored control, Chat (the assurance question asked), Export, Gap Matrix, Authoring. None contains `L2 — Tool-evidenced`, `Why L2`, `Evidence bundle loaded · L2`, `assurance L1 → L2` or `cannot change this`; the sidebar
  reads *Evidence bundle loaded · L1 / 71% tool-evidenced or analyst-signed · L2 needs 80%* after the upload and *Testimony only · L1* before. Console: 0 errors or warnings beyond React Router's future-flag notices, apart from one
  `404` on the first page of each browser run, which is Chromium asking for `/favicon.ico` (`curl localhost:5173/favicon.ico` → 404; the repository has no favicon and `round-1/truthfulness` had none either). Screenshots of the
  assurance card and the unauthored statement were looked at.
- **Regeneration and figures (finishing commit):** `python3 -I docs/evidence/derive_ministry_figures.py $ENGINE <out>` prints `mismatching views: 0`, the assurance line and the provenance line, and its output is byte-identical to
  `src/data/ministry.ts` (`cmp`); `verify_brief_figures.py` → `MISMATCHES: 0 of 41`.
- **Engine checkout untouched:** `git -C $ENGINE status --porcelain` → empty, and `git -C $ENGINE stash list` → empty.
- **Disk re-read:** after the last edit, every file in the finishing commit (18 files, including this report) was re-read from disk and checked for the marker text its change added, and for the absence of the old text: see the reply for the result.
- **Disk re-read, second finishing commit:** after the last edit, every file in it (21 files, including this report) was re-read from disk and checked for the marker text its change added and for the absence of the old text; the result is in the reply.


## 9. The rulings applied in the finishing commit

1. **JNCSF-139, and why there are two counts.** Its `gap_basis` is `observed`, with no path and no run. *Observing that a control is **unmet** does not require an authored path to prove it **met**.
   Evidence collected for one purpose can directly contradict another control.* So: **492 applicable controls have no authored path, 491 of them are Unknown because of it, and one was observed to fail
   regardless.** The two counts are kept distinct, not reconciled (§7). The earlier observation here, that it was "probably intended" and wanted "a label", is withdrawn.
2. **Rule R's provenance** is recorded where the figures are: in the generator (it asserts both premises from the golden file and refuses to write otherwise), in the header of `src/data/ministry.ts`
   with the numbers filled in by the generator, as an exported `RULE_R_PROVENANCE` that `assurance.test.tsx` holds against the figures in use, and in §3. All 21 Compliants are
   `machine_collected`, none document-backed; the engine's assurance distribution is 3 / 12 / 36 / 1, and the 15 at L0 and L1 are exactly the before-state's verdicts (with no exception after the second ruling, §10.1). The
   before-state is no longer described as "mine" or "not an engine figure"; it is the engine's data under one stated projection (a test fails if the header says otherwise).
3. **JNCSF-139 in the before-state: kept in both states** in this commit. **Superseded**: the owner ruled it must be flipped, and it was, in the next commit (§10.1). What this item argued (that keeping it made every difference attributable to the authored scope) is the tidiness the ruling rejected.
4. **Assurance is L1, and the prototype's L2 was false.** The engine's headline is the highest level at which the share of settled verdicts at that level or above meets the disclosed threshold (0.8):
   at L2 or above that is 37 of 52 = 71.15%, below; at L1 or above 49 of 52 = 94.23%, which meets it. So **the collection succeeded, 36 controls moved out of Unknown, and the system still refused to
   raise its own confidence, because the proportion threshold was not met.** That is now what the Dashboard card, the sidebar badge, the Intake banner, the tour step and the Chat answer say, with
   the measured value and the threshold beside the level (*37 of 52 (71%) · threshold 80% · reported L1*). The percentage is rounded down, so a figure under the threshold can never be displayed as equal to it.
   Nothing on a screen is typed: the counts, the total and the threshold are read from the generated `ASSURANCE` block, and `assurance.test.tsx` recomputes the engine's rule from the distribution. Beyond the
   three places you named, I changed the places that stated the same falsehood (executive subline, completeness statement, OSCAL `assurance-level`, tour, Chat), because leaving them would have contradicted the card.
   Three things for your review: (a) the **ladder definitions** for L1 and L2 are my wording (§4); the old L1 text, "no machine-collected artifacts", would have been shown as the active level's definition and was false;
   (b) the Dashboard's *Demotion risks* line (*1 declined module · N analyst overrides · N/A rate above sector baseline*) was part of the explanation I removed, and is not the engine's: it reports no demotion,
   its declined-module check passed at 0.0714 against 0.2, its unusable-evidence check at 0.0018 against 0.2, and two checks were not assessed (no baseline supplied; the profile challenge is not modelled).
   I did not replace it in that commit; it is replaced in the next, with the real table (§10.3); (c) the *before* badge, "Testimony only · L1", understated; changed in the next commit (§10.4).
5. **The unauthored copy was narrowed, and one clause gated.** The sentence *Uploading evidence cannot change this* was true of the 491 and false in general (139). I narrowed it rather than adding an exception,
   because an exception sentence on a control that has no verdict would only confuse: it now reads *Uploading evidence cannot establish that this control is met*, which is true of all 492. The clause
   before it, *nothing here says the control is met, and nothing says it is not*, is equally false of a control that carries a verdict (139, or an analyst override), so it is shown only while the control is
   Unknown (tested with an override). The Intake line had the same fault (*an upload cannot change them*) and now reads *an upload cannot establish that any of them is met*. The first version of the Task 1 text is
   in §4.
6. **The repository is public** (§0), and the derive and verify scripts stay in `docs/evidence/`.

## 10. The second ruling

1. **JNCSF-139 is Unknown before the upload and a Gap after it.**
   *The condition you set* (keep it only if the data shows its artifact predates the bundle): it does not. The golden file's claim for it is `gap_basis: observed`, `evidence_class: artifact`,
   `evidence_kind: null`, no module run and no satisfied path, and **no claim carries a date, age or observation-time field at all** (the claim's keys are `confidence`, `control_id`,
   `deployment_share`, `deployment_share_basis`, `deployment_share_interval`, `documents_overruled`, `enforcement_mode`, `enforcement_mode_basis`, `evidence_class`, `evidence_kind`,
   `exception_population`, `gap_basis`, `gap_reason`, `negative_evidence_module_run_id`, `partial_basis`, `population_description`, `reasoning`, `satisfied_path_label`, `state`,
   `testimony_contradicted`; the control appears in four sections of the file, `applicable`, `claims`, `coverage` and `ranking`, none of them a timeline). Nothing in the data places the
   artifact before the bundle, so it is flipped: one line removed from `before()`, and the generator now asserts that the before-state is *exactly* the engine's L0/L1 verdicts, with no
   exception, and that the one verdict outside the authored scope is machine evidence (L2).

   *What moved* (computed by the generator from the golden file; regenerated byte-identical to `src/data/ministry.ts`): the before-state has 15 verdicts (0 Compliant / 14 Partial / 1 Gap /
   542 Unknown, 492 of them unauthored); unweighted 0.32%–97.63%, width 97.31 (was 97.45% and 97.13); weighted including underived 0.34%–97.59%, width 97.25; derived only 0.29%–97.06%,
   width 96.77; the authored scope is unchanged (2.77%–79.69%); coverage 2.7% (15 of 557; was 2.9%); the tool's share of the width falls from 88.33 to 88.15 points. The two floors differ by
   the same one control: the pre-upload Dashboard hint (from the before-state) quotes 88.3, the Remediation card (from the post-upload verdict) 88.2.

   *The attribution is no longer clean, and that is correct.* The sentence I had argued for, "every difference between the two states is attributable to the authored scope", was cleaner
   than the truth. The truth is that the upload resolves 36 of the 50 Unknowns inside the authored scope **and** changes one control outside it, by observation: an artifact collected for
   other purposes directly contradicts a control nobody wrote a requirement for. That is the JNCSF-139 principle (§7) in the before/after narrative, where it now appears in the Intake
   banner and the Dashboard interval subline, worded from the generated record (*JNCSF-139 has no authored evidence requirement, but an artifact in the bundle shows it unmet, so it moved
   from Unknown to a Gap (observed).*), and nowhere before the upload. Every statement that the unauthored controls "stay Unknown regardless" is gone or narrowed to *…unless an artifact
   collected for another control happens to show one unmet* (Request Plan, Remediation, and the code comments); a source scan holds that.

   *One thing the flip exposes:* the before-state's L1 clears the threshold exactly. 12 of the 15 verdicts rest on documents or better, which is exactly 80%; one fewer would be 11 of 15 =
   73.3%, which is L0. The label is correct and thin.

2. **The four ladder definitions are the threshold rule** (the 80% is read from the data; a test holds each sentence verbatim, holds that none says what is missing, and checks that exactly
   one level's definition is true of the engine's distribution, the reported one):

   - **L0:** Fewer than 80% of verdicts rest on documents, tool evidence or an analyst’s signature.
   - **L1:** At least 80% of verdicts rest on documents, tool evidence or an analyst’s signature, but fewer than 80% rest on tool evidence or an analyst’s signature.
   - **L2:** At least 80% of verdicts rest on tool evidence or an analyst’s signature, but fewer than 80% rest on an analyst’s signature.
   - **L3:** At least 80% of verdicts rest on an analyst’s signature.

   Two choices for your ruling. L1 carries both halves of the rule (*at least 80% … but fewer than 80% …*) where your sentence had the second half only, because without the first, L0 also
   satisfies it. And "verdicts" means controls that have a verdict, the prototype's own word (the rest are Unknown); I did not use the engine's "settled".

3. **The demotion checks are back: the engine's own four, in its order.** Shown after the upload, inside the Assurance card, in the space the old line occupied. Each check has its cause,
   status, measured value, threshold and a detail line; the summary reads *No demotion applied: reported L1, base L1. 2 passed · 0 triggered · 2 not assessed.*

   | Check | Status | Measured | Threshold | Detail (written from the figures) |
   |---|---|---|---|---|
   | Declined module | Passed | 7.1% (4 of 56) | 20% | 4 of 56 in-scope signals were covered only by declined module runs. |
   | Unresolved profile challenge | **Not assessed** | not measured | none applied | This check could not run: the engine does not model the profile challenge it depends on. |
   | Unusable evidence | Passed | 0.2% (1 of 557) | 20% | 1 of 557 claims are Unknown because their evidence was unusable (1 stale, 0 future-dated). |
   | N/A rate above baseline | **Not assessed** | not measured | none applied | This check could not run: no sector baseline was supplied to compare the N/A rate against, and having no baseline is not treated as normal. |

   A check that could not run is a dashed grey *Not assessed* chip with "Measured: not measured · no threshold applied", never the word Passed and never a percentage; a footnote says it is
   *neither passed nor failed, and not counted as a pass*, and a test holds each of those. A *Triggered* status is handled by the component and by the summary (*Demoted n level(s)*), but is
   not reachable with this data. **Two things to know.** (a) The detail lines are my wording from the engine's figures, not the engine's own `detail` strings, because the rule is that figures
   cross and text does not; if you want the engine's strings they are in the golden file. (b) It is laid out as stacked rows, not a five-column table: the card is a third of the page width,
   and the first attempt at a real table (checked in a screenshot) wrapped the check names to five lines and clipped the figures. All five fields are on every row. The figures are generated
   into `ministry.ts` (`DEMOTION_CHECKS`): each assessed check carries its count and denominator, which the generator asserts equal the engine's measured value exactly, and each check that
   could not run carries a closed reason.

4. **The before badge is *Testimony and documents · L1*** (your acceptance), and so is its twin, the Dashboard's pre-upload banner, *Pre-upload state — testimony and documents only.* It said
   "testimony only" about the same state; 12 of the 15 before-verdicts rest on documents.

5. **Text audit.** Every string changed in this commit is in §4 (the rows for the pre-upload hint, the interval subline, the pre-upload banner, the Remediation footnote, the Request Plan
   paragraph, the Intake banner, the assurance card, the sidebar badge, the ladder definitions and the Chat answer). Stale claims, searched for in shipped source with tests excluded:

   ```
   grep -rnE "Testimony only · L1|testimony only\.|stay Unknown regardless|whatever is provided|unaffected by the (evidence )?upload|Demotion risks|Why L2|L2 — Tool-evidenced|cannot change this|an upload cannot change them|accredited assessor has reviewed|no machine-collected|kept in the before|KEPT|never changed" src --include=*.ts --include=*.tsx | grep -v "src/__tests__/"
   ```

   → no output (exit 1). Old before-figures: `grep -rnE "\b(97\.45|97\.13|97\.39|97\.05|96\.76|96\.47)\b|\b541\b" src --include=*.ts --include=*.tsx | grep -v "src/__tests__/"` → no output. The same strings were read off
   the rendered pages in a browser (Dashboard before and after, executive, Intake, Remediation, Request Plan, Chat, Authoring, Gap Matrix, Export): none of `Why L2`,
   `L2 — Tool-evidenced`, `Testimony only · L1`, `assurance L1 → L2`, `stay Unknown regardless`, `cannot change this` or `Demotion risks`; 0 console errors.

   Defects the audit found in my own work, all fixed: a comment in `controls.ts` that generalised "never changed" from the sample's seeds to unauthored controls; a test comment that still
   said "nothing outside the scope moves"; and, from the browser only, a missing space in the Intake banner (*…L2 needs 80%.1 control outside…*, a JSX line break that substring tests did not
   see), now pinned by a test that asserts the whole passage contiguously.

6. **Mutation checks, second ruling** (each restored byte-identical, `cmp`): L1's rule holds `L2` → 2 fail; `levelHolds` ignores the failing half → 1; definition wording changed → 1;
   "Not assessed" shown as "Passed" → 1; measured digits changed → 1; summary ternary inverted → 1; the two cannot-run reasons swapped → **survived; test added; now 2 fail**; not-assessed
   rows hidden → 2; checks shown before the upload → 1; moved-out-of-Unknown total wrong → 4; outside-scope sentence says "met" → 3; Intake sentence removed → 1; badge back to "Testimony
   only" → 1; banner back → 1; a provenance constant changed → 2; Request Plan back to "regardless" → 2; Intake space removed → 1. One survivor **cannot be killed**: the Chat answer's L3
   citation has a link, so its `passage` is never rendered (an equivalent mutant). The passage is derived from the rule, so it cannot drift if it is ever shown.

## Appendix — final `npm run build` (exit 0)

```

> jccp-prototype@0.1.0 build
> tsc --noEmit && vite build

vite v5.4.21 building for production...
transforming...
✓ 2787 modules transformed.
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
dist/assets/index-DlYV3Yp4.css                              34.71 kB │ gzip:   7.02 kB
dist/assets/motion-Ct5Xfmig.js                             115.26 kB │ gzip:  38.24 kB
dist/assets/react-Db5HS6QK.js                              164.79 kB │ gzip:  53.78 kB
dist/assets/index-CCLGdgtK.js                              294.39 kB │ gzip:  80.60 kB
dist/assets/charts-rE-ahWxC.js                             392.54 kB │ gzip: 106.59 kB
✓ built in 6.31s
```

## Appendix — final `npm test` (exit 0)

```

> jccp-prototype@0.1.0 test
> vitest run


 RUN  v2.1.9 /home/user/jccp-prototype

stderr | src/__tests__/ministry.test.tsx > Task 2: the whole aggregate is tagged illustrative > every region on the Dashboard is illustrative; none is measured
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
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/ministry.test.tsx (37 tests) 254ms
stderr | src/__tests__/truthfulness.test.tsx > 3.2 partial-credit quartile > Control Detail shows the actual credit (artifact-backed share, Partial)
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/__tests__/truthfulness.test.tsx > 3.2 partial-credit quartile > the dashboard says Partials are credited one by one, with the published totals (no flat weight)
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/truthfulness.test.tsx > 3.4 projection floor, pool and invariant > the dashboard (before the upload) and the projection card (from the post-upload verdict) each quote their own floor, and they differ by exactly the control observed from the bundle
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/truthfulness.test.tsx (23 tests) 716ms
stderr | src/__tests__/assurance.test.tsx > no screen says L2 > Dashboard after the upload: the active level is L1, with the measured value and the threshold beside it
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

stderr | src/__tests__/assurance.test.tsx > no screen says L2 > Dashboard before the upload shows no measurement box (nothing was collected to explain)
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/assurance.test.tsx > no screen says L2 > the Dashboard shows the active level’s definition, and the numbers beside it satisfy it
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/assurance.test.tsx > JNCSF-139 is in the before/after story, not in a footnote > the Dashboard interval subline says it after the upload and not before
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/assurance.test.tsx > the demotion checks are shown, all of them, and a check that could not run is not a pass > all four checks, in the engine’s order, each with its status
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/assurance.test.tsx > the demotion checks are shown, all of them, and a check that could not run is not a pass > an assessed check shows its measured value and its threshold, with the figures behind them
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/assurance.test.tsx > the demotion checks are shown, all of them, and a check that could not run is not a pass > a check that could not run says so: not assessed, not measured, no threshold, and never the word Passed
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/assurance.test.tsx > the demotion checks are shown, all of them, and a check that could not run is not a pass > the table is the engine’s after-upload result: absent before the upload
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/assurance.test.tsx (42 tests) 1143ms
stderr | src/__tests__/authoring.test.tsx > Task 5: the screen > shows every figure
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/__tests__/authoring.test.tsx (24 tests) 536ms
stderr | src/__tests__/consistency.test.tsx > 4.1 each "resolved" figure is computed from its own source and named precisely > the dashboard names 36 of the 50 Unknown controls in the authored scope, and 21 of the 48 in this sample
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

stderr | src/__tests__/consistency.test.tsx > on-screen vocabulary: no "seeded" > /dashboard renders no "seeded"
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/consistency.test.tsx (21 tests) 869ms
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

 ✓ src/__tests__/followup.test.tsx (19 tests) 501ms
stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > after the upload: the three segments are rendered in proportion to the parts
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

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > before the upload: the three segments are rendered in proportion to the parts
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > the assessed state: 97.2% of the bar is the tool's, 2.8% the organisation's, none structural
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > states that the parts are asserted to sum exactly to the width, with the sum shown
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > labels whose limitation each cause is, attached to the right one
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > colours the segments by cause: ours is orange, the organisation's is violet, structural is slate
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > itemises the organisation's share by reason, with counts and points, summing to the total
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > before the upload the only reason is not_provided: 50 controls
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > sits under the interval, not elsewhere
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/decomposition.test.tsx > Task 3: the width decomposition under the interval > follows the headline under an analyst override: the tool's share narrows and the parts still sum
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/decomposition.test.tsx (14 tests) 975ms
stderr | src/__tests__/unauthored.test.tsx > unauthored is in the vocabulary > has a tone distinct from the collection failures (ours, not the organisation's)
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/__tests__/unauthored.test.tsx (11 tests) 1029ms
   ✓ the sample contains unauthored controls > and the reason shows on Control Detail before and after the upload 579ms
stderr | src/__tests__/views.test.tsx > Task 4: the four views, all visible on first render > there are exactly four, in order, with no tab or toggle to click
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

stderr | src/__tests__/views.test.tsx > Task 4: the four views, all visible on first render > renders each view with the engine's bounds
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: the four views, all visible on first render > shows the widths the bounds imply
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: the four views, all visible on first render > also renders all four before the upload (the weighted views are derived under the same model)
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: authored_scope never appears without its label > the label is inside the authored_scope row, verbatim (uploaded=false)
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: authored_scope never appears without its label > the label is inside the authored_scope row, verbatim (uploaded=true)
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: authored_scope never appears without its label > and only in that row: the other views do not carry it
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: authored_scope never appears without its label > its numbers appear nowhere else on the page: every occurrence is inside the labelled row
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: authored_scope never appears without its label > is marked as a partial view
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: the weights explain a view that exists, and the totals agree with their table > the table counts the 557 applicable controls and sums to the engine's totals: 331.4 and 498.4
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: the weights explain a view that exists, and the totals agree with their table > says what the other population is: all 576 controls give 341.4 / 514.4 with 173 underived
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: the weights explain a view that exists, and the totals agree with their table > the old decorative card is gone: no weighted/unweighted toggle, no stale 14.9 or 30% of the framework
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/__tests__/views.test.tsx > Task 4: analyst overrides > apply to the unweighted row only, and the page says so
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

 ✓ src/__tests__/views.test.tsx (14 tests) 1136ms
stderr | src/__tests__/display_guard.test.tsx > Remediation reaches the screen only through the guard > shows the band when the width agrees with it
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/__tests__/display_guard.test.tsx (2 tests) 252ms
 ✓ src/__tests__/no_duplicate_figures.test.ts (3 tests) 370ms
   ✓ figures are not duplicated outside src/data/figures.ts > finds no literal outside the frozen allow-list 358ms
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

 ✓ src/__tests__/provenance.test.tsx (19 tests) 565ms
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

 ✓ src/__tests__/boundary_app.test.tsx (2 tests) 293ms
stderr | src/__tests__/projection.test.tsx > projected interval, all 32 subsets of the five artifacts > always shows lower ≤ upper, width ≥ 0, and the same width in hero and subline
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/__tests__/projection.test.tsx (1 test) 1130ms
   ✓ projected interval, all 32 subsets of the five artifacts > always shows lower ≤ upper, width ≥ 0, and the same width in hero and subline 1129ms

 Test Files  14 passed (14)
      Tests  232 passed (232)
   Start at  23:03:29
   Duration  11.59s (transform 1.73s, setup 2.02s, collect 9.66s, tests 9.77s, environment 6.32s, prepare 1.25s)
```
