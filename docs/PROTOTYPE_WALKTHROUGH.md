# JCCP prototype — walkthrough and reference

For the author, presenting live to the National Cyber Security Centre. Written from the four round reports (`docs/ROUND_1_REPORT.md` to `ROUND_4_REPORT.md`) and from running the app and reading what it actually shows (branch `round-4/final`, the ministry assessment, the evidence bundle uploaded). Figures quoted here were checked on screen or in a report. Where the screen's own words are good, they are quoted, so what you say and what the screen says match.

**Read this first, and nothing else if you are short of time:** Part 3 is the one-page card. Part 2 is the script. Part 1 is for when someone points at something.

**Four older documents are out of date** and must not be used to prepare: `README.md`, `DEMO_GUIDE.md`, `PROTOTYPE_AS_BUILT.md`, `docs/PROTOTYPE_INVENTORY.md`. They describe the prototype before Round 1 (48 invented sample controls, a "Top 3 risks" card, a story about multi-factor authentication). The README even says "Every gap maps to concrete MITRE ATT&CK techniques", which is no longer true. See "Things I found" at the end.

---

## 0. What this is, in the words you will use

JCCP measures an organisation's compliance with the Jordan National Cybersecurity Framework (576 controls) **from collected evidence, not self-declaration**, and says honestly what it could not establish.

The prototype shows that in a browser. It does **not** run the scoring engine. The figures on the "measured" screens are the engine's own output files, copied in and pinned, each with a fingerprint (SHA-256) shown on every page. The browser does arithmetic on them and nothing else. There is no backend, no database, no AI. Uploads and "collector runs" are simulated.

### The one distinction you must never get wrong

Every region on every screen carries a small chip in its top-right corner. The legend is in the top bar: **measured, illustrative, planned.**

| Tier | What it really means | What you may say |
|---|---|---|
| **measured** | The number is read from the engine's output file for this assessment. The file name and its SHA-256 are shown at the top of the page. | "That is the engine's figure, not mine." |
| **illustrative** | The prototype's own fixture, or a projection. The screen's wording: "Fixture data; the shape is real, the number is a worked example". | "That is a worked example of what the screen will show, not a measurement." |
| **planned** | Not built. The screen's wording: "Not built; the screen shows intended design only". | "That is the design. It is not built." |

**A trap in the chips.** *Before* the evidence upload, the state-derived figures (interval, coverage, assurance) are tagged **illustrative** with the note "Before the upload: a projection (rule R), not an engine run". They are not invented: they are the engine's verdicts that rest only on testimony and documents (15 of them), arranged as the "before" picture. *After* the upload the same elements turn **measured**. If asked: "Before the bundle, the screen shows what the assessment would say on testimony and documents alone. It is a projection of the engine's data, so it is marked illustrative. After the bundle, it is the engine's result."

### The frame that is on every screen

| Element | What it is | Tier |
|---|---|---|
| Amber banner | "Demonstration prototype · fictional organisation · nothing leaves this machine — your progress is kept in this browser only." | plain text, true |
| **Assessment source strip** | "Assessment source government_ministry.json · SHA-256 b4d05dfdee1e05a378ea85f7dd9829f73f7820d6a1bdd9755184711b69da6625" with a "how to check" link. It says the figures after the upload are the engine's output and the state before it is a projection (rule R), not an engine run. | measured (the file's real hash) |
| Top bar | Page title; organisation, sector and regulator; **Viewing as** (role switcher); **Guided tour**; the tier legend; "On-premise · read-only"; **Reset demo**. | — |
| Sidebar | The screens for the chosen role. Footer: four phases (Profile, Planning, Intake, Assessed) and a badge: "Testimony and documents · L1" before the upload, "Evidence bundle loaded · L1" after, with "71% tool-evidenced or analyst-signed · L2 needs 80%". | the badge is measured after upload |
| `?` button (bottom right) | A short help panel for the current screen. | — |
| Welcome dialog (first visit) | "This system lets a Jordanian organisation measure its own compliance with the National Cybersecurity Framework — using collected evidence rather than self-declaration." Offers "Start guided tour →" or "Explore on my own". | — |
| Roles | Owner and Analyst see everything. Executive sees the Dashboard and Chat. Contributor sees only My Tasks. Regulator sees OSCAL Export and National Rollup. It is a demo switcher: **there is no authentication.** | planned |

**Three assessments.** The first screen lets you choose among three real engine runs: a government ministry (557 of 576 controls apply, 19 excluded), a bank (576 apply, 0 excluded) and a utility with operational technology (544 apply, 32 excluded). This document quotes the **ministry**, which is the default.

**Rule you can state aloud, because it is built in:** a control is never marked Gap just because nothing was found. A Gap needs a negative-capable signal from a module that ran successfully, an artifact that shows the control unmet, or the organisation's own statement of non-enforcement. A failed or permission-denied query is **Unknown**, never a failure.

---

# Part 1 — The reference: every screen, every element

Screens are in sidebar order. Unless stated, the figures are for the ministry, **after** the upload.

---

## 1. Organisation Profile — `/#/profile`

**What it is.** The scoping screen: which assessment, which organisation, which of the 576 controls apply.

**Why it exists.** It answers "how do you decide what applies, and who checks it?" Under-scoping is the easiest way to inflate a score, so scoping is visible.

| Element | Shows | Source | Tier |
|---|---|---|---|
| **Assessment** card | Three buttons: Government ministry (557 of 576 applicable · 19 excluded), Bank (576 · 0), Utility with operational technology (544 · 32), each with its source file name. Choosing one re-renders the whole app from that assessment. | The engine's three output files | measured |
| **Organisation profile** card: Sector | Ten sectors, with the Arabic label and the regulator ("Regulator: not designated" for Government Services). | The NCSC sector designation list, as carried in the prototype | illustrative |
| **Entity** | A list of real organisations per sector (for Water: Water Authority of Jordan, Miyahuna, Yarmouk Water Company, Aqaba Water Company), plus "Other — enter a name". Screen copy: "The list is illustrative and not confirmed with NCSC; the assessable entity is the demonstration organisation." Choosing a real one shows "No assessment has been run for this organisation" on every screen that would show an assessment. | Curated by the prototype | illustrative |
| Size band, hosting model, named attestation, endpoints (400), servers (38), users (620) | Demonstration inputs. | Typed in the prototype | illustrative |
| **Applicability variables** (five) | In-house development, outsourced development, mobile devices, wireless network, remote access, each Yes / No / Don't know, with "declaring 'no' removes 19 / 9 / 4 / 4 / 2 controls". For the ministry, in-house development is **No** (19 controls removed). The other four read "in scope — not recorded as declined": the engine's output records only what was declared "no", so the screen does not pretend a "Yes" was declared. | The five variables are the framework's own; the ministry's "No" is read from the engine's exclusions | illustrative (the form), values from the engine |
| **Cloud services** | A Yes/No/Don't know toggle that does **not** change the applicable count ("cloud is governed by the MoDEE cloud policy, not JNCSF"). Set to No, a yellow banner asks for a written justification; after the upload, a red banner blocks the contradiction. | Demonstration of a cross-check | illustrative |
| **Critical infrastructure (CICSC)** | "Derived from the sector, not declared: Government Services is a designated sector (basis: sector_designation)", status "applies", and a note that CICSC (405 controls, three implementation levels, Level 1 = 135 mandatory) is a separate framework **not assessed** by this tool. | The engine's scope boundary | measured |
| PDPL data holdings | Four checkboxes (health, biometric, financial, religious or political). | Demonstration inputs | illustrative |
| **Live scoping** card | "557 applicable controls of 576 total · 19 excluded", a progress bar, "Sector N/A baseline 5%", "Your N/A rate 3.3%", link "view exclusion register". | The count agrees with the engine for all three assessments; the **5% baseline is invented** | illustrative |
| Continue to request plan | Moves on. | — | — |

