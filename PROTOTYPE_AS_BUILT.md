# JCCP Prototype — As Built

A factual description of what the code in this repository actually does, written for a
collaborator who has the build spec (`CLAUDE_CODE_PROMPT.md`) but has not run the app.
Where the build diverges from that spec, it is called out. Read alongside the source;
file references are given throughout.

Documented against the working tree on 2026-09-07.

---

## 1. Overview

JCCP ("Jordan Cyber Compliance Platform") is a **front-end-only demonstration app**. It
is a Vite + React + TypeScript single-page application with a persistent sidebar shell and
nine screens. There is no backend, no network I/O except a Google Fonts stylesheet, and no
real computation — every figure on screen is a hand-authored fixture, and the "before / after
evidence upload" transformation is one boolean (`evidenceUploaded`) selecting between two
pre-written datasets.

State: **prototype-complete**. All nine screens render, the headline before/after animation
works, `tsc --noEmit` is clean, and `vite build` succeeds with no warnings. It is a
demonstration artifact, not a working assessment engine — see §9 and §13.

| | |
|---|---|
| Node | v24.15.0 (developed against; any Node 18+ is fine for Vite 5) |
| Install | `npm install` |
| Run (dev) | `npm run dev` → Vite dev server on **http://localhost:5173** |
| Build | `npm run build` → static bundle in `dist/` (runs `vite build` only; **does not typecheck** — see §13) |
| Preview build | `npm run preview` |
| Typecheck | `npx tsc --noEmit` (not part of any npm script) |

The app persists a small amount of state to `localStorage` under the key `jccp-assessment`.
A **Reset demo** button in the top bar clears it back to the initial state.

---

## 2. Dependencies as installed

From `package.json`, with the version actually resolved in `package-lock.json`:

### Runtime dependencies

| Package | Spec | Installed | Used? |
|---|---|---|---|
| `react` | ^18.3.1 | 18.3.1 | yes |
| `react-dom` | ^18.3.1 | 18.3.1 | yes |
| `react-router-dom` | ^6.26.0 | 6.30.6 | yes (routing, `Link`, `NavLink`, `useNavigate`, `useParams`) |
| `zustand` | ^4.5.4 | 4.5.7 | yes (`create` + `persist` middleware) |
| `recharts` | ^2.12.7 | 2.15.4 | yes (dashboard donut + gap-reason bar chart only) |
| `lucide-react` | ^0.427.0 | 0.427.0 | yes (icons throughout) |
| `framer-motion` | ^11.3.19 | 11.18.2 | yes (interval bar, coverage bar, list/height transitions) |

### Dev dependencies

| Package | Spec | Installed |
|---|---|---|
| `vite` | ^5.4.0 | 5.4.21 |
| `@vitejs/plugin-react` | ^4.3.1 | 4.7.0 |
| `typescript` | ^5.5.4 | 5.9.3 |
| `tailwindcss` | ^3.4.10 | 3.4.19 |
| `postcss` | ^8.4.41 | 8.5.28 |
| `autoprefixer` | ^10.4.20 | 10.5.5 |
| `@types/react` | ^18.3.3 | 18.3.31 |
| `@types/react-dom` | ^18.3.0 | 18.3.7 |

### Specced-but-not-really-used

- **Recharts** is specced ("Recharts for charts") and technically used, but only for two
  charts on the Dashboard. The signature compliance-interval bar and every per-capability
  bar are hand-built `<div>` + framer-motion, not Recharts.
