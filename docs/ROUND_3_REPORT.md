# Round 3 report — grounding the prototype in the engine's output

Branch `round-3/measured`, from `round-2/unauthored`. One commit per task, the carry-over commit the Round 2 close asked for, and one finishing commit (the one that contains this report) that carries the rulings made when Round 3 was accepted. Not merged.

```
3213edd  Round 3 carry-over: the before-state says it sits on the threshold
655aa05  Round 3 Task 1: the generator reads all three goldens
3f1d6b7  Round 3 Task 2: all applicable controls, and the end of "the sample"
fe9d3f7  Round 3 Task 3: `measured` enters the vocabulary
44b5b02  Round 3 Task 4: remediation from the engine's ranking
b5b5748  Round 3 Task 5: the profile switcher chooses among the three real assessments
(finishing) the narrative from the data, the Request Plan derived, two corrections
```

(`git log --oneline round-2/unauthored..HEAD`)

---

## 0. The finishing commit: what the rulings asked for, and what was done

### 0.1 The stale narrative: rewritten from the data, not labelled

The tour, the executive summary, the Chat, the interviews and the evidence quotes told a story about JNCSF-102, -307 and -435 failing. The engine says 102 is Compliant and the other two are Unknown. All of it is rewritten from the six Gaps the engine established, which are the same six in all three assessments, one of every basis it can record:

| Gap | Basis | Run / ground |
|---|---|---|
| JNCSF-99 | absence | run `network-flow-rules` (successful) |
| JNCSF-100 | absence | run `directory-enumeration` (successful) |
| JNCSF-101 | absence | run `directory-enumeration` (successful) |
| JNCSF-109 | testimonial_admission | a respondent's statement of non-enforcement |
| JNCSF-124 | observed | an artifact; enforcement mode `disabled` (established) |
| JNCSF-139 | observed | an artifact; no authored evidence path |

(`realGaps()` in `src/lib/narrative.ts`; `narrative.test.tsx` asserts the six ids and the 3 / 2 / 1 split in each assessment.)

Nothing in the narrative is typed. `src/lib/narrative.ts` and `src/lib/plan.ts` derive every fact from the assessment (the Gaps, the tie group, the testimony, the plan), and a test refuses a literal `JNCSF-` id in any narrative source file (the tour script, the Chat, the Dashboard, Intake, the Request Plan, Tasks, and the two libraries; the refusal about `JNCSF-9999` and the catalogue range excepted). A second test refuses the old story's fingerprints anywhere in the source (`CrowdStrike`, `EDR`, `43 privileged`, `22 servers`, `12 of 400`, `1,842`, `Top 3 risks`, and others).

What was rewritten:

- **The tour.** The scripted interview ("one sentence becomes three findings") is now **Testimony is weighed, not counted**: JNCSF-109, a compliance officer's answer that supported the control, and the engine's own string recording that testimony admitting non-enforcement prevails over it. A new step, **Three grounds for a Gap**, names one Gap of each basis (JNCSF-100, -139, -109) and the real counts. "The evidence trail" is now **What the finding is built on** (the successful run behind JNCSF-100 and the file hash). "What an attacker gains" quotes the engine's recorded exposure for that control, `lower_confidence_only`, how many techniques were shown and how many withheld, and that exposure never ranks. "Ranked by value" is **Ranked, and honest about ties**: the real tie group (15 / 12 / 13 actions at rank 1 in the ministry / bank / utility), how many are fixes and how many are evidence requests, and the engine's own tie-order note. The collection-ledger step reads its numbers from the ledger. Every `target` exists: I drove the whole tour in Chromium for each assessment, all 31 steps, and the tour logs a `[tour]` warning when a target is missing; there were none.
- **Top-3 risks → the tie.** The card is replaced by **Prioritisation**: "15 actions share the highest rank, all of equal magnitude. The engine does not break a tie it cannot justify." (your wording; the count is the data's: 15 / 12 / 13), with the three fixes by id, the number of evidence requests, and the engine's note. Before the upload: "A ranking is derived from an assessment, so before one exists there is nothing to rank."
- **Chat.** Re-pointed. What a control requires (from the catalogue text the prototype holds, with the ISO/NIST references it holds), which controls are Gaps and on what basis, why one Gap of each basis is a Gap (from the claim's own fields), which Gap rests on an admission, "which Gaps would an attacker exploit first?" (answered as the engine does: it does not say; exposure is an annotation, never a rank, and the answer lists what it recorded for each Gap), which action comes first (the tie), the L3 question, the score, and the two refusals. The Gap answers appear only after the upload. The 48-hour/PDPL question is gone: it quoted a passage from "PDPL Art. 2023", a source the prototype does not hold.
- **Interviews → testimony.** The scripted interviews (CrowdStrike, MFA, a SIEM) are deleted. The Interviews tab lists the respondent roles the engine recorded, each with the answers it weighed: control, the control's measured state, the stance (`supports`, `admits_non_enforcement`), the signal, the engine's outcome string and the locator. The assessment file holds no transcript, and the screen says so. A table shows what the engine did with the answers by ground; the "Two answers disagree" banner is the engine's admission string for JNCSF-109 (it replaces an invented "operator wins on MFA" conflict). Before the upload only the testimony behind a verdict that exists then (rule R) has been weighed: one answer, one respondent; after it, four.
- **Evidence quotes and worked examples.** `evidence.ts` (invented quotes, AD exports, a 100%-reconciled CMDB), `attack.ts` (worked ATT&CK chains), `interviews.ts`, the worked-example population notes, the worked signals, and the "no conclusive path" box are deleted, together with the components that showed them. The 48 catalogue entries keep only the NCSC's published text and mappings. Control Detail now shows the measured panel, the catalogue mapping, the sufficiency ladder, the engine's ATT&CK exposure and the engine's actions, and nothing invented beside them.
- **Also removed, because they were invented and contradicted the engine on the same data:** the Dashboard's "Oldest evidence: 84 days (JNCSF-459)" line (the engine says JNCSF-459's document was not provided; the line is now the engine's own unusable-evidence count) and the invented four-cycle Trend card (replaced by the parameters the engine disclosed on this result).

### 0.2 Control text: left out, said once

The catalogue is not loaded. The Gap Matrix now says, once, at the top: "The control catalogue lives in the assessment engine, and this prototype does not need it to show you a verdict or the reasoning behind one. Each row carries the id, the capability, the state, the basis and the reason, all of them the engine's; text is shown only where the prototype already held it (48 of 557)." The per-row apology is gone. A row now carries a capability pill as well (it previously relied on the group heading).

### 0.3 The Request Plan: derived

The 22 invented artifacts are deleted. The plan is the engine's `coverage.required` (113 signals for the ministry, 115 for the bank, 113 for the utility), and each signal's controls are those whose requirement names it; `required` is exactly `provided` ∪ `gaps` with nothing in both, in all three assessments (tested). **A departure from "the same evidence requests Remediation uses":** Remediation's ten signals are the ones the ranking still asks for *after* assessment, so they are a subset of the plan, not the plan; a pre-collection plan needs the full required set. The two agree by computation: every signal Remediation asks for is in the plan, with the asking control among the plan's controls for it, and with a status other than `provided` (tested for all three). The controls the plan names are exactly the authored scope (65 / 66 / 65, tested as an equality).

Rows carry the signal, how many controls name it, which ones, and after the upload the engine's status: provided, or its reason (not provided, declined, insufficient permission, module failed, stale, future-dated). There is no effort, owner, command or "declining leaves N controls Unknown": the assessment has none of them. The Intake bundle tab uses the same derivation: its slots are the signals; simulating the bundle provides exactly those the engine records as provided; the module ledger is now a **collection ledger by signal family**, from the data (the three assessments differ: the ministry's `endpoint` family was declined, the utility's failed, the bank's was stale; the bank's `monitoring` was future-dated). The Tasks screen lists the signals Remediation asks for, with the controls that ask, and no due dates or notes. Intake's collector "ingestion" card is `planned` and its first stage says plainly that the signature check is simulated.

### 0.4 The two small corrections

1. **Applicability variables.** A variable no exclusion names is now `unrecorded`: "in scope — not recorded as declined". It is not shown as a declared Yes; none of the three buttons is active until the user chooses one, and choosing Yes records a declaration and removes the note. (The saved-state key is now `jccp-assessment-v4`, because the shape of the profile changed; a browser's earlier saved progress is not carried over.)
2. **The regeneration test does not run in CI.** It needs the engine checkout, and `.github/workflows/deploy.yml` runs `npm test` only. It was verified locally against the engine clone at the end of this round and is **not** checked by CI: a green build is not evidence that the generated profile modules still match the goldens. The result of running it:

```
ENGINE_ROOT=/home/user/jccp npx vitest run src/__tests__/regenerate.test.ts    → 1 passed
```

---

## 1. Every control id the narrative names, with its measured state

Extracted by rendering each surface, for each of the three assessments, and matching `JNCSF-\d+` in the text (the Chat after clicking every question; the tour script's titles, bodies, instructions and routes). The states are from the golden, via `CURRENT.claims`; they are identical in all three assessments.

| Surface | Control ids named | Measured state |
|---|---|---|
| Tour, "Testimony is weighed, not counted" | JNCSF-109 | **Gap** (`testimonial_admission`) |
| Tour, "Three grounds for a Gap" | JNCSF-100, JNCSF-139, JNCSF-109 | **Gap** (`absence`), **Gap** (`observed`), **Gap** (`testimonial_admission`) |
| Tour, "Open a control", "What the finding is built on", "What an attacker gains", route of "What to do about it" | JNCSF-100 | **Gap** (`absence`, run `directory-enumeration`) |
| Chat (every question, after the upload) | JNCSF-99, -100, -101, -109, -124, -139 | **Gap** (3 `absence`, 2 `observed`: -124 and -139, 1 `testimonial_admission`: -109) |
| Dashboard, Prioritisation | JNCSF-109, JNCSF-124, JNCSF-139 | **Gap** (`testimonial_admission`, `observed`, `observed`) |

Every id the narrative names is a Gap the engine established. `narrative.test.tsx` holds this for all three assessments (the tour text; every Chat question and answer, before and after the upload; the executive summary).

Two other kinds of surface also name control ids. Neither is narrative; I list them so that nothing is hidden:

- **Data displays generated from the assessment (measured, with the state beside the id).** Intake's testimony view lists the answers the engine weighed. Four are recorded: JNCSF-99, -109 and -124 (Gaps) and **JNCSF-95, which is Compliant** (`green`): a service desk lead's answer admitted non-enforcement, and the engine kept the artifact-backed path and recorded the testimony as retained, not outvoted. It is shown with its measured state and the engine's string, because it is the case where over-reporting is made visible, and it contradicts nothing. If you want only Gaps in that view, it is a one-line filter; I left it in because hiding the one case where testimony loses would misstate what the engine does. The Request Plan and the Tasks list name the controls whose evidence requirement names a signal (any state).
- **Not narrative, left as they were, both `illustrative`.** *Roles & Access* names JNCSF-102 (Compliant), -440, -30, -146 and -435 (Unknown), -100 (Gap) and -107 (Compliant) as the controls the prototype's own access model implements; it is a design statement about the product, not a finding about the assessed organisation. *National Rollup* names JNCSF-435, -307, -141, -30 and -407 (all Unknown here) as the most-failed controls across 47 other, invented entities; the assessment has no multi-entity data to derive that from. If you consider either to contradict the measured state, say so; neither was in the list you gave.

---

## 2. What is now `measured`, and what is not — by screen

**How to read the tiers.** `measured` means: the figure on the screen is read from one of the three golden files, and the element names the path it is read from (`data-source`; a test resolves every one of them against all three profiles). `illustrative` means: invented or carried by the prototype for the demonstration, marked on the element. `planned` means: something the system will do that the prototype does not. Before the evidence upload the screens show **rule R's projection** of the engine's data: arithmetic on the golden, not an engine run, so it is marked `illustrative` with the reason on screen. After the upload the same elements are `measured`. An analyst override moves a region back to `illustrative`.

| Screen | `measured` (after the upload) | Not measured |
|---|---|---|
| **Organisation Profile** | The assessment selector (path `totals`). The CICSC line, derived from the golden's boundary with its basis. | The form's inputs and the "Live scoping" panel: `illustrative`. The live count agrees with the golden's applicable count for each assessment (tested). Sector N/A baseline: invented (`SECTOR_BASELINE`). |
| **Evidence Request Plan** | The whole plan (113 / 115 / 113 signals, their controls, and after the upload each signal's status). | Before the upload `illustrative` (rule R). The collector buttons: `planned`. |
| **Intake** | The respondent roles and the answers weighed, with outcomes; what the engine did, by ground; the signal slots; the collection ledger. | Before the upload `illustrative` (rule R). Scoped links and the ingestion card: `planned`. |
| **Compliance Dashboard** | Interval, coverage, assurance and its boundary line, width by cause, the four views, per-capability figures, partial credit, the Unknowns by reason, the scope-exclusions card, the demotion checks, the disclosed parameters, the Prioritisation card, the engine's unusable-evidence count. | Before the upload `illustrative`. Framework-wide authoring figures: from the engine's reports, not from a golden. |
| **Gap Matrix** | All applicable controls (557 / 576 / 544) with state, reason, gap and partial basis, path label, run id, and capability. | Before the upload `illustrative`. Control text for 509 / 528 / 496 controls is not shown (§0.2). |
| **Control Detail** | The verdict and everything that explains it; contradicted testimony; overruled documents; the ranked action and its ATT&CK exposure. | The catalogue mapping for the 48 controls the prototype holds: `illustrative`. Nothing invented sits beside the measured panel any more. |
| **Remediation & Requests** | The ranked list, the tie groups, the exclusion lists, the artifacts and the projection. | Before the upload the screen shows nothing of the engine's and says why. |
| **OSCAL Export** | The preview documents are built from the active assessment. | Signing, validation, the export action: `planned`. |
| **Compliance Chat** | Nothing carries a `measured` mark (the answers are canned wording over live data). | `planned` (no LLM). |
| **Scope Exclusions** | The whole register (19 / 0 / 32). | Nothing. |
| **Roles & Access, Tasks, National Rollup, Authoring Coverage** | Nothing. | `illustrative`. Tasks' contents are derived from the engine's evidence requests; who is asked, and when, is a demonstration. |

---

## 3. The five tasks (unchanged from the first report)

### Task 1 — the generator (`655aa05`)
`docs/evidence/derive_profiles.py` reads `government_ministry.json`, `bank.json` and `utility_with_ot.json` and writes `src/data/profiles/{ministry,bank,utility}.ts`: every figure, every claim, each file's SHA-256. The stamp is on screen. Generator asserts: rule R, the assurance premises, the outside-scope controls, the demotion premises.

```
sha256sum /home/user/jccp/backend/tests/golden/*.json
85cdfc75…c691c  bank.json
b4d05dfd…a6625  government_ministry.json
ce2299be…6d611  utility_with_ot.json
```
These equal the `sha256` in each generated module. See §0.4 for the regeneration test, which is not run in CI.

### Task 2 — every control (`3f1d6b7`)
The 48 seeds are gone. The Gap Matrix lists every applicable control; Control Detail reads the same record. Absence Gaps show their run id.

### Task 3 — `measured` (`fe9d3f7`)
`measured` is in the vocabulary and the legend; a test that nothing carries it without tracing to a golden.

### Task 4 — Remediation (`44b5b02`)
`ranking.items`, grouped by rank (15 items share rank 1 in the ministry), the exclusion lists with their reasons, and artifacts computed as an intersection.

### Task 5 — the switcher (`b5b5748`)
The Organisation Profile screen opens with the three assessments; choosing one re-renders the whole app. Values fixed at import are `lazyByProfile(...)`; `App` re-keys its tree on the assessment; a test refuses a top-level constant that reads the assessment. `selectProfile` drops what was held against the previous assessment and sets the organisation profile from the assessment's output.

---

## 4. Where the brief was wrong (resolved or accepted)

1. **CICSC "for the profile whose golden declares it, not otherwise".** All three goldens declare it (`sector_designation`). Tested on a modified copy of the bank assessment for the false case; the toggle is replaced by the derived value and is not to be restored (accepted).
2. **"Five hand-entered artifacts".** The engine names ten signals (nine for the bank, ten for the utility); every evidence request names exactly one, so the 49-vs-14 overlap cannot arise from derived data. The regression test asserts what is true and keeps the two-signal case synthetic (accepted).
3. **Remediation is empty before the upload** (accepted).
4. **The Request Plan counts** (was open): derived (§0.3).
5. **Applicability variables shown as "Yes"** (was open): now `unrecorded` (§0.4).

---

## 5. Verification

```
npm run build                      exit 0 (tsc --noEmit && vite build)
npx vitest run                     20 files passed, 1 skipped · 385 tests: 384 passed, 1 skipped
ENGINE_ROOT=/home/user/jccp npx vitest run src/__tests__/regenerate.test.ts   1 passed   (local only; not in CI)
git -C /home/user/jccp status --porcelain | wc -l     0   (the engine clone is untouched)
```

**Headless render** (Chromium, `vite preview`, 14 routes × 3 assessments × before/after the upload = 84 pages, with the assessment set through the saved state): no page error, no console error other than the favicon request, no withheld-figure or withheld-screen guard, every page shows its own assessment's source file, none blank. Result line: `routes x profiles x states: 84 problems: []`.

**The guided tour, driven end to end** in Chromium for each assessment (all 31 steps, clicking the highlighted element on the steps that ask for it): 31 steps seen, last step "That’s the full journey", no `[tour]` missing-target warning, no console error, for ministry, bank and utility.

**Tests added this commit:** `narrative.test.tsx` (55): the six Gaps, no typed id in narrative source, every id the tour / Chat / summary names is a Gap (three assessments), the tie card and the tour's tie step, the tour's targets, testimony (before and after the upload), the plan (partition, order, relation to Remediation, summary, ledger, Request Plan screen, Tasks, bundle), the Gap Matrix note, the unrecorded variables. Rewritten: the Task 2 matrix test and the Task 3 provenance test that asserted the worked examples, and the truthfulness test that asserted an invented Chat figure was marked illustrative.

### Mutation checks (this commit)

21 mutants were applied to the source, the whole suite was run, and the file was restored (`cmp`): the example Gap's preference for held text; the before-upload testimony filter; the top rank taken as the lowest; the Gap filter; the documentary test; the plan's controls union; the maximum-coverage formula; the plan's sort order; the ledger's reason count; the Intake's testimony state; the ledger's `complete`; the capability pill; the tour row's id; the Prioritisation request count; the Chat's upload gating; the Chat's catalogue question; the tour's testimony pre-action; the tour's capability route; the Tasks filter; the plan's status column gating; the unrecorded state.

- **20 killed.** Five survived the first run and were killed by tests added for them: the plan's sort order, the ledger's reason count (a family with two not-provided signals collapsed to one), the Intake showing all four respondents' outcomes before the upload, the Prioritisation card's request count, and the Chat's "what does it require" answer.
- **1 unkillable, documented:** in the tour step for the Gap Matrix, replacing the route's capability (`absence.claim.capability`) by a literal `del`. JNCSF-100's capability is Delivery in every assessment, so the mutant is behaviourally identical on this data. The code is right for a Gap in another capability; no data here distinguishes them.
- `tieGroupSize` against `items.length` in `topTie()` is equivalent by an invariant the Round 3 ranking test already asserts (every rank's tie-group size equals the number of items given that rank).

---

## 6. Size

```
dist/assets/index-Oe7CEOu7.js   710.69 kB │ gzip: 110.42 kB
```
Down from 742.14 kB / 119.57 kB at the first report, because the invented evidence, interview, ATT&CK and plan content is gone. The note stands: loading the two inactive profiles on demand (dynamic import, which makes the data layer asynchronous) would take two of the three profile modules (about 182 kB each as source: `wc -c src/data/profiles/*.ts`) out of the first load; not done, the prototype is static and the first load is the only cost.

---

## 7. The engine repository

Read only. `git -C /home/user/jccp status --porcelain` printed nothing at the end of the round; nothing was committed, staged, branched or modified there. Only the goldens and the engine's own generated strings crossed (the Round 3 exception); no documentation, comment or design paper did. `JCCP_NCSC_Engagement_INTERNAL.md` was not read.