**What to say.** "The framework is 93% universal. Only five yes/no questions can remove controls at all. Here the ministry says it writes no software of its own, so 19 development controls drop out, and every exclusion is listed with its reason on the Exclusions screen."

**What it does NOT do.** It does not validate your answers against evidence in real time (the cloud contradiction is a demonstration). It does not assess CICSC. The "5% sector baseline" is not a real benchmark: the engine itself says no baseline was supplied (see Exclusions). Do not quote it.

---

## 2. Evidence Request Plan — `/#/request-plan`

**What it is.** The list of evidence the platform needs, generated before any collection.

**Why it exists.** It answers "how would I know what I'm missing?" The plan comes from the engine's own record of what the authored evidence rules require.

| Element | Shows | Source | Tier |
|---|---|---|---|
| Headline | "To assess the 65 controls that have an authored evidence requirement, we need 113 signals: 44 documents and 69 states read from systems." | Engine's coverage record | measured after upload; illustrative before |
| Sub-paragraph | "Provide all 113 → coverage can reach at most 11.8%. The other 491 controls have no evidence requirement authored, so the plan cannot ask for anything that would establish that any of them is met. They stay Unknown unless an artifact collected for another control happens to show one unmet." | Arithmetic on the engine's counts: (557 − 491) ÷ 557 | same |
| **Read from systems** card | 69 signals, each with how many controls name it and which ones (for example `iam.directory.account_inventory` — 7 controls). After the upload, a status per signal: provided, or the engine's reason (not provided, declined by the client, insufficient permission, module failed, stale). First ten rows; "Show all 69". | Engine's coverage record | same |
| Windows/AD collector and Linux collector buttons | Each only shows a line "collector package prepared (simulated)". | Nothing | planned |
| **Documents** card | 44 signals supplied by the organisation, same layout. | Engine's coverage record | same |
| Continue to intake | Moves on. | — | — |

**What to say.** "The system tells the organisation what it needs before it asks for anything. 113 signals, 44 are documents and 69 are things read from systems. And look at the line under it: even if every one is provided, coverage can reach only 11.8%, because 491 controls have no evidence rule written yet. That is the tool's limit, and it says so up front."

**What it does NOT do.** It does not generate commands, owners or effort estimates (the earlier invented ones were removed). The collector buttons do nothing real; the real thing is the transcript on the Intake screen.

---

## 3. Intake — `/#/intake`

**What it is.** Where evidence arrives: testimony from people, and an evidence bundle from machines.

**Why it exists.** It answers "how do you treat what people say versus what machines prove?" and "what happens when a collection fails?"

### Tab: Interviews

| Element | Shows | Source | Tier |
|---|---|---|---|
| Respondent cards | The roles the engine recorded answers from. After the upload four: service desk lead, network engineer, compliance officer, systems administrator, each "1 answer weighed". **Before** the upload only the compliance officer (the only answer behind a verdict that exists then). | Engine's claims | measured after / illustrative before |
| Generate scoped link | A fictional respondent link (`jccp.ministry.local`, "expires in 7 days"). | Nothing | planned |
| Opening a card | The answer the engine weighed: the control, its state, the stance ("testimony supports"), the signal, the engine's own sentence on what it did, and a locator such as `fixture://transcripts/interview-08/answer-03`. A note: "The transcript is not in the assessment file." | Engine's contradicted-testimony record | same |
| **What the engine did with the answers** | Four grounds, one answer each: `artifact_backed_path` (JNCSF-95, Compliant), `absence_by_successful_module` (JNCSF-99, Gap), `admission` (JNCSF-109, Gap), `established_non_enforcement` (JNCSF-124, Gap). | Engine's claims | same |
| **Two answers disagree** banner | JNCSF-109: "testimony admitting non-enforcement prevails over testimony supporting it". The supporting answer is kept, "not outvoted". | Engine's own string | **no tier chip** (see "Things I found") |

### Tab: Evidence bundle

| Element | Shows | Source | Tier |
|---|---|---|---|
| **Evidence intake** card | "0 of 113 signals provided", then the pending slots (each "named by N controls") with an Upload button. The button "Simulate collector bundle upload (provides 71)" fills the 71 signals the engine records as provided. After it, the slots left show the engine's reason (for example "declined by the client"). | Engine's coverage record | measured after / illustrative before; the button is planned |
| **Collector transcript** card | For each of six signals: the exact PowerShell query, whether it is negative-capable, the raw record shape, what the reduced statement keeps, and `query → signal → controls`, each mapping labelled **"proposed mapping — not yet authored"**. A "Show the script" expander shows the real file. Beneath: "A query that fails (permission denied, module missing, unreachable) is recorded as failed with record_count null. record_count 0 is written only by a query that ran to the end and returned nothing." | The script `collectors/windows_ad/Collect-JccpEvidence.ps1` and the evidence plan | planned |
| **Collection ledger** (after the upload) | Signal families with provided/not provided and the reason: `endpoint` declined (0 of 4), `monitoring` **failed** (0 of 2), `physical` insufficient permission (0 of 5), `document` 26 of 44. Then: "Only a module that ran successfully may produce a negative finding. Collection failed for monitoring, so the controls that depend on it remain Unknown, not Gap." | Engine's coverage record | measured |
| Result banner | "36 of the 50 Unknown controls in the authored scope resolved (50 → 14)"; "Interval 0.3–97.6% → 4.9–95.5% · coverage 2.7% → 9.3%. Assurance stays at L1: 37 of 52 verdicts (71%) are tool-evidenced or analyst-signed, and L2 needs 80%." Plus the one control outside the authored scope that moved (JNCSF-139). | Engine and rule R | measured |
| Reveal on dashboard | Moves on. | — | — |

**What to say.** "Two kinds of evidence. What people say is testimony, and testimony alone can never make a control Compliant. What machines show is an artifact. Here is a case where they disagree: a compliance officer said a control was in place, but another answer admitted it wasn't, and the engine records that the admission wins. The officer's answer is kept on the record, not deleted."

"And look at the ledger: the monitoring collection failed. A failed collection proves nothing, so those controls are Unknown, never Gap. A permissions error must never manufacture a confident failure."

**What it does NOT do.** **The collector has not been run.** There was no Windows host. The script is written to be read and reviewed, and no bundle in the prototype came from it. Nothing is parsed or uploaded; the "upload" fills slots from the engine's record. The six query-to-signal mappings are the author's proposal, not authored by the owner. The transcript shows what the hash *is* ("SHA-256 of the canonical JSON of the raw records, computed at run time") because nothing ran to produce one.

**One honest sentence on local administrators:** that signal is marked "cannot prove a negative". One host's absence says nothing about an estate, so it can only ever lead to Unknown.

---

## 4. Compliance Dashboard — `/#/dashboard`

**What it is.** The result: the interval, what is behind it, and how trustworthy the evidence was.

**Why it exists.** It answers the core question: "what is our compliance, and how sure are you?" It refuses to give one number.

Owner/analyst view. Before the upload every state-derived card carries the banner: "Pre-upload state — testimony and documents only. These figures are rule R's projection of the engine's data (the verdicts that rest on testimony or documents), not an engine run." All cards are **measured** after the upload unless marked.

