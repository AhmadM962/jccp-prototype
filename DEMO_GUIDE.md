# JCCP — Demo Guide

**Jordan Cyber Compliance Platform** · interactive prototype · capstone defence walkthrough

This guide is the operator's manual for the demo. It covers what the platform is, what
every screen contains, what every button does, and five scripted user journeys you can run
in front of an audience.

- **Companion documents:** `README.md` (quick start + 11-step script), `PROTOTYPE_AS_BUILT.md`
  (engineering audit of the earlier build).
- **Nothing here talks to a network.** No backend, no database, no AI inference. Every
  number is a pre-computed fixture; every "upload" and "collector run" is simulated. Roles
  are a demo switcher with no authentication.

---

## 1. What JCCP is

JCCP is an **on-premise, evidence-grounded compliance and gap-analysis platform** for the
**Jordan National Cybersecurity Framework (JNCSF)** — 576 controls. An organisation runs
it inside its own network; a signed *collector* gathers machine evidence; JCCP scores the
organisation against the framework and produces a signed OSCAL package for the regulator
(NCSC).

### The three ideas the demo must land

| Idea | How the UI shows it |
|---|---|
| **1. Evidence-grounded, not a questionnaire.** Testimony can never mark a control Compliant. Only machine-collected artifacts (or an accredited analyst's signature) promote a control to Green. | The evidence-sufficiency ladder on every Control Detail page; the amber *"Testimony only — capped at Yellow"* badge on every interview claim. |
| **2. Honest about what it doesn't know.** Compliance is a **bounded interval**, never a single number. The band's width is the visible cost of missing evidence. | The `ScoreInterval` component renders two endpoints and a shaded band — never one percentage. The completeness statement cannot be dismissed. |
| **3. Threat-informed.** Every gap maps to concrete MITRE ATT&CK techniques the organisation is exposed to. | The ATT&CK exposure card on every Control Detail page: *Control → Mitigation → Techniques*. |

### The single most important moment

The user runs the simulated collector bundle. On screen:

- Coverage jumps **62.9% → 89.4%**
- The compliance interval collapses **50.0–87.1% → 70.6–81.2%** (width 37.1 → 10.6 points)
- Assurance rises **L1 → L2**
- 90 individual controls animate from Unknown/Yellow to Green or Red, each now carrying a
  clickable evidence trail

The interval bar **springs** to its new position. Drive the demo through the *"Reveal on
dashboard"* button so the animation plays.

---

## 2. Running it

```bash
npm install
npm run dev          # Vite dev server → http://localhost:5173
```

- Stack: Vite · React 18 · TypeScript · Tailwind · React Router · Recharts · framer-motion ·
  Zustand (persisted to `localStorage`, key `jccp-assessment-v2`).
- `npm run build` runs `tsc --noEmit && vite build`.
- **Inter is self-hosted** (`@fontsource-variable/inter`) — the app has no CDN dependency,
  consistent with the on-premise positioning.
- **Reset demo** — top-right button on every screen. Clears all state (evidence, overrides,
  scoping decisions, role, profile) back to the initial pre-upload state. Use it before each
  run.

---

## 3. The demo scenario

| | |
|---|---|
| Organisation | **Ministry of Digital Services** (fictional) |
| Sector / size | Defence, Security & Government Services · 250–1000 staff |
| Regulator | **NCSC** — derived from the sector (see §4.6) |
| Estate | ~400 endpoints · 38 servers · 620 users · Windows/AD with a small Linux tier |
| Hosting | MoDEE Government Private Cloud |
| No | operational technology · in-house development · BYOD · cross-border cloud · critical infrastructure (CICSC off by default) |

### Fixture numbers (these reconcile exactly and must not drift)

| | Total controls | Not Applicable | **Applicable** |
|---|---|---|---|
| Scoping | 576 | 236 | **340** |

| | Evidenced | Green | Yellow | Red | Unknown | Coverage | **Interval** | Width | Assurance |
|---|---|---|---|---|---|---|---|---|---|
| **Before** upload | 214 | 150 | 40 | 24 | 126 | 62.9% | **50.0 – 87.1%** | 37.1 pts | L1 — Documented |
| **After** upload | 304 | 210 | 60 | 34 | 36 | 89.4% | **70.6 – 81.2%** | 10.6 pts | L2 — Tool-evidenced |

The bundle closes **90 evidence gaps** (Unknown 126 → 36).

### Per capability

| Capability | Applic. | Before interval / coverage | After interval / coverage |
|---|---|---|---|
| Security in Architecture & Portfolio | 22 | 43.2–88.6% / 54.5% | 63.6–81.8% / 81.8% |
| Security in Development | 20 | 30.0–90.0% / 40.0% | 57.5–82.5% / 75.0% |
| Security in Delivery | 40 | 67.5–87.5% / 80.0% | 78.8–86.3% / 92.5% |
| Security in Operations | 180 | 52.2–86.7% / 65.6% | 71.4–81.4% / 90.0% |
| Foundational Capabilities | 78 | 42.9–86.5% / 56.4% | 69.9–77.6% / 92.3% |
| Security in National Cyber Responsibility | 0 | *Not organisationally assessable — national obligation* | |

---

## 4. Global concepts

### 4.1 The four-state model (plus two)

Every state renders as **colour + icon shape + text label** and stays readable in greyscale
(accessibility is a functional requirement).

| State | Colour | Glyph | Label | Meaning |
|---|---|---|---|---|
| Green | emerald | ● filled circle | **Compliant** | Machine evidence (or analyst signature) confirms the control is met |
| Yellow | amber | ◐ half-filled | **Partial** | Partly met, or testimony-only (testimony can reach no higher) |
| Red | red | ■ filled square | **Gap** | Machine evidence from a *successful* module confirms the control is **not** met |
| Grey | slate | ─ dash | **N/A** | Excluded from scope — not in the denominator |
| Violet | violet | ◇ hollow diamond | **Unknown** | No sufficient evidence either way — this is the interval's width |

**Two figures are always kept separate:** "worst *established* state" (the worst thing we
*know* is wrong) and "*unestablished*" (Unknown — we don't know). Collapsing "we don't
know" and "we know it's broken" onto one scale would destroy the platform's central point.

### 4.2 Evidence classes and the state ceiling

| Evidence class | Highest state it permits |
|---|---|
| None | Unknown |
| **Testimonial** (interview) | **Yellow** |
| **Artifact** (machine-collected) | **Green** |
| **Analyst-signed** (accredited assessor reviewed) | **Green** |

An analyst override does **not** bypass this ceiling — it *asserts a higher class of
evidence* (`analyst_signed`) and is audit-logged.

### 4.3 The bounded score (`lib/scoring.ts`)

```
numerator = green·1.0 + yellow·0.5 + red·0.0
lower  = numerator / applicable                (all Unknowns fail)
upper  = (numerator + unknown) / applicable    (all Unknowns pass)
coverage = (applicable − unknown) / applicable
```

- `boundedScore(340, 150, 40, 24, 126)` → 0.500 – 0.871, coverage 0.629
- `boundedScore(340, 210, 60, 34, 36)` → 0.706 – 0.812, coverage 0.894

**Projection** (`projectProvision`) answers "what happens if I provide this artifact?" as
an *outcome range*, not a single narrower band: an artifact makes N Unknowns *known*, so
the band narrows by exactly `N/applicable` — but its *position* is bracketed by best case
(all N pass) and worst case (all N fail).

**Overrides propagate** (`lib/derive.ts`): an analyst override moves the control between
aggregate buckets and the interval is re-derived, so the dashboard shows both the engine
verdict and the with-overrides verdict.

### 4.4 The assurance ladder

| Level | Name | Meaning |
|---|---|---|
| L0 | Declared | Profile declared; no evidence of any kind |
| **L1** | **Documented** | Policy + testimonial evidence only (the *before* state) |
| **L2** | **Tool-evidenced** | Machine-collected artifacts corroborate a majority of controls (the *after* state) |
| L3 | Analyst-signed | An accredited assessor has reviewed and signed the evidence set |

The dashboard explains *why the current level holds and what would raise it* — in the demo,
L3 is blocked by the failed `logging` collector module and the absence of an analyst
sign-off.

### 4.5 Roles (demo switcher, top-right — no authentication)

| Role | Sees | Home screen |
|---|---|---|
| **Assessment Owner** | Everything | Profile |
| **Analyst** | Everything + override buttons enabled + review queue | Profile |
| **Executive** | Interval, coverage, assurance, trend, top-3 risks. **No** control detail, evidence, or personal data. Reduced sidebar. | Dashboard (reduced) |
| **Contributor** | Their own evidence-submission task list only — not the dashboard | My Tasks |
| **Regulator** | Submitted OSCAL packages and the national rollup only | OSCAL Export |

`/admin` — **Roles & Access** — shows the full RBAC matrix and maps each access boundary to
the JNCSF control it implements. Switching role re-filters the sidebar and redirects you if
the current screen is not permitted.

### 4.6 Sectors and regulators (`data/sectors.ts`)

The Profile's **Sector** dropdown offers the **eight official critical-infrastructure
sectors** from the NCSC CICSC Guidance document; each carries its regulator, and the
top-bar **"Regulator:"** label is derived from the selected sector — a single value read
from state, so choosing *Energy* makes the whole app read "Regulator: EMRC".

| Sector | Regulator |
|---|---|
| Defence, Security & Government Services *(demo default)* | NCSC |
| Energy | EMRC |
| Finance | CBJ |
| Health | Ministry of Health |
| Telecommunications | TRC |
| Transport | Land / Aviation / Maritime Commissions |
| Water | JWA |
| Manufacturing | Ministry of Industry & Trade |

### 4.7 Two frameworks — JNCSF and CICSC

**JNCSF** (576 controls) is what this tool assesses. **CICSC** — the Critical Infrastructure
Cyber Security Controls — is a *second, separate* framework: **405 controls across three
cumulative implementation levels, Level 1 (135 controls) mandatory**, for organisations
that operate critical infrastructure. JCCP does not assess CICSC, but the profile records
whether the organisation is subject to it, and that scope boundary is disclosed on the
dashboard and carried inside the OSCAL package (see the *Operates critical infrastructure*
toggle in §6.1). A clean JNCSF interval is **not** complete assurance for an
organisation with unassessed CICSC obligations.

---

## 5. Navigation shell

Present on every screen:

- **Left sidebar** (dark). Logo · "*{Role}* view" chip · nav links (filtered by role) ·
  **phase stepper** (Profile → Planning → Intake → Assessed; steps complete as you advance)
  · a status chip reading `Testimony only · L1` or `Evidence bundle loaded · L2`.
- **Top bar.** Screen title · organisation subtitle · **`Viewing as: {Role}` dropdown**
  (the 5 roles, each with a one-line description) · `On-premise · read-only` chip ·
  **`Reset demo`** button.
- **Content area** — max-width, scrolls.

Navigation is **free** — jump to any permitted screen at any time. The "Continue" buttons
advance the phase stepper; visiting via the sidebar does not.

---

## 6. Screen-by-screen

### 6.1 Organisation Profile — `/profile`

**Purpose.** Capture the scoping inputs that decide which of the 576 controls apply, and
demonstrate the two-stage scoping challenge.

**Layout — left column (form card):**

| Field | Type | Notes |
|---|---|---|
| Sector | dropdown | the **8 official CICSC sectors** (§4.6); a live *"Regulator: …"* hint sits under the field |
| Size band | dropdown | `< 50` / `50–250` / `250–1000` / `> 1000 staff` |
| Hosting model | dropdown | MoDEE Government Private Cloud / Own data centre / Third-party in Jordan / Foreign cloud |
| Named attestation | text | accountable officer's name |
| Endpoints / Servers / Users | number | estate size |
| **Architecture toggles** ×6 | **tri-state** — `Yes` / `No` / `Don't know` | see below |
| **Operates critical infrastructure** | on/off toggle | boolean `operatesCriticalInfrastructure`; **default off**; does **not** change the 340 count — CICSC is a separate framework |
| PDPL data holdings ×4 | checkbox | Health / Biometric / Financial / Religious or political (all unchecked by default) |

**The six architecture toggles** (each a `Yes / No / Don't know` segmented control):

| Toggle | `Yes` / `Don't know` | Explicit `No` |
|---|---|---|
| Operational technology | +41 controls in scope | 0 |
| **Cloud services** | 0 | **−23 controls** — and triggers the challenge |
| Cross-border cloud processing | +12 controls | 0 |
| In-house software development | +49 controls | 0 |
| Security operations centre | 0 | −6 monitoring controls |
| BYOD permitted | +8 controls | 0 |

**Tri-state rule:** `Don't know` keeps controls **in scope** (never shrinks the
denominator) and flags them for verification during collection. Choosing `Don't know` shows
a violet note under the toggle and a *"N controls held in scope by a 'Don't know' answer"*
line in the side panel.

**Operates critical infrastructure toggle.** Off by default. When switched **on**, a blue
**factual info panel** (not a challenge — this is a disclosure, not a contested claim)
appears beneath it:

> **Critical infrastructure scope note.** This organisation is also subject to the Critical
> Infrastructure Cyber Security Controls (CICSC) — 405 controls across three implementation
> levels, with Level 1 (135 controls) mandatory. A substantial number of Level 2/3 controls
> have no JNCSF correspondence at all. This assessment does not evaluate CICSC.

The applicable-controls number stays **340** — CICSC is a different framework, not a JNCSF
applicability condition. The toggle's real effect shows on the **Dashboard** and in the
**OSCAL Export** (see §6.4, §6.8).

**Layout — right column ("Live scoping" card, sticky):**

- Big number = applicable controls (default **340**), recomputes live as toggles change.
  **Click it → opens the exclusion register** (`/exclusions`).
- "of 576 total · {N} excluded" · accent progress bar.
- **Sector N/A baseline 34%** vs **Your N/A rate** — turns amber with *"⚠ above baseline"*
  when your rate exceeds it (the demo's 236/576 = 41.0% is deliberately above).
- Contextual amber note when cloud is declared absent.

**The scoping challenge — two stages:**

- **Stage 1 (soft, prior-based).** Fires ~0.9 s after you set *Cloud services = No*, while
  no decision is recorded. An amber card: *"{Sector} entities of {size band} almost always
  consume at least one cloud service. Declaring none removes 23 controls…"* (the sector and
  size are read live from the profile). It
  **requires a typed justification (≥ 12 chars)** and the *"Continue to request plan"*
  button is disabled until you decide.
  - **`Confirm exclusion & record`** — records `{ decision: 'confirmed', justification,
    decidedBy: role, decidedAt }` and lets you proceed. A grey chip then shows the recorded
    decision with a *"Reopen decision"* link.
  - **`Restore cloud services`** — sets the toggle back to `Yes` and records
    `{ decision: 'restored' }`.
- **Stage 2 (hard, post-upload).** Once the evidence bundle is loaded *and* the profile
  still declares no cloud, a **red block** appears here **and** on Intake **and** on the
  Dashboard: *"Contradiction: your profile declares no cloud services, but the bundle
  contains cloud agent entries. This scoping decision is blocked pending review."* Its only
  action is **`Restore cloud scope and re-run`**.

**Buttons:** the segmented toggles · `Confirm exclusion & record` · `Restore cloud services`
/ `Restore cloud scope and re-run` · `Reopen decision` · **`Continue to request plan →`**
(advances phase to *Planning*, navigates to `/request-plan`).

---

### 6.2 Evidence Request Plan — `/request-plan`

**Purpose.** Before any collection, tell the organisation exactly which artifacts are
needed, which are automated, and the cost of not providing each.

**Header card.** *"To assess your 340 applicable controls, we need 22 artifacts from 8
systems."* + *"Provide all 22 → projected coverage 94%. The remaining 24 controls are
structurally uncollectable and stay Unknown regardless."*

**Three tables:**

| Section | Contents |
|---|---|
| **Automated** (14 artifacts) | Header: *"collected by the signed collector · covers 126 controls · ~15 min"*. Two buttons: **`Windows/AD collector`**, **`Linux collector`** — clicking shows *"{platform} collector package prepared (simulated) · Ed25519-signed · run on-premise"*. |
| **Manual** (8 artifacts) | Require a console export by the named owner. |
| **Full plan** | **Top 10 of 22 by controls unlocked**, with a **`Show all 22`** / `Show top 10` toggle. |

**Each table row** shows: Artifact (+ a format hint like *"CSV — SamAccountName, Enabled,
PasswordLastSet, LastLogonDate"*) · Source system · Owner (Identity team, SOC, Server team,
HR…) · Controls unlocked · Effort · **the command in a copyable code block** (hover →
`Copy`) · and a red line *"Declining leaves N controls permanently Unknown."*

**Buttons:** collector download buttons · `Show all 22` toggle · per-command `Copy` ·
**`Continue to intake →`** (advances phase to *Intake*).

---

### 6.3 Intake — `/intake`

**Purpose.** The interactive centrepiece. Two tabs: **Interviews** (testimony, capped at
Yellow) and **Evidence bundle** (the machine collection that drives the reveal).

A **red contradiction block** appears at the top if the cloud scoping decision is unresolved
post-upload (Stage 2).

#### Tab A — Interviews

**Role list** — three cards:

| Card | Persona | Turns · claims |
|---|---|---|
| Infrastructure / Operator | Estate operations lead | 8 · 3 |
| Executive / Compliance | Director of governance | 5 · 2 |
| Defender / SOC | SOC team lead | 4 · 2 |

Each card shows a status pill (`not started` / green `done`) and a **`Generate scoped
link`** button. Clicking it produces a mock internal URL:

```
https://jccp.ministry.local/respond/a7f3c1
expires in 7 days · SOC questions only
[Copy]  [Mark as sent]
Internal network only — this link does not traverse the internet
```

**Review queue** (table below the cards): Role · Assignee (named people) · Status
(`accepted` / `under review` / `submitted`) · Submitted date · Actions
(`Review` · `Reopen` · `Nudge`). Plus one amber **conflict-flag row**: *"Executive and
Operator disagree on MFA enforcement scope — operator wins on configuration per trust
ordering."*

**Opening a role** → a two-column transcript view (`← All roles` back-link):

- **Left:** a chat transcript. **`Play`** reveals one turn every ~650 ms; **`Skip`** jumps
  to the end. Agent turns (grey, left) and interviewee turns (blue, right).
- After 2 turns of the Operator interview, an amber **"Coverage fallacy defeated"** inset
  appears:
  > ~~Naive extraction: 1 compliant control~~
  > ✓ Servers enforcing — block mode
  > ✓ Workstations detect-only, ~80% installed
  > ✓ Contractor machines — no agent
  > ✓ Named exception retained for the assessment
- **Right:** "Extracted claims" — claim cards fade in as the interview progresses. Each has
  the claim text, an optional note, an amber **`Testimony only — capped at Yellow`** badge,
  and a confidence score (e.g. `conf 0.71`).

Finishing (or skipping) an interview marks the card `done` and sets its review-queue status
to `submitted`.

**Operator script (verbatim):**
> A: "Do you have endpoint detection deployed across the estate?" · U: "Yes, we run
> CrowdStrike across the estate." · A: "Is it configured to block, or is it detect-only?" ·
> U: "It blocks on servers. On workstations it's detect-only for now." · A: "What share of
> workstations have the agent installed?" · U: "Around 80%." · A: "Are there populations
> excluded?" · U: "Contractor machines don't have the agent."

#### Tab B — Evidence bundle

**"Evidence intake" card** — header shows live progress: *"{N} of 22 artifact slots filled
· {N} controls evidenced · est. coverage {N}%"*. Button: **`Simulate collector bundle
upload (fills 14)`**.

- **22 typed slots** (a 2-column grid), each: artifact name · source · unlocks N · format
  hint · and either a green `accepted` pill or an **`Upload`** button. Clicking `Upload`
  shows *"{artifact} accepted — N controls now evidenced."*
- A dashed **"Other evidence"** drop zone for anything not listed (simulated).

**Clicking `Simulate collector bundle upload`:**

1. Fills the 14 automated slots.
2. An **"Ingestion"** card runs a 7-line staged animation (~700 ms/line):
   | Line | Result |
   |---|---|
   | Verifying signature — Ed25519 · collector build 2026.08.2 | ✓ |
   | Reading module execution ledger — 7 modules recorded | ✓ |
   | Parsing identity.json (1,842 records) | ✓ |
   | Parsing endpoint.json | ⚠ partial — insufficient permission (12 of 400 hosts) |
   | Parsing logging.json | ✗ failed — wineventlog_access_denied |
   | Module 'cloud' | ✗ declined by client |
   | Corroborating 90 claims | ✓ |
3. The **Module execution ledger** table appears — 7 modules with status
   (`success` / `partial` / `failed` / `declined`) and a *negative-capable* column, plus the
   rule: *"Only modules with status `success` may produce a negative finding. The `logging`
   module failed, so its controls remain **Unknown**, not Gap."*
4. A green banner: **"90 evidence gaps closed / Interval collapses 50.0–87.1% → 70.6–81.2%
   · coverage 62.9% → 89.4% · assurance L1 → L2"** with a **`Reveal on dashboard →`**
   button.

**Buttons:** tab switch · `Generate scoped link` · `Copy` · `Mark as sent` · `Play` /
`Skip` / `← All roles` · per-slot `Upload` · `Simulate collector bundle upload` ·
`Reveal on dashboard →`.

---

### 6.4 Compliance Dashboard — `/dashboard`

**Purpose.** The signature screen. Compliance as a bounded interval, coverage, assurance,
per-capability breakdown, scope exclusions, and the reasons controls are unevidenced.

**Banners (conditional, top):**
- Amber — pre-upload prompt to run the collector.
- Red — Stage-2 cloud contradiction.
- Blue — **override banner**: *"{N} analyst override(s) applied. Engine verdict:
  70.6–81.2%. With overrides: 70.9–81.5%."* + **`Review overrides`** link.

**Top row — three cards:**

| Card | Contents |
|---|---|
| **Compliance Interval** | The `ScoreInterval` hero: two big endpoints (`70.6%` — `81.2%`), a 0–100% track with a shaded band and edge markers, `width 10.6 points · coverage 89.4%`, and a subline. **Animates from the pre-upload band** when you arrive after an upload (or reload). Pre-upload the subline links to Remediation. |
| **Coverage** | Recharts donut, 4 segments: Artifact-evidenced · Testimony only · **Unevidenced — collectable** · Structurally uncollectable, with counts. Post-upload adds an **evidence-freshness line**: *"Oldest evidence: 84 days (JNCSF-459) · 6 controls approaching staleness · assessed 2026-09-08."* |
| **Assurance level** | L0–L3 vertical list, current level highlighted with its definition. Post-upload adds **"Why L2, not L3"** + a *demotion risks* line (declined module · override count · N/A rate above baseline). |

**By capability** (card). One **clickable row per capability** (→ Gap Matrix pre-filtered to
that capability): short name · `{G}G · {Y}Y · {R}R · {U} unknown` · a mini interval bar ·
coverage %. The 6th capability renders greyed: *"Not organisationally assessable — national
obligation"*.

**Two boxes side by side:**

| Box | Contents |
|---|---|
| **Completeness statement — cannot be dismissed** | *"This assessment covers 304 of 340 applicable controls. 36 are unevidenced. 24 are outside the tool's collection reach. Assurance level: L2 — Tool-evidenced. Compliance is reported as an interval because a point estimate would conceal what was not established."* — **plus, when *Operates critical infrastructure* is on**, a second sentence in the same non-dismissible box: *"This organisation operates critical infrastructure and is subject to the Critical Infrastructure Cyber Security Controls (405 controls, three implementation levels) in addition to the Jordan National Cybersecurity Framework. This assessment does not evaluate CICSC compliance, and a favourable JNCSF result does not represent complete assurance against the organisation's full regulatory obligation."* |
| **Scope exclusions — 236 of 576 controls** | *"236 controls (41.0%) marked Not Applicable. Sector baseline for {live sector label}: 34.0% — ⚠ your rate is above baseline. 12 exclusions carry no recorded justification · {scoping-challenge status}."* + **`Review all 236 exclusions →`** button. |

**Why controls are unevidenced** (card). Horizontal Recharts bar chart of gap reasons —
**switches between the before breakdown (sums to 126) and the after breakdown (sums to
36)**. Annotated: *"`not_requested = 0` is a design invariant — a non-zero value would
indicate a defect in the request planner."*

**Footer link (post-upload):** *"See the 90 promoted controls in the Gap Matrix →"*.

**Executive-role variant** (when `Viewing as: Executive`): only the interval card, a
4-cycle **Trend** sparkline, a **Top 3 risks** list (each links to a control), and the
completeness statement. No evidence, no per-capability drill-down, no personal data.

**Buttons / links:** `Review overrides` · per-capability rows · `Review all 236 exclusions`
· freshness link to JNCSF-459 · `See the 90 promoted controls` · Top-3-risk links (exec).

---

### 6.5 Gap Matrix — `/gap-matrix`

**Purpose.** Browse the seeded controls grouped by capability, with filters and a
"what changed" view.

**Filter bar:** search box · **state** (green/yellow/red/unknown) · **evidence class** ·
**gap reason** · checkbox **"Show only what changed after evidence upload"** (enabled only
post-upload) · checkbox **"Overridden only (N)"** (appears only when overrides exist).
URL parameters (`?cap=ops`, `?changed=1`, `?overrides=1`, `?state=red`, `?gap=…`) are
consumed on entry then cleared — links from the dashboard land pre-filtered.

**Six capability sections**, each an expandable card. Header shows:

- capability name · *"{N} applicable · {X} of {Y} seeded shown"*
- **Two independent figures from the fixture (NOT from visible rows, NOT an average, and
  stable under filtering):**
  - **worst established:** a state badge + count — e.g. `■ Gap 12` for Operations
  - **unestablished:** `◇ 62` (the Unknown count)

**Each control row** (links to Control Detail): state badge (colour + shape + label) · ID ·
description · evidence-class chip · gap-reason chip (for Unknowns) · `✨ promoted` chip
(post-upload changed controls) · `showcase` chip (JNCSF-102). Promoted rows have a pale-blue
background.

The 6th capability renders as a flat greyed card.

**Buttons:** section expand/collapse · every filter control · every control row.

---

### 6.6 Control Detail / Evidence Inspector — `/control/:id`

**Purpose.** The auditor-facing view of one control. Reached by clicking any seeded control
or a control-ID link. An unknown ID shows a graceful "No such control" card.

**Sections, top to bottom:**

1. **Header** — ID · capability pill · `showcase` / `promoted by upload` / `analyst
   override` pills · description · *"Assessment as of 2026-09-08"* · a large state badge
   (the *effective* state = override ?? engine) · evidence-class pill · gap-reason pill ·
   and an **evidence-age marker** (`evidence 3d old` / amber `evidence 84d old · past 365d
   window`).
2. **Standards mapping** — ISO 27002 chips (`9.2.3 · Management of privileged access
   rights`) and NIST 800-53 chips (`AC-6 · Least Privilege`).
3. **Evidence trail** — one card per evidence record: type (Artifact / Testimonial) · a
   `module: identity` pill · timestamp · a quoted blockquote (testimonial) or a mono
   locator (`raw/ad-privileged-groups.csv row 412`) · a truncated SHA-256 (`a3f1…d7e2`) ·
   source · a **`View raw`** link opening a dark modal with a plausible raw dump.
   *In the Executive / Contributor view this whole section is replaced by:* *"Evidence
   excerpts are hidden in the {role} view — they may contain account names and other
   personal data."*
4. **Evidence sufficiency** — the 4-cell ladder (None → Testimonial → Artifact →
   Analyst-signed) with the current class marked and the ceiling it permits, then:
   *"This control's evidence is Artifact, so it can reach at most Compliant. Testimony
   alone can never mark a control Compliant."*
5. **ATT&CK exposure** — **rendered on every control.** Where a mapping exists:
   *Control → Mitigation (M1026 Privileged Account Management) → Technique cards
   (T1078, T1548, T1021)* + the plain-language line *"Because JNCSF-102 is not enforced,
   you are exposed to T1078 Valid Accounts, …"* (technique cards dim when the control is
   Green). **The mitigation card carries a provenance tag:** a green
   **`✓ Official — CICSC Threat Annex`** when the control is covered by the Threat Annex's
   official NIST-to-ATT&CK mapping (access control, authentication, malware protection —
   JNCSF-102, 440, 435, 394), or a grey **`⑂ Derived — transitive via NIST, reviewed`** when
   the mapping was built transitively (JNCSF → NIST 800-53 → ATT&CK) and manually checked
   (JNCSF-30, 7, 163, 307). Where no mapping exists: *"No ATT&CK mapping. This is a
   governance control with no direct adversary-technique correspondence. 8 of the 48 seeded
   controls carry mappings."*
6. **Population data** (where relevant) — numerator/denominator with provenance
   (*"410 of 512 endpoints (denominator: AD computer objects)…"*), deployment share, and a
   red *"Named exception retained: 43 of 512 privileged accounts have no MFA enforcement"*.
7. **How to evidence this** (for Unknown / testimony-only controls) — each required signal,
   linked to the request-plan artifact that produces it (*"via 'Audit policy
   configuration' (1 min, unlocks 9)"*), plus a link into Remediation.
8. **Analyst actions** — **`Accept as Compliant`** / **`Override to Gap`** / **`Set to
   Unknown — request more evidence`**. Each opens the **override modal** (see below). A
   **`Clear override (engine verdict: …)`** button appears when an override exists. In the
   Executive / Contributor view these buttons are disabled.
9. **Override audit record** (violet box, when an override exists) — was / now
   (analyst-signed) / by / at / why (the typed justification).
10. **Related controls** — links to other controls in the same capability.

**The override modal.** *"Changing engine verdict [Gap] → [Compliant]. An override sets the
evidence class to analyst-signed — it does not bypass the state ceiling, it asserts a
higher class of evidence. It is recorded in the audit trail and surfaced in the OSCAL
Assessment Results as analyst-attested."* Requires a typed justification (≥ 12 chars).
Buttons: `Cancel` · `Record override`.

**The showcase control — JNCSF-102** (*"Manage access rights to be consistent with the
principle of least privilege"*) is fully fleshed: a 3-item evidence trail (operator quote +
two AD exports), a population figure, a named exception (43 privileged accounts without
MFA), the ATT&CK chain to T1078 / T1548 / T1021, and state **Gap** after upload.

---

### 6.7 Remediation & Requests — `/remediation`

**Purpose.** What to do next — evidence to gather and fixes to make.

**Three tabs:**

#### Tab: All actions (default)

One merged, ranked list interleaving **`[evidence]`** and **`[fix]`** items. Sort modes
(pill toggles): **risk-weighted** · **quick wins** · **controls closed**. Each item:
numeral · kind pill · title · effort · "establishes / closes N controls" · ATT&CK technique
pills (fixes) · an **acceptance-criteria line** (*"Done when the AD export shows 0
privileged accounts without MFA."*).

#### Tab: Remediation plan

Six ranked fix cards. Each: numeral · action · `closes 11 controls · 5 shown` (the count
and the linked-ID list are both shown honestly) · `effort` · affected assets · `removes
exposure to` technique pills · control-ID links. Example top card: *"Enforce MFA on all
privileged accounts — closes 11 controls · 5 shown · effort medium · 43 privileged
accounts · removes exposure to T1110, T1078, T1550."*

#### Tab: What you didn't provide

- **Projected interval card** — a `ScoreInterval` showing *"Where the band could land"*: a
  solid band (best case) and a **dashed ghost band** (worst case). Subline:
  *"{N} controls become known. Band width falls to {X} pts. Best case … · worst case …."*
  Footnote: *"The band cannot fall below 7.1 pts of width — the 24 structurally
  uncollectable controls stay Unknown regardless."*
- **Five request cards.** Each: artifact · source · *"{N} controls become known"* ·
  `narrows band {X} pts` · *"Interval becomes 72.9 – 81.2% (all pass) or 70.6 – 78.8%
  (all fail) — either way you learn where you stand"* · the command · and a
  **`Simulate providing this`** button (→ `✓ Provided`, updates the projected card).

**Buttons:** tab switch · sort pills · control-ID links · `Copy` · `Simulate providing
this` · **`Continue to OSCAL export →`**.

---

### 6.8 OSCAL Export — `/export`

**Purpose.** The regulator submission package, with coverage metadata inside it.

**Header card.** *"Five OSCAL models. Coverage metadata and the assurance level travel
inside the package…"* + a green validation line: *"✓ Validates against OSCAL 1.1.2 · 5
models · 340 control implementations · 0 errors"* + a **`Download package (.zip)`** button
that opens the **pre-submission review modal**.

**Five model cards** — Catalog · Profile · System Security Plan · Assessment Results ·
POA&M. Each: description · **`Preview JSON`** (opens a dark modal of OSCAL-shaped JSON that
embeds a `jccp:coverage-metadata` block with the `compliance-interval`, `assurance-level`
and `analyst-overrides` count — reflecting the current before/after state) · a **`.json`**
per-model download.

Every model's metadata also carries a **`jccp:scope-boundary`** block reflecting the
*Operates critical infrastructure* toggle:

```json
"jccp:scope-boundary": {
  "framework": "JNCSF",
  "operates-critical-infrastructure": true,
  "cicsc-assessed": false,
  "note": "CICSC (405 controls) not assessed. JNCSF result alone does not represent complete assurance for this organisation."
}
```

so the scope boundary travels with the exported package, not just the on-screen dashboard.

**Signed package card** — algorithm (Ed25519) · signing identity
(`JCCP Appliance — MoDS-JCCP-01`) · timestamp · a mock signature hash · a **`Verify
signature`** button.

**"JNCSF Catalog — a national reference" card.** Frames the Catalog model as the first
machine-readable representation of the JNCSF, publishable by NCSC as the authoritative
reference every entity assesses against.

**Pre-submission review modal.** Lists what the package discloses (interval, per-control
findings, POA&M, evidence *locators and hashes* — not raw files, but excerpts *may* contain
account names). A checkbox — **"Redact personal data in evidence excerpts before
submission"** (on by default). Buttons: `Cancel` · `Prepare signed package` → *"Package
prepared (simulated) · personal data redacted · Ed25519-signed."*

**Footer link:** *"National rollup (Analyst / Regulator) →"* to `/rollup`.

---

### 6.9 Compliance Chat — `/chat`

**Purpose.** Grounded Q&A over the pinned catalogue **and this assessment**. Every answer
carries citations. Free-text input is disabled — you pick from prompt chips.

**Prompt chips (8):**

| Prompt | Behaviour |
|---|---|
| What does JNCSF-102 require? | Framework answer + ISO/NIST citations (click a chip to reveal the retrieved passage). |
| **Why is JNCSF-102 a gap for us?** | `GROUNDED IN YOUR EVIDENCE` badge. *"The AD privileged-group export shows 43 of 512 privileged accounts with no MFA enforcement… exposes you to T1078, T1548, T1021."* Chips: the control, `raw/ad-privileged-groups.csv row 412`, the three techniques. |
| **What's blocking L3 assurance?** | The failed `logging` module + the missing analyst sign-off. |
| **Which gaps would an attacker exploit first?** | JNCSF-307 → T1190, 22 servers overdue. |
| Which controls cover the 48-hour breach rule? | JNCSF-30 / 252 / 257 + PDPL Art. 2023. |
| What is our compliance score? | **Answers now:** *"Your interval is 70.6–81.2% at 89.4% coverage — read from the assessment, not computed by me. The scoring engine is deterministic; I only retrieve."* |
| Are we compliant enough to pass an NCSC audit? | **Refuses:** *"I can't predict a regulator's determination. I can show you what the assessment establishes and what it doesn't."* |
| Tell me about JNCSF-9999 | **Refuses:** *"No such control exists in the pinned catalogue (JNCSF-1 to JNCSF-576)."* |

Answers grounded in evidence carry a green **`GROUNDED IN YOUR EVIDENCE`** badge; refusals a
red **`Won't answer — outside what the assessment establishes`** badge. Blue citation chips
navigate; chips with a passage reveal it inline on click.

**Footer:** a dark bar — *"On-premise · read-only · cannot change control states · cannot
compute scores · cannot access the internet · cannot see other organisations' data."*

---

### 6.10 Scope Exclusions — `/exclusions`

**Purpose.** The register of the 236 controls excluded from the assessment — why, and by
what fact.

- **Summary card** — N/A rate (41.0%) · sector baseline (34.0%, flagged *above*) ·
  count without recorded justification (12).
- **"Excluded by capability"** — 3 / 49 / 4 / 119 / 61 (= 236); each capability is a
  filter link.
- **"Excluded by triggering fact"** — No in-house development (62) · No OT (41) ·
  No cross-border cloud (12) · BYOD not permitted (8) · Scoping decision (89) ·
  National obligation (24) (= 236).
- **Table** — 29 representative exclusions: Control · Description · Excluded because
  (`inHouseDevelopment = no`) · Triggered by (Profile declaration / Scoping decision) ·
  Justification. **Rows with no justification are highlighted amber** with a *"⚠ none
  recorded"* pill.
- **Filters:** capability · triggering fact · "Unjustified only" checkbox.

---

### 6.11 Roles & Access — `/admin`

**Purpose.** A deliberate defence artifact: the RBAC design, and the JNCSF control each
access boundary implements.

- **Header** — *"Every role boundary in JCCP implements a JNCSF access-control requirement.
  The Appliance Admin can run the box but cannot read one line of assessment content —
  separation of duties by design."*
- **RBAC matrix** — 7 features × 6 roles (Assessment Owner · Analyst · Executive ·
  Contributor · Regulator · **Appliance Admin**). Each cell: ✓ full / `scoped` / — none.
  An **"Implements"** column maps each feature to a control chip (JNCSF-102, 440, 100, 30,
  146, 435, 107) that links to its detail page.
  - "Read assessment content" → full for Owner/Analyst only; **none for Appliance Admin**.
  - "Manage appliance (updates, backups, TLS, log forwarding)" → **full for Appliance Admin
    only; none for everyone else.**

---

### 6.12 National Rollup — `/rollup`

**Purpose.** The NCSC-facing aggregate view (Assessment Owner previews it; Analyst /
Regulator own it).

- **Header** — *"Distribution is over interval lower-bound bands, not point estimates, and
  is segmented by assurance level — an L1 entity 'at 75%' and an L2 entity 'at 75%' are not
  the same claim."*
- **Three stat cards** — `12 / 47` entities submitted · `8` overdue · `27` not yet due.
- **Compliance distribution** — stacked bars per lower-bound band (`≥ 80%`, `70–80%`,
  `55–70%`, `< 55%`), each split by **L1 / L2 / L3** colour. One row is shown greyed:
  *"suppressed — fewer than 5 entities"* (k-anonymity). Footnote explains the suppression.
- **Most frequently failed controls** — JNCSF-435 (9/12), 307 (8/12), 141 (7/12),
  30 (7/12), 407 (6/12).
- **Submission import log** — a table of signed packages arriving at NCSC: Entity · Received
  · Signature (`✓ verified` / `✗ rejected — signature does not match published key — not
  ingested`) · Assurance.

---

### 6.13 My Tasks — `/tasks`

**Purpose.** The Contributor role's home screen — own evidence submissions only, never the
assessment result.

- **Header** — *"You have been asked to provide evidence… You can see your own submissions
  and their status — not the assessment result."* + a count row (`1 accepted · 1 awaiting
  review · 3 to do`).
- **Five task cards** — status pill (`accepted` / `submitted` / `changes requested` /
  `to do`) · title · artifact · due date · unlocks N controls · a note on
  changes-requested items (*"Retention column missing — re-export with retention days per
  source."*) · a **`Submit`** button on open tasks (→ status `submitted`, feeds the shared
  slot state).

---

## 7. User journeys

Reset the demo before each. Each journey is a self-contained ~3–10 minute story.

---

### Journey A — Assessment Owner runs the full assessment (the headline demo, ~10 min)

**Persona:** the Ministry's assessment owner, doing a first JNCSF self-assessment.

| # | Screen | Action | What the audience sees |
|---|---|---|---|
| 0 | **Profile** | Point at the **Sector** field (Defence, Security & Government Services → *Regulator: NCSC* in the top bar). Optionally change it to **Energy** and back — the top-bar regulator flips to **EMRC** and back, everywhere. | The regulator label is sector-driven, not hardcoded. |
| 1 | **Profile** | Confirm the profile. Then set **Cloud services → No**. | Applicable drops **340 → 317**. After a beat the amber **Stage-1 challenge** appears: *"Defence, Security & Government Services entities of 250–1000 staff almost always consume at least one cloud service…"* — and **"Continue" is disabled**. |
| 1b | **Profile** *(optional CICSC beat)* | Flip **Operates critical infrastructure → on**. | A blue **CICSC scope note** appears; the **340 count does not change**. This adds a sentence to the dashboard completeness statement (step 9) and a `jccp:scope-boundary` block to the export (step 13). Leave it on for the rest of the run, or off — your call. |
| 2 | **Profile** | This is the "know what you don't know" beat — set it back: click **`Restore cloud services`**. | Applicable returns to 340; a decision is recorded (*"Cloud scope restored by Assessment Owner"*). |
| 3 | **Profile** | Click the big **`340`** number. | Opens the **exclusion register**: 236 controls, 41.0% N/A rate vs a 34% sector baseline (*above baseline*), 12 with no recorded justification. "Under-scoping is the first way a score gets inflated." Back to Profile → **`Continue to request plan →`**. |
| 4 | **Request Plan** | Read the header. Point at the **Automated (14)** vs **Manual (8)** split; hover one command → `Copy`; point at a *"Declining leaves 8 controls permanently Unknown"* line. | *"22 artifacts from 8 systems. Provide all 22 → projected coverage 94%. The other 24 are structurally uncollectable."* → **`Continue to intake →`**. |
| 5 | **Intake → Interviews** | Open **Infrastructure / Operator** → **`Play`**. | One sentence — *"we run CrowdStrike across the estate"* — decomposes into **three claims** (servers enforcing / workstations 80% / contractor exception), each stamped **`Testimony only — capped at Yellow`**. The **"Coverage fallacy defeated"** inset lands. |
| 6 | **Intake → Interviews** | Back to the role list; point at the **review queue** and the amber **conflict flag** row. | Multi-user reality: three assignees, statuses, and *"Executive and Operator disagree on MFA enforcement scope — operator wins on configuration."* |
| 7 | **Intake → Evidence bundle** | Switch tab. Click **`Simulate collector bundle upload (fills 14)`**. | 14 slots fill; the **ingestion** animation runs (partial · failed · declined); the **module ledger** appears with the rule *"a failed module yields Unknown, never Gap"*; then the green **"90 evidence gaps closed"** banner. |
| 8 | **Dashboard** | Click **`Reveal on dashboard →`**. | **THE MOMENT.** The interval band **springs** 50.0–87.1% → **70.6–81.2%** (width 37.1 → 10.6). Coverage **62.9% → 89.4%**. Assurance **L1 → L2**. The donut and per-capability bars update. |
| 9 | **Dashboard** | Scroll: the **completeness statement** (non-dismissible — and if you flipped CICSC on at step 1b, it now carries the extra "does not represent complete assurance" sentence), the **scope-exclusions** box (*"Sector baseline for Defence, Security & Government Services"*), the **"Why L2 not L3"** explainer, the **gap-reason chart** (now *"36 Unknowns after"* — down from 126). | Honesty about what is still not known. |
| 10 | **Gap Matrix** | Click *"See the 90 promoted controls…"*. Tick **"Show only what changed after evidence upload"**. | 90 controls light up with `✨ promoted`. Point at a capability header: **`worst established: ■ Gap 12 · unestablished: ◇ 62`** — two figures, never merged. |
| 11 | **Control Detail — JNCSF-102** | Open the showcase control. | State **Gap** · a 3-item **evidence trail** with a quote, `raw/ad-privileged-groups.csv row 412`, a hash, **`View raw`** · population *410 of 512 endpoints* · named exception *43 privileged accounts without MFA* · the **ATT&CK chain** to T1078 / T1548 / T1021 with a green **`Official — CICSC Threat Annex`** provenance tag on the mitigation. Open **JNCSF-307** for the contrast — a grey **`Derived — transitive via NIST`** tag. |
| 12 | **Remediation** | **All actions** tab → sort **risk-weighted**. Then **What you didn't provide** → click **`Simulate providing this`** on the SIEM inventory. | *"Enforce MFA on all privileged accounts — closes 11 controls, removes T1110/T1078/T1550."* The projected band shows *"Interval becomes 72.9–81.2% (all pass) or 70.6–78.8% (all fail)"* — a correct **outcome range**, never narrower than the real band. |
| 13 | **OSCAL Export** | **`Preview JSON`** on *Assessment Results*. Then **`Download package (.zip)`** → the review modal. | The `jccp:coverage-metadata` block carries the **interval and assurance level inside the package**; the **`jccp:scope-boundary`** block carries the CICSC boundary (`cicsc-assessed: false`). The review modal offers **redact personal data** before submission. |
| 14 | **Chat** | Ask **"Why is JNCSF-102 a gap for us?"** then **"Are we compliant enough to pass an NCSC audit?"**. | First: a **grounded** answer citing `raw/ad-privileged-groups.csv row 412` and the three techniques. Second: a **refusal** — *"I can't predict a regulator's determination."* |

---

### Journey B — Analyst reviews and overrides (~4 min)

**Persona:** an accredited assessor doing quality review after collection.

1. Top-right → **`Viewing as: Analyst`**. (Sidebar and screens unchanged from Owner, but the
   override buttons are enabled and framed as an analyst function.)
2. **Gap Matrix** → filter **state = red** → open **JNCSF-30** ("Generate audit records").
3. **Control Detail** → **Analyst actions** → **`Accept as Compliant`**. The **override
   modal** opens: *"Changing engine verdict Gap → Compliant. An override sets the evidence
   class to analyst-signed…"*.
4. Type a real justification (*"Reviewed the auditpol export and SIEM forwarding config
   directly; the three missing subcategories were enabled by GPO on 2026-09-07 and
   confirmed on 20 hosts."*) → **`Record override`**.
5. The page now shows the **override audit record** (was / now / by / at / why) and the
   evidence class is **analyst-signed**.
6. **Dashboard** → the blue **override banner**: *"1 analyst override applied. Engine
   verdict: 70.6–81.2%. With overrides: **70.9–81.5%**."* — the override **moves the
   dashboard**, transparently, showing both figures.
7. **`Review overrides`** → Gap Matrix filtered to overridden controls.
8. **OSCAL Export** → *Assessment Results* JSON now tags the finding **`analyst-attested`**
   and the metadata carries `analyst-overrides: 1`.

---

### Journey C — Executive briefing (~2 min)

**Persona:** the Director-General wants the headline, not the detail.

1. Top-right → **`Viewing as: Executive`**. The sidebar collapses to **Dashboard** and
   **Chat** only; you are redirected to the Dashboard.
2. The **reduced dashboard**: the interval card, a 4-cycle **Trend** sparkline (*"band
   narrowing as coverage improves"*), **Top 3 risks** (each links to a control), and the
   completeness statement. **No evidence, no per-control drill-down, no personal data.**
3. Open a Top-3 risk → Control Detail → the **Evidence trail is withheld**: *"Evidence
   excerpts are hidden in the Executive view — they may contain account names and other
   personal data."* The override buttons are disabled.
4. **Chat** → *"What is our compliance score?"* → the reframed answer: *"Your interval is
   70.6–81.2% at 89.4% coverage — read from the assessment, not computed by me."*

---

### Journey D — Contributor submits evidence (~2 min)

**Persona:** a SOC engineer asked to provide two exports.

1. Top-right → **`Viewing as: Contributor`**. The sidebar shows **My Tasks** only; you land
   there. **The contributor never sees the dashboard or the score.**
2. **My Tasks** — five task cards. One is **`accepted`**, one **`submitted`**, one
   **`changes requested`** (*"Retention column missing — re-export with retention days per
   source."*), two **`to do`**.
3. Click **`Submit`** on *"Provide the current IR plan and last tabletop record"* → its
   status flips to **`submitted`** (and the shared intake slot is now filled — visible to
   the Owner on the Intake screen).
4. (Optional) Switch back to **Owner** → **Intake → Evidence bundle** → that slot now shows
   `accepted`.

---

### Journey E — Regulator / national rollup (~3 min)

**Persona:** an NCSC sector analyst looking across 47 government entities.

1. Top-right → **`Viewing as: Regulator`**. The sidebar shows **OSCAL Export** and
   **National Rollup** only.
2. **OSCAL Export** → **`Preview JSON`** on any model → the package a regulator receives
   carries the **interval and assurance inside it** — not a bare percentage.
3. **National Rollup** —
   - `12 / 47` submitted · **`8` overdue** — non-submission is tracked, not hidden.
   - **Compliance distribution** over interval **lower-bound bands**, each split by
     **assurance level** (L1 grey / L2 blue / L3 green). One band is **suppressed** —
     *"fewer than 5 entities"* — so a single organisation can't be re-identified.
   - **Submission import log** — one row is **`✗ rejected — signature does not match
     published key — not ingested`**. Tampered or unsigned packages don't enter the
     aggregate.
4. Talking point: because every entity assesses against the **same pinned Catalog** (see
   the Export "national reference" card), the rollup is comparing like with like.

---

## 8. Feature index (cheat-sheet)

| Feature | Where | One line |
|---|---|---|
| Bounded interval (never a point estimate) | `ScoreInterval`, everywhere | Two endpoints + shaded band; width = cost of missing evidence |
| Four-state model + N/A + Unknown | `StateBadge`, everywhere | colour + shape + label, greyscale-safe |
| Evidence-class ceiling | Control Detail §4 | testimony → Yellow max; artifact → Green |
| Tri-state scoping toggles | Profile | `Don't know` keeps controls in scope, flags for verification |
| Sector-driven regulator | Profile sector dropdown, top bar | 8 official CICSC sectors; regulator label derived (Energy → EMRC, etc.) |
| CICSC scope boundary | Profile toggle, Dashboard, `/export` | 405-control framework; not assessed; disclosed non-dismissibly + in the OSCAL package |
| Two-stage scoping challenge | Profile / Intake / Dashboard | soft prior (typed justification) → hard post-upload contradiction |
| Exclusion register | `/exclusions`, Profile `340` click | 236 excluded, why, by what fact, unjustified flagged |
| Interval collapse (the moment) | Intake → Dashboard | 50.0–87.1% → 70.6–81.2%, springs on reveal |
| Module ledger + "never a false Red" | Intake Tab B | failed module → Unknown, not Gap |
| Typed evidence slots | Intake Tab B | 22 slots from the request plan; bundle fills 14 |
| Coverage-fallacy callout | Intake Tab A (Operator) | one sentence → four qualified claims |
| Capability health: two figures | Gap Matrix headers | worst established + unestablished, stable under filters |
| Evidence age / staleness | Dashboard, Control Detail | oldest 84 days; amber past the control's window |
| Assurance demotion explainer | Dashboard | *why L2 not L3*, and what would change it |
| ATT&CK on every control | Control Detail §5 | incl. the explicit "no mapping" state |
| ATT&CK mapping provenance | Control Detail §5 | green "Official — CICSC Threat Annex" vs grey "Derived — transitive via NIST" tag per mapping |
| Override discipline | Control Detail | mandatory justification → analyst-signed → audit trail → moves the dashboard |
| Projection as an outcome range | Remediation Tab C | best/worst band after providing an artifact; can't beat the real band |
| Merged action list | Remediation "All actions" | evidence + fixes, ranked, with acceptance criteria |
| Role switcher + RBAC matrix | Top bar, `/admin` | 5 demo roles; each boundary maps to a JNCSF control |
| Executive / Contributor scoping | Dashboard, `/tasks` | no evidence / no score for those roles |
| Signed OSCAL package + review | `/export` | coverage metadata inside; redact-PII decision before submit |
| National rollup | `/rollup` | interval bands × assurance, k-anonymity, rejected-signature log |
| Grounded chat | `/chat` | 3 evidence-grounded answers + a reframed score answer, 2 refusals, click-to-reveal citation passages, boundary footer |

---

## 9. What is deliberately *not* built

Front-end only. No backend, no real authentication, no network I/O, no real file parsing,
no real OSCAL schema validation, no real collector, no Arabic/RTL. Roles are a switcher.
The 340-applicable / before-after fixture numbers are frozen and reconcile exactly;
changing the profile after collection is a *what-if* and does not retroactively rescore
(the Stage-2 contradiction block exists precisely to surface that tension). ~48 of the 576
controls are seeded as clickable detail pages; the rest are aggregate counts.

**CICSC is disclosed, not assessed.** The prototype records that an organisation is subject
to CICSC and carries that boundary into every disclosure, but it does not evaluate any of
the 405 CICSC controls, implement the three implementation levels, or cross-reference the
CBJ maturity model. That is deliberate scope for this pass.