- **`recharts` prints a deprecation warning on install** ("1.x and 2.x branches are no
  longer active"). Harmless; the app pins 2.x.

### Nothing used that isn't specced.

The spec's "Zustand (or React Context)" choice landed on Zustand. The spec said "Keep it
simple: two fixture datasets, selected by that flag" — the build **added `zustand/persist`**
so the demo survives a hard browser refresh (see §5).

---

## 3. Repo map

```
NCSC_Prototype/
├── index.html                     App shell; loads Inter from Google Fonts CDN
├── package.json                   scripts: dev / build / preview (build = vite build, no tsc)
├── vite.config.ts                 React plugin; port 5173; manualChunks (react/charts/motion)
├── tsconfig.json                  strict; noUnusedLocals OFF; "@/*" path alias (tsconfig only — NOT in vite)
├── tailwind.config.js             custom colours: ink.*, accent.*, state.* (state.* is unused)
├── postcss.config.js              tailwindcss + autoprefixer
├── README.md                      run instructions + 10-minute demo script
├── .claude/launch.json            dev-tool config for the preview runner (not app code)
└── src/
    ├── main.tsx                   ReactDOM root, <BrowserRouter>, <React.StrictMode>
    ├── index.css                  Tailwind layers; body bg; .tnum; .scroll-slim; .pulse-ring (UNUSED)
    ├── vite-env.d.ts              Vite client types
    ├── App.tsx                    Layout shell (Sidebar + TopBar + <main>) and all <Routes>
    │
    ├── store/
    │   └── useAssessment.ts       Zustand store, persisted to localStorage key "jccp-assessment"
    │
    ├── data/                      All fixtures. No logic beyond tiny map/find helpers.
    │   ├── capabilities.ts        6 capabilities + per-capability before/after stats + TOTALS
    │   ├── controls.ts            48 seeded controls (before/after snapshots) + gap-reason breakdown + label maps
    │   ├── standards.ts           ISO 27002 / NIST 800-53 id → name lookup tables
    │   ├── attack.ts              8 ATT&CK bridge entries (control → mitigation → techniques)
    │   ├── scenario.ts            org profile, computeApplicable(), request plan (10 rows), module ledger, bundle stages
    │   ├── interviews.ts          3 scripted interviews (turns + extracted claims + coverage-fallacy block)
    │   ├── evidence.ts            evidence-trail records for 6 controls only, incl. raw-output strings
    │   └── remediation.ts         6 remediation actions, 5 evidence requests, national-rollup fixture
    │
    ├── lib/
    │   ├── scoring.ts             boundedScore() + ASSURANCE_LEVELS. boundedScore is NEVER CALLED (see §9)
    │   └── coverage.ts            coverageBreakdown() + completenessStatement() — used by Dashboard
    │
    ├── components/
    │   ├── ui.tsx                 Card, Pill, SectionLabel, Button, CodeBlock, Kbd (Kbd UNUSED)
    │   ├── ScoreInterval.tsx      ⭐ the interval bar (hero + row variants)
    │   ├── StateBadge.tsx         colour+shape+label badge; exports STATE_META
    │   ├── CoverageBar.tsx        stacked bar component — DEAD CODE, never imported
    │   ├── ControlRow.tsx         one row in the Gap Matrix
    │   ├── EvidenceTrail.tsx      evidence list + "View raw" modal
    │   ├── AttackExposure.tsx     control → mitigation → techniques cards
    │   └── layout/
    │       ├── Sidebar.tsx        dark nav, 8 links, phase stepper, L1/L2 chip
    │       ├── TopBar.tsx         screen title, "on-premise · read-only" chip, "Reset demo" button
    │       ├── PhaseStepper.tsx   4-step progress (Profile→Planning→Intake→Assessed)
    │       └── nav.ts             NAV array (label/icon/route); PHASE_ORDER / PHASE_LABEL
    │
    └── screens/
        ├── 01_Profile.tsx         org profile form + live denominator + profile challenge
        ├── 02_RequestPlan.tsx     "22 artifacts from 6 systems" + table of 10
        ├── 03_Intake.tsx          Tab A interviews (playback) · Tab B evidence bundle (staged sim)
        ├── 04_Dashboard.tsx       interval + coverage donut + assurance + capability rows + completeness + gap-reason chart
        ├── 05_GapMatrix.tsx       6 expandable capability sections, filters, search
        ├── 06_ControlDetail.tsx   7 sections; reached only via links (/control/:id)
        ├── 07_Remediation.tsx     Tab A remediation plan · Tab B "what you didn't provide"
        ├── 08_Export.tsx          5 OSCAL model cards + JSON modal + signed hash + national rollup
        └── 09_Chat.tsx            5 canned Q&A (2 refusals) with citation chips
```

### Stubs / dead code / unused exports

| Item | Status |
|---|---|
| `components/CoverageBar.tsx` | Complete component, **never imported anywhere**. The Dashboard uses a Recharts donut + bespoke capability rows instead. |
| `lib/scoring.ts` → `boundedScore`, `yellowWeightForShare`, `pct`, `pts`, `WEIGHTS`, `YELLOW_QUARTILE` | Defined and correct; **`boundedScore` is never called**. Only `ASSURANCE_LEVELS` is imported (by the Dashboard). |
| `components/ui.tsx` → `Kbd` | Exported, never used. |
| `index.css` → `.pulse-ring` / `@keyframes pulse-ring` | Defined, never applied to any element. |
| `store` → `resetEvidence` | Superseded by `resetDemo`; still exported, no caller. |
| `store` → `resolveProfileChallenge`, `profileChallengeResolved` | In the store; **no component reads or calls them**. The Profile screen uses local `useState` for the challenge banner. |
| `data/scenario.ts` → `PROFILE_DELTAS` | Exported metadata; `computeApplicable()` hard-codes the same numbers instead of reading it. |
| `data/interviews.ts` → `interviewById` | Exported, unused (Intake uses `interviews.find`). |
| `data/capabilities.ts` → `capabilityById` | Used (ControlDetail). |
| `screens/08_Export.tsx` | Imports `Button` from `ui` but never renders it. |
| `nav.ts` → `NavItem.step`, `NavItem.phase` | Fields defined on every nav entry, read by nothing. |
| `tailwind.config.js` → `colors.state.*`, `colors.accent.soft`, `colors.accent.fg`, `colors.ink[600]` | Declared, no class uses them. |
| `tsconfig` `paths: { "@/*": ... }` | Alias declared for TS only; **not mirrored in `vite.config.ts`**, so an `@/` import would resolve in the editor but fail the build. No file currently uses `@/`. |

`tsconfig.json` sets `noUnusedLocals: false` and `noUnusedParameters: false`, which is why
the dead exports and the unused `Button` import do not fail typecheck.

---

## 4. Routes and navigation

`src/App.tsx` defines the router. All routes render inside the shared shell
(`<Sidebar/>` + `<TopBar/>` + a scrolling `<main>` capped at `max-w-6xl`).

| Path | Component | Sidebar label | Reachable how |
|---|---|---|---|
| `/` | — | — | redirects to `/profile` |
| `/profile` | `01_Profile` | Organisation Profile | sidebar |
| `/request-plan` | `02_RequestPlan` | Evidence Request Plan | sidebar; "Continue" button on Profile |
| `/intake` | `03_Intake` | Intake | sidebar; "Continue" on Request Plan; link in Dashboard banner |
| `/dashboard` | `04_Dashboard` | Compliance Dashboard | sidebar; "Reveal on dashboard" button on Intake Tab B; chat citation |
| `/gap-matrix` | `05_GapMatrix` | Gap Matrix | sidebar; link at bottom of Dashboard (post-upload); "Gap Matrix" back-link on Control Detail |
| `/control/:id` | `06_ControlDetail` | *(none)* | control rows in Gap Matrix; control-ID links in Remediation and Chat. **Not in the sidebar.** |
| `/remediation` | `07_Remediation` | Remediation & Requests | sidebar |
| `/export` | `08_Export` | OSCAL Export | sidebar; "Continue" link on Remediation |
| `/chat` | `09_Chat` | Compliance Chat | sidebar |
| `*` | — | — | redirects to `/profile` |

`/control/:id` with an unknown id (e.g. `/control/JNCSF-9999`) renders a small
"No such control." card with a link back to the Gap Matrix — it does not crash.

### The persistent shell

- **Sidebar** (`w-64`, 256 px, dark `#0b1220`): logo block, 8 nav links (active =
  `bg-ink-700` + white text), a divider, the **PhaseStepper**, another divider, and a
  status chip reading `Testimony only · L1` or `Evidence bundle loaded · L2`
  depending on `evidenceUploaded`. **The sidebar is always visible and never
  collapses** — there is no mobile/hamburger treatment.
- **TopBar**: screen title (special-cased to "Control Detail / Evidence Inspector" for
  `/control/*`), the subtitle `Ministry of Digital Services · Government · Regulator: NCSC`
  (hard-coded from `defaultProfile`, not the live store), a grey `On-premise · read-only`
  chip, and a **Reset demo** button (always shown; calls `resetDemo()`).
- **PhaseStepper**: 4 steps — Profile → Planning → Intake → Assessed. Steps before the
  current phase get a green check; the current phase is blue; later steps are grey.

### Navigation is entirely free, not gated

Any screen is reachable from the sidebar at any time. The `phase` value only advances when
you click the explicit "Continue" buttons (`Profile → planning`, `Request Plan → intake`)
or finish the bundle upload (`→ assessed`). Visiting the Dashboard via the sidebar while
still in `phase: 'profile'` is possible and shows the pre-upload numbers. Nothing blocks
out-of-order use.

---

## 5. Global state

`src/store/useAssessment.ts` — Zustand store wrapped in `persist` (localStorage key
`jccp-assessment`). Full shape as implemented:

```ts
type Phase = 'profile' | 'planning' | 'intake' | 'assessed';

interface AssessmentState {
  phase: Phase;
  profile: OrgProfile;                      // from data/scenario.ts
  evidenceUploaded: boolean;                // THE before/after switch
  interviewsCompleted: string[];            // role ids: 'operator' | 'exec' | 'defender'
  providedRequests: string[];               // evidence-request ids (Remediation Tab B)
  overriddenControls: Record<string, ControlState>;  // analyst overrides, by control id
  profileChallengeResolved: boolean;        // present, never read

  setPhase(p): void;
  setProfile(patch): void;                  // shallow-merges into profile
  setPdpl(patch): void;                     // merges into profile.pdplHoldings
  uploadEvidence(): void;                   // evidenceUploaded = true; phase = 'assessed'
  resetEvidence(): void;                    // evidenceUploaded = false  (no caller)
  resetDemo(): void;                        // resets ALL of the above to initial values
  completeInterview(id): void;              // append to interviewsCompleted (dedup)
  provideRequest(id): void;                 // append to providedRequests (dedup)
  overrideControl(id, state): void;
  clearOverride(id): void;
  resolveProfileChallenge(): void;          // sets profileChallengeResolved (no caller)
}
```

`OrgProfile` (from `data/scenario.ts`):

```ts
interface OrgProfile {
  orgName: string; sector: string; sizeBand: string;
  endpoints: number; servers: number;
  hasOperationalTech: boolean; usesCloud: boolean; crossBorderCloud: boolean;
  inHouseDevelopment: boolean; hasSOC: boolean; byodPermitted: boolean;
  pdplHoldings: { health: boolean; biometric: boolean; financial: boolean; religiousOrPolitical: boolean };
}
```

Initial values: `phase: 'profile'`, `evidenceUploaded: false`, `profile = defaultProfile`
(Ministry of Digital Services, Government, 250–1000 staff, 400 endpoints, 38 servers,
`usesCloud: true`, `hasSOC: true`, `pdplHoldings.health: true`, everything else false).

### What flips the before/after transformation

**`evidenceUploaded` alone.** It is set `true` (and `phase` set to `'assessed'`) at the end
of the bundle-upload animation in `03_Intake.tsx` (`BundlePanel`, after all 7 stages).
Every screen reads it and switches between the `before` and `after` fixture objects:

- Dashboard: `TOTALS.before` vs `TOTALS.after`; `coverageBreakdown(uploaded)`; capability
  `.before` vs `.after`; assurance L1 vs L2.
- Gap Matrix / Control Detail: `snapshotFor(control, uploaded)` returns `control.before`
  or `control.after`.
- Control Detail evidence trail: pre-upload it filters to testimonial items only.
- Sidebar chip, TopBar (Reset demo only shown when there's something to reset — actually
  shown always in current build).
- Export JSON preview: before/after coverage metadata.

### What persists vs what resets

**Persisted to localStorage** (survives a full browser refresh):
`phase`, `profile`, `evidenceUploaded`, `interviewsCompleted`, `providedRequests`,
`overriddenControls`, `profileChallengeResolved`.

**Not persisted — component-local `useState`, resets whenever you navigate away and back:**

- Intake: which tab is active, which interview role is open, interview playback position,
  bundle-stage counter.
- Gap Matrix: all four filters, the search box, which sections are expanded (`ops` opens
  by default every time).
- Remediation: which tab is active, the projected-interval `mid` value.
- Export: which JSON modal is open.
- **Chat: the entire conversation thread.** Navigating away from `/chat` discards it.
- Profile: the challenge-banner visibility flag.

Client-side navigation via the sidebar/`<Link>` does **not** reset the store (it's a SPA);
only a hard reload re-hydrates from localStorage, and `persist` makes that lossless. Before
`persist` was added, a hard reload wiped everything — that is now fixed.

### Derived vs stored

Almost everything shown is **stored fixture data**, read directly. The only meaningful
*derivation* at runtime:

- `computeApplicable(profile)` in `data/scenario.ts` — a branchy sum (baseline 340 ± fixed
  deltas) driving the Profile screen's live number.
- `coverageBreakdown()` / `completenessStatement()` — return one of two hard-coded objects
  based on `uploaded`.
- Gap Matrix "weakest child" — `reduce` over the *currently visible seeded rows* in a
  section (see §6, Gap Matrix deviations).
- Remediation Tab B projected interval — `mid ± (10.6 − Σ narrowingPts)/2`, floored at a
  2-point width. Purely cosmetic; feeds nothing.
- Analyst overrides — `overriddenControls[id] ?? snapshot.state` in Gap Matrix and Control
  Detail only.

The compliance intervals are **not** computed from `boundedScore`; they are literals in
`data/capabilities.ts` (they happen to equal what `boundedScore` would return — see §9).

---

## 6. Screen-by-screen

### 6.1 Organisation Profile — `/profile`

**Purpose.** Capture the scoping inputs and show, live, how many of the 576 JNCSF controls
apply. Demonstrate the "profile challenge" unknown-unknown defence.

**Layout (two columns, `lg:` and up; stacks below 1024 px).**

- **Left column** — one `Card` titled "Organisation profile", subtitle "Scoping inputs —
  these set which of the 576 JNCSF controls apply". Inside, top to bottom:
  - Two `<select>`s side by side: **Sector** (Government / Financial services / Healthcare /
    Energy & utilities / Telecommunications / Education) and **Size band** (`< 50 staff` /
    `50–250 staff` / `250–1000 staff` / `> 1000 staff`).
  - "Architecture toggles" label, then a 2-column grid of **6 toggle buttons** (each a full
    row: bold label + grey hint on the left, a pill switch on the right):
    | Toggle | Hint text | Effect on denominator |
    |---|---|---|
    | Has operational technology | "adds ~41 OT controls" | +41 when on |
    | Uses cloud services | "removing this shrinks the denominator" | **−23 when OFF** |
    | Cross-border cloud processing | "adds ~12 controls" | +12 when on |
    | In-house software development | "adds ~49 Development controls" | +49 when on |
    | Has a security operations centre | "no denominator change" | **0** |
    | BYOD permitted | "adds ~8 mobile controls" | +8 when on |
  - "PDPL data holdings" label, then a 2-column grid of **4 checkboxes**: Health records,
    Biometric data, Financial data, Religious or political affiliation. (Health starts
    checked.)
  - Below the card: the **Profile challenge** banner appears here when `usesCloud` is false
    (see below).
  - Bottom-right: a primary **"Continue to request plan →"** button.
- **Right column** (sticky) — `Card` "Live scoping": a big number (the applicable count,
  `text-4xl`), the caption "Applicable controls", "of 576 total", a thin accent progress
  bar (applicable / 576, spring-animated), an explanatory paragraph about under-scoping, and
  — only when `usesCloud` is false — an amber line "Cloud declared absent — 23
  cloud-conditional controls removed from scope."

**Data shown.** Default state → **340** applicable of 576. Toggling *Uses cloud services*
off → **317** (340 − 23) after the switch, and the challenge banner appears ~0.9 s later.
Turning *In-house software development* on → +49. The Sector/Size selects and the PDPL
checkboxes write to the store but **do not change the number**.

**The Profile challenge banner** (amber card, `AlertTriangle` icon):

> **Profile challenge**
> Your declared profile says no cloud services, but the evidence bundle contains cloud
> agent entries in the software inventory and cloud endpoints in firewall configuration. A
> wrong profile silently shrinks the assessment denominator and inflates your score.
> **[ Review — restore cloud scope ]  [ Keep declaration ]**

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| select | Sector | writes `profile.sector` | functional (no downstream effect) |
| select | Size band | writes `profile.sizeBand` | functional (no downstream effect) |
| toggle ×6 | (as table above) | writes the boolean; `computeApplicable` re-runs | functional — 5 of the 6 move the number (`hasOperationalTech` +41, `usesCloud` −23 when off, `crossBorderCloud` +12, `inHouseDevelopment` +49, `byodPermitted` +8); **`hasSOC` is inert** |
| checkbox ×4 | PDPL holdings | writes `profile.pdplHoldings.*` | changes local state only; nothing reads it |
| button | Review — restore cloud scope | `setProfile({ usesCloud: true })` → number returns to 340, banner auto-hides | functional |
| button | Keep declaration | hides the banner (local `setShowChallenge(false)`); **keeps `usesCloud: false` and the 317 number** | functional |
| button | Continue to request plan → | `setPhase('planning')` + navigate `/request-plan` | functional |

**Animations.** Banner: fade + 8 px slide, `AnimatePresence`. Progress bar: framer spring
(stiffness 120). Challenge trigger: 900 ms `setTimeout` after `usesCloud` becomes false
(cleared/re-armed on every change).

**Empty/error/loading.** None.

**Deviations.**
- The denominator model is a fixed lookup, not a real rule engine. `computeApplicable`
  hard-codes `+41 / −23 / +12 / +49 / +8`; the exported `PROFILE_DELTAS` table that lists
  the same numbers is not used.
- The store has `profileChallengeResolved` / `resolveProfileChallenge()` for this exact
  purpose; the screen ignores them and uses local `useState`, so "Keep declaration" does
  not record a decision anywhere.
- "Keep declaration" only hides the banner; toggling cloud off again re-shows it.
- The number `23` in the right-column note is a literal in JSX, not the
  `CLOUD_CONDITIONAL_CONTROLS` constant (same value).

---

### 6.2 Evidence Request Plan — `/request-plan`

**Purpose.** Show, before any collection, exactly which artifacts are needed.

**Layout.**

- A header `Card`: a `Server` icon in a rounded tile, then the sentence
  **"To assess your 340 applicable controls, we need 22 artifacts from 6 systems."**
  (from `REQUEST_PLAN_SUMMARY`), and a grey subtitle about "how would I know what I'm
  missing".
- A `Card` "Evidence request plan", subtitle "Top 10 of 22 artifacts", containing a
  5-column table:

  | Artifact | Source system | Controls | Effort | How to produce it |

  Rows are sorted descending by "Controls". The "How to produce it" column renders each
  command in a dark `CodeBlock` (with a hover **Copy** button).
- A primary **"Continue to intake →"** button.

**Data shown (the 10 rows, as sorted):**

| Artifact | Source | Controls | Effort | Command |
|---|---|---|---|---|
| All accounts + state | Active Directory | 22 | 3 min | `Get-ADUser -Filter * -Properties Enabled,PasswordLastSet,LastLogonDate \| Export-Csv accounts.csv` |
| Linux hardening baseline | Linux servers | 18 | 10 min | `oscap xccdf eval --profile cis --results cis-results.xml /usr/share/xml/scap/ssg/content/ssg-rhel8-ds.xml` |
| Privileged group membership | Active Directory | 14 | 2 min | `Get-ADGroupMember "Domain Admins" \| Export-Csv adm.csv` |
| EDR agent inventory | EDR console | 11 | 5 min | `Export agent list as CSV from the EDR console (Hosts → Manage → Export)` |
| Audit policy configuration | Windows | 9 | 1 min | `auditpol /get /category:* > auditpol.txt` |
| SIEM log source inventory | SIEM | 8 | 5 min | `Export source list + retention settings from the SIEM admin console` |
| Defender status | Windows endpoints | 7 | 2 min | `Get-MpComputerStatus \| Select-Object AMRunningMode,AntivirusSignatureAge,RealTimeProtectionEnabled` |
| Backup job report | Backup system | 5 | 3 min | `Export last 30 days job status from the backup console` |
| BitLocker state | Windows endpoints | 4 | 2 min | `manage-bde -status` |
| Security awareness completion | LMS | 4 | 3 min | `Export completion CSV from the LMS reporting module` |

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| button (hover) | Copy | `navigator.clipboard.writeText(command)` | functional |
| button | Continue to intake → | `setPhase('intake')` + navigate | functional |

**Animations / empty states.** None.

**Deviations.**
- The header says **22 artifacts from 6 systems** but only **10 rows** exist, across
  **8 distinct source systems** (AD, Linux, EDR console, Windows, SIEM, Windows endpoints,
  Backup, LMS). The spec's own example table also had 10 rows, so 10 is expected; "6
  systems" is an un-reconciled fixture string.
- The spec's column "Controls unlocked" is shortened to "Controls".

---

### 6.3 Intake — `/intake`

**Purpose.** The interactive centrepiece. Tab A: scripted interviews that decompose one
sentence into several claims. Tab B: the simulated evidence-bundle upload that triggers the
whole before→after reveal.

**Layout.** A segmented control at the top: **Interviews | Evidence bundle**.

#### Tab A — Interviews

- **Role list** (3 cards in a row): each shows title, persona, "`N` turns · `M` claims",
  and a status pill (`not started` / green `done`). The three:
  - **Infrastructure / Operator** — "Estate operations lead" — 8 turns · 3 claims
  - **Executive / Compliance** — "Director of governance" — 5 turns · 2 claims
  - **Defender / SOC** — "SOC team lead" — 4 turns · 2 claims
- **Clicking a card** opens a two-column view (`← All roles` back-link above it):
  - **Left** `Card` (title = role, right-aligned **Play** / **Skip** buttons): a
    chat transcript, max-height 420 px, scrolls. Agent turns are grey bubbles on the left
    ("JCCP agent"), interviewee turns are blue bubbles on the right ("Interviewee"). Below
    the transcript, once ≥ 2 turns are shown *and the role has a coverage-fallacy block*
    (operator only), an amber inset appears:
    > **Coverage fallacy defeated**
    > ~~Naive extraction: 1 compliant control~~  *(struck through)*
    > ✓ Servers enforcing — block mode
    > ✓ Workstations detect-only, ~80% installed
    > ✓ Contractor machines — no agent
    > ✓ Named exception retained for the assessment
  - **Right** `Card` "Extracted claims", subtitle "Testimony is capped at Yellow — never
    Green". Claim cards fade/scale in proportionally as the transcript advances. Each shows
    the claim text, an optional grey note, an amber pill **"Testimony only — capped at
    Yellow"**, and `conf 0.NN`.

**Scripted content (verbatim).**

*Operator* — turns: "Let's start with endpoint protection. Do you have endpoint detection
deployed across the estate?" / "Yes, we run CrowdStrike across the estate." / "Is it
configured to block, or is it detect-only?" / "It blocks on servers. On workstations it's
detect-only for now." / "What share of workstations have the agent installed?" / "Around
80%." / "Are there populations excluded from deployment?" / "Contractor machines don't have
the agent." — claims: "EDR enforcing (block mode) on all servers" (0.82), "EDR on
workstations is monitor-only, ~80% agent coverage" (0.71), "Contractor-managed machines
have no EDR agent (named exception)" (0.90).

*Executive* — "Which systems would cause the most disruption if unavailable for a day?" /
"The citizen services portal and the internal HR system." / "Do you hold data classified as
sensitive under PDPL — health, biometric, financial, religious or political?" / "Yes, HR
holds health records for medical leave." / "Noted. That brings the 48-hour
breach-notification obligation into scope." — claims: "Crown-jewel systems: citizen
services portal, internal HR system" (0.86), "PDPL-sensitive health data held in HR (medical
leave records)" (0.93).

*Defender* — "Which log sources are forwarded to your SIEM?" / "Domain controllers,
firewalls, and the EDR console." / "Are all three alert-capable, or are some collected but
not monitored?" / "Firewall logs are collected but nobody has built alerts on them." —
claims: "SIEM ingests DC, firewall and EDR logs" (0.80), "Firewall logs collected but not
alerting — no use cases built" (0.88).

**Tab A interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| button | (role card) | opens the transcript view; `setActiveRole(id)` | functional |
| button | Play | reveals one more turn every **650 ms**; on completion calls `completeInterview(id)` | functional |
| button | Skip | jumps to the last turn; calls `completeInterview(id)` | functional |
| button | ← All roles | returns to the role list | functional |

`completeInterview` flips the card's pill to green `done` (persisted). **That is the only
effect** — interview claims do not feed scoring, the Gap Matrix, or anything else.

#### Tab B — Evidence bundle

- A dashed drop-zone `Card`: `UploadCloud` icon, "Collector evidence bundle", a note that
  the drop zone is simulated, and a button **"Simulate collector bundle upload"** (label
  becomes "Bundle processed" and disables once done).
- On click: an **Ingestion** `Card` appears with a 7-line staged list, advancing one line
  every **700 ms**. Each line: an icon (✓ green / ⚠ amber / ✗ red), the label, and — once
  reached — " — {detail}". The 7 stages:
  1. Verifying signature — Ed25519 · collector build 2026.08.2  ✓
  2. Reading module execution ledger — 7 modules recorded  ✓
  3. Parsing identity.json (1,842 records) — accounts, groups, MFA state  ✓
  4. Parsing endpoint.json — partial — insufficient permission (12 of 400 hosts)  ⚠
  5. Parsing logging.json — failed — wineventlog_access_denied  ✗
  6. Module 'cloud' — declined by client  ✗
  7. Corroborating 90 claims — testimony cross-checked against artifacts  ✓
- When the list finishes: `uploadEvidence()` fires (`evidenceUploaded = true`,
  `phase = 'assessed'`), and two more blocks render:
  - **Module execution ledger** `Card` — a 4-column table (Module / Status / Detail /
    Negative-capable):
    | Module | Status | Detail | Negative-capable |
    |---|---|---|---|
    | identity | success | identity.json parsed — 1,842 records | yes |
    | endpoint | partial | insufficient permission — 12 of 400 hosts readable | no |
    | logging | failed | wineventlog_access_denied | no |
    | cloud | declined | declined by client at collection time | no |
    | configuration | success | GPO + registry baseline parsed — 214 objects | yes |
    | vulnerability | success | scanner export parsed — 3,908 findings | yes |
    | backup | success | job history parsed — 30 days | yes |

    Below the table, a grey inset: *"Only modules with status `success` may produce a
    negative finding. The `logging` module failed, so its controls remain **Unknown**, not
    Gap. A permission error must never manufacture a confident failure."*
  - A green banner: **"90 evidence gaps closed / Interval collapses 50.0–87.1% → 70.6–81.2%
    · coverage 62.9% → 89.4% · assurance L1 → L2"** and a **"Reveal on dashboard →"**
    button (client-side navigate — the interval animates because the store, not a reload,
    drives it).

**Tab B interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| button | Simulate collector bundle upload | starts the staged animation; at the end sets `evidenceUploaded`/`phase` | functional — the core demo action |
| button | Reveal on dashboard → | `navigate('/dashboard')` | functional |

**State on re-entry.** `BundlePanel` seeds its `done` flag from `evidenceUploaded`, so if
you already uploaded and come back to Tab B it shows the ledger immediately (no re-run,
no re-animation).

**Deviations.**
- Interview playback is **650 ms/turn**; spec said "~600 ms". (Trivial.)
- Spec: "As turns complete, a right-hand panel shows extracted claims appearing as cards
  with confidence scores" — done, but claims appear in proportion to turns shown
  (`round(shown/turns × claims)`), not strictly "as turns complete".
- The interview has **no downstream consequence** beyond the `done` pill. The spec implies
  claims demote/shape controls ("records collected-but-not-alerting, which demotes the
  related detection controls to Yellow") — no such linkage exists; those control states are
  fixed in the fixture.

---

### 6.4 Compliance Dashboard — `/dashboard`

**Purpose.** The headline screen: compliance as an interval, coverage, assurance, and the
before→after reveal.

**Layout, top to bottom.**

1. **Pre-upload banner** (only when `!evidenceUploaded`): amber strip — "Pre-upload state —
   testimony only. Run the collector bundle on the **Intake** screen to see the interval
   collapse."
2. **Top row, 3 cards** (`lg` grid `1.4fr / 1fr / 1fr`; stacks below 1024 px):
   - **Compliance Interval** `Card`, subtitle "Never a single percentage — the band is the
     cost of missing evidence". Inside: the `ScoreInterval` hero — two big numbers
     `50.0%` — `87.1%` (or `70.6%` — `81.2%`), a horizontal track (0–100 %) with gridlines
     at 25/50/75, a shaded accent band from lower to upper with vertical edge markers, `0%`
     / `100%` end labels, then centred: "COMPLIANCE INTERVAL", "width 37.1 points · coverage
     62.9%", and a muted subline ("Width is the cost of missing evidence. Provide 5 more
     artifacts to narrow this to ~10 points." → after upload: "Interval narrowed after the
     Windows/AD collector bundle closed 90 evidence gaps.").
   - **Coverage** `Card`, subtitle "`214 of 340` applicable controls" (`304 of 340` after).
     A Recharts donut (innerRadius 45, outerRadius 75) with 4 segments, then a legend list
     with counts:
     | Segment | colour | before | after |
     |---|---|---|---|
     | Artifact-evidenced | `#059669` | 174 | 244 |
     | Testimony only | `#d97706` | 40 | 60 |
     | Unevidenced | `#7c3aed` | 102 | 12 |
     | Structurally uncollectable | `#64748b` | 24 | 24 |
   - **Assurance level** `Card`, subtitle "How the evidence was established". A vertical
     list L0–L3; the active one (`L1` before, `L2` after) is outlined in accent and shows
     its one-line definition. Definitions:
     - L0 Declared — "Profile declared; no evidence of any kind supplied."
     - L1 Documented — "Policy and testimonial evidence only; no machine-collected artifacts."
     - L2 Tool-evidenced — "Machine-collected artifacts corroborate a majority of controls."
     - L3 Analyst-signed — "An accredited assessor has reviewed and signed the evidence set."
3. **By capability** `Card` — one row per capability. Each row: name + a
   `{G}G · {Y}Y · {R}R · {U} unknown` line (from the capability *fixture aggregate*), a
   `ScoreInterval` row-variant bar (lower% … "width X pts" … upper%), and a right-aligned
   coverage % with "COVERAGE" beneath. The **6th capability** ("Security in National Cyber
   Responsibility") renders greyed with "Not organisationally assessable — national
   obligation" and a `0 numbered controls` pill — no bar.
4. **Completeness statement** — a box with a thick 2 px slate border (no close control):
   > **COMPLETENESS STATEMENT — CANNOT BE DISMISSED**
   > This assessment covers **214 of 340** applicable controls. **126** are unevidenced.
   > **24** are outside the tool's collection reach. Assurance level: **L1 — Documented**.
   > Compliance is reported as an interval because a point estimate would conceal what was
   > not established.
   (After upload: **304 of 340**, **36** unevidenced, **24** outside reach, **L2 —
   Tool-evidenced**.)
5. **Why controls are unevidenced** `Card`, subtitle "Breakdown of the 126 Unknowns before
   the evidence bundle" — a horizontal Recharts bar chart, 7 bars with value labels:
   | Reason | count | bar colour |
   |---|---|---|
   | Not provided | 71 | violet |
   | Uncollectable by design | 24 | violet |
   | Insufficient signal | 14 | violet |
   | Declined by client | 9 | violet |
   | Insufficient permission | 5 | violet |
   | Stale | 3 | violet |
   | Not requested | 0 | slate |
   Followed by a grey inset: *"**not_requested = 0** is a design invariant. The tool always
   asks for every artifact it needs; a non-zero value here would indicate a defect in the
   request planner."*
6. **Post-upload only**: a right-aligned link "See the 90 promoted controls in the Gap
   Matrix →".

**Per-capability numbers rendered (from `data/capabilities.ts`).**

| Capability | before G/Y/R/U | before interval | before cov | after G/Y/R/U | after interval | after cov |
|---|---|---|---|---|---|---|
| Architecture & Portfolio | 8 / 3 / 1 / 10 | 43.2 – 88.6 % | 54.5 % | 12 / 4 / 2 / 4 | 63.6 – 81.8 % | 81.8 % |
| Development | 5 / 2 / 1 / 12 | 30.0 – 90.0 % | 40.0 % | 10 / 3 / 2 / 5 | 57.5 – 82.5 % | 75.0 % |
| Delivery | 24 / 6 / 2 / 8 | 67.5 – 87.5 % | 80.0 % | 28 / 7 / 2 / 3 | 78.8 – 86.3 % | 92.5 % |
| Operations | 82 / 24 / 12 / 62 | 52.2 – 86.7 % | 65.6 % | 112 / 33 / 17 / 18 | 71.4 – 81.4 % | 90.0 % |
| Foundational | 31 / 5 / 8 / 34 | 42.9 – 86.5 % | 56.4 % | 48 / 13 / 11 / 6 | 69.9 – 77.6 % | 92.3 % |
| **TOTAL** | 150 / 40 / 24 / 126 | **50.0 – 87.1 %** | **62.9 %** | 210 / 60 / 34 / 36 | **70.6 – 81.2 %** | **89.4 %** |

The per-capability "width X pts" label in the row bar is `upper − lower` (e.g. Architecture
before shows "width 45.4 pts"), whereas the hero card shows the explicit `widthPts` fixture
(37.1 / 10.6).

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| link | Intake (in banner) | navigate `/intake` | functional |
| Recharts `<Tooltip>` | — | hover shows segment/bar value | functional |
| link | See the 90 promoted controls… | navigate `/gap-matrix` | functional |

Nothing on this screen is editable. It is a pure read-out of `evidenceUploaded`.

**Animations.** The `ScoreInterval` band + edge markers spring to their new positions
(framer `spring`, stiffness 90, damping 18) when `evidenceUploaded` changes — this is the
"interval collapse". The donut and bar chart use Recharts' default entrance animation.
Because the store change is instant, the animation only *visibly* plays if you were already
on `/dashboard` (or arrive via the client-side "Reveal on dashboard" button); a hard reload
onto `/dashboard` shows the end state with no motion.

**Empty/error/loading.** None. Recharts renders nothing until it has a measured container
(momentary blank on very fast navigation).

**Deviations.**
- The gap-reason chart always shows the **before** numbers (static `GAP_REASON_BREAKDOWN`),
  even post-upload. The subtitle says "before the evidence bundle", so it's labelled, but
  it never updates.
- Coverage donut segment counts (`coverageBreakdown`) are a *third* hand-authored split,
  independent of both `TOTALS` and the seeded controls (they do reconcile to 340 and to the
  214/304 evidenced totals).

---

### 6.5 Gap Matrix — `/gap-matrix`

**Purpose.** Browse the seeded controls grouped by capability, with filters and a
"what changed" view.

**Layout.**

- **Filter `Card`** — a wrapping row of controls:
  - a search input ("Search controls…", matches id + description, case-insensitive);
  - **state** select: Any state / green / yellow / red / unknown *(lower-case option
    labels)*;
  - **evidence class** select: Any evidence class / No evidence / Testimonial / Artifact /
    Analyst-signed;
  - **gap reason** select: Any gap reason / Not provided / Declined by client / Module
    failed / Insufficient permission / Unparseable / Stale / Insufficient signal /
    Uncollectable by design / Not requested;
  - a checkbox **"Show only what changed after evidence upload"** — disabled (greyed) until
    `evidenceUploaded`.
- **6 capability blocks**, each a bordered card with a clickable header:
  - header: a chevron (rotates), the capability name, "`X` shown of `Y`" (X = seeded rows
    passing the filters, Y = `capability.totalControls`, i.e. 25 / 69 / 44 / 299 / 139),
    and on the right "weakest child" + a small `StateBadge`.
  - body (height-animated expand/collapse): the `ControlRow`s, or "No seeded controls match
    the current filters."
  - Only **Operations** is expanded on first render.
- The **6th capability** renders as a flat greyed card (no expander): "Not organisationally
  assessable — national obligation".

**`ControlRow`** (each row, links to `/control/{id}`): a `StateBadge` (small), the mono id,
the description (truncated to one line), then pills — evidence-class pill (green for
Artifact, blue for Testimonial, slate otherwise), a violet gap-reason pill if state is
`unknown`, a blue "✨ promoted" pill if highlighted, an amber "showcase" pill for
JNCSF-102 — and a chevron. Highlighted rows (post-upload changed controls) get a pale blue
background.

**Data shown.** 48 seeded control rows total, distributed 8 / 7 / 6 / 18 / 9 across the
five assessable capabilities. Full list with states in §8.

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| text input | Search controls… | filters rows by id+description | functional |
| select ×3 | state / evidence class / gap reason | filter rows | functional |
| checkbox | Show only what changed after evidence upload | filters to `uploaded && control.changed` | functional (disabled pre-upload) |
| button | capability header | expand/collapse the section | functional |
| link | (whole `ControlRow`) | navigate `/control/{id}` | functional |

**Animations.** Section body: height 0 ↔ auto (`AnimatePresence`). `ControlRow` has
`motion.div layout` so rows re-flow when filters change.

**Deviations.**
- **No "by capability" filter.** The spec lists "Filters: by state, by capability, by
  evidence class, by gap reason" — capability is the grouping instead, so there are only
  three selects + search + the changed-toggle.
- **"Weakest child" is computed over the currently-visible seeded rows in that section**,
  using severity order red > unknown > yellow > green > grey. It is not the weakest of the
  whole capability. Consequence: post-upload, **Architecture shows weakest child = Unknown**
  (its 8 seeded rows top out at Unknown via JNCSF-25) even though the capability fixture
  says Architecture has 2 Reds. It also changes as you apply filters.
- **"X shown of Y" mixes scales**: "8 shown of 25" — the 25 is the whole capability, only
  ~8 controls are seeded. A reader may misread this as "only 8 of 25 match".
- The state filter's option labels are the raw enum values (`green`, `yellow`, …), not the
  human labels used elsewhere ("Compliant", "Partial", …).

---

### 6.6 Control Detail / Evidence Inspector — `/control/:id`

**Purpose.** The auditor-facing view of a single control. Reached only by link.

**Layout (stacked cards).**

1. Back-link "← Gap Matrix".
2. **Header `Card`**: mono id, a capability pill, an amber "showcase control" pill
   (JNCSF-102 only), a blue "promoted by upload" pill (post-upload, if `control.changed`);
   the description as an `h2`; right-aligned: a large `StateBadge` (the *effective* state =
   override ?? snapshot), an evidence-class pill, and a violet gap-reason pill if Unknown.
3. **Standards mapping `Card`**: two columns — "ISO 27002" (blue pills `9.2.3 · Management
   of privileged access rights`) and "NIST 800-53" (slate pills `AC-6 · Least Privilege`).
   "—" when a control has none.
4. **Required signals `Card`**: the control's `requiredSignals` as mono chips. Each chip
   turns green with a check **iff** `evidenceUploaded && snapshot.evidenceClass ===
   'artifact'` — i.e. all-or-nothing, not per-signal.
5. **Evidence trail `Card`**: `EvidenceTrail` — one bordered item per evidence record:
   type ("Artifact"/"Testimonial") with icon, a `module: xxx` pill if present, timestamp; a
   quoted blockquote for testimonial items; a line with the mono locator, a truncated hash
   (`Hash` icon), and `source: …`; a **"View raw"** link that opens a dark modal containing
   a plausible raw dump. **If the control has no evidence records → a dashed placeholder:**
   "No evidence items recorded for this control yet. It sits at its evidence-class ceiling
   until an artifact is provided." Pre-upload, the list is filtered to testimonial items
   only.
6. **Evidence sufficiency `Card`**: a 4-cell ladder — None → Testimonial → Artifact →
   Analyst-signed. Each cell shows the class name, the ceiling `StateBadge` (glyph only),
   "ceiling: {label}", and marks the current class. Then a sentence: "This control's
   evidence is **{class}**, so it can reach at most **{ceiling}**. Testimony alone can
   never mark a control Compliant."
7. **ATT&CK exposure `Card`** — only for the 8 controls with a bridge entry.
   `AttackExposure`: three connected card groups — **Control** {id} → **Mitigation**
   {Mxxxx} {name} → one **Technique** card per technique ({Txxxx} {name}). If the effective
   state is `green` the technique cards are dimmed and the sentence reads "Because {id} is
   enforced, exposure … is mitigated by {Mxxxx}."; otherwise red technique cards and
   "Because {id} is not enforced, you are exposed to T…, T…, T….".
8. **Population data `Card`** — only if the control has `populationNote`,
   `exceptionPopulation`, or `deploymentSharePct`. Shows the population note (with a `Users`
   icon), "Deployment share: N% — partial-credit quartile applied to the Yellow weighting.",
   and a red inset "Named exception retained: …".
9. **Analyst actions `Card`**, subtitle "Local to this demo session — does not alter the
   scoring engine": buttons **Accept as Compliant** / **Override to Gap** / **Request more
   evidence** (writes `overriddenControls[id] = 'green' | 'red' | 'unknown'`), plus **Clear
   override (engine verdict: {label})** when an override exists.

**JNCSF-102 (the showcase control) renders in full:** header state **Gap** (post-upload),
evidence class **Artifact**; ISO `9.4.4`, `9.2.3`; NIST `AC-6`; required signals
`privileged_group_membership`, `mfa_enrolment_state`, `last_recertification`; **evidence
trail of 3 items** —
- testimonial, locator "Interview — Infrastructure / Operator, turn 6", quote "Around 80%
  [of workstations have the agent]. Contractor machines don't have the agent.", hash
  `9f2a…c71e`, View raw = an extraction log;
- artifact, "raw/ad-privileged-groups.csv row 412", hash `a3f1…d7e2`, module identity, View
  raw = a CSV excerpt ending "SUMMARY: 512 privileged group members · 469 MFA-enforced · 43
  without MFA · 6 stale";
- artifact, "raw/ad-computers.csv — aggregate", hash `7c04…1b90`, module identity, View raw
  = "TOTAL AD computer objects: 512 … Reconciled with EDR agent inventory: 410 (80.1%) …";

ATT&CK: **M1026 Privileged Account Management → T1078 Valid Accounts, T1548 Abuse Elevation
Control Mechanism, T1021 Remote Services**; Population: "410 of 512 endpoints (denominator:
AD computer objects). Sample ratio sufficient for estate-level claim." + "Deployment share:
80%" + red inset "Named exception retained: 43 of 512 privileged accounts have no MFA
enforcement".

**Controls with evidence-trail records (6 total):** JNCSF-102 (3), JNCSF-435 (2 — 1
testimonial + 1 artifact), JNCSF-30 (1 artifact, an `auditpol` excerpt), JNCSF-173 (1
artifact, the failed-`logging`-module note), JNCSF-394 (1 artifact, Defender status),
JNCSF-7 (1 artifact, CMDB reconcile). **The other 42 seeded controls show the dashed
"No evidence items recorded" placeholder.**

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| link | ← Gap Matrix | navigate `/gap-matrix` | functional |
| button | View raw | opens the raw-output modal | functional |
| modal backdrop / ✕ | — | closes the modal (no Escape key, no focus trap) | functional |
| button | Accept as Compliant | `overrideControl(id, 'green')` | changes **local persisted state only** — affects this badge, the Gap Matrix row, and the ATT&CK "enforced" text; **not** the Dashboard |
| button | Override to Gap | `overrideControl(id, 'red')` | same scope |
| button | Request more evidence | `overrideControl(id, 'unknown')` | same scope |
| button | Clear override | `clearOverride(id)` | reverts to the engine (fixture) verdict |

**Animations.** None beyond default.

**Deviations.**
- Most seeded controls have a thin detail page (no evidence, no ATT&CK, no population) — the
  spec implies every clickable control has an evidence trail. Only 6 do.
- "Required signals" green-check is a single boolean for all signals of a control, not a
  per-signal match.
- Analyst overrides never propagate to the Dashboard interval/coverage (by design — the
  Dashboard is fixture-driven — but a demo-er who overrides and then checks the Dashboard
  will see no change).

---

### 6.7 Remediation & Requests — `/remediation`

**Purpose.** Ranked fixes, and the "what you didn't provide" list with a projected-narrowing
toy.

**Layout.** Title row ("Remediation & evidence requests", `Wrench` icon) then a segmented
control **Remediation plan | What you didn't provide**, then a bottom link "Continue to
OSCAL export →".

**Tab A — Remediation plan.** Six numbered `Card`s, sorted by `controlsClosed` desc. Each:
a numeral badge, the action title, a row of pills ("closes **N** controls", "effort: {low
|medium|high}", the affected-assets string), a "removes exposure to" row of red technique
pills, and a row of mono control-id links (each → `/control/{id}`).

| # | Action | closes | effort | removes exposure | linked ids |
|---|---|---|---|---|---|
| 1 | Enforce MFA on all privileged accounts | 11 | medium | T1110, T1078, T1550 | JNCSF-102, 435, 440, 107, 116 |
| 2 | Enable the 3 missing audit subcategories via GPO (Object Access, Process Creation) | 9 | low | T1070, T1562 | JNCSF-30, 167, 173, 179 |
| 3 | Bring patch SLA adherence to policy on internet-facing hosts | 7 | high | T1190 | JNCSF-307, 407, 32 |
| 4 | Automate the leavers feed from HR to identity for same-day de-provisioning | 6 | medium | T1078, T1098 | JNCSF-141, 515, 139 |
| 5 | Deploy removable-media authorization policy to all workstations | 4 | low | T1200 | JNCSF-163, 105 |
| 6 | Switch workstation EDR from detect-only to block; close contractor exception | 4 | medium | T1204, T1566 | JNCSF-394, 87 |

**Tab B — What you didn't provide.**
- A **Projected interval** `Card` with a `ScoreInterval` (caption "Projected compliance
  interval"). Starts at 70.6 – 81.2 % (width 10.6). Each request you "provide" subtracts its
  `narrowingPts` from the width, keeping the midpoint fixed at **75.9 %**, floored at a
  2-point width.
- Five request `Card`s, sorted by `narrowingPts` desc:
  | Artifact | Source | unlocks | narrowing | command |
  |---|---|---|---|---|
  | SIEM log source inventory + retention | SIEM | 8 | −8.2 points | Export source list + retention settings from the SIEM admin console |
  | Linux hardening baseline (CIS) | Linux servers | 18 | −6.1 points | `oscap xccdf eval --profile cis --results cis-results.xml ssg-rhel8-ds.xml` |
  | Re-run identity module with endpoint read permission | Active Directory | 14 | −5.7 points | `Grant the collector service account "Read" on the endpoint OU, then re-run collector --module endpoint` |
  | Backup job report + restore test log | Backup system | 5 | −2.4 points | Export last 30 days job status from the backup console |
  | Security awareness completion export | LMS | 4 | −1.6 points | Export completion CSV from the LMS reporting module |
  Each card has a **"Simulate providing this"** button → `provideRequest(id)`, then the
  button becomes a disabled "✓ Provided" and the projected bar re-springs narrower.

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| button ×2 | Remediation plan / What you didn't provide | switch tab | functional |
| link (mono id) | JNCSF-xxx | navigate `/control/{id}` | functional |
| button (hover) | Copy | copy the command | functional |
| button | Simulate providing this | `provideRequest(id)` → narrows the projected bar | functional (persisted) — **affects only this screen's toy bar; not the Dashboard** |
| link | Continue to OSCAL export → | navigate `/export` | functional |

**Animations.** The projected `ScoreInterval` springs on each "provide". The `−N points`
label has a small scale-in.

**Deviations.**
- **"closes N controls" ≠ the number of linked ids** (11 vs 5, 9 vs 4, …). The count is
  decorative; the links are a sample.
- The projected-interval narrowing is **not** derived from scoring — it's a symmetric shrink
  around a hard-coded 75.9 % midpoint. Providing all five collapses the band to the 2-point
  floor (≈ 74.9 – 76.9 %). It never touches the real Dashboard interval.
- Tab B shows the *post-upload* interval as its starting point regardless of whether the
  bundle has been uploaded.
- The spec's "−8.2 points" example is present and is the top row.

---

### 6.8 OSCAL Export — `/export`

**Purpose.** Show the submission package shape, with coverage metadata inside it, plus a
national rollup.

**Layout.**

- Header `Card`: `FileJson` icon + "OSCAL submission package" + a line about coverage
  metadata travelling inside the package.
- A responsive grid of **6 cards**: 5 OSCAL model cards (**Catalog**, **Profile**, **System
  Security Plan**, **Assessment Results**, **POA&M**) each with a one-line description and a
  **"Preview JSON"** link; and a **Signed package** card (`ShieldCheck` icon, the explainer
  "Packages are signed so a submission cannot be altered undetected.", and a mono hash
  `e7c1 9a02 44bd 8f10 55ce 7731 a9b0 2d4f 88e0 1c6a 90ff 43d2`).
- **National rollup preview** `Card`, subtitle "Anonymised NCSC-facing sector view — 12
  fictional entities":
  - left: "Compliance distribution" — 4 bars: `≥ 85%` → 2, `70–85%` → 4, `55–70%` → 4,
    `< 55%` → 2 (accent bars scaled to /12);
  - right: "Most frequently failed controls" — a list with a red `N/12` pill:
    | JNCSF-435 · MFA for privileged and non-privileged access | 9/12 |
    | JNCSF-307 · Vulnerability scanning | 8/12 |
    | JNCSF-141 · Timely removal of access rights | 7/12 |
    | JNCSF-30 · Audit record generation | 7/12 |
    | JNCSF-407 · Flaw remediation | 6/12 |

**"Preview JSON" modal.** A dark modal, filename `{model}.json`, containing
`JSON.stringify(oscalDoc(model, uploaded), null, 2)` rendered as **monochrome green mono
text** (no token colouring). Every model embeds a `jccp:coverage-metadata` block:

```json
"jccp:coverage-metadata": {
  "assurance-level": "L1 — Documented",           // or "L2 — Tool-evidenced"
  "controls-applicable": 340,
  "controls-evidenced": 214,                       // 304 after
  "controls-unevidenced": 126,                     // 36 after
  "compliance-interval": { "lower": 0.5, "upper": 0.871 },   // 0.706 / 0.812 after
  "interval-width-points": 37.1,                   // 10.6 after
  "note": "Point estimates are intentionally omitted. A regulator reads the interval."
}
```

`Catalog` / `Profile` / `System Security Plan` previews are the `common` block wrapped in
one key each (nearly identical). `Assessment Results` adds a `results[].findings` array for
JNCSF-102 / 435 / 173 (states change with `uploaded`). `POA&M` adds two `poam-items`.

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| link ×5 | Preview JSON | open the JSON modal for that model | functional |
| modal backdrop / ✕ | — | close (click-outside or ✕ only) | functional |

**Animations / empty states.** None.

**Deviations.**
- Spec: "syntax-highlighted panel" — the JSON is single-colour green, not tokenised.
- 3 of the 5 model previews are near-identical stubs.
- `Button` is imported into this file and never used.

---

### 6.9 Compliance Chat — `/chat`

**Purpose.** Grounded Q&A with citations; demonstrate refusals.

**Layout.** A tall `Card` (`h-[calc(100vh-140px)]`) titled "Compliance chat", subtitle
"Grounded Q&A over the pinned catalogue — every answer carries citations". Inside: a
scrolling transcript area ("Pick a question below to start." when empty), then a divider,
then a wrap of **5 prompt-chip buttons**, then a **disabled** input-style bar reading
"Free-text input is disabled in this demo — use the grounded prompts above." (`Send` icon;
it is not a real `<input>`). Below the card, a full-width dark footer badge: **🔒 On-premise
· read-only · cannot modify the assessment**.

Asking a question appends a blue user bubble + a grey bot bubble. Bot bubbles show a red
"⊘ Refused — grounding discipline" header for the two refusals, the answer text, then
citation chips (blue = a `<Link>`, slate = plain text).

**The 5 canned pairs:**

1. **"What does JNCSF-102 require?"** → answer about least privilege; chips: `JNCSF-102`
   (→ control), `ISO 27002 · 9.2.3 …`, `ISO 27002 · 9.4.4 …`, `NIST 800-53 · AC-6 Least
   Privilege`.
2. **"Which controls cover the 48-hour breach rule?"** → cites `JNCSF-30`, `JNCSF-252`,
   `JNCSF-257`, `PDPL Art. 2023`.
3. **"What evidence do I need for JNCSF-30?"** → lists audit policy config, SIEM source
   inventory, retention settings; chips: `JNCSF-30`, `Request plan · Audit policy
   configuration` (→ `/request-plan`), `Request plan · SIEM log source inventory`.
4. **"What is our compliance score?"** → **REFUSAL**: "I'm read-only and don't compute
   scores. The scoring engine is deterministic — see the dashboard. I can explain what a
   control requires." chip: `Dashboard · Compliance interval` (→ `/dashboard`).
5. **"Tell me about JNCSF-9999"** → **REFUSAL**: "No such control exists in the pinned
   catalogue (JNCSF-1 to JNCSF-576)." chip: `Pinned catalogue: JNCSF-1 … JNCSF-576`.

**Interactive elements.**

| Element | Label | What it does | Status |
|---|---|---|---|
| button ×5 | (the question text) | append the Q + canned A; disable that chip | functional |
| link (blue chip) | e.g. JNCSF-102 | navigate to that route | functional |
| "input" bar | — | none — decorative disabled `<div>` | **inert** |

**Animations / empty / error.** None. Thread auto-scrolls to bottom on new message.

**Deviations.**
- Free-text input is a disabled bar, not a real field (acceptable — spec said "chat UI over
  a canned Q&A set").
- The thread is component-local `useState` — **not persisted**; leaving `/chat` and coming
  back clears the conversation.

---

## 7. Key components

### `ScoreInterval` (`components/ScoreInterval.tsx`) — the signature component

Props: `lower` (percent number), `upper` (percent number), `coveragePct?`, `widthPts?`,
`variant?: 'hero' | 'row'` (default `'hero'`), `caption?` (default "Compliance interval"),
`subline?`.

- **hero**: big `{lower}%` — `{upper}%` heading; a 36 px track (`bg-slate-100`, inset ring)
  with gridlines at 25/50/75; a spring-animated shaded band (`bg-accent/25`, ring
  `accent/50`) from `lower%` to `upper%`; two spring-animated 2 px accent edge markers;
  `0%`/`100%` end labels; then centred caption, "width {n} points · coverage {n}%", and the
  optional muted subline.
- **row**: just the 20 px track + band + markers, and a line "`{lower}%`   width {n} pts
   `{upper}%`".

Used by: Dashboard (hero card + one row per capability), Remediation Tab B (hero,
projected). **Never renders a bare single percentage** — always both endpoints.

### `StateBadge` (`components/StateBadge.tsx`) + `STATE_META`

Props: `state: ControlState`, `size?: 'sm'|'md'|'lg'` (default `md`), `showLabel?`
(default `true`). Renders a pill: `{glyph} {label}` with inline colours, `title="{label} —
{shape}"`.

**The five states, exactly as implemented:**

| State | Label | Glyph rendered | `shape` string (tooltip) | text colour | bg | border |
|---|---|---|---|---|---|---|
| `green` | **Compliant** | `●` | "filled circle" | `#047857` | `#ecfdf5` | `#a7f3d0` |
| `yellow` | **Partial** | `◐` | "half-filled triangle" | `#b45309` | `#fffbeb` | `#fde68a` |
| `red` | **Gap** | `■` | "filled square" | `#b91c1c` | `#fef2f2` | `#fecaca` |
| `grey` | **N/A** | `─` | "dash" | `#475569` | `#f1f5f9` | `#cbd5e1` |
| `unknown` | **Unknown** | `◇` | "hollow diamond" | `#6d28d9` | `#f5f3ff` | `#ddd6fe` |

Colour + glyph + label are all present, so the badge is readable in greyscale. **Note:** the
`yellow` glyph is `◐` (a half-*circle* character); the `shape` string says "half-filled
triangle" (inherited verbatim from the spec, which wrote "half-filled triangle ◐"). The
`grey` state is defined but **no seeded control is ever `grey`** — N/A controls exist only
as the 236 aggregate count, so the grey badge only appears as a ladder-ceiling glyph and in
the Gap Matrix "weakest child" fallback.

Used by: `ControlRow`, `ControlDetail` (header + sufficiency ladder), `GapMatrix` (weakest
child).

### `CoverageBar` (`components/CoverageBar.tsx`) — **not used**

A stacked horizontal bar (segments + legend, framer width animation). Complete, but no file
imports it. The spec listed it; the Dashboard went with a Recharts donut instead.

### `ControlRow` (`components/ControlRow.tsx`)

Props: `control: Control`, `snap: ControlSnapshot`, `highlight?: boolean`. Renders one
Gap-Matrix row as a `<Link>` (see §6.5 for the anatomy). Pale-blue background when
`highlight`.

### `EvidenceTrail` (`components/EvidenceTrail.tsx`)

Props: `items: EvidenceItem[]`. Renders the ordered list of evidence cards, or the dashed
empty-state. Owns the **"View raw" modal** (dark, `max-w-2xl`, click-outside or ✕ to close,
`<pre>` with `whitespace-pre`). No focus trap / Escape handling.

### `AttackExposure` (`components/AttackExposure.tsx`)

Props: `controlId: string`, `entry: AttackEntry`, `enforced: boolean`. Renders
Control → Mitigation → Techniques as connected cards (arrows rotate 90° on narrow
viewports), then the plain-language sentence (enforced vs exposed wording). Technique cards
dim when `enforced`.

### `ui.tsx` primitives

- `Card({ title?, subtitle?, right?, className?, children })` — white `rounded-xl` card,
  optional header row.
- `Pill({ tone, title?, children })` — tones: slate / blue / amber / red / green / violet.
- `SectionLabel` — tiny uppercase grey label.
- `Button({ variant, onClick, disabled, type })` — variants: primary (accent) / ghost /
  outline / danger.
- `CodeBlock({ code })` — dark `<pre>` with a hover **Copy** button
  (`navigator.clipboard`).
- `Kbd` — **unused**.

### Layout

- `Sidebar` — 256 px dark rail; `NAV` links; `PhaseStepper`; L1/L2 status chip.
- `TopBar` — screen title, on-premise chip, **Reset demo** button (`resetDemo()`).
- `PhaseStepper` — 4-step vertical progress from `phase`.

---

## 8. Data fixtures as built

### 8.1 Control catalogue

- **48 seeded controls** as full `Control` objects (spec said "~50"), each with a `before`
  and `after` `ControlSnapshot` (`{ state, evidenceClass, gapReason?, providedSignals }` —
  `providedSignals` is always `[]`). All 48 are clickable (`/control/:id`).
- The remaining **528** of the 576 exist only as `capability.totalControls` aggregate
  counts and the 236 not-applicable figure. There are no `grey` seeded rows.
- **6 controls have evidence-trail records** (§6.6). **8 controls have an ATT&CK bridge
  entry** (§8.3). **4 controls carry population/exception/share data** (JNCSF-102, 7, 394,
  435).
- **1 showcase control**: JNCSF-102 (`showcase: true`).
- `changed: true` on **25 of 48** seeded controls (the ones that visibly move on upload).
  JNCSF-173 and JNCSF-179 deliberately have `changed: false` — they go from
  `unknown/not_provided` to `unknown/module_failed` (the "failed module → still Unknown"
  demonstration).

**All 48 seeded controls, by capability, with before → after state (evidence class):**

*Architecture & Portfolio (8):*

| id | before | after | notes |
|---|---|---|---|
| JNCSF-1 | green (artifact) | green (artifact) | |
| JNCSF-3 | yellow (testimonial) | yellow (testimonial) | |
| JNCSF-6 | green (artifact) | green (artifact) | |
| JNCSF-7 | unknown / not_provided | **green** (artifact) | changed; ATT&CK M1013; population; evidence ×1 |
| JNCSF-8 | unknown / not_provided | **yellow** (artifact) | changed |
| JNCSF-14 | green (artifact) | green (artifact) | |
| JNCSF-20 | yellow (testimonial) | yellow (testimonial) | |
| JNCSF-25 | unknown / declined | unknown / declined | |

*Development (7):*

| id | before | after | notes |
|---|---|---|---|
| JNCSF-27 | unknown / not_provided | **green** (artifact) | changed |
| JNCSF-30 | unknown / not_provided | **red** (artifact) | changed; ATT&CK M1047; evidence ×1 |
| JNCSF-32 | yellow (testimonial) | yellow (**artifact**) | changed (class only) |
| JNCSF-39 | green (artifact) | green (artifact) | |
| JNCSF-45 | unknown / not_provided | **yellow** (artifact) | changed |
| JNCSF-46 | unknown / insufficient_signal | unknown / insufficient_signal | |
| JNCSF-87 | yellow (testimonial) | **green** (artifact) | changed |

*Delivery (6):*

| id | before | after | notes |
|---|---|---|---|
| JNCSF-96 | green (artifact) | green (artifact) | |
| JNCSF-100 | yellow (testimonial) | yellow (testimonial) | |
| JNCSF-102 | yellow (testimonial) | **red** (artifact) | **showcase**; changed; ATT&CK M1026; evidence ×3; population; share 80; exception |
| JNCSF-105 | unknown / not_provided | unknown / not_provided | |
| JNCSF-107 | green (artifact) | green (artifact) | |
| JNCSF-116 | green (artifact) | green (artifact) | |

*Operations (18):*

| id | before | after | notes |
|---|---|---|---|
| JNCSF-139 | unknown / not_provided | **green** (artifact) | changed |
| JNCSF-141 | yellow (testimonial) | **red** (artifact) | changed |
| JNCSF-142 | unknown / not_provided | **green** (artifact) | changed |
| JNCSF-146 | unknown / not_provided | **green** (artifact) | changed |
| JNCSF-163 | unknown / not_provided | **red** (artifact) | changed; ATT&CK M1028 |
| JNCSF-167 | yellow (testimonial) | yellow (testimonial) | |
| JNCSF-173 | unknown / not_provided | unknown / **module_failed** | `changed: false`; evidence ×1 |
| JNCSF-179 | unknown / not_provided | unknown / **module_failed** | `changed: false` |
| JNCSF-190 | yellow (testimonial) | yellow (testimonial) | |
| JNCSF-225 | unknown / not_provided | **green** (artifact) | changed |
| JNCSF-252 | yellow (testimonial) | yellow (testimonial) | |
| JNCSF-257 | yellow (testimonial) | **green** (artifact) | changed |
| JNCSF-307 | unknown / not_provided | **red** (artifact) | changed; ATT&CK M1051 |
| JNCSF-382 | unknown / not_provided | **yellow** (artifact) | changed |
| JNCSF-394 | yellow (testimonial) | **green** (artifact) | changed; ATT&CK M1049; evidence ×1; share 80; exception |
| JNCSF-407 | unknown / not_provided | **red** (artifact) | changed |
| JNCSF-435 | yellow (testimonial) | **red** (artifact) | changed; ATT&CK M1032; evidence ×2; exception |
| JNCSF-437 | unknown / not_provided | **green** (artifact) | changed |

*Foundational (9):*

| id | before | after | notes |
|---|---|---|---|
| JNCSF-438 | green (artifact) | green (artifact) | |
| JNCSF-440 | yellow (testimonial) | **green** (artifact) | changed; ATT&CK M1018 |
| JNCSF-459 | yellow (testimonial) | yellow (**artifact**) | changed (class only); share 78 |
| JNCSF-465 | unknown / not_provided | **green** (artifact) | changed |
| JNCSF-479 | unknown / uncollectable_by_design | unknown / uncollectable_by_design | |
| JNCSF-512 | unknown / declined | unknown / declined | |
| JNCSF-515 | yellow (testimonial) | **red** (artifact) | changed |
| JNCSF-538 | green (artifact) | green (artifact) | |
| JNCSF-573 | unknown / uncollectable_by_design | unknown / uncollectable_by_design | |

**ISO/NIST mappings:** every ref from the spec's §5.2 table is reproduced. Where the spec
wrote "(…17 total)" for JNCSF-1 / JNCSF-438, only the leading refs are stored
(AC-1, AT-1, AU-1, CA-1, CM-1 for JNCSF-1; AC-1, AT-1, AU-1 for JNCSF-438). Human-readable
names for every ref come from `data/standards.ts` (added by the build; the spec gave refs
only).

### 8.2 Capability + total fixtures — **all reconcile**

Portfolio totals (`TOTALS`): 576 total, 236 N/A, **340 applicable**.
- Before: evidenced 214, G/Y/R/U = 150/40/24/126, coverage 62.9 %, interval **50.0–87.1 %**,
  width **37.1**, assurance **L1**.
- After: evidenced 304, G/Y/R/U = 210/60/34/36, coverage 89.4 %, interval **70.6–81.2 %**,
  width **10.6**, assurance **L2**, gapsClosed 90.

Per-capability `totalControls`: arch 25, dev 69, del 44, ops 299, found 139, natl 0
(sum **576**). Per-capability before/after G/Y/R/U/coverage/interval — see the table in
§6.4.

**Reconciliation check (performed against the source):**

| Sum of 5 assessable capabilities | before | matches TOTALS.before? | after | matches TOTALS.after? |
|---|---|---|---|---|
| applicable | 22+20+40+180+78 = **340** | ✅ | 340 | ✅ |
| evidenced | 12+8+32+118+44 = **214** | ✅ | 18+15+37+162+72 = **304** | ✅ |
| green | 8+5+24+82+31 = **150** | ✅ | 12+10+28+112+48 = **210** | ✅ |
| yellow | 3+2+6+24+5 = **40** | ✅ | 4+3+7+33+13 = **60** | ✅ |
| red | 1+1+2+12+8 = **24** | ✅ | 2+2+2+17+11 = **34** | ✅ |
| unknown | 10+12+8+62+34 = **126** | ✅ | 4+5+3+18+6 = **36** | ✅ |

Every capability's interval also equals `boundedScore(applicable, g, y, r, u, 0.5)` to one
decimal place (verified by hand for all 12 rows). Gap-reason breakdown sums to 126
(71+24+14+9+5+3+0). **No fixture number fails to reconcile.**

### 8.3 ATT&CK bridge (`data/attack.ts`) — 8 entries, verbatim from the spec

| Control | Mitigation | Techniques |
|---|---|---|
| JNCSF-102 | M1026 Privileged Account Management | T1078 Valid Accounts · T1548 Abuse Elevation Control Mechanism · T1021 Remote Services |
| JNCSF-440 | M1018 User Account Management | T1078 Valid Accounts · T1098 Account Manipulation |
| JNCSF-30 | M1047 Audit | T1070 Indicator Removal · T1562 Impair Defenses |
| JNCSF-435 | M1032 Multi-factor Authentication | T1110 Brute Force · T1078 Valid Accounts · T1550 Use Alternate Authentication Material |
| JNCSF-7 | M1013 Application Developer Guidance | T1200 Hardware Additions |
| JNCSF-163 | M1028 Operating System Configuration | T1200 Hardware Additions |
| JNCSF-394 | M1049 Antivirus/Antimalware | T1204 User Execution · T1566 Phishing |
| JNCSF-307 | M1051 Update Software | T1190 Exploit Public-Facing Application |

### 8.4 Interview scripts — see §6.3 (reproduced verbatim from spec §7.4).

### 8.5 Module execution ledger (`data/scenario.ts`) — 7 modules

| Module | Status | Negative-capable | Detail |
|---|---|---|---|
| identity | success | yes | identity.json parsed — 1,842 records |
| endpoint | partial | no | insufficient permission — 12 of 400 hosts readable |
| logging | failed | no | wineventlog_access_denied |
| cloud | declined | no | declined by client at collection time |
| configuration | success | yes | GPO + registry baseline parsed — 214 objects |
| vulnerability | success | yes | scanner export parsed — 3,908 findings |
| backup | success | yes | job history parsed — 30 days |

Bundle manifest: collector `jccp-collector 2026.08.2`, `Ed25519`, hash
`a3f1c92e7b40d5188cc21e0f6b9a4d7e2f8c1b06`, 1,842 identity records, 90 claims corroborated.

### 8.6 Gap-reason breakdown (`GAP_REASON_BREAKDOWN`)

`not_provided` 71 · `uncollectable_by_design` 24 · `insufficient_signal` 14 · `declined` 9
· `insufficient_permission` 5 · `stale` 3 · `not_requested` **0** (`invariant: true`).
Sum = 126. ✅

### 8.7 Remediation & national rollup — see §6.7, §6.8. National rollup: 12 entities,
distribution 2/4/4/2, five most-failed controls.

---

## 9. Scoring implementation

`src/lib/scoring.ts`, verbatim:

```ts
export const WEIGHTS = { green: 1.0, red: 0.0 } as const;
export const YELLOW_QUARTILE = { q1: 0.85, q2: 0.5, q3: 0.25, q4: 0.1 };

export function yellowWeightForShare(sharePct: number | undefined): number {
  if (sharePct === undefined) return 0.5;
  if (sharePct >= 75) return YELLOW_QUARTILE.q1;
  if (sharePct >= 50) return YELLOW_QUARTILE.q2;
  if (sharePct >= 25) return YELLOW_QUARTILE.q3;
  return YELLOW_QUARTILE.q4;
}

export function boundedScore(
  applicable: number, green: number, yellow: number,
  red: number, unknown: number, yellowWeight = 0.5,
): BoundedScore {
  const numerator = green * WEIGHTS.green + yellow * yellowWeight + red * WEIGHTS.red;
  return {
    lower: numerator / applicable,
    upper: (numerator + unknown) / applicable,
    coverage: (applicable - unknown) / applicable,
    width: unknown / applicable,
    confidence: 1 - unknown / applicable,
  };
}
```

**Does it match the spec's verification cases?** Yes, exactly:

- `boundedScore(340, 150, 40, 24, 126)` → numerator = 150 + 20 + 0 = 170 →
  **lower 170/340 = 0.500**, **upper 296/340 = 0.8706 ≈ 0.871**,
  **coverage 214/340 = 0.6294 ≈ 0.629**. ✅
- `boundedScore(340, 210, 60, 34, 36)` → numerator = 210 + 30 + 0 = 240 →
  **lower 240/340 = 0.7059 ≈ 0.706**, **upper 276/340 = 0.8118 ≈ 0.812**,
  **coverage 304/340 = 0.8941 ≈ 0.894**. ✅

**But `boundedScore` is never called.** `grep` across `src/` finds one import from
`lib/scoring.ts` — `ASSURANCE_LEVELS`, by the Dashboard. Every interval shown in the app is
a literal in `data/capabilities.ts`. Those literals were evidently computed with this
formula (all 12 capability rows + both totals reconcile to it, verified in §8.2), so the
displayed numbers are spec-correct — they are just not produced by the function at runtime.
`yellowWeightForShare`, `pct`, `pts`, `WEIGHTS`, `YELLOW_QUARTILE` are all dead exports.

Consequence for a reviewer: the "deterministic scoring engine" the UI refers to (and that
the chat refuses to second-guess) **does not exist as executable code paths**. Analyst
overrides, "simulate providing this", and interview outcomes do not recompute anything.

---

## 10. Design system as implemented

**Palette** (`tailwind.config.js` + inline hex):

| Token | Value | Where |
|---|---|---|
| `accent` (DEFAULT) | `#1d4ed8` | buttons, active nav, interval band, links, focus outlines (`bg-accent`, `text-accent`, `/5 /10 /25 /50`) |
| `ink.900` | `#0b1220` | sidebar background |
| `ink.800` | `#111a2e` | sidebar hover |
| `ink.700` | `#1c2740` | sidebar active item, dividers |
| body bg | `#f1f5f9` (slate-100) | `index.css` |
| content bg | `slate-50` | `<main>` |
| `accent.soft` `#dbeafe`, `accent.fg` `#1e3a8a`, `ink.600` `#2b3a5c`, `state.*` | — | **declared, unused** |

State colours are the inline hex in `STATE_META` (§7), which **differ** from the chart
palette: donut = `#059669 / #d97706 / #7c3aed / #64748b`; gap-reason bars = `#7c3aed`
(violet) / `#94a3b8` (slate for the invariant zero).

**Typography.** `Inter` (weights 400/500/600/700) from Google Fonts CDN, fallback
`ui-sans-serif, system-ui, sans-serif`. Mono: `ui-monospace, SFMono-Regular, Menlo`. A
`.tnum` class applies `font-variant-numeric: tabular-nums` to every figure. Sizes are
almost entirely Tailwind `text-xs` (12) / `text-sm` (14) / `text-[11px]` / `text-[10px]`,
with `text-lg` (18, bold) for screen H2s, `text-3xl` for the interval endpoints, `text-4xl`
for the Profile live number.

**Spacing / surfaces.** Cards: `rounded-xl border border-slate-200 bg-white shadow-sm`,
`p-5` body, header `px-5 py-3.5`. Page content is `max-w-6xl` centred with `px-6 py-6`.
Pills: `rounded-md border px-2 py-0.5 text-[11px]`. Modals: fixed overlay `bg-slate-900/50`,
dark `#0f172a`-ish panel, `max-w-2xl`.

**Icons.** lucide-react throughout (`ShieldCheck`, `Building2`, `Server`, `UploadCloud`,
`AlertTriangle`, `Ban`, `Lock`, `FileJson`, `Wrench`, etc.).

**Dark mode.** None. `index.css` sets `color-scheme: light`; there are no `dark:` variants.

**Responsiveness.**
- The shell is `flex h-screen overflow-hidden`; the sidebar is a fixed **`w-64` (256 px),
  always visible, never collapsible** — there is no hamburger / drawer.
- Screen content uses `sm:` (640) and `lg:` (1024) breakpoints: the 3-card dashboard row,
  the profile 2-column layout, the standards 2-column grid, the toggle grid, and the
  intake 2-column transcript all collapse to single column below their breakpoint.
- Tables (`RequestPlan`, module ledger) sit in `overflow-x-auto` wrappers; the body never
  scrolls horizontally.
- **Where it breaks:** below ~900 px total width the 256 px sidebar leaves the content
  column cramped; below ~640 px it is effectively unusable (sidebar + content can't
  coexist, no mobile nav). The app targets laptop width and up. Verified fine at 1400×900
  and 1280×800; degraded but functional at 1024; poor below that.

---

## 11. Demo flow as it actually works

Starting from a clean state (click **Reset demo** first if anything is stored):

1. **`/profile`.** Sidebar → "Organisation Profile". Live scoping reads **340 of 576**.
   Toggle **Uses cloud services** off → number animates to **317**; ~1 s later the amber
   **Profile challenge** banner slides in. Leave it (or click **Review — restore cloud
   scope** to go back to 340). Click **Continue to request plan →**.
2. **`/request-plan`.** Header: *"To assess your 340 applicable controls, we need 22
   artifacts from 6 systems."* Table of 10, sorted by controls unlocked. Hover a command →
   **Copy**. Click **Continue to intake →**.
3. **`/intake`, Interviews tab.** Click the **Infrastructure / Operator** card → **Play**.
   Turns appear every ~0.65 s; claim cards build on the right with amber *"Testimony only —
   capped at Yellow"* pills; after ~2 turns the **Coverage fallacy defeated** inset appears.
   (Or **Skip**.) Card flips to green **done**.
4. **`/intake`, Evidence bundle tab.** Click **Simulate collector bundle upload**. The
   7-line ingestion list advances every ~0.7 s (line 4 amber, lines 5–6 red). Then the
   **Module execution ledger** table and the *"a failed module yields Unknown, never Gap"*
   rule render, plus a green **"90 evidence gaps closed"** banner. Click **Reveal on
   dashboard →**.
5. **`/dashboard` — the reveal.** Because you arrived via the in-app button (not a reload),
   the interval band **springs from 50.0–87.1 % to 70.6–81.2 %**; the numbers now read
   width **10.6 points · coverage 89.4 %**; the coverage donut and the Assurance card
   update to **L2**; the completeness box now says **304 of 340** / **36** unevidenced /
   **L2**. The per-capability rows all move.
   *Caveat:* if you instead reach `/dashboard` by hard-reloading the page, you see the end
   state with **no animation** — the spring only plays on a live store change.
6. **`/gap-matrix`.** Expand a section (Operations is open by default). Tick **"Show only
   what changed after evidence upload"** → the list filters to the promoted controls, all
   pale-blue with a "✨ promoted" pill. JNCSF-102 carries an amber "showcase" pill.
7. **`/control/JNCSF-102`.** (Click the row, or the link from Remediation/Chat.) Header
   **Gap** / **Artifact**; a 3-item evidence trail with quote, `raw/ad-privileged-groups.csv
   row 412`, hash `a3f1…d7e2`, and **View raw** modals; the evidence-sufficiency ladder;
   the **ATT&CK exposure** chain to **T1078 / T1548 / T1021**; **Population data** (410 of
   512 endpoints, 43 privileged accounts without MFA). The **Analyst actions** buttons
   toggle a local override only — the Dashboard will not change.
8. **`/remediation`, Remediation plan.** Card 1: *"Enforce MFA on all privileged accounts —
   closes 11 controls · removes exposure to T1110, T1078, T1550"*. Control-id links jump to
   detail pages.
9. **`/remediation`, What you didn't provide.** Card 1: *"SIEM log source inventory +
   retention … −8.2 points"*. Click **Simulate providing this** → the **Projected interval**
   bar springs narrower. (Toy — no effect on the real Dashboard.)
10. **`/export`.** Click **Preview JSON** on **Assessment Results** → a modal of
    OSCAL-shaped JSON including `jccp:coverage-metadata` with `compliance-interval` and
    `assurance-level` **inside the package**. The **Signed package** card shows a mock hash.
    Scroll to the **National rollup**.
11. **`/chat`.** Click **"What does JNCSF-102 require?"** → answer with citation chips
    (`JNCSF-102`, ISO 9.2.3/9.4.4, NIST AC-6). Click **"What is our compliance score?"** →
    a red **"Refused — grounding discipline"** answer. Click **"Tell me about JNCSF-9999"**
    → a second refusal.

**Steps needing a caveat / workaround:**
- Step 5: the animation only plays if you did **not** reload onto `/dashboard`. For a live
  demo, always navigate via the **Reveal on dashboard** button (or be on `/dashboard` when
  the flag flips).
- Step 4: if the bundle was already uploaded earlier in the session, Tab B shows the ledger
  immediately with no re-animation — use **Reset demo** first to replay it.
- Step 7: the "Analyst actions" produce no visible change on the Dashboard — do not present
  them as feeding the score.
- Step 9: same — the projected-interval narrowing is local to that card.

---

## 12. Deviations from the brief — consolidated

| Spec requirement | What was built | Reason / note |
|---|---|---|
| `lib/scoring.ts` as "pure functions" driving the numbers | `boundedScore` implemented correctly but **never called**; intervals are literals in `capabilities.ts` | Fixture-first build; literals were computed with the formula and do reconcile |
| Global state per spec's `AssessmentState` | Same shape **+ `providedRequests`, `profileChallengeResolved` (unused), `resetEvidence`/`resetDemo`, and `zustand/persist`** | persistence added so a hard refresh doesn't wipe the demo |
| "Keep it simple: two fixture datasets selected by that flag" | Done, but also localStorage-persisted | see above |
| `components/CoverageBar.tsx` | Built, **never imported**; Dashboard uses a Recharts donut + bespoke rows | design choice |
| Screen 4 Card 2 "Donut: evidenced / testimony-only / unevidenced / structurally uncollectable" | Recharts donut with those 4 segments, from a **third** hand-authored split (`coverageBreakdown`) | reconciles to 340 |
| ~50 seeded controls | **48** | within "~50" |
| Control catalogue ISO/NIST refs | All refs reproduced; "(…17 total)" truncated to the listed refs; **ISO/NIST names added** (`standards.ts`) | spec gave refs only |
| Screen 5 filters "by state, **by capability**, by evidence class, by gap reason" | state / evidence-class / gap-reason selects + search + changed-toggle. **No capability filter** (capability is the section grouping) | |
| Screen 5 "Parent capability header shows the state of its weakest child" | Implemented, but computed over **currently-visible seeded rows only**, so it can disagree with the capability fixture and changes with filters | |
| Screen 5 row count | "X shown of Y" where Y = whole-capability total (25/69/…), X = seeded matches | reads ambiguously |
| Screen 6 evidence trail on "any seeded control" | **6 of 48** controls have evidence records; the other 42 show an empty-state placeholder | only the demo-relevant controls were fleshed out |
| Screen 6 "Required signals" checkmarks | One all-or-nothing boolean per control (`uploaded && class==='artifact'`), not per-signal | |
| Screen 7 remediation "controls it closes" | A decorative count (11, 9, …) that **doesn't equal** the linked control-ID list length (5, 4, …) | |
| Screen 7 Tab B "projected interval narrowing" | Cosmetic symmetric shrink around a fixed 75.9 % midpoint, floored at 2 pts; **no effect on the Dashboard** | it's a "toy" as the spec allows ("re-runs the narrowing animation") but it isn't derived from scoring |
| Screen 8 "syntax-highlighted panel of OSCAL JSON" | Monochrome green mono text (not tokenised); 3 of 5 model previews near-identical stubs | |
| Screen 8 `Button` import | imported, unused | dead import |
| Screen 9 chat | 5 canned pairs, **free-text bar is a disabled decoration**; thread **not persisted** | spec said "canned Q&A set", so canned is fine; non-persistence is a gap |
| Screen 2 header "22 artifacts from 6 systems" | 10 rows across 8 named systems | un-reconciled fixture string (spec's own example had 10 rows) |
| Screen 1 challenge uses `profileChallengeResolved` | Screen uses local `useState`; the store fields exist but are dead | |
| Screen 1 denominator model | `computeApplicable` hard-codes ±deltas; `PROFILE_DELTAS` table unused | |
| Interview playback "~600 ms per turn" | 650 ms | trivial |
| Interview claims "demote related detection controls to Yellow" | Claims are display-only; no control state is derived from them | |
| Dashboard gap-reason chart | Always shows the *before* 126-Unknown breakdown, even post-upload | subtitle labels it "before the evidence bundle" |
| "Reset demo" button | **Added** (not in spec) — resets the whole store | useful for re-running the demo |
| `data/standards.ts`, `components/ui.tsx`, `nav.ts` | **Added** helper/primitive files | scaffolding |
| `vite.config.ts` `manualChunks` | **Added** to silence the 500 kB chunk warning | |
| Fonts | Inter pulled from Google Fonts CDN | an "on-premise" tool would fall back to system fonts offline |
| Yellow badge shape | Glyph `◐` (half-circle) with `shape` text "half-filled triangle" | inherited verbatim from the spec's own table |

---

## 13. Known issues and incomplete work

**Behavioural / architectural**

1. **The scoring engine is not executable.** `boundedScore` is never invoked; all intervals
   are static fixtures. Overrides, provided-requests, and interviews recompute nothing. If a
   collaborator expects the Dashboard to react to Control-Detail overrides, it won't.
2. **The Dashboard reveal animation only plays on a live store change.** Hard-reloading onto
   `/dashboard` (or onto it after the flag is already set) shows the end state statically.
3. **Analyst overrides are invisible outside Gap Matrix / Control Detail.** Overriding
   JNCSF-102 to Compliant and returning to the Dashboard shows no change — could read as a
   bug during a demo.
4. **Gap Matrix "weakest child"** is computed over visible/filtered seeded rows, so it (a)
   can contradict the capability's own fixture (Architecture shows Unknown while the fixture
   has 2 Reds) and (b) changes as you filter.
5. **Chat history is not persisted** and is wiped on navigation away from `/chat`.
6. **`build` script does not typecheck** (`"build": "vite build"`). Type errors ship. Run
   `npx tsc --noEmit` manually — it is currently clean.
7. **`@/*` path alias** is in `tsconfig.json` but not `vite.config.ts`; any `@/` import
   would break the build. None exist today.
8. **Google Fonts CDN dependency** contradicts the "on-premise / air-gapped" positioning —
   offline, the UI silently falls back to system sans.

**Fixture inconsistencies (all cosmetic — none break a screen)**

9. Request Plan: "22 artifacts from 6 systems" vs 10 rows / 8 systems shown.
10. Remediation: "closes N controls" (11, 9, 7, 6, 4, 4) ≠ linked-id-list lengths
    (5, 4, 3, 3, 2, 2).
11. Remediation Tab B projected interval: decorative shrink around a hard-coded 75.9 %
    midpoint; providing all 5 requests floors it at a 2-pt band (~74.9–76.9 %).
12. Dashboard gap-reason chart never updates post-upload.
13. `number 23` literal in Profile's cloud note instead of the `CLOUD_CONDITIONAL_CONTROLS`
    constant (same value).

**Dead code / lint debt** — see §3: `CoverageBar`, `Kbd`, `.pulse-ring`, `resetEvidence`,
`yellowWeightForShare`/`pct`/`pts`, `PROFILE_DELTAS`, `interviewById`,
`resolveProfileChallenge`/`profileChallengeResolved`, unused `Button` import in Export,
unused Tailwind tokens (`state.*`, `accent.soft`, `accent.fg`, `ink.600`), unused
`NavItem.step`/`.phase`.

**Accessibility gaps**

14. Profile toggles are `<button>`s with a visual switch but **no `role="switch"` /
    `aria-checked`**.
15. Tab strips (Intake, Remediation) and the segmented control are plain `<button>`s with
    **no `role="tab"` / `aria-selected`**.
16. Modals ("View raw", "Preview JSON") have **no `role="dialog"`, no focus trap, no
    Escape-to-close, no aria-label** — click-outside / ✕ only.
17. Charts have no text alternative beyond the adjacent legend list.
18. Some secondary text is `text-slate-400` on white (contrast ~3:1 — below AA for body
    text).
19. No skip-link; landmark roles are only the implicit `<aside>`/`<header>`/`<main>`.
20. **Passes** the spec's explicit a11y requirement: every state badge carries colour +
    icon shape + text label and is greyscale-legible.

**Runtime robustness**

21. **No error boundary.** A render error in any screen blanks the whole app. (Observed once
    from a stale Vite HMR module mid-development; **not reproducible on a clean
    `npm run dev` + load** — `tsc` and `vite build` are clean and every screen was
    re-verified.)
22. `React.StrictMode` double-invokes effects in dev; the interview/bundle timers have
    cleanup so this is handled, but the bundle animation cannot be restarted without
    **Reset demo**.

---

## 14. Acceptance checklist status

From spec §12, plus the specific checks requested:

| Item | Status | Note |
|---|---|---|
| `npm install && npm run dev` works from a clean clone | **Pass** | Vite 5, dev server on 5173; `vite build` also clean (no chunk warning after `manualChunks`) |
| **No single compliance percentage anywhere** | **Pass (with nuance)** | No point estimate of *compliance* is ever rendered — `ScoreInterval` always shows both endpoints. **Coverage** percentages (62.9 %, 89.4 %, per-capability), the Profile denominator, and national-rollup bands *are* shown as single numbers — but the spec's own mock-ups show "coverage 62.9%", so this is intended. |
| Before/after transition animates and numbers match §6 exactly | **Pass** | All fixtures reconcile (§8.2); the interval band springs on the live flag change. Only caveat: no animation on a hard reload onto `/dashboard`. |
| Every state badge = colour **and** shape **and** text label; greyscale-readable | **Pass** | `STATE_META` (§7). Caveat: the yellow glyph is `◐` not a triangle, but colour+label still disambiguate. |
| Completeness statement present and non-dismissible | **Pass** | Bordered box on the Dashboard, no close control, always rendered. |
| `not_requested = 0` shown and annotated as a design invariant | **Pass** | 7th bar on the gap-reason chart (slate, value 0) + the inset "**not_requested = 0** is a design invariant …". |
| Module ledger shows partial / failed / declined + "never a false Red" rule | **Pass** | 7-row table with all four status types; the `success`-only-negative rule stated in the inset. |
| JNCSF-102 fully fleshed: evidence trail, hash, population, ATT&CK chain | **Pass** | 3 evidence items (1 quote + 2 artifacts), truncated SHA-256, "View raw" modals, population 410/512, exception 43/512, ATT&CK M1026 → T1078/T1548/T1021, state Gap. |
| Sixth capability appears, marked not organisationally assessable | **Pass** | "Security in National Cyber Responsibility", greyed, on both Dashboard and Gap Matrix. |
| Chat refuses to produce a score **and** refuses an invalid control ID | **Pass** | Prompts 4 and 5; both render the red "Refused — grounding discipline" treatment. |
| Profile challenge fires when cloud declared absent | **Pass** | ~0.9 s after `usesCloud` → false; denominator drops 340 → 317; [Review] / [Keep declaration]. |
| All 6 capabilities, ~50 seeded real controls, correct ISO/NIST mappings | **Pass** | 6 capabilities; **48** seeded controls; all spec ISO/NIST refs reproduced (+ names added). |
| Loads fast; no console errors; responsive to laptop width | **Partial** | Clean load = no console errors (verified on a fresh server). Responsive **to laptop width only** — the fixed 256 px sidebar never collapses, so < ~900 px is cramped and < 640 px unusable. |

Additional spec-§12 line "The before/after upload transition animates" — **Pass** for the
interval; the coverage donut / assurance card / capability rows update but via Recharts
default animation or an instant swap, not a bespoke transition.

---

## 15. Screenshots

**Not saved to `docs/screenshots/`.** The app was run (`npm run dev`, port 5173) and every
screen was visually verified in a browser during this review — the before/after reveal, the
profile challenge, the interview playback, the bundle ingestion, the JNCSF-102 detail page,
the chat refusals, and the OSCAL JSON modal all render as described. However, the review
tooling available here can display browser screenshots but cannot write them to disk as
files, so there are no image files to reference. §6 is written in enough layout detail to
sketch each screen; the fixture values in §6 and §8 are quoted from source.

If screenshots are needed, run `npm run dev` and capture: `/profile` (with cloud toggled
off to show the challenge), `/dashboard` before and after upload, `/intake` bundle tab
mid-ingestion, `/gap-matrix` with "show only changed" on, `/control/JNCSF-102`,
`/remediation` both tabs, `/export` with a JSON modal open, `/chat` after the two refusals.

---

## Terminal summary

- **Screens documented:** 9 (Profile, Request Plan, Intake, Dashboard, Gap Matrix, Control
  Detail, Remediation, OSCAL Export, Chat) + the shared shell.
- **Deviations found:** ~30, consolidated in §12 (the material ones: scoring function never
  called, persistence added, CoverageBar unused, no capability filter, weakest-child scoped
  to visible rows, only 6/48 controls have evidence trails, remediation counts don't match
  linked IDs, projected-narrowing is decorative, chat not persisted, "22 artifacts/6
  systems" vs 10 rows).
- **Top 3 to fix before a live demo:**
  1. **Make the Dashboard reveal reliable** — it does not animate on a hard reload onto
     `/dashboard`; drive the demo through the "Reveal on dashboard" button and/or trigger
     the spring on mount when `evidenceUploaded` is already true.
  2. **Decide what analyst overrides and "simulate providing this" should visibly do** —
     right now they change nothing a presenter would point at, which reads as broken. Either
     wire them to a recomputed interval (via the existing `boundedScore`) or relabel them
     clearly as illustrative.
  3. **Fix the two viewer-facing fixture mismatches** — "22 artifacts from 6 systems"
     (10 rows shown) and remediation "closes N controls" (N ≠ linked IDs) — since a
     capstone panel will read those numbers literally.