| # | Element | Shows (ministry, after upload) | Source | Tier |
|---|---|---|---|---|
| 1 | **Compliance Interval** | **4.9% — 95.5%**, "width 90.7 points · coverage 9.3%" (exactly 4.87%–95.54%, width 90.66). Before the upload: 0.3%–97.6%, width 97.3, coverage 2.7%. After the upload a line explains the movement and that JNCSF-139 "has no authored evidence requirement, but an artifact in the bundle shows it unmet, so it moved from Unknown to a Gap (observed)." | Engine | measured |
| 2 | **Where the width comes from** | A bar in three parts, "asserted to sum exactly to the width, in exact fractions: 88.15 + 2.51 + 0.00 = 90.66 points". **88.15 points — unauthored: the tool's limitation** (491 controls); **2.51 points — unevidenced: the organisation's** (14 controls); **0.00 points — uncollectable: structural** (0 controls). | Engine | measured |
| 3 | The organisation's share, by reason | A table of the 14: Not provided 5 (0.90), Declined by client 3 (0.54), Insufficient permission 3 (0.54), Module failed 2 (0.36), Stale 1 (0.18); total 14, 2.51. | Engine | measured |
| 4 | Partial-credit note | "The 25 Partial controls here earn 6.15 in total, credited one by one by the engine rather than at a flat weight." | Engine | measured |
| 5 | **Coverage** | A donut: "52 of 557 applicable controls". Artifact-evidenced 27, Partial 25, Not evidenced — the organisation's 14, Not yet authored — the tool's 491, Structurally uncollectable 0. Below: "Unusable evidence, as the engine counted it: 1/557 claims unknown because evidence was unusable (1 stale, 0 future-dated)." | Engine | measured |
| 6 | **Assurance level** | The ladder L0 Declared, **L1 Documented** (highlighted), L2 Tool-evidenced, L3 Analyst-signed. L1's definition: "At least 80% of verdicts rest on documents, tool evidence or an analyst's signature, but fewer than 80% rest on tool evidence or an analyst's signature." Then: "The collection succeeded; the level did not rise… Measured 37 of 52 (71%) · threshold 80% · reported L1." | Engine | measured |
| 7 | **Demotion checks** | "No demotion applied: reported L1, base L1. 2 passed · 0 triggered · 2 not assessed." Declined module — Passed (7.1% against a 20% threshold; 4 of 56 signals). Unusable evidence — Passed (0.2% against 20%). **Unresolved profile challenge — Not assessed**. **N/A rate above baseline — Not assessed** ("no sector baseline supplied -- absence of a baseline is not evidence of normality"). Footer: "A check that could not run is shown as not assessed: neither passed nor failed, and not counted as a pass." | Engine, in its own words | measured |
| 8 | **By capability** | Five rows, each with its own interval and coverage. Architecture & Portfolio 10.8%–90.8% (2G·3Y·0R, 20 unknown, 5 of 25 authored); Development 1.0%–99.0% (3 of 50 authored); **Delivery 42.8%–54.2%, width 11.4 points, 88.6% coverage — "44 of 44 authored"**; Operations 1.7%–99.4% (9 of 299 authored); Foundational 0.0%–100.0% (4 of 139 authored). Plus "Security in National Cyber Responsibility — Not organisationally assessable — national obligation". Rows link to the Gap Matrix. | Engine | measured |
| 9 | **Four views** | A table. Unweighted 4.87%–95.54% (557 controls); Weighted, including underived 5.14%–95.57% (557); Weighted, derived only 5.38%–94.60% (390 controls); **Authored scope partial view 41.77%–63.31%, width 21.54 (65 controls)**, always printed with its label "Covers only applicable controls with at least one authored evidence path." Beneath, the weights table: NIST Low 246 at 1.0, Moderate 67 at 0.7, High 12 at 0.5, no baseline 65 at 0.5, Underived 167 at 1.0 (30% of applicable); totals 331.4 derived-only and 498.4 including underived. | Engine | measured |
| 10 | **Completeness statement** ("cannot be dismissed") | "This assessment covers 52 of 557 applicable controls. 505 are not established: 491 because no evidence requirement has been authored (a limitation of the tool), 14 because evidence was not provided, and 0 because they are outside the tool's collection reach. Assurance level: L1 — Documented." Then the CICSC paragraph: "This assessment does not evaluate CICSC compliance, and a favourable JNCSF result does not represent complete assurance against the organisation's full regulatory obligation." | Engine | measured |
| 11 | **Scope exclusions** | "19 controls (3.3%) are marked Not Applicable. The engine was not given a sector baseline to compare that rate with (its check: not assessed). 0 exclusions carry no recorded justification." Link to the register. | Engine | measured |
| 12 | **Why controls are Unknown** | A chart of the 505 by reason, and "not_requested = 0 is a design invariant." | Engine | measured |
| 13 | Framework-wide authoring note | "of 115 signals, 1 is false through uncertainty rather than rule or judgement… 7 of 66 authored controls have no conclusive path at all." Labelled "Framework-wide figures from the engine's reports, not from this assessment file." | Engine's reports, not this assessment | **illustrative** |
| 14 | Link | "See the 37 of the 557 controls that the upload changed in the Gap Matrix". | — | — |
| 15 | Pre-upload only | A link "See what evidence would narrow this" with "by the evidence the plan asks for, at best to 88.3 points". | Arithmetic | illustrative |

**Executive view** (`Viewing as: Executive`): the interval with its width bar; a **"This assessment"** card listing the engine's disclosed parameters (framework JNCSF 2024.06, as of 2026-09-30, assurance threshold 0.8, declined threshold 0.2, unusable threshold 0.2, inheritIsoBaselines false, weightUnderived 1…); the **Prioritisation** card; the completeness statement. "Evidence excerpts, personal data and per-control detail are not shown."

**The Prioritisation card.** "15 actions share the highest rank, all of equal magnitude. The engine does not break a tie it cannot justify. 3 are fixes for a Gap (JNCSF-109, JNCSF-124, JNCSF-139); 12 are requests for evidence." Before the upload: "A ranking is derived from an assessment, so before one exists there is nothing to rank."

**What to say.**
- "Never one number. The lower figure assumes every unestablished control fails; the upper assumes they all pass. The width is exactly what we did not establish."
- "And the width is not all the organisation's problem. 88 of the 90.7 points are controls where we have not yet written an evidence rule. That is our limitation, and the screen labels it as ours. Only 2.5 points are the organisation's."
- "The level did not rise when evidence arrived. Assurance is not how much you collected. It is how many verdicts rest on machine evidence: 71%, against an 80% threshold. So the platform reports L1 and shows the measurement."

**What it does NOT do.**
- It does not say "you are 4.9% compliant". The interval's lower end is not a score.
- **Do not say the interval "collapsed".** It narrowed from 97.3 to 90.7 points of width. The honest point is that most of the width is not evidence-collectable at all yet.
- The Dashboard line "Interval narrowed after the Windows/AD collector bundle resolved 36 of the 50…" implies the real collector ran. It did not (see Things I found).
- The framework-wide note (13) is not this assessment's.

---

## 5. Gap Matrix — `/#/gap-matrix`

**What it is.** Every applicable control (557 for the ministry), grouped by capability, each with the engine's verdict.

**Why it exists.** It answers "show me the controls, not the summary", and every row says why it is in its state.

| Element | Shows | Source | Tier |
|---|---|---|---|
| Filter bar | Search (id, text, path, run); filters for state, evidence class, gap reason, **gap basis** (absence / observed / testimonial_admission), partial basis (share / indicative_path / monitor_only / testimonial / pilot); "Show only what changed after evidence upload". | Engine's vocabulary | — |
| Count line | "557 of 557 applicable controls shown. Every state, reason, basis, path and run on this screen is the engine's, read from the assessment file named above." Before the upload it says which controls have a verdict is rule R's projection. | Engine | measured after / illustrative before |
| **Catalogue note** | "The control catalogue lives in the assessment engine, and this prototype does not need it to show you a verdict or the reasoning behind one… text is shown only where the prototype already held it (48 of 557)." | — | plain |
| Capability groups | Five collapsible groups; Delivery is open by default: "44 applicable · 44 authored · 44 of 44 shown", "worst established: Gap 5", "unestablished 5". Architecture: 25 applicable, 5 authored. Development: 50 applicable, 3 authored. | Engine | measured |
| **Rows** | Verdict badge, id, capability, evidence class, and where relevant the Unknown reason, "gap basis: …", "run: …", "partial basis: …", the satisfied path, and a "promoted" pill if the upload changed it. Control text only for the 48 controls the prototype held. | Engine | measured |

**What to say.** "Every one of the 557 is here, not a sample. Each row says what the engine concluded and why. The six Gaps rest on three different grounds, and the row says which."

**What it does NOT do.** It does not show control wording for most controls (509 of 557): that text lives in the engine and, so far, cannot be copied in. Say "The prototype does not need the wording to show you the verdict."

### Control Detail — `/#/control/JNCSF-100` (reached by clicking a row; no sidebar entry)

| Element | Shows | Source | Tier |
|---|---|---|---|
| Header | Id, capability, "changed by the upload", catalogue text where held, "Assessment as of 2026-09-30", state badge, evidence class. | Engine | measured |
| **What the engine concluded** | State ("Gap · Unknown before the upload (projection)"); evidence; **gap basis** ("absence — Absence — a negative-capable signal from a successful module run"); **module run** ("directory-enumeration — the successful run whose complete enumeration found nothing"); risk weight 0.7; "Evidence requirement: authored". Other controls add enforcement mode, share, the engine's reasoning, contradicted testimony. | Engine | measured |
| Standards mapping | ISO 27002 6.1.2 Segregation of duties; NIST AC-5 Separation of Duties. "Catalogue content the prototype carries for this control; it is not part of the assessment file." | The prototype's catalogue | illustrative |
| **Evidence sufficiency** | The four-step ladder (No evidence → Unknown; Testimonial → Partial; Artifact → Compliant; Analyst-signed → Compliant), with "Testimony alone can never mark a control Compliant — only machine-collected artifacts or an analyst signature." | Engine's rule | measured |
| ATT&CK exposure (engine) | For JNCSF-100: `lower_confidence_only`, "0 techniques shown; 0 broad, 167 diffuse, 167 suppressed by the engine (withheld, not counted as exposure)." | Engine's ranking | measured |
| Analyst actions | Accept as Compliant / Override to Gap / Set to Unknown. An override records who, when and why, and moves the dashboard interval. | Demonstration | illustrative |
| Related controls | Links to four others in the capability. | — | — |

**What to say (JNCSF-100).** "A Gap, and the page says on what ground. This one is absence: a module that ran successfully looked at the directory, enumerated it completely, and found nothing showing the control is met. Not a guess, and not a failure to look."

**JNCSF-139** (use it if asked about "observed"): no evidence rule is written for it, but an artifact in the bundle shows it unmet, so it is Unknown before the upload and a Gap after. **JNCSF-109**: a Gap on the organisation's own statement of non-enforcement.

---

## 6. Scope Exclusions — `/#/exclusions`

**What it is.** The register of every control removed from scope, and why.

**Why it exists.** It answers "can an organisation shrink the denominator quietly?" No: every exclusion is public, with its trigger and justification.

| Element | Shows | Source | Tier |
|---|---|---|---|
| Header stats | "19 of 576 JNCSF controls excluded"; **3.3%** Not-Applicable rate; "Not compared with a baseline — The engine's check: not assessed — no sector baseline supplied -- absence of a baseline is not evidence of normality"; "0 without a recorded justification". | Engine | measured |
| Excluded by capability | Development 19; every other capability 0; National obligation "—". | Engine | measured |
| Excluded by triggering flag | `in_house_development = no`: 19. (Utility: also outsourced development 9 and wireless network 4.) | Engine | measured |
| **Register table** | 19 rows: control, capability, "in_house_development = no", reason `not_applicable`, the engine's justification: "`in_house_development` is declared no." Filters by capability and flag. | Engine | measured |

**What to say.** "Nothing is dropped quietly. 19 controls, all removed by one declared answer, each listed with its justification. And notice what the engine says about the rate: it was given no sector baseline, so that check is 'not assessed'. Absence of a baseline is not evidence of normality."

**What it does NOT do.** It does not judge whether an exclusion is reasonable; it makes it visible.

---

## 7. My Tasks — `/#/tasks` (Contributor role only)

**What it is.** What a person asked to supply evidence would see. **Why:** it shows the platform separates "provide evidence" from "see the result".

| Element | Shows | Source | Tier |
|---|---|---|---|
| Header | "You have been asked to provide evidence for the Ministry of Digital Services assessment. You can see your own submissions and their status — not the assessment result." Counts: 0 accepted, 0 awaiting review, 10 to do. | The ten signals Remediation asks for | illustrative (the assignment) |
| Task cards | One per signal, the controls that ask for it, a Submit button that moves it to "submitted". No due dates, owners or notes: the assessment carries none. | Engine's evidence requests | illustrative |

**What to say.** "A contributor sees only their own tasks, never the assessment." **Not:** there is no real assignment or notification.

---

## 8. Remediation & Requests — `/#/remediation`

**What it is.** The engine's ranking of what to do next, and what each missing artifact would change.

**Why it exists.** It answers "what should we do first?" and shows the engine will not invent a preference it cannot justify.

**Empty before the upload, by design.** Screen: "The engine's ranking is computed on the assessed state, after the evidence bundle is in. Run the collector bundle on the Intake screen to see it." A ranking is derived from an assessment; before one exists there is nothing to rank. If you forget to upload first, this is what he will see.

| Element | Shows | Source | Tier |
|---|---|---|---|
| Tabs | All actions; Fixes; What you didn't provide. | — | — |
| Action filter | all / fix / evidence request / corroboration request; "47 actions in 11 ranks". | Engine | measured |
| **Rank groups** | "15 items share rank 1", "13 items share rank 2", "1 item at rank 3", "4 share rank 4", "1 at rank 5", "5 share rank 6", "3 share rank 7", "1 at rank 8", "1 at rank 9", "1 at rank 10", "2 share rank 11". Under a tie: "items of equal magnitude share a rank; their order within the rank is presentation only." | Engine | measured |
| **Action card** | Type; control; the engine's description ("Supply document.mobile_device_policy to close JNCSF-105."); the control text where held; "magnitude 0.20 points (125/623; unweighted 0.18 = 100/557)"; "effort 1"; "asks for …"; **ATT&CK exposure** (`lower_confidence_only` / `no_mapping` / `shown`, with broad, diffuse and **suppressed** counts). | Engine | measured |
| **Not ranked** | "unauthored_excluded 491 — no evidence requirement is authored for these controls, so the ranking has nothing it could ask for or fix"; uncollectable_excluded 0 and conflicting_evidence_excluded 0, each "none —". | Engine | measured |
| **What you didn't provide** tab | A **Projected interval** (starts at 4.9%–95.5%), the line "By the artifacts this plan asks for, the band cannot fall below 88.2 pts of width — the 491 controls with no authored evidence requirement are not what it asks about…", and ten artifacts (signals). Each shows "N controls become known", "narrows band X pts", and the interval if all pass or all fail; **Simulate providing this** moves the projection. | Engine's requests; the projection is arithmetic on the engine's counts | measured (the figures), the simulation is a demonstration |

**What to say.** "Fifteen actions share the top rank, all of equal magnitude. The engine does not break a tie it cannot justify. Most tools would hand you a ranked list with a number one. This one says: these fifteen are equal, and the order you see within them is only presentation. That is the same honesty as the width: it will not invent precision."

**What it does NOT do.** ATT&CK exposure is an annotation only: it never ranks anything. Many cards show 'suppressed' counts: the engine withheld lower-confidence techniques. Do not describe it as a threat assessment. The "simulate" button does not collect anything.

---

## 9. OSCAL Export — `/#/export`

**What it is.** Two things: the **Word report** (built) and the **OSCAL submission package** (a design preview).

**Why it exists.** It answers "what do you hand to a regulator, and what is in it?"

| Element | Shows | Source | Tier |
|---|---|---|---|
| **Word report** card, button "Generate Word report (.docx)" | Builds a real `.docx` in the browser (nothing sent anywhere). Contents: cover with the organisation, assessment date, source file and SHA-256; the interval and its width by cause and whose limitation each is; the four views (authored scope carries its label); exclusions with the engine's justifications; the completeness statement; the ranked actions with the tie group; assurance and every demotion check, "not assessed" included; a provenance appendix with the file, hash and parameters. The cover says: "Every sentence in this document is a template filled from the assessment result. No prose in it was written by a model, and no figure in it was typed." Disabled until the upload ("A report is made from an assessment: run the evidence bundle on the Intake screen first."). | Engine | measured after upload (illustrative before) |
| **OSCAL submission package** | "Five OSCAL models. Coverage metadata and the assurance level travel inside the package, so the regulator sees the interval — not a bare number." "OSCAL 1.1.2 · 5 models · 557 control implementations. Validation runs in the assessment engine, not in this preview." Button "Download package (.zip)" opens a review dialog and prints "Package prepared (simulated)". | Prototype | **planned** |
| Five model cards (Catalog 576, Profile 557, System Security Plan, Assessment Results, POA&M) | "Preview JSON" shows a document built from the active assessment (interval, counts, per-control findings, entity name and sector). | Built from the engine data; unsigned | illustrative / planned |
| **Signed package** card | Ed25519, a "signing identity", a timestamp, a hash, a Verify button. | **Invented** | planned |
| JNCSF Catalog card | A paragraph claiming the Catalog model "is the first machine-readable representation of the JNCSF" and could be published by NCSC as the authoritative reference. | Prototype's own claim | illustrative |
| National rollup link | Opens the Rollup. | — | — |

**What to say (Word report).** "This one is real. I generate it live from the assessment. Every sentence is a template filled from the result, and the document says so. Nothing in it was written by a model."

**What to say (OSCAL).** "The package is the design. Coverage metadata and assurance level travel inside it, so a regulator sees the interval, not a number. It is not built: nothing here is signed and nothing validates."

**What it does NOT do.** No OSCAL file is signed or validated. The **Signed package** card's identity, hash and date are made up and the card is marked `planned`: do not click Verify in the room. Do not read out the Catalog card (it makes a claim about NCSC's own catalogue that you have not checked).

---

## 10. National Rollup — `/#/rollup` (Owner, Analyst, Regulator)

**What it is.** A regulator's anonymised view across 47 entities in a sector.

**Why it exists.** It shows the platform's second purpose: a national picture, with small cells suppressed so no organisation can be re-identified.

| Element | Shows | Source | Tier |
|---|---|---|---|
| Header | "National rollup — Defence, Security & Government Services sector", "12 / 47 entities submitted", "8 overdue", "27 not yet due". | **Invented** | illustrative |
| Compliance distribution | Bars by interval lower-bound band (≥ 80%: 3; 70–80%: 4; 55–70%: 3; < 55%: 2) split by assurance level, one cell suppressed ("fewer than 5 entities"). | **Invented** | illustrative |
| Most frequently failed controls | JNCSF-435 9/12, JNCSF-307 8/12, JNCSF-141 7/12, JNCSF-30 7/12, JNCSF-407 6/12. | **Invented** | illustrative |
| Submission import log | Four entities with "verified" / "rejected — signature does not match published key" and assurance L2 / L1. | **Invented** | illustrative |

**What to say.** "This is a mock-up of the regulator's view, with invented numbers. The thing to look at is the design: bands, not point estimates; split by assurance level, because an L1 entity 'at 75%' and an L2 entity 'at 75%' are not the same claim; and small cells suppressed."

**What it does NOT do.** **Nothing on this screen is real.** There are no other entities. The failed-controls list is not from any data: in the ministry's own assessment those controls are Unknown. This is the weakest screen to be questioned on.

---

## 11. Integrations — `/#/integrations` (Owner, Analyst)

**What it is.** What the platform will expose, and what will cross the boundary, side by side.

**Why it exists.** It answers "what leaves the building?" Sovereignty is one of the five claims: no assessment data leaves the organisation, only a signed statement does.

Everything on this screen is **planned**. Its subtitle says: "Nothing here is built; both payloads are filled from government_ministry.json."

| Element | Shows | Source | Tier |
|---|---|---|---|
| **Inside the organisation** | The appliance's local REST surface: `POST /evidence/bundle`, `GET /assessment/current`, `GET /controls/{id}`, `POST /override`, with token auth and scopes per role (for example `control:read` — owner, analyst). "Raw evidence lives here and only here." | The author's design | planned |
| `GET /controls/JNCSF-99` payload | The full claim, six raw fields highlighted red and tagged RAW (the run id, the engine's string, the locator, the signal key, the respondent role…). "`GET /assessment/current` returns every one of the 557 claims like this: 154,944 bytes." | Built from the engine's data | planned |
| **Boundary** | `raw evidence ──✗── boundary` and `signed statement ──✓──`. | — | planned |
| **Crossing to NCSC** | One endpoint, `POST /assessment-results`, at "the address NCSC supplies". "Signed outside the engine; outbound only, initiated by the organisation." | The author's design | planned |
| Crossing payload | Verdicts, counts and hashes: assurance level, framework, applicable controls, verdicts by state (21 / 25 / 6 / 505), the interval, width points by cause, the 52 verdicts, a commitment to the source hash, and "Ed25519 — planned: not signed in this prototype". **4,536 bytes: 3% of the local assessment, and none of the raw fields.** | Built from the engine's data | planned |

**What to say.** "Raw evidence stays inside the organisation. What crosses is a signed statement: verdicts, counts, hashes. Compare the two sizes: the whole assessment locally is 155 kilobytes; the statement is 4.5. And not one raw field crosses. The organisation submits; the platform never connects into its network."

**What it does NOT do.** No server exists, there is no signing, and no submission. The role scopes are the author's proposal.

---

## 12. Authoring Coverage — `/#/authoring`

**What it is.** How much of the framework has a written evidence rule, and what it takes to write the rest.

**Why it exists.** It answers the hardest question: "you only cover 66 of 576 controls. Is the tool finished?" It shows that writing the rules is finite work, one capability at a time.

All figures on this screen are **illustrative**: they are the engine's report figures, pinned in the prototype, but not read from the assessment file.

| Element | Shows | Source | Tier |
|---|---|---|---|
| **Proof the work finishes** | "**44 of 44** Security in Delivery — complete". "Every control in this capability has an evidence requirement… where it is finished the tool's own gap closes: in this assessment Security in Delivery has 5 Unknown controls, and 0 of them are Unknown for want of a requirement." | Engine's report, and the assessment | illustrative |
| Authored | "66 of 576: 59 with a conclusive path, which can reach Compliant · 7 indicative only, capped at Partial". | Engine's report | illustrative |
| Unauthored | "510 across the framework. In this assessment 492 of them apply (19 controls are excluded as not applicable); 491 are Unknown and 1 carries a verdict." | Report and assessment | illustrative |
| Signals | 115: 70 machine-collected, 45 documentary. Negative-capable: 38 of 115. | Report | illustrative |
| Evidence paths | 125 across the 66 authored controls. | Report | illustrative |
| Authoring queue | 205 unauthored controls ready to be written first. | Report | illustrative |
| Reach through published mappings | Via NIST SP 800-53: 403; via ISO/IEC 27002: 341; via either: 568 of 576 (98.6%); via neither: 8. "Documentary floor: roughly 325–359 new documentary signals would give every unauthored control at least an indicative path." | Report | illustrative |
| By capability | Architecture 5 of 25 (20.0%), Development 4 of 69 (5.8%), **Delivery 44 of 44 — complete**, Operations 9 of 299 (3.0%), Foundational 4 of 139 (2.9%); framework 66 / 510. | Report | illustrative |

**What to say.** "I will not pretend this is finished. 66 of 576 controls have a written evidence rule today. But look at Security in Delivery: 44 of 44. Every control in that capability has a rule, and in this assessment none of its five Unknowns is Unknown for want of a rule. That is the proof the remaining work is finite. It is writing, capability by capability."

**What it does NOT do.** It is not read from the assessment file. Do not say these figures are "measured". The "3.0% authored" for Operations is the honest weak spot: say it first before someone else does.

---

## 13. Roles & Access — `/#/admin`

**What it is.** A matrix of seven features against six roles, each with the control it implements.

**Why it exists.** It shows the platform's own access model follows the framework: separation of duties, least privilege. The Appliance Admin can run the box but "cannot read one line of assessment content".

| Element | Shows | Source | Tier |
|---|---|---|---|
| RBAC matrix | Features such as "Read assessment content" (JNCSF-102 Least privilege), "Override a control verdict (analyst-signed, audit-logged)" (JNCSF-30), "Approve the OSCAL submission package for the regulator" (JNCSF-435, "Sign-off requires the Owner and step-up MFA"), against Owner, Analyst, Executive, Contributor, Regulator, Appliance Admin; ticks or "scoped". | Design | illustrative |

**What to say.** "This is the design of who can do what. The role switcher in the top bar lets you see each view."

**What it does NOT do.** The prototype has no authentication. The controls named are statements about the product's own design, not findings about the assessed organisation (in the ministry's assessment JNCSF-102 is Compliant, JNCSF-100 is a Gap, JNCSF-435 is Unknown).

---

## 14. Compliance Chat — `/#/chat`

**What it is.** Eleven prepared questions with scripted, cited answers.

**Why it exists.** It shows the intended assistant: it retrieves, it does not compute, and it refuses what the assessment cannot support.

Its own footer: "On-premise · read-only — cannot change control states — cannot compute scores — cannot access the internet — cannot see other organisations' data."

| Question | Answer (summarised) | Source | Tier |
|---|---|---|---|
| What does JNCSF-100 require? | The catalogue text, with ISO 27002 and NIST references. | Prototype's catalogue | planned |
| Which controls are Gaps? | "6 controls are Gaps: JNCSF-99, -100, -101, -109, -124, -139", with the ground for each: 3 on absence, 2 observed, 1 testimonial admission. | Engine data | planned (Chat) |
| Why is JNCSF-100 a Gap? / Why is JNCSF-139 a Gap? | Absence (run `directory-enumeration`) / observed (an artifact; no authored evidence path). | Engine data | planned |
| Which Gap rests on an admission? | JNCSF-109 and the engine's string. "A respondent's admission can make it a Gap." | Engine data | planned |
| Which Gaps would an attacker exploit first? | "The engine does not say, and the prototype will not guess. Exposure to ATT&CK techniques is an annotation, never a rank." | Engine data | planned |
| Which action comes first? | The 15-way tie. | Engine data | planned |
| What's blocking L3 assurance? | The threshold rule and 37 of 52. | Engine data | planned |
| What is our compliance score? | "Your interval is 4.9–95.5% at 9.3% coverage — read from the assessment, not computed by me." | Engine data | planned |
| Are we compliant enough to pass an NCSC audit? | A refusal: "I can't predict a regulator's determination." | — | planned |
| Tell me about JNCSF-9999 | A refusal: no such control exists in the pinned catalogue. | — | planned |

The Gap questions appear only after the upload. Executives see only the first and the last four.

**What to say.** "There is no language model in this prototype. These are scripted answers over real data, to show how it will behave: it cites, it refuses to predict a regulator, and it will not guess which gap an attacker uses."

**What it does NOT do.** It is **not an AI**. Free text is disabled. Do not call it "grounded" without adding "scripted".

---

# Part 2 — The walkthrough

## Setup before the meeting (do this the night before and again 10 minutes before)

1. Open the app and press **Reset demo** (top right). This clears any saved upload and returns to the ministry assessment. The state is kept in the browser, so an old session will otherwise still be there.
2. Check the top of the page: "Assessment source **government_ministry.json**". That is the assessment this document's figures describe.
3. **Do not upload the bundle beforehand.** The strongest moment is doing it live. (If you do upload by accident, press Reset demo.)
4. Set the role to **Assessment Owner**. Have the browser at full width, and the zoom at 100% or larger.
5. Dismiss the welcome dialog with **Explore on my own** (it only appears on first visit in a browser).
6. Have a second tab open on `/#/dashboard` only if you need a fallback; it will show the pre-upload state until the upload happens in that browser.
7. Be online or served locally, either is fine; **the Word button needs to download one more file the first time you click it** (about 490 kB). Click it once beforehand so it is cached.

**What breaks if you forget:**
- Forgot to upload at the right moment: Remediation is **empty by design** ("A ranking is derived from an assessment…"), the Word button is disabled, Chat has no Gap questions. Go to Intake → Evidence bundle → Simulate collector bundle upload.
- Forgot Reset demo and the last user switched assessment: you may be on the bank (576 applicable, 0 excluded) or utility (544, 32). Choose "Government ministry" on the Profile screen.
- Left the role on Executive: you will see only the Dashboard and Chat. Switch back with **Viewing as**.
- Picked a real entity (for example Miyahuna) and every screen reads "No assessment has been run for this organisation". Choose the demonstration organisation under Entity.

## The opening (about 45 seconds, before clicking anything)

Say it standing, to the room, with the Profile screen on the projector:

> "Before I click anything, three ideas.
> One: this measures compliance from collected evidence, not from what people tell you. What someone says counts for something, but it can never make a control compliant. Only a machine's output or an analyst's signature can.
> Two: it does not give you one number. It gives you a range, and the width of the range is exactly what the assessment could not establish. And it tells you whose limitation each part of that width is.
> Three: every region on every screen is marked measured, illustrative or planned. Measured means it is the engine's own output, with a fingerprint at the top of the page. Illustrative is a worked example. Planned is design, not built. I will tell you which is which as we go. This is a prototype; the scoring engine sits behind it, and the prototype shows its results."

## The 10-minute route

| # | Route | Time | Do | Say |
|---|---|---|---|---|
| 1 | `/#/profile` | 1:30 | Point at the **Assessment** card (three assessments), then "Live scoping". | "Three real runs of the engine: a ministry, a bank, a utility. We use the ministry. 557 of the framework's 576 controls apply; the other 19 are out because the ministry writes no software. Every exclusion is listed, with its reason. Under-scoping is the easiest way to inflate a score, so we make it visible." |
| 2 | `/#/intake` → **Evidence bundle** tab | 2:00 | Click the tab. Scroll to the **Collector transcript**, click **Show the script** briefly. Then click **Simulate collector bundle upload**. Read the **Collection ledger** when it appears. | "This is the collector, a read-only script. Six queries, no credentials, raw records kept separate from the statement. It is written to be read. It is not yet run against a live domain, and this upload is simulated. Now look at the ledger: the monitoring collection failed. That proves nothing, so those controls are Unknown, never Gap. A permissions error must never manufacture a confident failure." |
| 3 | `/#/dashboard` | 3:30 | Point at the interval, then **Where the width comes from**, then the **Assurance level** and **Demotion checks**. | "4.9 to 95.5%. That is wide, and it should be. 88 of the 90.7 points are the tool's own limitation: controls where we have not yet written an evidence rule. Only 2.5 points are the organisation's. [Then, at Demotion checks:] Four checks could demote the assurance level. Two passed. Two say 'not assessed': the engine will not say 'passed' for something it could not measure. And the level is L1, not L2: 71% of verdicts rest on machine evidence, the threshold is 80%. The screen shows the measurement." |
| 4 | `/#/remediation` | 1:30 | Point at "15 items share rank 1". | "Fifteen actions share the top rank, all of equal magnitude. The engine does not break a tie it cannot justify. It will not invent a preference." |
| 5 | `/#/authoring` | 1:00 | Point at "44 of 44 — complete". | "I will say the weak point first: 66 of 576 controls have a written evidence rule. But Security in Delivery is complete: 44 of 44, and none of its Unknowns is unknown for want of a rule. The rest is finite writing." |
| 6 | Top of any page | 0:30 | Point at the **Assessment source** strip. | "And every figure you saw traces to this file and its SHA-256. Anyone with the file can check it." |

Total about 10 minutes. If you are running over, drop step 5.

**Closing line:** "Evidence, not declaration. A range, not a number. And it says what it could not establish."

## The 25-minute route

Use the 10-minute stops, with these additions (times add up to about 25 minutes). Order is as the sidebar.

| # | Route | Time | Do | Say |
|---|---|---|---|---|
| 1 | `/#/profile` | 2:00 | As above. Also change **Sector** to Water and open **Entity**; pick **Miyahuna**, then click Compliance Dashboard. Then return and choose the demonstration organisation. | "The sector alone does not identify an entity. Water has the Authority and separate distribution companies. The list is illustrative, not confirmed with NCSC. But pick a real organisation and the platform says: no assessment has been run for this organisation. I will not put a compliance figure next to a real organisation's name." |
| 2 | `/#/request-plan` | 1:30 | Read the headline. | "113 signals needed: 44 documents, 69 read from systems. And even if every one is provided, coverage can reach only 11.8%, because 491 controls have no rule yet. The tool says so up front." |
| 3 | `/#/intake` Interviews tab, then bundle | 3:30 | First, before the upload, open the **compliance officer** card. Then continue as step 2 of the short route. After the upload, open **systems administrator** and show the "What the engine did with the answers" table. | "Testimony is weighed, not counted. A compliance officer said the control was in place. Another answer admitted it was not, and the engine records that the admission wins. The officer's answer is kept, not deleted." |
| 4 | `/#/dashboard` | 4:30 | As above, plus **By capability** (point at Delivery 42.8–54.2%, 44 of 44) and **Four views**. | "Four views of the same assessment: each hides something, so none is shown alone. The 'authored scope' view looks good, 41.8 to 63.3%, so it is always printed with its label: it covers only what we have rules for." |
| 5 | `/#/gap-matrix` → `/#/control/JNCSF-100` | 3:00 | Open Delivery, click JNCSF-100. Point at **Gap basis** and **Module run**. Mention JNCSF-139 and JNCSF-109 from the filter "Any gap basis". | "Six Gaps, three grounds: absence, observation, an admission. Each row says which. This one is absence: a module that ran successfully enumerated the directory completely and found nothing showing the control met." |
| 6 | `/#/exclusions` | 1:00 | Scroll to the table. | "19 exclusions, one declared answer, each with its justification." |
| 7 | `/#/remediation` | 2:00 | Show the tie group, then **What you didn't provide** and click **Simulate providing this** once. | "The band cannot fall below 88.2 points of width by anything this plan asks for. The rest stays Unknown." |
| 8 | `/#/export` | 2:30 | Click **Generate Word report (.docx)**. Open the file. | "This is real. Cover, interval, width by cause, four views, exclusions, completeness statement, the tie group, assurance, and an appendix with the file and its hash. Every sentence is a template filled from the result, and the document says so. No model wrote it." |
| 9 | `/#/integrations` | 2:00 | Point at the boundary line and the two sizes. | "Raw evidence stays inside. What crosses is a signed statement: 4.5 kilobytes against 155. Not one raw field crosses. This is the design; none of it is built." |
| 10 | `/#/authoring` | 1:00 | As above. | As above. |
| 11 | Role switcher | 1:00 | Switch to **Executive**, show the Dashboard and the Prioritisation card; switch back. | "An executive sees the interval, the prioritisation and the completeness statement. No evidence, no personal data." |
| 12 | Close | 0:30 | Back to the Dashboard; point at the source strip. | "Every figure traces to the engine's output file and its fingerprint." |

If you have time left, offer to switch to the **bank** (576 apply, nothing excluded) on the Profile screen to show the same engine on a different organisation.

## The moments that land

Name them in your head; these are what the audience will remember.

1. **The width decomposition and whose limitation each part is.** *Dashboard.* "88.15 + 2.51 + 0.00 = 90.66, asserted to sum exactly." The platform tells you that most of the uncertainty is its own. This is the strongest single idea in the product.
2. **The tie where the engine refuses to invent a preference.** *Remediation / Dashboard (executive).* 15 actions at rank 1. The same honesty as the width, applied to prioritisation.
3. **A check that reports "not assessed" rather than passed.** *Dashboard, Demotion checks.* "A check that could not run is shown as not assessed: neither passed nor failed, and not counted as a pass."
4. **Security in Delivery complete at 44 of 44.** *Authoring.* The proof that the unauthored work is finite.
5. **The source-file hash anyone can verify.** *Every page.* government_ministry.json and its SHA-256, `b4d05dfd…a6625`.
6. **A failed collection is Unknown, never a Gap.** *Intake ledger.* "Collection failed for monitoring…". Also the collector's local-administrators signal: "one host's absence proves nothing about an estate".
7. **The level did not rise.** *Dashboard.* Collection succeeded, 37 controls moved out of Unknown, and the assurance level stayed L1. The platform reports its own confidence honestly.
8. **A real organisation gets an empty state.** *Profile → Entity.* "No assessment has been run for this organisation."

## Screens to avoid, or handle carefully

| Screen | Why | What to do |
|---|---|---|
| **National Rollup** | Every number is invented (47 entities, the bands, the "most frequently failed" list). If NCSC asks which entities, there are none. It is also the screen they will care most about. | Skip it unless asked. If asked: "That is a mock-up of the regulator's view with invented numbers. The design is the point: bands, assurance level, small cells suppressed." Never quote a figure from it. |
| **OSCAL Export: Signed package card** | Invented signing identity, a date earlier than the assessment's, a made-up hash and a Verify button. | Do not click Verify. Say "planned". |
| **OSCAL Export: JNCSF Catalog card** | It claims the Catalog "is the first machine-readable representation of the JNCSF" and could be published by NCSC as the authoritative reference. You have not verified that, and it is about their own catalogue. | Do not read it aloud. |
| **Compliance Chat** | Scripted; **not an AI**. "Grounded Q&A" is true only of the data, not of any model. | Use at most the "Which action comes first?" and the refusal. Say "scripted". |
| **Roles & Access** | A design claim ("cryptographically walled off") that is not built. | Skip, or say "design". |
| **Request Plan: collector buttons** | They only print a line. | Don't click them; use the Intake transcript instead. |
| **Profile: "Sector N/A baseline 5%"** | Invented. The Exclusions screen says the engine had no baseline. | Do not quote it. |
| **The Guided tour** | 31 steps. The welcome says "about 3 minutes". It is longer. | Use it only as a fallback if the room wants to explore on their own. |
| **Anything said "collector bundle"** | The collector has not been run. The Dashboard even says the "Windows/AD collector bundle resolved 36 of the 50". | Say "simulated bundle". |

The weakest parts, plainly: the National Rollup (invented), the signed-package and catalogue cards on Export (invented or unverified claims), the whole Integrations screen and the OSCAL package (planned, nothing built), the Chat (scripted), and the collector (written, never run).

## If something goes wrong

- **Blank screen.** Press **Reset demo**. If still blank, reload the page (Ctrl/Cmd+R) and choose **Explore on my own**. Your state is in the browser, so Reset demo is the clean slate.
- **A message instead of a figure.** "This figure could not be displayed because it failed an internal consistency check. The assessment data is unchanged; the number was withheld rather than shown unverified." Say: "That is a safety check doing its job. The platform withholds a figure it cannot verify rather than showing it." Move to the next screen. For a whole screen the message reads "This screen could not be displayed because a figure failed an internal consistency check… Other screens are unaffected."
- **The Remediation screen is empty.** The upload has not happened. "A ranking is derived from an assessment, so before one exists there is nothing to rank." Go to Intake and simulate the upload.
- **The Word report will not generate** ("The report could not be generated"). It loads one extra file on first click; if that file cannot load (no network and not cached), it fails. Say "I can show you the document I generated earlier" and move on. Keep one generated copy on your desktop.
- **No network.** The app is static; once loaded, everything works offline except the Word button's first use (see above). Fonts are bundled.
- **The state looks wrong** (different organisation, wrong role). Reset demo; choose Government ministry; set Viewing as to Assessment Owner.
- **A question you cannot answer.** Say: "I don't have that to hand. The engine and its repository are the authority on that, and I will come back to you on it." Do not guess a number. Prepared answers to the likely ones:
  - *"Is this running the real engine?"* "No. It shows the engine's output files, pinned and fingerprinted. The prototype does arithmetic on them. The engine itself is separate."
  - *"Is the collector real?"* "It is a real script, written to be read. It has not yet been run against a live domain."
  - *"Is the OSCAL export real?"* "It is the design. The preview is built from the real data, but nothing is signed or validated yet."
  - *"Why only 66 of 576 controls?"* "That is the tool's limit today and the screen says so: 491 of the 557 applicable controls have no evidence rule yet. Delivery is complete at 44 of 44, which shows the rest is finite writing."
  - *"Do you assess CICSC?"* "No. It is flagged as a separate framework that applies to this sector and is not assessed."
  - *"Is there an AI?"* "Not in this prototype. The Chat is scripted."
  - *"Who are these organisations?"* "The ministry, bank and utility are the engine's test cases, fictional."
  - *"Where can I check the hash?"* "Hash the engine's output file named at the top of the page and compare. I can provide the file." (The file is in the engine's repository, which is private; bring a copy if you offer this.)

---

# Part 3 — The one-page card

**Route (10 min):** `/#/profile` 1:30 → `/#/intake` (Evidence bundle, simulate upload, read the ledger) 2:00 → `/#/dashboard` 3:30 → `/#/remediation` 1:30 → `/#/authoring` 1:00 → source strip 0:30.
**Setup:** Reset demo · Government ministry · Owner role · **do not** upload beforehand · click "Generate Word report" once to warm it.
**If Remediation is empty:** the upload has not happened. Go to Intake.

**Key figures (ministry, after upload)**
- 557 of 576 apply; 19 excluded (all in-house development) · 3.3%
- Interval **4.9% – 95.5%**, width 90.7 points, coverage 9.3% (before: 0.3% – 97.6%, width 97.3, coverage 2.7%)
- Width: **88.15 unauthored (491)** + **2.51 unevidenced (14)** + 0.00 uncollectable = 90.66
- 21 Compliant · 25 Partial · 6 Gap · 505 Unknown (52 verdicts)
- Assurance **L1**: 37 of 52 (71%) tool-evidenced or signed; L2 needs 80%. Checks: 2 passed, 0 triggered, **2 not assessed**
- **Delivery 44 of 44 authored**; 66 of 576 authored overall
- **15** actions share rank 1 (47 actions, 11 ranks); bank 12, utility 13
- Six Gaps: 99, 100, 101 (absence) · 124, 139 (observed) · 109 (admission)
- Request plan: 113 signals (44 documents, 69 systems), max coverage 11.8%
- Integrations: statement 4,536 bytes vs 154,944 local (3%)
- Hash: government_ministry.json `b4d05dfd…a6625`

**The sentences that matter**
1. "Evidence, not declaration: testimony alone can never make a control Compliant."
2. "A range, not a number. The width is exactly what we did not establish, and the screen says whose limitation each part is."
3. "88 of the 90.7 points are the tool's own limitation. Only 2.5 are the organisation's."
4. "The engine does not break a tie it cannot justify. A check it could not run says 'not assessed', never 'passed'."
5. "A failed collection is Unknown, never a Gap."
6. "Every figure traces to the engine's output file and its fingerprint. Measured is the engine's; illustrative is a worked example; planned is not built."

**Never say:** "the interval collapsed" · "AI" or "grounded" about the Chat without "scripted" · "we collected" or "the collector ran" · any figure from the National Rollup · "4.9% compliant" · "signed" about the OSCAL package.

**Honest one-liners:** Rollup — "mock-up, invented numbers." OSCAL/Integrations — "design, not built." Collector — "written, not yet run." Chat — "scripted."

---

# Things I found (not fixed)

**Out of date**
1. `README.md`, `DEMO_GUIDE.md`, `PROTOTYPE_AS_BUILT.md` and `docs/PROTOTYPE_INVENTORY.md` describe the prototype before Round 1 (commit `ebd07e2`): 48 invented sample controls, a Top-3-risks card, a multi-factor-authentication story, 13 routes (now 15, with Integrations and the entity field). The README claims "Every gap maps to concrete MITRE ATT&CK techniques" and "Threat-informed" as a headline idea; the engine suppresses most technique lists and the screen says ATT&CK never ranks.
2. `docs/ROUND_1_REPORT.md` quotes figures that no longer exist on screen (207 Unknown, 148 resolved, 49 vs 20 artifacts). `docs/ROUND_2_REPORT.md`'s main figures (21 Compliant / 25 Partial / 6 Gap / 505 Unknown, 52 verdicts) still match the screen. Rounds 3 and 4 match.

**Wrong or overstated on screen**
3. The Dashboard banner (before upload) says "Run the collector bundle on the Intake screen to see the interval collapse." The width moves from 97.3 to 90.7 points. "Collapse" overstates it.
4. After the upload the Dashboard reads "Interval narrowed after the Windows/AD collector bundle resolved 36 of the 50 Unknown controls", and Remediation says "Run the collector bundle". No collector has run; the bundle is simulated.
5. Export, **Signed package** card: "JCCP Appliance — MoDS-JCCP-01", a timestamp of 2026-09-08 (the assessment is dated 2026-09-30), a made-up hash, and a Verify button. Tier `planned`, but it reads as real.
6. Export, **JNCSF Catalog** card claims to be "the first machine-readable representation of the JNCSF" and publishable by NCSC as the authoritative reference. Unverified, and about NCSC's own document.
7. Profile shows "Sector N/A baseline 5%" and "Your N/A rate 3.3%"; the Exclusions screen and the engine say no baseline was supplied (check "not assessed"). The two contradict each other on the same assessment.
8. The National Rollup lists JNCSF-435, -307, -141, -30, -407 as most frequently failed; in this assessment those are Unknown. The whole screen is invented.

**Confusing**
9. Before the upload, state-derived figures are tagged `illustrative`, though they are real engine verdicts arranged as a projection; the chip's own definition ("worked example") does not describe them. The on-screen note ("a projection (rule R)") does. Rule R is not explained anywhere in plain words.
10. On Intake before the upload, the "Two answers disagree" banner has no tier chip, while the cards around it are tagged `illustrative`.
11. Remediation before the upload says the same thing twice ("The engine's ranking is computed on the assessed state…" and "…before the upload there is nothing of its to show.").
12. The welcome says the tour "takes about 3 minutes"; it has 31 steps.
13. The hash can be checked only by someone holding the engine's output file, which lives in a private repository. The screen's "how to check" tells a reader to run `sha256sum` on it; the room cannot unless you bring the file.
14. The Chat's subtitle says "Grounded Q&A over the pinned catalogue" though the prototype holds catalogue text for only 48 of 576 controls.
15. The tab named "Interviews" contains no interview text; it lists the engine's record of the answers it weighed (the transcripts are not in the engine's output).
