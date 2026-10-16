# JCCP prototype — inventory

A read-only description of what is in this repository, written so that someone who has never
opened it can plan surgical changes. It describes; it does not recommend or judge.

## How to read this document

- Every statement about the code carries a `path:line` reference. A range is written `path:start-end`. Paths are relative to the repository root; after the first mention in a cell a bare file name such as `04_Dashboard.tsx:233` is used for brevity (each file name is unique in the repository).
- Text in backticks is one of: an exact quotation from the cited line or range (JSX that wraps across lines is joined), an identifier or expression from the code, or a computed value. Values I computed by running the repository's own functions are labelled `computed` or `derived`; nothing was estimated.
- **"could not determine"** means the code did not let me establish the fact; the text says what I looked at.
- The `Origin` column in Section D uses exactly these five values: `hardcoded` (a literal written into the source), `fixture` (from a mock/sample/seed data file, which is named), `derived` (computed in the browser, expression given), `fetched` (network call; there are none, see G), `user input` (typed or selected in the UI).
- Judgement calls on `Origin`: files under `src/data/` are treated as `fixture`. Literals written inside components, `src/lib/` or `src/tour/` are treated as `hardcoded`. `src/tour/*.ts` are copy/content modules rather than mock datasets, so their text is `hardcoded`.
- Commit inspected: `ebd07e2a0c95d179d58d3b177e21efe5daec3d2b` (branch `claude/compassionate-darwin-i74nwh`, identical to `master` at the start of the session; `git status` was clean).
- Three Markdown files already exist in the repository root (`README.md`, `PROTOTYPE_AS_BUILT.md`, `DEMO_GUIDE.md`). They were **not** used as sources for anything below. Where they disagree with the code, that is recorded in Section L.

---

## A. Orientation

### A.1 Stack (versions are the ones resolved in `package-lock.json`)

| Concern | Choice | Version in lock file | Evidence |
|---|---|---|---|
| UI framework | React | `18.3.1` | `package-lock.json:2594`; declared `"react": "^18.3.1"` at `package.json:15`; `react-dom` `18.3.1` at `package-lock.json:2606` |
| Language | TypeScript (`strict`, `jsx: react-jsx`, target `ES2020`) | `5.9.3` | `package-lock.json:3060`; `tsconfig.json:15`, `tsconfig.json:14`, `tsconfig.json:3` |
| Build tool / dev server | Vite (with `@vitejs/plugin-react`) | `5.4.21` (plugin `4.7.0`) | `package-lock.json:3143`, `package-lock.json:1392`; `vite.config.ts:7` |
| Package manager | npm (lockfile v3). No `yarn.lock` or `pnpm-lock.yaml` is tracked | lockfileVersion `3` | `package-lock.json:4`; `git ls-files` lists only `package-lock.json` |
| Styling | Tailwind CSS 3 + PostCSS + autoprefixer, plus one global stylesheet | tailwindcss `3.4.19`, postcss `8.5.28`, autoprefixer `10.5.5` | `package-lock.json:2919`, `package-lock.json:2393`, `package-lock.json:1441`; `tailwind.config.js`, `postcss.config.js:1-6`, `src/index.css:1-3` |
| State library | Zustand with the `persist` middleware | `4.5.7` | `package-lock.json:3210`; `src/store/useAssessment.ts:1-2` |
| Routing library | React Router DOM, `HashRouter` | `6.30.6` (`react-router` also `6.30.6`) | `package-lock.json:2650`, `package-lock.json:2635`; `src/main.tsx:12` |
| Chart library | Recharts | `2.15.4` | `package-lock.json:2718`; imported only in `src/screens/04_Dashboard.tsx:3-14` |
| Animation | framer-motion | `11.18.2` | `package-lock.json:1982` |
| Icons | lucide-react | `0.427.0` | `package-lock.json:2231` |
| Font | `@fontsource-variable/inter` (self-hosted) | `5.3.0` | `package-lock.json:727`; `src/main.tsx:4` |

Several visuals are not Recharts: the compliance interval band is hand-built divs (`src/components/ScoreInterval.tsx:51-92`), the Executive "Trend" is hand-built divs (`src/screens/04_Dashboard.tsx:63-75`), and the National Rollup bars are hand-built divs (`src/screens/13_Rollup.tsx:44-58`).

### A.2 Commands

| Purpose | Command | Evidence |
|---|---|---|
| Install | `npm ci` (what CI runs). `README.md` says `npm install` | `.github/workflows/deploy.yml:26`; `README.md:23` |
| Run in dev | `npm run dev` (runs `vite`; port `5173`, `open: false`) | `package.json:7`; `vite.config.ts:8`; `.claude/launch.json:6-8` (a Claude Code launch config also targets `npm run dev` on port 5173) |
| Build | `npm run build` = `tsc --noEmit && vite build` | `package.json:8` |
| Preview a build | `npm run preview` = `vite preview` | `package.json:9` |

There is no `engines` field in `package.json`, so the required Node version is **could not determine**. CI uses Node `20` (`.github/workflows/deploy.yml:24`). This session used Node `v22.22.0` / npm `10.9.4`.

### A.3 Entry point

`index.html:6` sets the title `JCCP — Jordan Cyber Compliance Platform`; `index.html:9` is `<div id="root"></div>`; `index.html:10` loads `/src/main.tsx`. `src/main.tsx:10-16` renders `<React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>` into `#root`, after importing the font (`src/main.tsx:4`) and `./index.css` (`src/main.tsx:6`). `src/App.tsx:38-76` is the application shell and the route table.

### A.4 Folder map

| Path | Holds |
|---|---|
| `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js` | Build and tooling configuration |
| `.github/workflows/deploy.yml` | The only CI workflow: build and deploy to GitHub Pages |
| `.claude/launch.json` | A Claude Code dev-server launch config (not application code) |
| `README.md`, `DEMO_GUIDE.md`, `PROTOTYPE_AS_BUILT.md` | Pre-existing prose documents (not used as sources here) |
| `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/vite-env.d.ts` | Shell and route table, bootstrap, global CSS, Vite type reference |
| `src/screens/` (13 files) | One file per page, numbered `01_`…`13_` |
| `src/components/` (7 files) | Shared presentational components (`ui.tsx` holds 6 small primitives) |
| `src/components/layout/` (4 files) | Sidebar, top bar, phase stepper, and the navigation table `nav.ts` |
| `src/data/` (12 files) | All mock/seed data ("fixtures"): controls, capability totals, evidence, scenario, exclusions, etc. |
| `src/lib/` (3 files) | Pure scoring/coverage/derivation helpers |
| `src/store/` (1 file) | The single Zustand store `useAssessment.ts` |
| `src/tour/` (7 files) | Guided tour engine, welcome modal, per-screen help, glossary tooltips and their copy |
| `docs/` | Contains only this file (created by this task) |
| `node_modules/`, `dist/` | Not tracked (`.gitignore:1-2`). They exist on disk only because this task ran install and build |

### A.5 Install and production build — run once, results

Both were run from the repository root on a clean checkout (no `node_modules`).

**Install — SUCCEEDED** (`npm ci`, exit code `0`). Output of note:

```
npm warn deprecated recharts@2.15.4: 1.x and 2.x branches are no longer active. Bump to Recharts v3 to receive latest features and bugfixes. See https://github.com/recharts/recharts/wiki/3.0-migration-guide
added 182 packages, and audited 183 packages in 6s
12 vulnerabilities (5 moderate, 7 high)
```

**Production build — SUCCEEDED** (`npm run build`, exit code `0`). `tsc --noEmit` printed no errors, then:

```
vite v5.4.21 building for production...
✓ 2775 modules transformed.
dist/index.html                                              0.66 kB │ gzip:   0.35 kB
dist/assets/index-Bd_i6vuB.css                              32.97 kB │ gzip:   6.70 kB
dist/assets/motion-Ct5Xfmig.js                             115.26 kB │ gzip:  38.24 kB
dist/assets/react-Db5HS6QK.js                              164.79 kB │ gzip:  53.78 kB
dist/assets/index-0HlEP34F.js                              252.84 kB │ gzip:  69.25 kB
dist/assets/charts-rE-ahWxC.js                             392.54 kB │ gzip: 106.59 kB
✓ built in 5.19s
```

(plus seven `inter-*-wght-normal-*.woff2` font files). The three chunks `react`, `charts`, `motion` come from `vite.config.ts:12-16`. No code, lock file or config was changed by either command (`git status` clean afterwards). Nothing was fixed.

---

## B. Pages and routes

### B.1 Route table

The router is `HashRouter` (`src/main.tsx:12`), so URLs look like `/#/dashboard` (`src/main.tsx:8-9`). All routes are declared in one `<Routes>` block, wrapped by `RoleGate`, at `src/App.tsx:49-67`.

| # | Path | Declared at | Renders | What the page shows | Reached from |
|---|---|---|---|---|---|
| 1 | `/` | `src/App.tsx:51` | `<Navigate to="/profile" replace />` | Nothing (redirect) | Initial load with an empty hash |
| 2 | `/profile` | `src/App.tsx:52` | `Profile` (`src/screens/01_Profile.tsx:73`) | Organisation profile form, five applicability toggles, cloud and critical-infrastructure toggles, PDPL checkboxes, scoping-challenge banners, and a "Live scoping" card with the applicable-control count | Sidebar `Organisation Profile` (`src/components/layout/nav.ts:28`); redirect target of `/` and `*`; link in `src/screens/04_Dashboard.tsx:188` and `src/screens/03_Intake.tsx:363` |
| 3 | `/request-plan` | `src/App.tsx:53` | `RequestPlan` (`src/screens/02_RequestPlan.tsx:55`) | Headline, Automated table, Manual table, "Full plan" table of the evidence artifacts to collect | Sidebar `Evidence Request Plan` (`nav.ts:29`); button `Continue to request plan` (`src/screens/01_Profile.tsx:325-334`) |
| 4 | `/intake` | `src/App.tsx:54` | `Intake` (`src/screens/03_Intake.tsx:343`) | Two tabs: `Interviews` (scripted interviews, review queue) and `Evidence bundle` (artifact slots, simulated bundle ingestion, module ledger) | Sidebar `Intake` (`nav.ts:30`); button `Continue to intake` (`src/screens/02_RequestPlan.tsx:139-146`); link in `src/screens/04_Dashboard.tsx:172`; chat citation (`src/screens/09_Chat.tsx:47`) |
| 5 | `/dashboard` | `src/App.tsx:55` | `Dashboard` (`src/screens/04_Dashboard.tsx:127`); renders `ExecutiveDashboard` (`04_Dashboard.tsx:38`) when role is `executive` (`04_Dashboard.tsx:136`) | Compliance interval, coverage donut, assurance ladder, per-capability rows, risk-weighting toggle, completeness statement, exclusions summary, gap-reason chart | Sidebar `Compliance Dashboard` (`nav.ts:31`); button `Reveal on dashboard` (`src/screens/03_Intake.tsx:331`); link in `src/screens/10_Exclusions.tsx:37`; chat citations (`src/screens/09_Chat.tsx:48`, `09_Chat.tsx:74`, `09_Chat.tsx:81`) |
| 6 | `/gap-matrix` | `src/App.tsx:56` | `GapMatrix` (`src/screens/05_GapMatrix.tsx:30`) | Filter bar plus the five assessable capabilities as collapsible groups listing the 48 seeded controls | Sidebar `Gap Matrix` (`nav.ts:32`); links `/gap-matrix?cap=<id>` (`src/screens/04_Dashboard.tsx:333`), `?overrides=1` (`04_Dashboard.tsx:210`), `?changed=1` (`04_Dashboard.tsx:525`); tour route (`src/tour/steps.ts:251`, `steps.ts:259`); back links (`src/screens/06_ControlDetail.tsx:88`, `06_ControlDetail.tsx:119`) |
| 7 | `/control/:id` | `src/App.tsx:57` | `ControlDetail` (`src/screens/06_ControlDetail.tsx:73`) | One control: state, standards mapping, evidence trail, evidence ladder, ATT&CK exposure, population data, "How to evidence this", analyst override actions, related controls. Unknown id → `No such control.` (`06_ControlDetail.tsx:84-92`) | **No sidebar entry.** Only via links: `ControlRow` (`src/components/ControlRow.tsx:31`), `src/screens/04_Dashboard.tsx:87` and `04_Dashboard.tsx:277`, `src/screens/07_Remediation.tsx:49`, `src/screens/11_Admin.tsx:128`, `src/screens/06_ControlDetail.tsx:329`, chat chips (`src/screens/09_Chat.tsx:25`…`09_Chat.tsx:67`), tour (`src/tour/steps.ts:269`, `steps.ts:277`, `steps.ts:285`) |
| 8 | `/remediation` | `src/App.tsx:58` | `Remediation` (`src/screens/07_Remediation.tsx:255`) | Three tabs: `All actions` (default), `Remediation plan`, `What you didn't provide` | Sidebar `Remediation & Requests` (`nav.ts:35`); links `src/screens/04_Dashboard.tsx:238`, `src/screens/06_ControlDetail.tsx:282` |
| 9 | `/export` | `src/App.tsx:59` | `ExportScreen` (`src/screens/08_Export.tsx:136`) | OSCAL package: five model cards with a JSON preview modal, signing card, pre-submission review modal | Sidebar `OSCAL Export` (`nav.ts:36`); link `Continue to OSCAL export` (`src/screens/07_Remediation.tsx:285`) |
| 10 | `/chat` | `src/App.tsx:60` | `Chat` (`src/screens/09_Chat.tsx:115`) | Canned question buttons and scripted answers with citation chips; free-text disabled | Sidebar `Compliance Chat` (`nav.ts:39`) |
| 11 | `/exclusions` | `src/App.tsx:61` | `Exclusions` (`src/screens/10_Exclusions.tsx:12`) | Scope-exclusion register: stats, counts by capability and by trigger, 19-row table with filters | Sidebar `Scope Exclusions` (`nav.ts:33`); `view exclusion register` (`src/screens/01_Profile.tsx:346`); `Review all … exclusions →` (`src/screens/04_Dashboard.tsx:470-474`); chat citation (`src/screens/09_Chat.tsx:82`) |
| 12 | `/admin` | `src/App.tsx:62` | `Admin` (`src/screens/11_Admin.tsx:87`) | RBAC matrix (7 features × 6 roles) | Sidebar `Roles & Access` (`nav.ts:38`) |
| 13 | `/tasks` | `src/App.tsx:63` | `Tasks` (`src/screens/12_Tasks.tsx:9`) | Contributor's task list with Submit buttons | Sidebar `My Tasks` (`nav.ts:34`), role `contributor` only |
| 14 | `/rollup` | `src/App.tsx:64` | `Rollup` (`src/screens/13_Rollup.tsx:7`) | National rollup: counts, distribution bars, most-failed controls, import log | Sidebar `National Rollup` (`nav.ts:37`); link `National rollup (Analyst / Regulator)` (`src/screens/08_Export.tsx:217-219`) |
| 15 | `*` | `src/App.tsx:65` | `<Navigate to="/profile" replace />` | Nothing (redirect) | Any unknown hash path |

Count: 13 page components, 1 parameterised route (`/control/:id`), 2 redirect routes (`/`, `*`) = 15 `<Route>` elements (`src/App.tsx:51-65`).

### B.2 Navigation structure

- **Sidebar** (`src/components/layout/Sidebar.tsx:56-76`): renders `NavLink`s from `navForRole(role)` (`src/components/layout/nav.ts:42-44`) in the order of the `NAV` array (`nav.ts:27-40`). It is fixed on `lg` screens and an off-canvas drawer below that (`Sidebar.tsx:31-33`, backdrop at `Sidebar.tsx:22-28`, opened by the hamburger at `src/components/layout/TopBar.tsx:31-37`, closed on route change at `Sidebar.tsx:17`).
- **Sidebar footer**: `PhaseStepper` (`src/components/layout/PhaseStepper.tsx:5-37`) shows four non-clickable phases (`Profile`, `Planning`, `Intake`, `Assessed` — `nav.ts:46-52`) and a badge `Evidence bundle loaded · L2` / `Testimony only · L1` (`Sidebar.tsx:88`).
- **Top bar** (`TopBar.tsx:28-95`): page title, org line, the `Viewing as:` role switcher (`TopBar.tsx:46-76`), `Guided tour` (`TopBar.tsx:77-83`), `On-premise · read-only` label (`TopBar.tsx:84-86`), `Reset demo` (`TopBar.tsx:87-93`). The title is looked up with `NAV.find((n) => pathname.startsWith(n.to))` over the **unfiltered** `NAV` array (`TopBar.tsx:18`), and is `Control Detail / Evidence Inspector` for `/control/…` (`TopBar.tsx:19`).
- **Linear "next" buttons**: Profile → Request plan (`01_Profile.tsx:325-334`) → Intake (`02_RequestPlan.tsx:139-146`) → Dashboard via `Reveal on dashboard` (`03_Intake.tsx:331`); Remediation → Export (`07_Remediation.tsx:285`) → Rollup (`08_Export.tsx:217`).
- **Floating**: a `?` help button on every page (`src/tour/HelpPanel.tsx:51-58`), a first-visit welcome modal (`src/tour/WelcomeGate.tsx:48-92`) and the guided-tour overlay (`src/tour/Tour.tsx`), all mounted in `src/App.tsx:71-73`.

### B.3 Role gating (`RoleGate`, `src/App.tsx:25-36`)

`RoleGate` computes the allowed paths from `navForRole(role)` (`App.tsx:28`), adds `/control` only if `/gap-matrix` is allowed (`App.tsx:29-30`), and redirects any other path to the first nav item for the role (`App.tsx:31-34`). The path `/` is always allowed (`App.tsx:32`).

| Role (`src/store/useAssessment.ts:8`) | Sidebar entries (in order) | Evidence |
|---|---|---|
| `owner` | Organisation Profile, Evidence Request Plan, Intake, Compliance Dashboard, Gap Matrix, Scope Exclusions, Remediation & Requests, OSCAL Export, National Rollup, Roles & Access, Compliance Chat (11) | `nav.ts:28-33`, `nav.ts:35-39` |
| `analyst` | Same 11 as `owner` | `nav.ts:28-33`, `nav.ts:35-39` |
| `executive` | Compliance Dashboard, Compliance Chat | `nav.ts:31`, `nav.ts:39` |
| `contributor` | My Tasks | `nav.ts:34` |
| `regulator` | OSCAL Export, National Rollup | `nav.ts:36-37` |

Consequences read directly from that logic:

- `/control/:id` is permitted only for `owner` and `analyst` (the only roles whose list contains `/gap-matrix`, `nav.ts:32`).
- The role switcher does not navigate (`TopBar.tsx:62-65`); a role change makes `RoleGate` re-render and redirect if the current path is no longer allowed.
- Landing on `/` goes to `/profile` (`App.tsx:51`), then `RoleGate` redirects roles lacking `/profile` to their first entry (executive → `/dashboard`, contributor → `/tasks`, regulator → `/export`).

### B.4 Routes and links that exist in code but do not work from the UI

1. **Executive "Top 3 risks" links.** `ExecutiveDashboard` renders `<Link to={r.to}>` with `to: '/control/JNCSF-307'`, `'/control/JNCSF-102'`, `'/control/JNCSF-30'` (`src/screens/04_Dashboard.tsx:33-35`, `04_Dashboard.tsx:87`). For role `executive`, `RoleGate` does not allow `/control` (`src/App.tsx:29-34`), so each click is redirected to `/dashboard`.
2. **Chat citations for executives.** `Chat` is in the executive's nav (`nav.ts:39`), and its chips link to `/control/…`, `/intake`, `/exclusions` (`src/screens/09_Chat.tsx:25`, `09_Chat.tsx:47`, `09_Chat.tsx:82`, …). Those paths are not allowed for `executive` (they redirect to `/dashboard`); `/dashboard` links (`09_Chat.tsx:48`, `09_Chat.tsx:74`, `09_Chat.tsx:81`) are allowed.
3. **Query parameters that are read but never set by any link in the app.** `GapMatrix` reads `state`, `ev`, `gap` (`src/screens/05_GapMatrix.tsx:39-41`, `05_GapMatrix.tsx:53-56`) and `Exclusions` reads `cap` (`src/screens/10_Exclusions.tsx:15`). The only in-app query strings I found are `?cap=` (Dashboard `04_Dashboard.tsx:333`, tour `steps.ts:251`/`steps.ts:259`), `?overrides=1` (`04_Dashboard.tsx:210`) and `?changed=1` (`04_Dashboard.tsx:525`); there is no `?state=`, `?gap=` or `?ev=` link, and nothing links to `/exclusions?cap=`. (Found by `grep -rnE "\?(cap|state|gap|ev|changed|overrides)="` over `src/`.)
4. **No route is missing a UI entry point for at least one role**: every page component has a sidebar entry (`nav.ts:28-39`) except `ControlDetail`, which is link-only.
5. `NavItem.step` and `NavItem.phase` (`nav.ts:21-22`) are populated on every entry (`nav.ts:28-39`) but no code reads them (`grep -rnE "\.step\b|\.phase\b"` finds only `PhaseStepper.tsx:6`, which reads the store's `phase`, not `NavItem.phase`).

---

## C. Component inventory

"Used by" lists importers found with `grep -rlE "import .*\bName\b.* from" src` plus same-file references. Props are copied from the type annotation at the cited lines.

### C.1 Shared / reusable components (`src/components/`, `src/tour/Term.tsx`)

| Component | File:line | Props (with types) | Renders | Used by |
|---|---|---|---|---|
| `Card` | `src/components/ui.tsx:3-32` | `children: ReactNode; className?: string` (default `''`); `title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; dataTour?: string` | White rounded bordered box; header row (`h3` title, `p` subtitle, `right` slot) only when `title` or `right` is given (`ui.tsx:20`) | All 13 screens (`01_Profile` … `13_Rollup`) |
| `Pill` | `ui.tsx:34-59` | `children: ReactNode; tone?: 'slate' \| 'blue' \| 'amber' \| 'red' \| 'green' \| 'violet'` (default `'slate'`); `title?: string` | Small bordered inline badge; tone → Tailwind classes at `ui.tsx:44-49` | `ControlRow`, `EvidenceTrail`, all 13 screens |
| `SectionLabel` | `ui.tsx:61-65` | `children: ReactNode` | Small uppercase grey label | `01_Profile`, `06_ControlDetail` |
| `Button` | `ui.tsx:67-101` | `children: ReactNode; onClick?: () => void; variant?: 'primary' \| 'ghost' \| 'outline' \| 'danger'` (default `'primary'`); `disabled?: boolean; className?: string; type?: 'button' \| 'submit'; dataTour?: string` | `<button>` styled by variant (`ui.tsx:84-89`) | `01_Profile`, `02_RequestPlan`, `03_Intake`, `06_ControlDetail`, `07_Remediation`, `08_Export`, `12_Tasks` |
| `Kbd` | `ui.tsx:103-107` | `children: ReactNode` | Dark inline `<code>` | **Defined but never imported or referenced** (no match outside its definition) |
| `CodeBlock` | `ui.tsx:109-124` | `code: string` | Dark `<pre><code>` with a hover `Copy` button calling `navigator.clipboard?.writeText(code)` (`ui.tsx:110`, `ui.tsx:116-121`) | `02_RequestPlan` (`02_RequestPlan.tsx:39`), `07_Remediation` (`07_Remediation.tsx:135`) |
| `ScoreInterval` | `src/components/ScoreInterval.tsx:22-111` | `Props` (`ScoreInterval.tsx:6-18`): `lower: number; upper: number; coveragePct?: number; widthPts?: number; variant?: 'hero' \| 'row'; caption?: string; subline?: string; animateFrom?: { lower: number; upper: number }; ghost?: { lower: number; upper: number; label?: string }` | A 0–100% track with gridlines at 25/50/75 (`ScoreInterval.tsx:52`), an animated shaded band between `lower` and `upper`, two marker lines, optional dashed ghost band. `hero`: large `lower — upper` numbers, `0%`/`100%` scale labels, caption, `width N points · coverage N%`. `row`: small `lower%`, `width N pts`, `upper%` | `04_Dashboard` (`04_Dashboard.tsx:51`, `04_Dashboard.tsx:224`, `04_Dashboard.tsx:343`), `07_Remediation` (`07_Remediation.tsx:86`) |
| `StateBadge` (+ `STATE_META`) | `src/components/StateBadge.tsx:23-37`; `STATE_META` `StateBadge.tsx:6-15` | `state: ControlState; size?: 'sm' \| 'md' \| 'lg'` (default `'md'`); `showLabel?: boolean` (default `true`) | Coloured bordered badge: glyph + label from `STATE_META` (`title` = `"<label> — <shape>"`, `StateBadge.tsx:30`) | `ControlRow`, `05_GapMatrix`, `06_ControlDetail`. `STATE_META` is also imported by `06_ControlDetail` (`06_ControlDetail.tsx:5`) |
| `ControlRow` | `src/components/ControlRow.tsx:16-58` | `control: Control; snap: ControlSnapshot; highlight?: boolean` (default `false`); `dataTour?: string` | A `Link` row to `/control/<id>`: `StateBadge`, id, description, evidence-class pill, gap-reason pill (only when `snap.state === 'unknown'`), `promoted` pill (when `highlight`), `showcase` pill (when `control.showcase`) | `05_GapMatrix` only (`05_GapMatrix.tsx:181`) |
| `EvidenceTrail` | `src/components/EvidenceTrail.tsx:6-86` | `items: EvidenceItem[]` | Empty state box when `items.length === 0` (`EvidenceTrail.tsx:9-16`); otherwise one card per item (type, module pill, timestamp, quote, locator, hash, source) and a `View raw` button opening a modal with `raw` (`EvidenceTrail.tsx:64-84`) | `06_ControlDetail` only (`06_ControlDetail.tsx:187`) |
| `AttackExposure` | `src/components/AttackExposure.tsx:6-125` | `controlId: string; entry?: AttackEntry; enforced: boolean` | No-mapping box when `entry` is undefined (`AttackExposure.tsx:17-28`); otherwise Control → Mitigation → Technique cards, source badge, collapsed tail button, and a sentence stating exposure/mitigation (`AttackExposure.tsx:105-123`) | `06_ControlDetail` only (`06_ControlDetail.tsx:237`) |
| `CoverageBar` | `src/components/CoverageBar.tsx:10-35` | `segments: { label: string; value: number; colour: string }[]` (`Seg`, `CoverageBar.tsx:3-7`); `total: number` | Stacked horizontal bar with legend | **Defined but never imported.** Its own comment says `(used on capability rows and the dashboard)` (`CoverageBar.tsx:9`); no importer exists |
| `Term` | `src/tour/Term.tsx:10-62` | `k: string; children?: ReactNode` | Dotted-underlined span with hover/focus tooltip showing `GLOSSARY[k]`; renders plain `children` if the key is not in the glossary (`Term.tsx:17`) | `01_Profile` (`01_Profile.tsx:343`, `01_Profile.tsx:375`), `04_Dashboard` (`04_Dashboard.tsx:220`, `04_Dashboard.tsx:272`, `04_Dashboard.tsx:433`, `04_Dashboard.tsx:436`) |

### C.2 Layout and global overlays (mounted once in `src/App.tsx`)

| Component | File:line | Props | Renders | Used by |
|---|---|---|---|---|
| `Sidebar` | `src/components/layout/Sidebar.tsx:8-93` | none | Logo block, `{ROLE_LABEL[role]} view` chip, role-filtered nav, `PhaseStepper`, evidence badge | `App.tsx:41` |
| `TopBar` | `src/components/layout/TopBar.tsx:16-96` | none | Title, org/sector/regulator line, role switcher, tour, lock label, reset | `App.tsx:43` |
| `PhaseStepper` | `src/components/layout/PhaseStepper.tsx:5-37` | none | Ordered list of four phases with done/active/pending styling | `Sidebar.tsx:79` |
| `HelpPanel` | `src/tour/HelpPanel.tsx:9-60` | none | Floating `?` button and dialog showing `helpFor(pathname)`; hidden while the tour runs or the nav drawer is open (`HelpPanel.tsx:22`) | `App.tsx:71` |
| `WelcomeGate` | `src/tour/WelcomeGate.tsx:21-93` | none | First-visit modal with `Start guided tour →` / `Explore on my own` | `App.tsx:72` |
| `Tour` | `src/tour/Tour.tsx:33-350` | none | Spotlight overlay and step card driven by `TOUR_STEPS` | `App.tsx:73` |
| `RoleGate` | `src/App.tsx:25-36` | `children: ReactNode` | Redirect or children (see B.3) | `App.tsx:49` |
| `App` | `src/App.tsx:38-75` | none | Shell: sidebar, top bar, amber banner, scrolling `<main>` with `<Routes>` | `src/main.tsx:13` |

### C.3 Screen components (one per route; all `export default`, no props)

`Profile` `src/screens/01_Profile.tsx:73`; `RequestPlan` `02_RequestPlan.tsx:55`; `Intake` `03_Intake.tsx:343`; `Dashboard` `04_Dashboard.tsx:127`; `GapMatrix` `05_GapMatrix.tsx:30`; `ControlDetail` `06_ControlDetail.tsx:73`; `Remediation` `07_Remediation.tsx:255`; `ExportScreen` `08_Export.tsx:136`; `Chat` `09_Chat.tsx:115`; `Exclusions` `10_Exclusions.tsx:12`; `Admin` `11_Admin.tsx:87`; `Tasks` `12_Tasks.tsx:9`; `Rollup` `13_Rollup.tsx:7`. Each is imported only by `src/App.tsx:7-19`.

### C.4 One-off page sections (defined inside a screen file, not exported)

| Component | File:line | Props | Renders | Used at |
|---|---|---|---|---|
| `TriToggle` | `src/screens/01_Profile.tsx:35-71` | `value: Ternary; onChange: (v: Ternary) => void; label: string; hint: string; dataTour?: string` | Row with label, hint and a Yes / No / Don't know segmented control; violet note when `unknown` (`01_Profile.tsx:64-68`) | `01_Profile.tsx:158`, `01_Profile.tsx:170` |
| `ArtifactTable` | `src/screens/02_RequestPlan.tsx:10-53` | `rows: RequestArtifact[]; tourFirstRow?: string` | Table: Artifact (+ `formatHint`), Source system, Owner, Controls, Effort, How to produce it (`CodeBlock` + decline-cost line) | `02_RequestPlan.tsx:116`, `02_RequestPlan.tsx:123`, `02_RequestPlan.tsx:135` |
| `InterviewPanel` | `src/screens/03_Intake.tsx:25-153` | `role: InterviewRole; onComplete: () => void` | Chat-style transcript with Play/Skip, "Coverage fallacy defeated" box, "Extracted claims" card | `03_Intake.tsx:396` |
| `BundlePanel` | `03_Intake.tsx:164-339` | none | Slot grid, simulate-upload button, staged ingestion list, module ledger, result banner | `03_Intake.tsx:402` |
| `InterviewList` | `03_Intake.tsx:415-513` | `onOpen: (id: string) => void; done: string[]` | Three role cards with scoped-link generator, then the review-queue table | `03_Intake.tsx:399` |
| `ExecutiveDashboard` | `src/screens/04_Dashboard.tsx:38-125` | none | Executive view: interval, trend, top-3 risks, completeness statement | `04_Dashboard.tsx:136` |
| `OverrideModal` | `src/screens/06_ControlDetail.tsx:28-71` | `controlId: string; from: ControlState; to: ControlState; onCancel: () => void; onConfirm: (justification: string) => void` | Modal requiring a justification of ≥ 12 characters (`06_ControlDetail.tsx:64`) | `06_ControlDetail.tsx:338` |
| `RemediationTab` / `RequestsTab` / `AllActionsTab` | `src/screens/07_Remediation.tsx:19`, `07_Remediation.tsx:64`, `07_Remediation.tsx:169` | none | The three tabs of the page | `07_Remediation.tsx:282` |
| `JsonModal` | `src/screens/08_Export.tsx:83-101` | `model: string; onClose: () => void` | Modal with `JSON.stringify(oscalDoc(...), null, 2)` | `08_Export.tsx:222` |
| `ReviewModal` | `08_Export.tsx:103-134` | `onClose: () => void; onSubmit: (redact: boolean) => void` | "Pre-submission review" modal with a redaction checkbox | `08_Export.tsx:224` |
| `Chip` | `src/screens/09_Chat.tsx:93-113` | `c: Citation` (`Citation` = `{ label: string; to?: string; passage?: string }`, `09_Chat.tsx:6-11`) | Link pill, expandable passage button, or plain pill | `09_Chat.tsx:150` |

Non-component helpers defined in screen files: `oscalDoc` (`08_Export.tsx:11-73`), `worstEstablished` (`05_GapMatrix.tsx:23-28`), `cell` (`11_Admin.tsx:78-85`), `bandTotal` (`13_Rollup.tsx:5`), `pollFor`/`el`/`sleep` (`src/tour/Tour.tsx:6-21`).

### C.5 Defined but never used (components)

`Kbd` (`src/components/ui.tsx:103`) and `CoverageBar` (`src/components/CoverageBar.tsx:10`). Non-component exports that are also unreferenced are listed in Section K.3.

---

## D. Data inventory

### D.0 Reading guide

- Tables have four columns: **What is displayed**, **Where it is defined** (`path:line`), **Origin** (one of the five exact values), and **Detail** (the expression for `derived`, the fixture file for `fixture`, the endpoint for `fetched` — none exist — or the store field for `user input`).
- Where a fixture file drives many screens, the file is described once in D.1 (with every field that reaches the UI and every field that does not), and per-screen rows then cite the exact line.
- "Before/after" refers to the single store flag `evidenceUploaded` (`src/store/useAssessment.ts:46`), which selects `TOTALS.before` vs `TOTALS.after` (`src/data/capabilities.ts:94`, `capabilities.ts:105`) and `control.before` vs `control.after` (`src/data/controls.ts:210-212`).
- Values written `49.9%` etc. are what the screen prints after `toFixed(1)`; where I quote an unrounded computed value it is the result of running the repository's own functions, not an estimate.
- Everything shown is local. There are no `fetched` values (Section G).

### D.1 Fixture files (`src/data/`) — what reaches the UI and what does not

| File | Contents | Fields that reach the UI (screen) | Fields in the file that no UI code reads |
|---|---|---|---|
| `src/data/controls.ts` (289 lines) | 48 seeded controls (`seeds`, `controls.ts:100-153`) built into `controls` (`controls.ts:181-206`); `GAP_REASON_BREAKDOWN` (`controls.ts:224-232`); `UNCOLLECTABLE_COUNT` (`controls.ts:236`); `EVIDENCE_BASIS_BREAKDOWN` (`controls.ts:246-251`); `EVIDENCE_SIGNAL_TOTAL` (`controls.ts:253`); `NO_CONCLUSIVE_PATH_STATS` (`controls.ts:258-262`); label and ceiling maps (`controls.ts:31-43`, `controls.ts:264-289`) | `id`, `description`, `capability`, `iso`/`isoNames`, `nist`/`nistNames`, `requiredSignals`, `attackKey`, `deploymentSharePct`, `exceptionPopulation`, `populationNote`, `maxAgeDays`, `before`/`after` (`state`, `evidenceClass`, `gapReason`), `changed`, `showcase`, `evidenceBasis`, `noConclusivePath` → Gap Matrix and Control Detail. `GAP_REASON_BREAKDOWN` → Dashboard chart. `UNCOLLECTABLE_COUNT` → Dashboard donut, Remediation. `EVIDENCE_SIGNAL_TOTAL`, the `uncertainty` row of `EVIDENCE_BASIS_BREAKDOWN`, `NO_CONCLUSIVE_PATH_STATS.noPath`/`.authoredTotal` → Dashboard (`04_Dashboard.tsx:512-518`) | `num` (used only to build `id`); `providedSignals` (always `[]`, `controls.ts:97`; read nowhere); `NO_CONCLUSIVE_PATH_STATS.seededNoPath` (`controls.ts:261`); the `68`, `31`, `15` counts in `EVIDENCE_BASIS_BREAKDOWN` (only the `uncertainty` row is read) |
| `src/data/capabilities.ts` (117 lines) | 5 assessable capabilities plus `natl` with per-capability `before`/`after` stats (`capabilities.ts:29-82`); `TOTALS` (`capabilities.ts:90-117`) | Per capability: `shortName`, `name`, `applicable`, `green`, `yellow`, `red`, `unknown`, `interval`, `coveragePct`, `organisationallyAssessable`. `TOTALS`: `totalControls`, `notApplicable`, `applicable`, `before`/`after` `.green/.yellow/.red/.unknown/.evidenced/.interval/.widthPts` | `Capability.totalControls` (`capabilities.ts:34`, `capabilities.ts:43`…); `CapabilityStat.evidenced` (`capabilities.ts:7`); `TOTALS.before/after.coveragePct` (`capabilities.ts:100`, `capabilities.ts:111`); `TOTALS.before/after.assurance` (`capabilities.ts:103`, `capabilities.ts:114`); `TOTALS.after.gapsClosed` (`capabilities.ts:115`) |
| `src/data/scenario.ts` (219 lines) | `OrgProfile` and `defaultProfile` (`scenario.ts:10-65`); applicability arithmetic (`scenario.ts:70-115`); `HOSTING_LABEL`; `requestPlan` (22 rows, `scenario.ts:141-164`); `REQUEST_PLAN_SUMMARY` (`scenario.ts:166-177`); `moduleLedger` (7 rows, `scenario.ts:192-200`); `bundleStages` (7, `scenario.ts:202-210`); `BUNDLE_MANIFEST` (`scenario.ts:212-219`) | All `requestPlan` fields; `REQUEST_PLAN_SUMMARY` all fields; `moduleLedger` `module/status/detail/negativeCapable`; `bundleStages` `label/result/detail`; `BUNDLE_MANIFEST.collector`, `.signatureAlg` | `BUNDLE_MANIFEST.signatureHash`, `.generatedAt`, `.identityRecords`, `.claimsCorroborated` (`scenario.ts:215-218`); `ModuleResult.records` (`scenario.ts:187`, set at `scenario.ts:193-199`); `BASELINE_APPLICABLE` is read only inside `computeApplicable` |
| `src/data/evidence.ts` (158 lines) | `evidenceByControl` (10 items on 7 controls, `evidence.ts:22-136`); `ASSESSMENT_DATE` (`evidence.ts:141`); `ageDays` (`evidence.ts:143-147`); `EVIDENCE_FRESHNESS` (`evidence.ts:152-158`) | All `EvidenceItem` fields (Control Detail); `EVIDENCE_FRESHNESS.oldestDays`, `.oldestControl`, `.approachingStaleness` (Dashboard `04_Dashboard.tsx:276-278`); `ASSESSMENT_DATE` (Dashboard, Control Detail) | `EVIDENCE_FRESHNESS.oldestControlLabel` (`evidence.ts:155`), `.stale` (`evidence.ts:157`) |
| `src/data/exclusions.ts` (61 lines) | 19 `EXCLUSIONS`, `EXCLUSION_COUNTS`, `EXCLUSION_TRIGGERS`, `SECTOR_BASELINE` | All fields (Exclusions page; `SECTOR_BASELINE.naRatePct` also Profile, Dashboard) | — |
| `src/data/interviews.ts` (90 lines) | 3 scripted interviews (`interviews.ts:27-88`) | `title`, `persona`, `turns[].who/text`, `claims[].text/confidence/note`, `coverageFallacy.naive/refined` (Intake) | `claims[].cappedAtYellow` (the screen prints its own literal instead, `03_Intake.tsx:137`); `claims[].relatedControls`; `interviewById` (`interviews.ts:90`) is never called |
| `src/data/remediation.ts` (119 lines) | `remediationPlan` (6), `evidenceRequests` (5), `nationalRollup` | All `remediationPlan` and `evidenceRequests` fields (Remediation); `nationalRollup` `sector`, `entitiesInScope`, `submitted`, `overdue`, `kAnonymityFloor`, `distribution`, `mostFailedControls`, `imports` (Rollup) | — |
| `src/data/riskWeighting.ts` (45 lines) | Weight table, totals, width, explainer | All exports (Dashboard "Risk weighting" card) | — |
| `src/data/collaboration.ts` (57 lines) | `reviewQueue` (3), `CONFLICT_FLAG`, `scopedLinkFor`, `contributorTasks` (5) | `reviewQueue` fields except `conflict`; `CONFLICT_FLAG.summary`; `scopedLinkFor` → `token`, `scopeLabel`, `expiresInDays`; `contributorTasks` all fields | `ReviewRow.conflict` (`collaboration.ts:12`, never set or read); `CONFLICT_FLAG.detail` (`collaboration.ts:23-24`) |
| `src/data/attack.ts` (168 lines) | `attackBridge` (9 controls), `ATTACK_COVERAGE`, `DIFFUSE_COLLAPSE_THRESHOLD` | `mitigation`, `mitigationName`, `techniques`, `source`, `sourceLabel`; `ATTACK_COVERAGE.mappedControls`, `.mappedPct` (`AttackExposure.tsx:23-24`); `DIFFUSE_COLLAPSE_THRESHOLD` | `ATTACK_COVERAGE.totalControls`, `.bySource`, `.diffuse` (`attack.ts:38-50`) |
| `src/data/sectors.ts` (39 lines) | 10 sectors, default id, `NO_REGULATOR_LABEL`, lookup helpers | `label`, `arabicLabel`, `regulator`; `regulatorDisplay` | `regulatorForSector` (`sectors.ts:38`) is never called |
| `src/data/standards.ts` (91 lines) | ISO 27002 and NIST 800-53 name lookups | Names shown as chips on Control Detail (via `controls.ts:190`, `controls.ts:192`) | — |

### D.2 Shell (App, top bar, sidebar, phase stepper)

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| `Demonstration prototype · fictional organisation · no data is stored or transmitted.` | `src/App.tsx:45` | hardcoded | — |
| Page title in top bar | `src/components/layout/TopBar.tsx:18-19` | derived | `NAV.find(n => pathname.startsWith(n.to))?.label`, else `JCCP`; fixed string `Control Detail / Evidence Inspector` for `/control/…` |
| Organisation name in top bar (`Ministry of Digital Services`) | `src/components/layout/TopBar.tsx:41` | fixture | `profile.orgName` ← `defaultProfile.orgName` (`src/data/scenario.ts:42`); no input in the UI edits it (`01_Profile.tsx` has no `orgName` field) |
| Sector label in top bar | `TopBar.tsx:41` | derived | `sectorById(profile.sector).label`; `SECTORS` in `src/data/sectors.ts:18-27` |
| Regulator in top bar | `TopBar.tsx:41` | derived | `regulatorDisplay(profile.sector)` = `sectorById(id).regulator \|\| 'not designated'` (`sectors.ts:39`, `sectors.ts:32`) |
| Role in switcher button: `Viewing as:` + role name | `TopBar.tsx:51-52` | user input | `role` store field (default `owner`, `useAssessment.ts:87`); names from `ROLE_LABEL` (`useAssessment.ts:10-16`) |
| Five role notes: `full access + collection progress`; `full access + review queue; can override`; `interval, coverage, assurance only — no evidence or personal data`; `own task list and submission status only`; `submitted packages and the national rollup only` | `TopBar.tsx:8-14` | hardcoded | — |
| `Demo switcher — no authentication` | `TopBar.tsx:72` | hardcoded | — |
| `Guided tour`, `Reset demo`, `On-premise · read-only` | `TopBar.tsx:82`, `TopBar.tsx:92`, `TopBar.tsx:85` | hardcoded | — |
| `JCCP`, `Jordan Cyber Compliance` | `src/components/layout/Sidebar.tsx:40-41` | hardcoded | — |
| `{role} view` chip | `Sidebar.tsx:53` | user input | `ROLE_LABEL[role]` |
| 12 nav labels: `Organisation Profile`, `Evidence Request Plan`, `Intake`, `Compliance Dashboard`, `Gap Matrix`, `Scope Exclusions`, `My Tasks`, `Remediation & Requests`, `OSCAL Export`, `National Rollup`, `Roles & Access`, `Compliance Chat` | `src/components/layout/nav.ts:28-39` | hardcoded | filtered by role (`nav.ts:42-44`) |
| `Progress` and the four phase labels `Profile`, `Planning`, `Intake`, `Assessed` | `PhaseStepper.tsx:11`; `nav.ts:47-52` | hardcoded | — |
| Which phase is done/active/pending | `PhaseStepper.tsx:7`, `PhaseStepper.tsx:14-15` | derived | `PHASE_ORDER.indexOf(phase)`; `phase` set by `setPhase('planning'/'intake')` (`01_Profile.tsx:329`, `02_RequestPlan.tsx:141`) and `uploadEvidence` → `'assessed'` (`useAssessment.ts:118`) |
| Sidebar badge `Evidence bundle loaded · L2` / `Testimony only · L1` | `Sidebar.tsx:88` | derived | `evidenceUploaded ? … : …` |

### D.3 Profile — `src/screens/01_Profile.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Card title `Organisation profile`, subtitle `Scoping inputs — these set which of the 576 JNCSF controls apply` | `01_Profile.tsx:97` | hardcoded | `576` is a literal in the string |
| Sector dropdown: 10 options (`Energy`, `Water`, `Telecommunications and IT`, `Government Services`, `Industry and Trade`, `Financial and Banking`, `Health`, `Transport`, `Education`, `Defence and Security`) | `01_Profile.tsx:102-104` | fixture | `SECTORS`, `src/data/sectors.ts:18-27` |
| Selected sector (initial `Government Services`) | `01_Profile.tsx:101` | user input | store `profile.sector`; default `DEFAULT_SECTOR_ID = 'gov_services'` (`sectors.ts:30`, `scenario.ts:43`) |
| Arabic sector label under the dropdown (e.g. `قطاع الخدمات الحكومية`) | `01_Profile.tsx:106` | fixture | `sectorById(profile.sector).arabicLabel`, `sectors.ts:18-27` |
| `Regulator: …` (`not designated` for gov_services, education, defence_security) | `01_Profile.tsx:107-109` | derived | `regulatorDisplay(profile.sector)`; names in `sectors.ts:18-27` |
| Size-band options `< 50 staff`, `50–250 staff`, `250–1000 staff`, `> 1000 staff` | `01_Profile.tsx:114` | hardcoded | — |
| Selected size band (initial `250–1000 staff`) | `01_Profile.tsx:113` | user input | default `scenario.ts:44` |
| Hosting options `MoDEE Government Private Cloud`, `Own data centre`, `Third-party hosting in Jordan`, `Foreign cloud` | `01_Profile.tsx:122-124` | fixture | `HOSTING_LABEL`, `scenario.ts:117-122` |
| Selected hosting model (initial `gov-private-cloud`) | `01_Profile.tsx:121` | user input | default `scenario.ts:48` |
| `Named attestation` input, placeholder `Accountable officer name` | `01_Profile.tsx:128-134` | user input | initial `''` (`scenario.ts:49`) |
| `Endpoints` `400`, `Servers` `38`, `Users` `620` | `01_Profile.tsx:141`, `01_Profile.tsx:145`, `01_Profile.tsx:149` | user input | defaults `scenario.ts:45-47`; **no other screen reads these three values** (`grep` for `.endpoints`, `.servers`, `.users` finds only these inputs) |
| Heading `Applicability variables — answer Yes, No, or Don't know` | `01_Profile.tsx:154` | hardcoded | — |
| Five toggle labels and hints: `In-house software development` / `declaring "no" removes 19 Development controls`; `Outsourced development` / `… removes 9 controls`; `Mobile devices` / `… 4 controls`; `Wireless network` / `… 4 controls`; `Remote access` / `… 2 controls` | `01_Profile.tsx:25-29` | hardcoded | the numbers `19`, `9`, `4`, `4`, `2` are literals in the hint strings, separate from the arithmetic values in `PROFILE_DELTAS` |
| Segmented control labels `Yes`, `No`, `Don't know` | `01_Profile.tsx:33` | hardcoded | — |
| Toggle selections (initial: in-house `no`; outsourced, mobile, wireless, remote `yes`) | `01_Profile.tsx:162` | user input | defaults `scenario.ts:52-56` |
| `Held in scope; related controls flagged for verification during collection.` | `01_Profile.tsx:66` | hardcoded | shown when a toggle is `unknown` |
| Cloud-services toggle: label `Cloud services`, hint `does not change the applicable count — cloud is governed by the MoDEE cloud policy, not JNCSF. Declarations are still cross-checked against evidence.` | `01_Profile.tsx:171-172` | hardcoded | selection is `user input` (default `yes`, `scenario.ts:57`) |
| Critical-infrastructure toggle: `Operates critical infrastructure`, hint with `405 controls, 3 implementation levels` | `01_Profile.tsx:182-185` | hardcoded | selection `user input` (default `false`, `scenario.ts:58`) |
| Note when on: `Critical infrastructure scope note.` … `405 controls across three implementation levels, with Level 1 (135 controls) mandatory.` | `01_Profile.tsx:201-205` | hardcoded | `405`, `135` literals |
| PDPL heading and four checkboxes: `PDPL data holdings`; `Health records`, `Biometric data`, `Financial data`, `Religious or political affiliation` | `01_Profile.tsx:213`, `01_Profile.tsx:218-221` | hardcoded | checked state `user input`, defaults all `false` (`scenario.ts:59-64`); **no other screen reads `pdplHoldings`** |
| **Applicable controls** big number (initial `557`) | `01_Profile.tsx:87`, `01_Profile.tsx:341` | derived | `computeApplicable(profile)` = `576 + Σ over the five toggles of (toggle ≠ 'no' ? 0 : noDelta)` (`scenario.ts:98-105`); baseline `576` from `scenario.ts:70`; deltas `-19, -9, -4, -4, -2` from `scenario.ts:91-95`. With all five answered `no` the function returns `538`. |
| `of 576 total · 19 excluded` | `01_Profile.tsx:345` | derived | `TOTAL_CONTROLS` (`scenario.ts:71`, fixture `576`) and `TOTAL_CONTROLS - applicable` |
| `Applicable controls` (tooltip) | `01_Profile.tsx:343` | hardcoded | glossary key `applicable controls` (`src/tour/glossary.ts:10-13`) |
| Progress bar width | `01_Profile.tsx:351` | derived | `(applicable / TOTAL_CONTROLS) * 100 %` |
| `Sector N/A baseline` `5%` | `01_Profile.tsx:354-355` | fixture | `SECTOR_BASELINE.naRatePct`, `src/data/exclusions.ts:22` |
| `Your N/A rate` `3.3%` (amber if above 5) | `01_Profile.tsx:358-361` | derived | `((TOTAL_CONTROLS - applicable) / TOTAL_CONTROLS) * 100`, `.toFixed(1)` |
| `{n} controls held in scope by a “Don't know” answer — flagged for verification.` | `01_Profile.tsx:363-367` | derived | `unknownScopedControls(profile)` = Σ `Math.abs(inScopeDelta \|\| noDelta)` over toggles equal to `'unknown'` (`scenario.ts:109-115`) |
| `Cloud declared absent — the applicable count is unaffected …` | `01_Profile.tsx:368-373` | hardcoded | shown when `profile.usesCloud === 'no'` |
| `Grey (not-applicable) controls are excluded from the denominator entirely. Under-scoping is the first way a score gets inflated — every exclusion is cross-checked against collected evidence.` | `01_Profile.tsx:374-378` | hardcoded | — |
| `Viewing as {role} — read only` pill | `01_Profile.tsx:379-381` | user input | shown for roles other than owner/analyst; the inputs above are **not** disabled for those roles (no `disabled` on them, `01_Profile.tsx:101-176`) |
| Cloud challenge (stage 1): heading `Confirm this scoping decision`, paragraph naming `{sector label}` and `{sizeBand}`, textarea, buttons `Confirm exclusion & record`, `Restore cloud services` | `01_Profile.tsx:259-306` | hardcoded | text literal; sector/size interpolated from `profile`; condition `usesCloud === 'no' && !challenge` (`01_Profile.tsx:89`) |
| Justification minimum length `12` characters | `01_Profile.tsx:281`, `01_Profile.tsx:299` | hardcoded | — |
| Justification text | `01_Profile.tsx:271-277` | user input | local `useState` (`01_Profile.tsx:85`) |
| Contradiction (stage 2): `Contradiction — scoping decision blocked` + paragraph + `Restore cloud scope and re-run` | `01_Profile.tsx:239-248` | hardcoded | shown when `evidenceUploaded && usesCloud === 'no'` (`01_Profile.tsx:90`) |
| Recorded decision: `Scoping decision recorded`, `Cloud exclusion confirmed`/`Cloud scope restored`, `by {role} on {timestamp}`, quoted justification, `Reopen decision` | `01_Profile.tsx:308-320` | user input | `ChallengeDecision` (`useAssessment.ts:28-33`); timestamp derived from `new Date().toISOString().slice(0,16).replace('T',' ')` (`01_Profile.tsx:92`); the restore path writes the literal `Declaration corrected — cloud services are in use.` (`01_Profile.tsx:292`) |
| `Record the scoping decision to continue.` and `Continue to request plan` (disabled while stage 1 pending) | `01_Profile.tsx:324-333` | hardcoded | — |

### D.4 Evidence Request Plan — `src/screens/02_RequestPlan.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| `557` in the headline `To assess your 557 applicable controls, we need 22 artifacts from 8 systems.` (`02_RequestPlan.tsx:79-82`) | `src/data/scenario.ts:174` | hardcoded | `REQUEST_PLAN_SUMMARY.applicable: 557`; **not** linked to the Profile's computed count — changing profile toggles does not change it |
| `22` in the same headline (`02_RequestPlan.tsx:79-82`) | `src/data/scenario.ts:167` | derived | `requestPlan.length` |
| `8` in the same headline | `src/data/scenario.ts:168` | derived | `new Set(requestPlan.map(r => r.source)).size` (sources: Active Directory, Linux servers, EDR console, Windows servers, Windows endpoints, SIEM, Backup system, HR & LMS) |
| `Generated before any collection — the "how would I know what I'm missing" answer made concrete.` | `02_RequestPlan.tsx:84` | hardcoded | — |
| `projected coverage 93%` | `02_RequestPlan.tsx:86`; `scenario.ts:176` | hardcoded | `projectedCoveragePct: 93` |
| `The remaining 39 controls are structurally uncollectable and stay Unknown regardless.` | `02_RequestPlan.tsx:87-88`; `scenario.ts:175` | hardcoded | `uncollectable: 39` (a second, independent literal from `UNCOLLECTABLE_COUNT` in `controls.ts:236`) |
| `Automated` subtitle: `14 artifacts collected by the signed collector · covers 126 controls · ~15 min` | `02_RequestPlan.tsx:97` | derived | `automatedCount` = filter `method === 'automated'` (`scenario.ts:169`); `automatedControls` = Σ `controlsUnlocked` of those (`scenario.ts:171-173`); `~15 min` is a literal |
| `Manual` subtitle: `8 artifacts requiring a console export by the named owner` | `02_RequestPlan.tsx:121` | derived | `manualCount`, `scenario.ts:170` |
| Buttons `Windows/AD collector`, `Linux collector` | `02_RequestPlan.tsx:101-106` | hardcoded | — |
| `{collector} collector package prepared (simulated) · Ed25519-signed · run on-premise` | `02_RequestPlan.tsx:110` | hardcoded | shown after a click (`useState`, `02_RequestPlan.tsx:59`) |
| Table column headers `Artifact`, `Source system`, `Owner`, `Controls`, `Effort`, `How to produce it` | `02_RequestPlan.tsx:16-21` | hardcoded | — |
| Rows (Automated table = 14 rows, Manual table = 8 rows, each sorted by `controlsUnlocked` descending) | `02_RequestPlan.tsx:61-68` | derived | filter + sort of `requestPlan`; row data are the 22 rows in D.6.2 |
| `Declining leaves {n} control(s) permanently Unknown.` | `02_RequestPlan.tsx:41-45` | fixture | `declineCost`, `scenario.ts:142-163`; wording is a literal |
| `Full plan` subtitle `Top 10 of 22 by controls unlocked` / `All 22 artifacts by controls unlocked`; toggle `Show all 22` / `Show top 10` | `02_RequestPlan.tsx:128`, `02_RequestPlan.tsx:131` | derived | `TOP_N = 10` literal (`02_RequestPlan.tsx:8`); `allSorted.length` |
| `Continue to intake` | `02_RequestPlan.tsx:145` | hardcoded | — |

### D.5 Intake — `src/screens/03_Intake.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Tab labels `Interviews`, `Evidence bundle`; `← All roles` | `03_Intake.tsx:370-371`, `03_Intake.tsx:394` | hardcoded | selected tab is `useState` (`03_Intake.tsx:344`), i.e. `user input` but local |
| Three role cards: titles `Infrastructure / Operator`, `Executive / Compliance`, `Defender / SOC`; personas `Estate operations lead`, `Director of governance`, `SOC team lead` | `03_Intake.tsx:427-428` | fixture | `interviews`, `src/data/interviews.ts:30-31`, `interviews.ts:59-60`, `interviews.ts:75-76` |
| `{n} turns · {n} claims` (8·3, 5·2, 4·2) | `03_Intake.tsx:431` | derived | `r.turns.length`, `r.claims.length` |
| `done` / `not started` pill | `03_Intake.tsx:432-436` | user input | `interviewsCompleted` store field, set by `completeInterview` when Play finishes or Skip is pressed (`03_Intake.tsx:34`, `03_Intake.tsx:48`) |
| Scope labels `Infrastructure / Operator questions only`, `Executive / Compliance questions only`, `Defender / SOC questions only` | `03_Intake.tsx:409-413` | hardcoded | — |
| Scoped link `https://jccp.ministry.local/respond/{token}` | `03_Intake.tsx:442`, `03_Intake.tsx:448` | derived | host and path are literals; `token = Math.random().toString(16).slice(2, 8)` (`src/data/collaboration.ts:36`) — different on every click |
| `expires in 7 days · {scope label}` | `03_Intake.tsx:445` | fixture | `expiresInDays: 7`, `collaboration.ts:38` |
| `Generate scoped link`, `Copy`, `Mark as sent` / `Sent ✓`, `Internal network only — this link does not traverse the internet` | `03_Intake.tsx:463`, `03_Intake.tsx:448`, `03_Intake.tsx:453`, `03_Intake.tsx:456` | hardcoded | — |
| Review queue title `Review queue`, subtitle `who is answering what, and where it stands`; headers `Role`, `Assignee`, `Status`, `Submitted`, `Actions` | `03_Intake.tsx:472`, `03_Intake.tsx:477-481` | hardcoded | — |
| Review queue rows: `Executive / Compliance` · `D. Haddad (Governance)` · `accepted` · `2026-09-03`; `Infrastructure / Operator` · `M. Qasem (Ops)` · `under review` · `2026-09-04`; `Defender / SOC` · `R. Nabulsi (SOC)` · `submitted` · `2026-09-05` | `03_Intake.tsx:485-498` | fixture | `reviewQueue`, `src/data/collaboration.ts:16-18` (independent of the store's `interviewsCompleted`) |
| Row actions `Review`, `Reopen`, `Nudge` | `03_Intake.tsx:496` | hardcoded | buttons have no `onClick` handler |
| `Conflict:` + `Executive and Operator disagree on MFA enforcement scope` + `— operator wins on configuration per trust ordering.` + `Review` | `03_Intake.tsx:503-504` | fixture | summary `CONFLICT_FLAG.summary`, `collaboration.ts:22`; the remaining words are literals; `Review` has no handler |
| Interview transcript turns (operator 8, exec 5, defender 4) | `03_Intake.tsx:71-91` | fixture | `interviews[].turns`, `interviews.ts:33-40`, `interviews.ts:62-66`, `interviews.ts:78-82` (exact text in Section E.5) |
| Speaker labels `Interviewee`, `JCCP agent`; `typing…`; `Press Play to run the scripted interview.` | `03_Intake.tsx:86`, `03_Intake.tsx:93`, `03_Intake.tsx:95` | hardcoded | — |
| Turn reveal pace `650` ms | `03_Intake.tsx:37` | hardcoded | — |
| Buttons `Play`, `Skip` | `03_Intake.tsx:62-65` | hardcoded | — |
| `Coverage fallacy defeated` box | `03_Intake.tsx:106` | hardcoded | appears when the role has `coverageFallacy` and `shown >= 2` (`03_Intake.tsx:52`); only the operator interview has it |
| Struck-through `Naive extraction: 1 compliant control` and four refined bullets (`Servers enforcing — block mode`, `Workstations detect-only, ~80% installed`, `Contractor machines — no agent`, `Named exception retained for the assessment`) | `03_Intake.tsx:109`, `03_Intake.tsx:112-116` | fixture | `interviews.ts:43-49` |
| `Extracted claims` / `Testimony is capped at Yellow — never Green` / `Claims appear here as the interview progresses.` | `03_Intake.tsx:124`, `03_Intake.tsx:146` | hardcoded | — |
| Claim text, note, and `conf 0.82` etc. (confidences `0.82`, `0.71`, `0.90`; exec `0.86`, `0.93`; defender `0.80`, `0.88`) | `03_Intake.tsx:133-141` | fixture | `interviews.ts:52-54`, `interviews.ts:69-70`, `interviews.ts:84-85`; confidence printed with `.toFixed(2)` |
| Number of claims shown at a given moment | `03_Intake.tsx:51`, `03_Intake.tsx:126` | derived | `Math.round((shown / role.turns.length) * role.claims.length)` |
| Pill `Testimony only — capped at Yellow` on every claim | `03_Intake.tsx:137` | hardcoded | the fixture field `cappedAtYellow: true` is not read |
| Card title `Evidence intake` | `03_Intake.tsx:200` | hardcoded | — |
| Subtitle `{filled} of 22 artifact slots filled · {n} controls evidenced · est. coverage {x}%` (initial `0 of 22 … 0 controls … 62.8%`) | `03_Intake.tsx:192-195`, `03_Intake.tsx:201` | derived | `filled` = slots with an entry in `uploadedSlots`; `22` = `requestPlan.length`; `controlsEvidenced` = Σ `controlsUnlocked` of filled slots; `covEstimate = Math.min(93, 62.8 + (controlsEvidenced / 557) * 100 * 0.85).toFixed(1)` — literals `93`, `62.8`, `557`, `0.85`. All 14 automated slots filled → `82.0`; all 22 → `89.2` (computed with the same expression) |
| Button `Simulate collector bundle upload (fills 14)` / `Bundle processed` | `03_Intake.tsx:204` | hardcoded | `14` is a literal in the label |
| 22 slot cards: artifact name; `{source} · unlocks {n} · {formatHint}`; `accepted` pill or `Upload` button | `03_Intake.tsx:212-237` | fixture | `requestPlan` rows (D.6.2) |
| `{artifact} accepted — {n} controls now evidenced.` | `03_Intake.tsx:227` | derived | template over the clicked row |
| `Other evidence — drop anything not listed above. Simulated; no file is parsed.` | `03_Intake.tsx:240` | hardcoded | — |
| `Ingestion` card; subtitle `jccp-collector 2026.08.2 · signature Ed25519` | `03_Intake.tsx:245` | fixture | `BUNDLE_MANIFEST.collector`, `.signatureAlg`, `scenario.ts:213-214` |
| Seven ingestion stages (labels, details, ok/warn/error icons) | `03_Intake.tsx:247-269` | fixture | `bundleStages`, `scenario.ts:203-209` (exact text in E.5) |
| Stage pace `300` ms | `03_Intake.tsx:187` | hardcoded | — |
| `Module execution ledger` / `Which collector modules ran, and with what result`; headers `Module`, `Status`, `Detail`, `Negative-capable` | `03_Intake.tsx:276`, `03_Intake.tsx:281-284` | hardcoded | — |
| Seven ledger rows: `identity` success 1,842 records; `endpoint` partial 12 of 400 hosts; `logging` failed `wineventlog_access_denied`; `cloud` declined; `configuration` success 214 objects; `vulnerability` success 3,908 findings; `backup` success 30 days | `03_Intake.tsx:288-309` | fixture | `moduleLedger`, `scenario.ts:193-199` |
| Status pill labels `success`, `partial`, `failed`, `declined` and tones green/amber/red/slate | `03_Intake.tsx:157-162` | hardcoded | — |
| `yes` / `no` under Negative-capable | `03_Intake.tsx:301-305` | fixture | `negativeCapable`, `scenario.ts:193-199` |
| `Only modules with status success may produce a negative finding. The logging module failed, so its controls remain Unknown, not Gap. A permission error must never manufacture a confident failure.` | `03_Intake.tsx:316-319` | hardcoded | the module name `logging` is a literal, not read from the ledger |
| `148 evidence gaps closed` | `03_Intake.tsx:326` | hardcoded | — |
| `Interval collapses 49.9–87.1% → 70.8–81.4% · coverage 62.8% → 89.4% · assurance L1 → L2` | `03_Intake.tsx:328` | hardcoded | literals; identical numbers also exist in `TOTALS` (`capabilities.ts:101`, `capabilities.ts:112`, `capabilities.ts:100`, `capabilities.ts:111`) |
| `Reveal on dashboard` | `03_Intake.tsx:332` | hardcoded | — |
| Banner `Declaration contradiction — blocked pending review` + paragraph | `03_Intake.tsx:357-364` | hardcoded | shown when `evidenceUploaded && profile.usesCloud === 'no'` (`03_Intake.tsx:351`) |

### D.6 Dashboard — `src/screens/04_Dashboard.tsx` (owner/analyst view)

Core computation: `dashboardView(uploaded, overrides)` (`src/lib/derive.ts:53-66`) takes the bucket counts of `TOTALS.before` or `TOTALS.after` (`derive.ts:11-20`), applies analyst overrides by moving counts between buckets (`src/lib/scoring.ts:96-114`), then calls `boundedScore(applicable, green, yellow, red, unknown)` (`scoring.ts:25-41`, `derive.ts:37`) with the default `yellowWeight = 0.5`:

```
numerator  = green*1.0 + yellow*0.5 + red*0.0
lower      = numerator / applicable
upper      = (numerator + unknown) / applicable
coverage   = (applicable - unknown) / applicable
width      = unknown / applicable
```

Results with no overrides (running the repository's own functions): before `49.91 / 87.07 / 62.84 / 37.16`; after `70.83 / 81.42 / 89.41 / 10.59` (lower / upper / coverage / width, in percent). These print as `49.9%`–`87.1%`, `62.8%`, `37.2 points` and `70.8%`–`81.4%`, `89.4%`, `10.6 points`.

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Hero interval numbers `49.9% — 87.1%` (before) / `70.8% — 81.4%` (after) | `04_Dashboard.tsx:224-229`; `src/components/ScoreInterval.tsx:45-47` | derived | `eff.lowerPct`, `eff.upperPct` from `dashboardView(...).effective` using `TOTALS` fixture buckets (`capabilities.ts:94-117`) and the expressions above |
| `width 37.2 points · coverage 62.8%` / `width 10.6 points · coverage 89.4%` | `ScoreInterval.tsx:98-99` | derived | `eff.widthPts`, `eff.coveragePct` |
| Band start position on first reveal | `04_Dashboard.tsx:229` | fixture | `animateFrom = TOTALS.before.interval` (`capabilities.ts:101`) when `uploaded` |
| `0%`, `100%` axis labels; gridlines at 25/50/75 | `ScoreInterval.tsx:84-89`, `ScoreInterval.tsx:52` | hardcoded | — |
| Card title `Compliance Interval`; subtitle `Never a single percentage — the band is the cost of missing evidence` | `04_Dashboard.tsx:218` | hardcoded | — |
| Caption `Compliance interval` under the hero | `ScoreInterval.tsx:28` | hardcoded | default prop `caption` |
| Subline `Width is the cost of missing evidence. ` (before) / `Interval narrowed after the Windows/AD collector bundle closed 90 evidence gaps.` (after) | `04_Dashboard.tsx:230-234` | hardcoded | `90` literal |
| `Provide 5 more artifacts to narrow this toward ~10 points.` (before only) | `04_Dashboard.tsx:236-243` | hardcoded | `5` and `~10` literals |
| Banner `Pre-upload state — testimony only. Run the collector bundle on the Intake screen to see the interval collapse.` | `04_Dashboard.tsx:168-178` | hardcoded | shown while `!uploaded` |
| Banner `Scoping contradiction — blocked pending review` + paragraph | `04_Dashboard.tsx:180-194` | hardcoded | shown when `uploaded && profile.usesCloud === 'no' && !challenge` |
| Override banner: `{n} analyst override(s) applied. Engine verdict: a–b%. With overrides: c–d%.` and link `Review overrides` | `04_Dashboard.tsx:196-213` | derived | `view.overridesActive` (count of overrides whose state differs from the engine state, `scoring.ts:104-112`); `view.engine` vs `view.effective` |
| Coverage card title `Coverage`; subtitle `350 of 557 applicable controls` (before) / `498 of 557 …` (after) | `04_Dashboard.tsx:247` | derived | `completenessStatement(uploaded)` → `covered = TOTALS.*.evidenced` (350/498), `applicable = TOTALS.applicable` (557) (`src/lib/coverage.ts:28-37`) |
| Donut slice `Artifact-evidenced` `284` / `399` (fill `#059669`) | `04_Dashboard.tsx:147`; `coverage.ts:20` | derived | `green + red` of `TOTALS.before` / `TOTALS.after` |
| Donut slice `Testimony only` `66` / `99` (fill `#d97706`) | `04_Dashboard.tsx:148`; `coverage.ts:21` | derived | `TOTALS.*.yellow` |
| Donut slice `Unevidenced — collectable` `168` / `20` (fill `#7c3aed`) | `04_Dashboard.tsx:149`; `coverage.ts:22` | derived | `TOTALS.*.unknown - UNCOLLECTABLE_COUNT` (207−39, 59−39) |
| Donut slice `Structurally uncollectable` `39` (fill `#64748b`) | `04_Dashboard.tsx:150`; `coverage.ts:23` | fixture | `UNCOLLECTABLE_COUNT = 39`, `src/data/controls.ts:236` |
| Donut tooltip (`name : value` on hover) and slice geometry (`innerRadius 45`, `outerRadius 75`, `paddingAngle 2`) | `04_Dashboard.tsx:251-256` | derived | Recharts default `<Tooltip />`; radii literals |
| `Coverage is the share of applicable controls with evidence.` | `04_Dashboard.tsx:271-273` | hardcoded | — |
| `Oldest evidence: 84 days (JNCSF-459) · 6 controls approaching staleness · assessed 2026-09-08` (after only) | `04_Dashboard.tsx:274-280` | fixture | `EVIDENCE_FRESHNESS.oldestDays/oldestControl/approachingStaleness` (`src/data/evidence.ts:153-156`), `ASSESSMENT_DATE` (`evidence.ts:141`) |
| Assurance card `Assurance level` / `How the evidence was established`; four rows `L0 Declared`, `L1 Documented`, `L2 Tool-evidenced`, `L3 Analyst-signed` | `04_Dashboard.tsx:283-299` | hardcoded | `ASSURANCE_LEVELS`, `src/lib/scoring.ts:117-122` |
| Which level is highlighted and its definition (`Policy and testimonial evidence only; no machine-collected artifacts.` / `Machine-collected artifacts corroborate a majority of controls.`) | `04_Dashboard.tsx:153`, `04_Dashboard.tsx:286`, `04_Dashboard.tsx:295` | derived | `uploaded ? 'L2' : 'L1'`; definitions `scoring.ts:119-120` |
| `Why L2, not L3.` … `L3 requires analyst sign-off and every declared-estate module succeeding — the logging module failed.` | `04_Dashboard.tsx:302-304` | hardcoded | shown when `uploaded` |
| `Demotion risks: 1 declined module · {n} analyst override(s) · N/A rate above sector baseline` | `04_Dashboard.tsx:305-308` | derived | `1` and the third phrase are literals; `n = Object.keys(overrides).length` |
| `By capability` / `Each capability carries its own interval and coverage figure` | `04_Dashboard.tsx:315` | hardcoded | — |
| Five capability rows: name, `{G}G · {Y}Y · {R}R · {U} unknown`, interval bar, coverage % | `04_Dashboard.tsx:329-349` | fixture | `capabilities[].before/after`, table below. These rows read the capability fixture directly and do **not** pass through `dashboardView`, so analyst overrides do not change them |
| Interval bar for a capability: `{lower}%`, `width {hi−lo} pts`, `{upper}%` | `04_Dashboard.tsx:343`; `ScoreInterval.tsx:104-108` | derived | lower/upper = `stat.interval[0]`, `[1]` (fixture); width = `interval[1] - interval[0]` |
| Row for the sixth capability: `Security in National Cyber Responsibility`, `Not organisationally assessable — national obligation`, pill `0 numbered controls` | `04_Dashboard.tsx:318-327` | hardcoded | the name is `capabilities` fixture (`capabilities.ts:77`); the sentence and pill text are literals (`Capability.totalControls: 0`, `capabilities.ts:79`, is not read) |
| Risk-weighting card: title `Risk weighting`, subtitle `Derived from NIST SP 800-53B baselines — an additive view, not a replacement for the interval above`; toggle `Unweighted (default)` / `Weighted` | `04_Dashboard.tsx:357-367` | hardcoded | toggle state `useState(false)` (`04_Dashboard.tsx:134`) |
| `Showing the unweighted interval — every control counts equally. Switch on to see the same assessment scored by NIST-baseline risk weight.` | `04_Dashboard.tsx:371-374` | hardcoded | — |
| Weight table (5 rows: `NIST Low baseline` 251 / 1.0; `NIST Moderate baseline` 72 / 0.7; `NIST High baseline` 14 / 0.5; `NIST, no baseline` 66 / 0.5; `Underived` 173 / 1.0) | `04_Dashboard.tsx:387-396` | fixture | `RISK_WEIGHT_TABLE`, `src/data/riskWeighting.ts:15-19`; weight printed with `.toFixed(1)` |
| `(30% of framework)` and `(conservative default)` beside the Underived row | `04_Dashboard.tsx:391`, `04_Dashboard.tsx:394` | fixture | `UNDERIVED_SHARE_PCT = 30` (`riskWeighting.ts:23`); `(conservative default)` is a literal |
| `Derived-only` `331.4`; `Including underived` `498.4` | `04_Dashboard.tsx:403-409` | fixture | `RISK_WEIGHTED_TOTALS`, `riskWeighting.ts:29-30` |
| `167`-control gap sentence | `04_Dashboard.tsx:412-415` | derived | `RISK_WEIGHTED_TOTALS.gap` = `+(includingUnderived - derivedOnly).toFixed(1)` (`riskWeighting.ts:31-33`) |
| `weighted width is currently 14.9 pts, which is not derivable from the {coverage}% coverage figure above` | `04_Dashboard.tsx:416-418` | fixture | `WEIGHTED_WIDTH_PTS = 14.9` (`riskWeighting.ts:40`); coverage `fmt1(eff.coveragePct)` is derived |
| Explainer `30% of the framework carries no derived weight …` | `04_Dashboard.tsx:420` | fixture | `RISK_WEIGHTING_EXPLAINER`, `riskWeighting.ts:42-45` |
| Completeness statement: `This assessment covers 350 of 557 applicable controls. 207 are unevidenced. 39 are outside the tool's collection reach. Assurance level: L1 — Documented.` (after: `498 of 557`, `59`, `39`, `L2 — Tool-evidenced`) | `04_Dashboard.tsx:431-438` | derived | `completenessStatement` (`coverage.ts:28-37`): `unevidenced = TOTALS.*.unknown`, `uncollectable = UNCOLLECTABLE_COUNT`, `assurance` = literal strings `L2 — Tool-evidenced` / `L1 — Documented` (`coverage.ts:35`) |
| Heading `Completeness statement — cannot be dismissed` | `04_Dashboard.tsx:429` | hardcoded | — |
| CICSC paragraph `This organisation operates critical infrastructure and is subject to the Critical Infrastructure Cyber Security Controls (405 controls, three implementation levels) …` | `04_Dashboard.tsx:439-447` | hardcoded | shown when `profile.operatesCriticalInfrastructure` |
| Exclusion card heading `Scope exclusions — 19 of 576 controls` | `04_Dashboard.tsx:452` | fixture | `TOTALS.notApplicable` (`capabilities.ts:92`), `TOTALS.totalControls` (`capabilities.ts:91`) |
| `19 controls (3.3%) are marked Not Applicable. Sector baseline for Government Services: 5.0% — in line with baseline.` | `04_Dashboard.tsx:455-463` | derived | `naRate = (TOTALS.notApplicable / TOTALS.totalControls) * 100` (`04_Dashboard.tsx:163`); baseline `SECTOR_BASELINE.naRatePct` (`exclusions.ts:22`); branch `naRate > baseline ? '⚠ your rate is above baseline' : 'in line with baseline'` |
| `8 exclusions carry no recorded justification · no scoping challenges` | `04_Dashboard.tsx:466-467` | derived | `EXCLUSIONS.filter(e => !e.justification).length` (`04_Dashboard.tsx:164`); second phrase: `challenge ? '1 scoping challenge recorded' : cloudContradiction ? '1 scoping challenge overridden' : 'no scoping challenges'` |
| `Review all 19 exclusions →` | `04_Dashboard.tsx:473` | fixture | `TOTALS.notApplicable` |
| Gap-reason chart title `Why controls are unevidenced`; subtitle `Breakdown of the 207 Unknowns before the evidence bundle` / `… 59 Unknowns after …` | `04_Dashboard.tsx:480-485` | derived | `gapTotal` = Σ counts (`04_Dashboard.tsx:161`) |
| Chart bars (category labels `Not provided`, `Uncollectable by design`, `Insufficient signal`, `Declined by client`, `Insufficient permission`, `Stale`, `Not requested`; counts before `117, 39, 23, 15, 8, 5, 0`; after `7, 39, 3, 5, 3, 2, 0`) | `04_Dashboard.tsx:155-160`, `04_Dashboard.tsx:488-500` | fixture | `GAP_REASON_BREAKDOWN`, `controls.ts:225-231`; labels `GAP_REASON_LABEL`, `controls.ts:265-273`. X axis hidden (`<XAxis type="number" hide />`, `04_Dashboard.tsx:490`); no axis titles; bar fill `#7c3aed`, or `#94a3b8` when `invariant` (`04_Dashboard.tsx:495`) |
| `not_requested = 0 is a design invariant. The tool always asks for every artifact it needs; a non-zero value here would indicate a defect in the request planner.` | `04_Dashboard.tsx:505-507` | hardcoded | — |
| `Every evidence signal records why it is or isn't negative-capable, framework-wide: of 115 signals, 1 is false through uncertainty rather than rule or judgement — the recoverable case. Also, 7 of 66 authored controls have no conclusive path at all — each such control's detail page states the limit.` | `04_Dashboard.tsx:512-518` | fixture | `EVIDENCE_SIGNAL_TOTAL` (`controls.ts:253`), `uncertainty` count (`controls.ts:250`), `NO_CONCLUSIVE_PATH_STATS.noPath`/`.authoredTotal` (`controls.ts:259-260`) |
| `See the 90 promoted controls in the Gap Matrix` (after only) | `04_Dashboard.tsx:525-527` | hardcoded | `90` literal; the Gap Matrix filter it links to (`?changed=1`) shows `changed` seeded controls, of which there are 25 (D.7) |

Capability fixture values that reach the dashboard rows (`src/data/capabilities.ts`; `interval` is `[lower, upper]`, `cov` = `coveragePct`):

| Capability (`shortName`) | `name` | Before (line): applicable / evidenced / G / Y / R / unknown / cov / interval | After (line): applicable / evidenced / G / Y / R / unknown / cov / interval |
|---|---|---|---|
| `Architecture & Portfolio` | `Security in Architecture & Portfolio` | `capabilities.ts:36` 25 / 15 / 10 / 3 / 2 / 10 / 60.0 / [46.0, 86.0] | `capabilities.ts:37` 25 / 23 / 15 / 5 / 3 / 2 / 92.0 / [70.0, 78.0] |
| `Development` | `Security in Development` | `capabilities.ts:45` 50 / 30 / 20 / 6 / 4 / 20 / 60.0 / [46.0, 86.0] | `capabilities.ts:46` 50 / 45 / 30 / 9 / 6 / 5 / 90.0 / [69.0, 79.0] |
| `Delivery` | `Security in Delivery` | `capabilities.ts:54` 44 / 32 / 22 / 6 / 4 / 12 / 72.7 / [56.8, 84.1] | `capabilities.ts:55` 44 / 42 / 28 / 9 / 5 / 2 / 95.5 / [73.9, 78.4] |
| `Operations` | `Security in Operations` | `capabilities.ts:63` 299 / 192 / 135 / 36 / 21 / 107 / 64.2 / [51.2, 87.0] | `capabilities.ts:64` 299 / 272 / 188 / 54 / 30 / 27 / 91.0 / [71.9, 80.9] |
| `Foundational` | `Foundational Capabilities` | `capabilities.ts:72` 139 / 81 / 58 / 15 / 8 / 58 / 58.3 / [47.1, 88.8] | `capabilities.ts:73` 139 / 116 / 84 / 22 / 10 / 23 / 83.5 / [68.3, 84.9] |

(`totalControls` per capability: 25, 69, 44, 299, 139, and 0 for `natl` — `capabilities.ts:34`, `capabilities.ts:43`, `capabilities.ts:52`, `capabilities.ts:61`, `capabilities.ts:70`, `capabilities.ts:79`; not displayed.)

#### D.6.1 Executive dashboard (`ExecutiveDashboard`, `04_Dashboard.tsx:38-125`)

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Card `Compliance interval` / `Executive summary — the band, not a number` | `04_Dashboard.tsx:49` | hardcoded | — |
| Hero interval, width, coverage | `04_Dashboard.tsx:51-55` | derived | same `dashboardView(...).effective` as above |
| Subline `Assurance L1 — Documented. 207 controls still unevidenced.` / `Assurance L2 — Tool-evidenced. 59 controls still unevidenced.` | `04_Dashboard.tsx:57` | derived | `cs.unevidenced` = `TOTALS.*.unknown`; assurance words are literals |
| Card `Trend` / `last four collection cycles` | `04_Dashboard.tsx:61` | hardcoded | — |
| Bar `Q4-25`: `41`–`92` | `04_Dashboard.tsx:64` | hardcoded | — |
| Bar `Q1-26`: `46`–`90` | `04_Dashboard.tsx:65` | hardcoded | — |
| Bar `Q2-26`: `49.9`–`87.1` | `04_Dashboard.tsx:66` | fixture | `TOTALS.before.interval` (`capabilities.ts:101`) |
| Bar `Q3-26` (before upload: `49.9`–`87.1`) or `now` (after upload: `70.8`–`81.4`) | `04_Dashboard.tsx:67` | derived | `uploaded ? eff.lowerPct/eff.upperPct : TOTALS.before.interval` |
| Bar geometry (`bottom: lo%`, `height: hi−lo %`, container `h-24`) | `04_Dashboard.tsx:70-71` | derived | — |
| `band narrowing as coverage improves` | `04_Dashboard.tsx:78` | hardcoded | shown regardless of the data |
| `Top 3 risks` / `what to escalate` | `04_Dashboard.tsx:83` | hardcoded | — |
| Risk 1 `Vulnerability scanning not established` — `22 servers overdue for patches · exposes T1190`; Risk 2 `Least privilege not enforced` — `43 privileged accounts without MFA · exposes T1078`; Risk 3 `Audit records incomplete` — `3 of 9 audit subcategories off · reduces detection` | `04_Dashboard.tsx:33-35` | hardcoded | `TOP_RISKS` array; independent of control states |
| Completeness statement (shorter form) | `04_Dashboard.tsx:103-107` | derived | `cs.covered`, `cs.applicable`, `cs.unevidenced` |
| CICSC paragraph | `04_Dashboard.tsx:108-116` | hardcoded | shown when `operatesCriticalInfrastructure` |
| `Executive view — evidence excerpts, personal data and per-control detail are not shown. Switch role (top right) for the full assessment.` | `04_Dashboard.tsx:119-122` | hardcoded | — |

### D.7 Gap Matrix — `src/screens/05_GapMatrix.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Search box, placeholder `Search controls…` | `05_GapMatrix.tsx:92` | user input | local `useState` `q`; matches `${c.id} ${c.description}` case-insensitively (`05_GapMatrix.tsx:76`) |
| State filter: `Any state` plus option text `green`, `yellow`, `red`, `unknown` (raw state keys, lower case; no `grey` option) | `05_GapMatrix.tsx:97-100` | hardcoded | — |
| Evidence-class filter: `Any evidence class`, `No evidence`, `Testimonial`, `Artifact`, `Analyst-signed` | `05_GapMatrix.tsx:103-106` | fixture | `EVIDENCE_CLASS_LABEL`, `src/data/controls.ts:276-281` |
| Gap-reason filter: `Any gap reason` plus the nine labels `Not provided`, `Declined by client`, `Module failed`, `Insufficient permission`, `Unparseable`, `Stale`, `Insufficient signal`, `Uncollectable by design`, `Not requested` | `05_GapMatrix.tsx:109-112` | fixture | `GAP_REASON_LABEL`, `controls.ts:264-274` |
| Checkbox `Show only what changed after evidence upload` (disabled until upload) | `05_GapMatrix.tsx:114-117` | hardcoded | state from URL `?changed=1` or user input |
| Checkbox `Overridden only ({n})` (only when at least one override exists) | `05_GapMatrix.tsx:118-123` | derived | `Object.keys(overrides).length` |
| Five capability group headers (names as in D.6 table); the sixth capability shows `Security in National Cyber Responsibility` / `Not organisationally assessable — national obligation` | `05_GapMatrix.tsx:128-135` | fixture | `capabilities` |
| `{applicable} applicable · {shown} of {seeded} seeded shown` (e.g. `299 applicable · 18 of 18 seeded shown`) | `05_GapMatrix.tsx:149-151` | derived | `stat.applicable` (fixture); `capRows.length`; `controls.filter(c => c.capability === cap.id).length`. Seeded counts: arch 8, dev 7, del 6, ops 18, found 9 |
| `worst established` badge + number (always `Gap` with `stat.red` in the shipped data: 3, 6, 5, 30, 10 after upload; 2, 4, 4, 21, 8 before) | `05_GapMatrix.tsx:157-163`; `05_GapMatrix.tsx:23-28` | derived | `worstEstablished(stat)`: red if `stat.red > 0`, else yellow, else green; count = that bucket from the capability fixture |
| `unestablished` diamond + number (10, 20, 12, 107, 58 before; 2, 5, 2, 27, 23 after) | `05_GapMatrix.tsx:164-168` | fixture | `stat.unknown`; tooltip `Two independent figures from the capability fixture — never an average, and unaffected by filters` (`05_GapMatrix.tsx:155`) |
| Default open group | `05_GapMatrix.tsx:35-38` | hardcoded | `ops`, unless `?cap=` is present |
| Empty message `No seeded controls match the current filters.` | `05_GapMatrix.tsx:176` | hardcoded | — |
| Control rows (id, description, state badge, evidence pill, gap-reason pill, `promoted` pill, `showcase` pill) | `05_GapMatrix.tsx:62-79`, `05_GapMatrix.tsx:180-188`; `src/components/ControlRow.tsx:36-53` | fixture | the 48 seeds below. Row state = `overrides[id]?.state ?? snapshot.state`; the evidence pill is the **snapshot's** class even when overridden (`05_GapMatrix.tsx:67`) |
| `promoted` highlight | `05_GapMatrix.tsx:185` | derived | `onlyChanged \|\| (uploaded && c.changed)` |
| State badge labels | `src/components/StateBadge.tsx:10-14` | hardcoded | see Section E.1 |

#### D.7.1 The 48 seeded controls (`src/data/controls.ts:101-152`)

All columns are `fixture` (file and line given), except `Evidence basis` which is `derived` by `evidenceBasisFor` (`controls.ts:173-179`) from the number sets at `controls.ts:159`, `controls.ts:163`, `controls.ts:167`, `controls.ts:171`. The `description`, `iso`, `nist`, `requiredSignals` of each control are on the cited line and are displayed on the Gap Matrix row (description) and the Control Detail page (all four). `Defined at` is the seed line.

| Control | Defined at | Cap | Before: state / evidence / gap reason | After: state / evidence / gap reason | `changed` | Other fields that reach the UI | Evidence basis (derived) | No-conclusive-path |
|---|---|---|---|---|---|---|---|---|
| `JNCSF-1` | `src/data/controls.ts:101` | arch | green / artifact / — | green / artifact / — | false | — | by_rule | — |
| `JNCSF-3` | `src/data/controls.ts:102` | arch | yellow / testimonial / — | yellow / testimonial / — | false | — | by_rule | — |
| `JNCSF-6` | `src/data/controls.ts:103` | arch | green / artifact / — | green / artifact / — | false | — | by_rule | yes |
| `JNCSF-7` | `src/data/controls.ts:104` | arch | unknown / none / not_provided | green / artifact / — | true | attackKey JNCSF-7; populationNote `512 of 512 AD computer objects reconciled against the CMDB.` | negative_capable | — |
| `JNCSF-8` | `src/data/controls.ts:105` | arch | unknown / none / not_provided | yellow / artifact / — | true | — | negative_capable | — |
| `JNCSF-14` | `src/data/controls.ts:106` | arch | green / artifact / — | green / artifact / — | false | — | by_rule | — |
| `JNCSF-20` | `src/data/controls.ts:107` | arch | yellow / testimonial / — | yellow / testimonial / — | false | — | by_rule | yes |
| `JNCSF-25` | `src/data/controls.ts:108` | arch | unknown / none / declined | unknown / none / declined | false | — | by_rule | — |
| `JNCSF-27` | `src/data/controls.ts:110` | dev | unknown / none / not_provided | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-30` | `src/data/controls.ts:111` | dev | unknown / none / not_provided | red / artifact / — | true | attackKey JNCSF-30 | negative_capable | — |
| `JNCSF-32` | `src/data/controls.ts:112` | dev | yellow / testimonial / — | yellow / artifact / — | true | — | uncertainty | — |
| `JNCSF-39` | `src/data/controls.ts:113` | dev | green / artifact / — | green / artifact / — | false | — | negative_capable | — |
| `JNCSF-45` | `src/data/controls.ts:114` | dev | unknown / none / not_provided | yellow / artifact / — | true | — | negative_capable | — |
| `JNCSF-46` | `src/data/controls.ts:115` | dev | unknown / none / insufficient_signal | unknown / none / insufficient_signal | false | — | judgement | — |
| `JNCSF-87` | `src/data/controls.ts:116` | dev | yellow / testimonial / — | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-96` | `src/data/controls.ts:118` | del | green / artifact / — | green / artifact / — | false | — | negative_capable | — |
| `JNCSF-100` | `src/data/controls.ts:119` | del | yellow / testimonial / — | yellow / testimonial / — | false | — | judgement | yes |
| `JNCSF-102` | `src/data/controls.ts:120` | del | yellow / testimonial / — | red / artifact / — | true | attackKey JNCSF-102; deploymentSharePct 80; exceptionPopulation `43 of 512 privileged accounts have no MFA enforcement`; populationNote `410 of 512 endpoints (denominator: AD computer objects). Sample ratio sufficient for estate-level claim.`; showcase | negative_capable | — |
| `JNCSF-105` | `src/data/controls.ts:121` | del | unknown / none / not_provided | unknown / none / not_provided | false | — | judgement | — |
| `JNCSF-107` | `src/data/controls.ts:122` | del | green / artifact / — | green / artifact / — | false | — | negative_capable | — |
| `JNCSF-116` | `src/data/controls.ts:123` | del | green / artifact / — | green / artifact / — | false | — | negative_capable | — |
| `JNCSF-139` | `src/data/controls.ts:125` | ops | unknown / none / not_provided | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-141` | `src/data/controls.ts:126` | ops | yellow / testimonial / — | red / artifact / — | true | attackKey JNCSF-141 | negative_capable | — |
| `JNCSF-142` | `src/data/controls.ts:127` | ops | unknown / none / not_provided | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-146` | `src/data/controls.ts:128` | ops | unknown / none / not_provided | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-163` | `src/data/controls.ts:129` | ops | unknown / none / not_provided | red / artifact / — | true | attackKey JNCSF-163 | negative_capable | — |
| `JNCSF-167` | `src/data/controls.ts:130` | ops | yellow / testimonial / — | yellow / testimonial / — | false | — | judgement | — |
| `JNCSF-173` | `src/data/controls.ts:131` | ops | unknown / none / not_provided | unknown / none / module_failed | false | — | judgement | — |
| `JNCSF-179` | `src/data/controls.ts:132` | ops | unknown / none / not_provided | unknown / none / module_failed | false | — | judgement | — |
| `JNCSF-190` | `src/data/controls.ts:133` | ops | yellow / testimonial / — | yellow / testimonial / — | false | — | judgement | — |
| `JNCSF-225` | `src/data/controls.ts:134` | ops | unknown / none / not_provided | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-252` | `src/data/controls.ts:135` | ops | yellow / testimonial / — | yellow / testimonial / — | false | — | judgement | — |
| `JNCSF-257` | `src/data/controls.ts:136` | ops | yellow / testimonial / — | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-307` | `src/data/controls.ts:137` | ops | unknown / none / not_provided | red / artifact / — | true | attackKey JNCSF-307 | negative_capable | — |
| `JNCSF-382` | `src/data/controls.ts:138` | ops | unknown / none / not_provided | yellow / artifact / — | true | — | negative_capable | — |
| `JNCSF-394` | `src/data/controls.ts:139` | ops | yellow / testimonial / — | green / artifact / — | true | attackKey JNCSF-394; deploymentSharePct 80; exceptionPopulation `Contractor-managed workstations excluded from managed AV` | negative_capable | — |
| `JNCSF-407` | `src/data/controls.ts:140` | ops | unknown / none / not_provided | red / artifact / — | true | — | negative_capable | — |
| `JNCSF-435` | `src/data/controls.ts:141` | ops | yellow / testimonial / — | red / artifact / — | true | attackKey JNCSF-435; exceptionPopulation `43 of 512 privileged accounts without MFA` | negative_capable | — |
| `JNCSF-437` | `src/data/controls.ts:142` | ops | unknown / none / not_provided | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-438` | `src/data/controls.ts:144` | found | green / artifact / — | green / artifact / — | false | — | negative_capable | — |
| `JNCSF-440` | `src/data/controls.ts:145` | found | yellow / testimonial / — | green / artifact / — | true | attackKey JNCSF-440 | negative_capable | — |
| `JNCSF-459` | `src/data/controls.ts:146` | found | yellow / testimonial / — | yellow / artifact / — | true | deploymentSharePct 78; maxAgeDays 365 | negative_capable | — |
| `JNCSF-465` | `src/data/controls.ts:147` | found | unknown / none / not_provided | green / artifact / — | true | — | negative_capable | — |
| `JNCSF-479` | `src/data/controls.ts:148` | found | unknown / none / uncollectable_by_design | unknown / none / uncollectable_by_design | false | — | judgement | — |
| `JNCSF-512` | `src/data/controls.ts:149` | found | unknown / none / declined | unknown / none / declined | false | — | judgement | — |
| `JNCSF-515` | `src/data/controls.ts:150` | found | yellow / testimonial / — | red / artifact / — | true | — | negative_capable | — |
| `JNCSF-538` | `src/data/controls.ts:151` | found | green / artifact / — | green / artifact / — | false | — | judgement | — |
| `JNCSF-573` | `src/data/controls.ts:152` | found | unknown / none / uncollectable_by_design | unknown / none / uncollectable_by_design | false | — | judgement | — |

Counts over the 48 seeds, computed by running the repository's own `controls` array: `before` states green 9 / yellow 16 / unknown 23 / red 0; `after` states green 21 / yellow 11 / unknown 8 / red 8; `changed: true` on 25 seeds (23 differ in state; `JNCSF-32` and `JNCSF-459` keep `yellow` but move from `testimonial` to `artifact`); evidence basis `negative_capable` 29 / `judgement` 12 / `by_rule` 6 / `uncertainty` 1; `noConclusivePath` on `JNCSF-6`, `JNCSF-20`, `JNCSF-100`; 9 seeds carry an `attackKey`. These seeded counts are independent of the capability totals in D.6 (for example the seeds contain 8 `red` controls after upload while `TOTALS.after.red` is 54).

### D.8 Control Detail — `src/screens/06_ControlDetail.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Control id, capability pill (`shortName`), description heading | `06_ControlDetail.tsx:128-134` | fixture | the seed rows above |
| Pills `showcase control`, `promoted by upload`, `analyst override` | `06_ControlDetail.tsx:130-132` | derived | `control.showcase`; `uploaded && control.changed`; `ov` |
| `Assessment as of 2026-09-08` | `06_ControlDetail.tsx:135` | fixture | `ASSESSMENT_DATE`, `src/data/evidence.ts:141` |
| Large state badge | `06_ControlDetail.tsx:138` | derived | `ov?.state ?? snapshotFor(control, uploaded).state` (`06_ControlDetail.tsx:94-96`) |
| Evidence-class pill | `06_ControlDetail.tsx:139-141` | derived | `ov ? 'analyst_signed' : base.evidenceClass` (`06_ControlDetail.tsx:97`) |
| Gap-reason pill | `06_ControlDetail.tsx:142` | fixture | `base.gapReason` when `base.state === 'unknown'` |
| `evidence {n}d old` / `· past {n}d window` | `06_ControlDetail.tsx:105-106`, `06_ControlDetail.tsx:143-147` | derived | `n` = max `ageDays(timestamp)` over the visible evidence items against `ASSESSMENT_DATE`; window = `control.maxAgeDays` (default `90`, `controls.ts:198`; `365` on `JNCSF-459`) |
| Standards mapping: card `Standards mapping` / `ISO/IEC 27002 and NIST SP 800-53`; chips `{ref} · {name}`; `—` when empty | `06_ControlDetail.tsx:153-173` | fixture | `iso`, `nist` on the seed; names from `ISO_NAMES`/`NIST_NAMES` (`src/data/standards.ts:3-43`, `standards.ts:45-88`) via `controls.ts:190`, `controls.ts:192` |
| `Evidence trail` / `Every finding traces to a quote or an artifact locator with a hash` | `06_ControlDetail.tsx:178` | hardcoded | — |
| `Evidence basis: {label}.` + meaning + `This is why an absent finding here can be a Gap rather than Unknown.` | `06_ControlDetail.tsx:182-184` | fixture | `EVIDENCE_BASIS_LABEL`/`_MEANING` (`controls.ts:31-43`) indexed by the derived `control.evidenceBasis` |
| Evidence items (filtered to testimonial-only before upload) | `06_ControlDetail.tsx:100`; `src/components/EvidenceTrail.tsx:21-61` | fixture | the 10 items in D.8.1 |
| Empty state `No evidence items recorded for this control yet. It sits at its evidence-class ceiling until an artifact is provided.` | `src/components/EvidenceTrail.tsx:11-14` | hardcoded | shown for the 41 seeds with no item, and for controls whose only items are artifacts before upload |
| Hidden-evidence text `Evidence excerpts are hidden in the {role} view — they may contain account names and other personal data.` | `06_ControlDetail.tsx:191-194` | hardcoded | condition `role === 'executive' \|\| 'contributor'` (`06_ControlDetail.tsx:103`); not reachable through the UI (see B.4) |
| `No conclusive evidence path.` box | `06_ControlDetail.tsx:198-208` | hardcoded | shown when `control.noConclusivePath` |
| Evidence-sufficiency ladder: `No evidence`/`Testimonial`/`Artifact`/`Analyst-signed`, each `ceiling: Unknown` / `Partial` / `Compliant` / `Compliant`; `current` marker | `06_ControlDetail.tsx:26`, `06_ControlDetail.tsx:212-227` | fixture | `EVIDENCE_CEILING`, `controls.ts:284-289`; labels from `STATE_META` |
| `This control's evidence is {class}, so it can reach at most {state}. Testimony alone can never mark a control Compliant — only machine-collected artifacts or an analyst signature.` | `06_ControlDetail.tsx:228-232` | derived | `EVIDENCE_CLASS_LABEL[effectiveClass]`, `STATE_META[EVIDENCE_CEILING[effectiveClass]].label` |
| ATT&CK card: `ATT&CK exposure` / `Control → Mitigation → Techniques`, then `AttackExposure` | `06_ControlDetail.tsx:236-237` | fixture | `attackBridge[control.attackKey]`, `src/data/attack.ts:56-168` (9 controls); exposed/mitigated styling chosen by `enforced = effectiveState === 'green'` |
| No-mapping text `No ATT&CK mapping. This is a governance control with no direct adversary-technique correspondence. 203 of 576 controls (35.2%) carry a mapping — …` | `src/components/AttackExposure.tsx:22-25` | fixture | `ATTACK_COVERAGE.mappedControls` (203) and `.mappedPct` (35.2), `attack.ts:39-40`; `576` is a literal in the JSX |
| Source badge `Official — NCSC Threat Annex` / `Derived — transitive via NIST, reviewed` | `AttackExposure.tsx:56-63` | hardcoded | chosen by `entry.source`; the longer tooltip is fixture `sourceLabel` (`attack.ts:33-34`) |
| `Mitigation` id and name; `Technique` id and name | `AttackExposure.tsx:46-47`, `AttackExposure.tsx:76-82` | fixture | `attack.ts` entries (table in D.8.2) |
| Collapse: first `4` techniques, button `and {n} lower-confidence technique(s)` | `AttackExposure.tsx:31`, `AttackExposure.tsx:85-93` | fixture | `DIFFUSE_COLLAPSE_THRESHOLD = 4` (`attack.ts:54`) |
| `Derived mapping with a long transitive tail — showing the 4 highest-confidence techniques. A finding naming all {n} tells a reader nothing; …` | `AttackExposure.tsx:97-102` | derived | shown when `entry.techniques.length > 4`; only `JNCSF-141` (19 techniques) qualifies |
| `Because {id} is enforced, exposure to these techniques is mitigated by {mitigation}.` / `Because {id} is not enforced, you are exposed to {T-ids and names} …` | `AttackExposure.tsx:105-123` | derived | template over `enforced` and `entry` |
| `Population data` / `Numerator / denominator with provenance` | `06_ControlDetail.tsx:242` | hardcoded | card shown only if the seed has `populationNote`, `exceptionPopulation` or `deploymentSharePct` (`06_ControlDetail.tsx:241`): `JNCSF-7`, `-102`, `-394`, `-435`, `-459` |
| Population note, e.g. `512 of 512 AD computer objects reconciled against the CMDB.`; `410 of 512 endpoints (denominator: AD computer objects). Sample ratio sufficient for estate-level claim.` | `06_ControlDetail.tsx:244-248` | fixture | `populationNote`, `controls.ts:104`, `controls.ts:120` |
| `Deployment share: 80% — partial-credit quartile applied to the Yellow weighting.` (80 / 80 / 78 for `-102`, `-394`, `-459`) | `06_ControlDetail.tsx:250-255` | fixture | `deploymentSharePct`, `controls.ts:120`, `controls.ts:139`, `controls.ts:146`; the sentence is a literal (see L) |
| `Named exception retained: {text}` (`43 of 512 privileged accounts have no MFA enforcement`; `Contractor-managed workstations excluded from managed AV`; `43 privileged accounts without MFA`) | `06_ControlDetail.tsx:256-260` | fixture | `exceptionPopulation`, `controls.ts:120`, `controls.ts:139`, `controls.ts:141` |
| `How to evidence this` / `Move this control out of Unknown / off the Yellow ceiling`: one line per `requiredSignals` entry, with ` — via “{artifact}” ({effort}, unlocks {n})` when matched | `06_ControlDetail.tsx:266-285` | derived | shown when snapshot is `unknown` or `testimonial` (39 seeds before upload, 14 after). Match rule: `requestPlan.find(r => r.command.toLowerCase().includes(sig.split('_')[0]) \|\| r.formatHint.toLowerCase().includes(sig.split('_')[0]))` (`06_ControlDetail.tsx:270`). Of 116 signal entries across the 48 seeds, 77 match nothing and show no `via`; the 38 distinct matches are in D.8.3 |
| Link `Open in Remediation → What you didn't provide` | `06_ControlDetail.tsx:282-284` | hardcoded | — |
| Card `Analyst actions`; subtitle `Overrides are recorded and move the dashboard interval` (or `Read-only in the {role} view`) | `06_ControlDetail.tsx:289` | derived | `canOverride = role === 'analyst' \|\| 'owner'` |
| Buttons `Accept as Compliant`, `Override to Gap`, `Set to Unknown — request more evidence`, `Clear override (engine verdict: {label})` | `06_ControlDetail.tsx:291-303` | hardcoded | — |
| Override modal text, textarea placeholder `Justification (required) — what did you review, and why does it warrant this verdict?`, button `Record override` (enabled at ≥ 12 characters) | `06_ControlDetail.tsx:46-66` | hardcoded | justification is `user input` |
| Override audit record: `was`, `now … · analyst-signed`, `by`, `at`, `why` | `06_ControlDetail.tsx:310-319` | user input | `by` = `` `${ROLE_LABEL[role]} · demo` `` (`:348`); `at` = `new Date().toISOString().slice(0,16).replace('T',' ')` (`:349`); `why` = typed text; stored in `overriddenControls` (persisted) |
| `Related controls` / `Other {shortName} controls`; up to four chips `{id} {description first 44 chars}…` | `06_ControlDetail.tsx:326-334` | derived | `controls.filter(same capability, not self).slice(0, 4)` |
| `No such control.` + link `Back to the Gap Matrix` | `06_ControlDetail.tsx:87-89` | hardcoded | shown for any id not among the 48 seeds |

#### D.8.1 Evidence items (`src/data/evidence.ts`; shown on Control Detail via `EvidenceTrail`)

All cells are `fixture`. The `quote` (testimonial) and `raw` (artifact; shown in the `View raw` modal) texts are at the cited item line and are reproduced in Section E.4. Items of type `artifact` appear only after upload (`06_ControlDetail.tsx:100`).

| Control | Item (defined at) | Type | `locator` | `sha256` (display) | `source` | `timestamp` | `module` | Age at `ASSESSMENT_DATE` |
|---|---|---|---|---|---|---|---|---|
| `JNCSF-102` | `ev-102-1` (`src/data/evidence.ts:25`) | testimonial | `Interview — Infrastructure / Operator, turn 6` | `9f2a…c71e` | `Operator interview transcript` | `2026-09-03T11:22:00+03:00` | — | 5 d |
| `JNCSF-102` | `ev-102-2` (`src/data/evidence.ts:35`) | artifact | `raw/ad-privileged-groups.csv row 412` | `a3f1…d7e2` | `Active Directory — Get-ADGroupMember` | `2026-09-05T09:11:04+03:00` | `identity` | 3 d |
| `JNCSF-102` | `ev-102-3` (`src/data/evidence.ts:45`) | artifact | `raw/ad-computers.csv — aggregate` | `7c04…1b90` | `Active Directory — Get-ADComputer` | `2026-09-05T09:12:41+03:00` | `identity` | 3 d |
| `JNCSF-30` | `ev-30-1` (`src/data/evidence.ts:57`) | artifact | `raw/auditpol.txt lines 4–37` | `b81d…4a02` | `Windows — auditpol /get /category:*` | `2026-09-05T09:15:10+03:00` | `configuration` | 3 d |
| `JNCSF-435` | `ev-435-1` (`src/data/evidence.ts:69`) | testimonial | `Interview — Infrastructure / Operator` | `2e9c…88fa` | `Operator interview transcript` | `2026-09-03T11:29:00+03:00` | — | 5 d |
| `JNCSF-435` | `ev-435-2` (`src/data/evidence.ts:78`) | artifact | `raw/ad-privileged-groups.csv — MFAEnforced column` | `a3f1…d7e2` | `Active Directory — identity module` | `2026-09-05T09:11:04+03:00` | `identity` | 3 d |
| `JNCSF-173` | `ev-173-1` (`src/data/evidence.ts:90`) | artifact | `module: logging — execution ledger` | `0000…fail` | `Collector module ledger` | `2026-09-05T09:13:55+03:00` | `logging` | 3 d |
| `JNCSF-394` | `ev-394-1` (`src/data/evidence.ts:102`) | artifact | `raw/defender-status.json — aggregate` | `55ab…9d1c` | `Windows endpoints — Get-MpComputerStatus` | `2026-09-05T09:16:30+03:00` | `configuration` | 3 d |
| `JNCSF-459` | `ev-459-1` (`src/data/evidence.ts:114`) | artifact | `raw/lms-completion-2026Q2.csv — aggregate` | `4d10…ab77` | `LMS — completion report` | `2026-06-16T14:02:00+03:00` | `manual-upload` | 84 d |
| `JNCSF-7` | `ev-7-1` (`src/data/evidence.ts:126`) | artifact | `raw/cmdb-reconcile.json` | `c7f0…2ab4` | `CMDB ↔ AD reconciliation` | `2026-09-05T09:10:02+03:00` | `identity` | 3 d |

#### D.8.2 ATT&CK bridge entries (`src/data/attack.ts:56-168`), all `fixture`

| Control (`attackKey`) | Mitigation | `source` | Techniques shown | Defined at |
|---|---|---|---|---|
| `JNCSF-102` | `M1026` `Privileged Account Management` | official | `T1078 Valid Accounts`, `T1548 Abuse Elevation Control Mechanism`, `T1021 Remote Services` | `attack.ts:58-68` |
| `JNCSF-440` | `M1018` `User Account Management` | official | `T1078 Valid Accounts`, `T1098 Account Manipulation` | `attack.ts:70-79` |
| `JNCSF-30` | `M1047` `Audit` | derived | `T1070 Indicator Removal`, `T1562 Impair Defenses` | `attack.ts:81-90` |
| `JNCSF-435` | `M1032` `Multi-factor Authentication` | official | `T1110 Brute Force`, `T1078 Valid Accounts`, `T1550 Use Alternate Authentication Material` | `attack.ts:92-102` |
| `JNCSF-7` | `M1013` `Application Developer Guidance` | derived | `T1200 Hardware Additions` | `attack.ts:104-110` |
| `JNCSF-163` | `M1028` `Operating System Configuration` | derived | `T1200 Hardware Additions` | `attack.ts:112-118` |
| `JNCSF-394` | `M1049` `Antivirus/Antimalware` | official | `T1204 User Execution`, `T1566 Phishing` | `attack.ts:120-128` |
| `JNCSF-307` | `M1051` `Update Software` | derived | `T1190 Exploit Public-Facing Application` | `attack.ts:131-137` |
| `JNCSF-141` | `M1018` `User Account Management` | derived | 19 techniques: `T1078`, `T1098`, `T1136`, `T1136.001`, `T1136.002`, `T1087`, `T1069`, `T1531`, `T1548`, `T1556`, `T1484`, `T1098.001`, `T1021.001`, `T1021.002`, `T1078.002`, `T1078.003`, `T1550.002`, `T1552`, `T1110.003` (first four shown, rest collapsed) | `attack.ts:141-167` |

#### D.8.3 "How to evidence this" — signal matches produced by the rule at `06_ControlDetail.tsx:270`, all `derived`

| Required signal (as in `requiredSignals`) | Word tested (`sig.split('_')[0]`) | First `requestPlan` row whose `command` or `formatHint` contains it | Controls whose signal list contains it |
|---|---|---|---|
| `policy_document` | `policy` | `EDR agent inventory` | `JNCSF-1` |
| `asset_inventory_export` | `asset` | `Media sanitisation records` | `JNCSF-7` |
| `last_sync_timestamp` | `last` | `All accounts + state` | `JNCSF-7` |
| `line_item_reference` | `line` | `GPO baseline export` | `JNCSF-20` |
| `dpo_signoff` | `dpo` | `Local admin rights inventory` | `JNCSF-25` |
| `auditpol_output` | `auditpol` | `Audit policy configuration` | `JNCSF-30` |
| `event_field_coverage` | `event` | `Joiner/mover/leaver log` | `JNCSF-30` |
| `baseline_document` | `baseline` | `GPO baseline export` | `JNCSF-32` |
| `password_policy_export` | `password` | `All accounts + state` | `JNCSF-45`, `JNCSF-437` |
| `privileged_group_membership` | `privileged` | `Privileged group membership` | `JNCSF-102` |
| `mfa_enrolment_state` | `mfa` | `Privileged group membership` | `JNCSF-102` |
| `last_recertification` | `last` | `All accounts + state` | `JNCSF-102` |
| `encryption_state` | `encryption` | `Encryption-at-rest inventory (servers)` | `JNCSF-105` |
| `admin_account_naming` | `admin` | `Privileged group membership` | `JNCSF-107` |
| `auth_provider_config` | `auth` | `Vulnerability scan results` | `JNCSF-116` |
| `device_control_policy` | `device` | `Removable-media control policy` | `JNCSF-163` |
| `log_source_inventory` | `log` | `All accounts + state` | `JNCSF-167` |
| `siem_use_cases` | `siem` | `SIEM log source inventory` | `JNCSF-173` |
| `retention_config` | `retention` | `SIEM log source inventory` | `JNCSF-179` |
| `oldest_record_date` | `oldest` | `Patch compliance report` | `JNCSF-179` |
| `backup_job_report` | `backup` | `Backup job report` | `JNCSF-225` |
| `ir_plan` | `ir` | `Firewall rule base` | `JNCSF-252` |
| `exercise_record` | `exercise` | `Incident response plan + exercise record` | `JNCSF-252` |
| `reporting_procedure` | `reporting` | `Security awareness completion` | `JNCSF-257` |
| `scan_coverage` | `scan` | `Vulnerability scan results` | `JNCSF-307` |
| `server_encryption_state` | `server` | `Encryption-at-rest inventory (servers)` | `JNCSF-382` |
| `key_escrow` | `key` | `Encryption-at-rest inventory (servers)` | `JNCSF-382` |
| `signature_age` | `signature` | `Defender status` | `JNCSF-394` |
| `patch_compliance_report` | `patch` | `Patch compliance report` | `JNCSF-407` |
| `mfa_policy` | `mfa` | `Privileged group membership` | `JNCSF-435` |
| `privileged_enrolment` | `privileged` | `Privileged group membership` | `JNCSF-435` |
| `min_length` | `min` | `Privileged group membership` | `JNCSF-437` |
| `last_review_date` | `last` | `All accounts + state` | `JNCSF-438` |
| `lms_completion_export` | `lms` | `Security awareness completion` | `JNCSF-459` |
| `retention_period` | `retention` | `SIEM log source inventory` | `JNCSF-465` |
| `destruction_certificates` | `destruction` | `Media sanitisation records` | `JNCSF-479` |
| `completion_records` | `completion` | `Security awareness completion` | `JNCSF-512` |
| `asset_return_log` | `asset` | `Media sanitisation records` | `JNCSF-515` |

### D.9 Remediation & Requests — `src/screens/07_Remediation.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Heading `Remediation & evidence requests`; tab labels `All actions`, `Remediation plan`, `What you didn't provide`; link `Continue to OSCAL export` | `07_Remediation.tsx:261`, `07_Remediation.tsx:267-269`, `07_Remediation.tsx:285-286` | hardcoded | selected tab is local `useState`, default `'all'` (`07_Remediation.tsx:256`) |
| Sort pills `risk-weighted`, `quick wins`, `controls closed`, label `sort` | `07_Remediation.tsx:210`, `07_Remediation.tsx:217` | hardcoded | selection local, default `'impact'` (`07_Remediation.tsx:170`) |
| **All actions** — 12 cards: 6 evidence items + 6 fixes, ranked `1…12` | `07_Remediation.tsx:172-205`, `07_Remediation.tsx:221-249` | derived | see the ordering table below. Evidence items: `requestPlan.filter(r => r.method === 'automated' \|\| r.controlsUnlocked >= 4).slice(0, 6)` (`07_Remediation.tsx:173-175`) — thresholds `4` and `6` are literals. Fixes: `remediationPlan` |
| Evidence-card title `Run the {artifact in lower case}` (e.g. `Run the all accounts + state`) | `07_Remediation.tsx:179` | derived | `r.artifact.toLowerCase()` |
| Evidence-card effort (`3 min`, `10 min`, `2 min`, `4 min`, `5 min`, `1 min`) and `establishes N controls` (22, 18, 14, 12, 11, 9) | `07_Remediation.tsx:180-181`, `07_Remediation.tsx:240` | fixture | `requestPlan`, `scenario.ts:142-163` |
| Evidence acceptance line `Done when the {source} export is accepted and its {n} controls move out of Unknown.` | `07_Remediation.tsx:182` | derived | template over `requestPlan` row |
| Fix-card title, `closes N controls` (11, 9, 7, 6, 4, 4) and technique pills | `07_Remediation.tsx:187-191`, `07_Remediation.tsx:240-244` | fixture | `remediationPlan`, `src/data/remediation.ts:14-69` |
| Fix effort `1 day` / `1 week` / `1 month` | `07_Remediation.tsx:189` | derived | maps fixture `effort` `low`/`medium`/`high`; the three strings are literals |
| Fix acceptance line: `Done when the AD export shows 0 privileged accounts without MFA.` (for `rem-mfa`) or `Done when re-collection shows the {n} linked controls satisfied.` | `07_Remediation.tsx:192-195` | hardcoded | special case keyed on id `rem-mfa` |
| Rank formulas | `07_Remediation.tsx:198-203` | derived | `controls`: `-controls`; `quick`: `(effort includes 'min' ? 0 : includes 'day' ? 1 : 2) - controls/100`; `impact`: `-(controls + techniques.length*5)` — the `100` and `5` are literals |
| **Remediation plan** tab: 6 cards ranked by `controlsClosed` | `07_Remediation.tsx:20`, `07_Remediation.tsx:23-57` | fixture | `remediationPlan` sorted descending: `rem-mfa` 11, `rem-audit` 9, `rem-patch` 7, `rem-leavers` 6, `rem-usb` 4, `rem-edr` 4 |
| `closes N controls · M shown` (all six cards show `· M shown`: 5, 4, 3, 3, 2, 2) | `07_Remediation.tsx:32-37` | derived | `controlIds.length < controlsClosed` |
| `effort: low\|medium\|high`, `affectedAssets` text, `removes exposure to` T-ids, control links | `07_Remediation.tsx:38-53` | fixture | `remediationPlan` |
| **What you didn't provide** tab — card `Projected interval` / `Providing an artifact makes its controls known — pass or fail. The band narrows either way; its position depends on what the evidence shows.` | `07_Remediation.tsx:82-83` | hardcoded | — |
| Projection base: `green 345`, `yellow 99`, `unknown 59`, `applicable 557` | `07_Remediation.tsx:69` | fixture | `TOTALS.after`, **regardless of the `evidenceUploaded` flag** |
| Hero numbers, width, ghost band, subline | `07_Remediation.tsx:86-96` | derived | `projectProvision(557, 345, 99, 59, Σ controlsUnlocked of provided requests)` (`scoring.ts:56-80`); `lower = bestCase.lower*100`, `upper = worstCase.upper*100`, `widthPts = (worstCase.upper - bestCase.lower)*100`. Values, computed by running the repository's functions, in the table below |
| Caption `Where the band could land`; ghost label `worst case — all resolved controls fail`; subline `Provide artifacts below to project the outcome.` | `07_Remediation.tsx:90-93` | hardcoded | — |
| `The band cannot fall below 7.0 pts of width — the 39 structurally uncollectable controls stay Unknown regardless of what is provided.` | `07_Remediation.tsx:100-101` | derived | `(UNCOLLECTABLE_COUNT / base.applicable) * 100` = `39/557*100` |
| Five request cards sorted by `controlsUnlocked` desc: `Linux hardening baseline (CIS)` 18, `Re-run identity module with endpoint read permission` 14, `SIEM log source inventory + retention` 8, `Backup job report + restore test log` 5, `Security awareness completion export` 4 | `07_Remediation.tsx:106-117` | fixture | `evidenceRequests`, `remediation.ts:83-87` |
| Per card: `{n} controls become known`, `narrows band {x} pts`, `Interval becomes a – b% (all pass) or c – d% (all fail) — either way you learn where you stand.` | `07_Remediation.tsx:117-133` | derived | `projectProvision(557, 345, 99, 59, r.controlsUnlocked)`; table below |
| Command block, button `Simulate providing this` → `Provided` | `07_Remediation.tsx:135-146` | fixture | `command` (`remediation.ts:83-87`); `provided` list is `user input` stored in `providedRequests` (persisted) |

Ordering produced by the three sort modes (derived by running the code at `07_Remediation.tsx:172-205`; rank per mode):

| Item | Kind | Shown effort | Controls | Rank: `risk-weighted` (default) | `quick wins` | `controls closed` |
|---|---|---|---|---|---|---|
| `Enforce MFA on all privileged accounts` | fix | `1 week` | 11 | 1 | 9 | 6 |
| `Run the all accounts + state` | evidence | `3 min` | 22 | 2 | 1 | 1 |
| `Enable the 3 missing audit subcategories via GPO (Object Access, Process Creation)` | fix | `1 day` | 9 | 3 | 7 | 8 |
| `Run the linux hardening baseline` | evidence | `10 min` | 18 | 4 | 2 | 2 |
| `Automate the leavers feed from HR to identity for same-day de-provisioning` | fix | `1 week` | 6 | 5 | 11 | 10 |
| `Run the privileged group membership` | evidence | `2 min` | 14 | 6 | 3 | 3 |
| `Switch workstation EDR from detect-only to block; close contractor exception` | fix | `1 week` | 4 | 7 | 12 | 12 |
| `Run the gpo baseline export` | evidence | `4 min` | 12 | 8 | 4 | 4 |
| `Bring patch SLA adherence to policy on internet-facing hosts` | fix | `1 month` | 7 | 9 | 10 | 9 |
| `Run the edr agent inventory` | evidence | `5 min` | 11 | 10 | 5 | 5 |
| `Run the audit policy configuration` | evidence | `1 min` | 9 | 11 | 6 | 7 |
| `Deploy removable-media authorization policy to all workstations` | fix | `1 day` | 4 | 12 | 8 | 11 |

Projection outputs (Requests tab; base `TOTALS.after`; the projection depends only on the sum of `controlsUnlocked` of provided requests, `07_Remediation.tsx:71-75`):

| Provided | Σ unlocked | Hero lower — upper | Hero `width … points` | Subline: `Band width falls to … pts` | Subline best case · worst case |
|---|---|---|---|---|---|
| none | 0 | `70.8% — 81.4%` | `10.6` | (subline is `Provide artifacts below to project the outcome.`) | — |
| `req-siem` only | 8 | `72.3% — 80.0%` | `7.7` | `9.2` | `72.3 – 81.4%` · `70.8 – 80.0%` |
| `req-linux` only | 18 | `74.1% — 78.2%` | `4.1` | `7.4` | `74.1 – 81.4%` · `70.8 – 78.2%` |
| `req-priv` only | 14 | `73.3% — 78.9%` | `5.6` | `8.1` | `73.3 – 81.4%` · `70.8 – 78.9%` |
| `req-backup` only | 5 | `71.7% — 80.5%` | `8.8` | `9.7` | `71.7 – 81.4%` · `70.8 – 80.5%` |
| `req-lms` only | 4 | `71.5% — 80.7%` | `9.2` | `9.9` | `71.5 – 81.4%` · `70.8 – 80.7%` |
| all five | 49 | `79.6% — 72.6%` | `-7.0` | `1.8` | `79.6 – 81.4%` · `70.8 – 72.6%` |

Per-card values (each card is computed alone): `req-siem` narrows `1.4` pts, `72.3 – 81.4%` (all pass) or `70.8 – 80.0%` (all fail); `req-linux` `3.2`, `74.1 – 81.4%` / `70.8 – 78.2%`; `req-priv` `2.5`, `73.3 – 81.4%` / `70.8 – 78.9%`; `req-backup` `0.9`, `71.7 – 81.4%` / `70.8 – 80.5%`; `req-lms` `0.7`, `71.5 – 81.4%` / `70.8 – 80.7%`.

### D.10 OSCAL Export — `src/screens/08_Export.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Heading `OSCAL submission package`; `Five OSCAL models. Coverage metadata and the assurance level travel inside the package, so the regulator sees the interval — not a bare number.` | `08_Export.tsx:149-153` | hardcoded | — |
| `Validates against OSCAL 1.1.2 · 5 models · 557 control implementations · 0 errors` | `08_Export.tsx:155` | hardcoded | nothing in the app runs a validator |
| Button `Download package (.zip)`; after review: `Package prepared (simulated) · personal data redacted \| not redacted · Ed25519-signed` | `08_Export.tsx:160-166` | user input | `prepared` local state set from the review modal's checkbox (default checked, `08_Export.tsx:104`) |
| Five model cards: `Catalog` — `The pinned JNCSF control catalogue (576 controls).`; `Profile` — `The applicable-control baseline for this organisation (557).`; `System Security Plan` — `Declared implementation of each applicable control.`; `Assessment Results` — `Findings, evidence class, and gap reasons per control.`; `POA&M` — `Plan of action & milestones — ranked remediation.` | `08_Export.tsx:75-81` | hardcoded | `576`, `557` literals |
| Card links `Preview JSON`, `.json` | `08_Export.tsx:177-179` | hardcoded | `.json` only sets `prepared`; it downloads nothing |
| `Signed package` card: `algorithm` `Ed25519`, `signing identity` `JCCP Appliance — MoDS-JCCP-01`, `timestamp` `2026-09-08T10:04:00+03:00` | `08_Export.tsx:9`, `08_Export.tsx:193-195` | hardcoded | `SIGNING` constant |
| Hash `e7c1 9a02 44bd 8f10 55ce 7731 a9b0 2d4f 88e0 1c6a 90ff 43d2` | `08_Export.tsx:8`, `08_Export.tsx:197` | hardcoded | not computed from the displayed JSON |
| `Verify signature` | `08_Export.tsx:198-200` | hardcoded | sets `prepared`; verifies nothing |
| Card `JNCSF Catalog — a national reference` / `not just an export` and its paragraph (`576 controls …`) | `08_Export.tsx:204-210` | hardcoded | — |
| Link `National rollup (Analyst / Regulator)` | `08_Export.tsx:217-219` | hardcoded | — |
| Modal `Pre-submission review`: `The package discloses to NCSC:` and five bullets (incl. `Per-control findings, evidence class and gap reasons (557 controls)`); checkbox `Redact personal data in evidence excerpts before submission` + `recommended — replaces account names with role-typed placeholders`; buttons `Cancel`, `Prepare signed package` | `08_Export.tsx:109-130` | hardcoded | — |
| JSON preview: `uuid` `0b9d5f2c-8a41-4e77-9c1e-6f2b3a5d7e10`; `title` `JNCSF Assessment — Ministry of Digital Services — {model}`; `last-modified`; `version` `1.0.0`; `oscal-version` `1.1.2`; role `assessor` / `JCCP Automated Assessor` | `08_Export.tsx:14-21` | hardcoded | the organisation name is a literal, not `profile.orgName` |
| `jccp:coverage-metadata`: `assurance-level` (`L2 — Tool-evidenced` / `L1 — Documented`), `controls-applicable` (557), `controls-evidenced` (350 / 498), `controls-unevidenced` (207 / 59), `compliance-interval` (`{lower: 0.499, upper: 0.871}` / `{lower: 0.708, upper: 0.814}`), `interval-width-points` (37.2 / 10.6), `analyst-overrides` (count) | `08_Export.tsx:22-29` | derived | from `TOTALS.before/after` fixture values (not from `dashboardView`, so the interval does not move with overrides); `analyst-overrides = Object.keys(overriddenControls).length` |
| `note`: `Point estimates are intentionally omitted. A regulator reads the interval.` | `08_Export.tsx:30` | hardcoded | — |
| `jccp:scope-boundary`: `framework` `JNCSF`, `operates-critical-infrastructure` (profile flag), `cicsc-assessed` `false`, note (two literal variants) | `08_Export.tsx:32-39` | derived | `operatesCI` from the profile; `false` and both notes are literals |
| `Assessment Results` extra block: `Automated collection run 2026-09-05`, `start` `2026-09-05T09:00:00+03:00`, findings for `JNCSF-102` and `JNCSF-435` (`not-satisfied` after upload, `not-evaluated` before; `evidence-class` `artifact`/`testimonial` and `attestation` `analyst-attested`/`engine` for 102), `JNCSF-173` (`not-evaluated`, `gap-reason` `module_failed`/`not_provided`) | `08_Export.tsx:41-58` | hardcoded | three findings only, ids and the state strings are literals chosen by `uploaded` and `overrideCount > 0` |
| `POA&M` extra block: `Enforce MFA on all privileged accounts` (`controls-closed` 11), `Enable missing audit subcategories` (9) | `08_Export.tsx:60-69` | hardcoded | duplicates values that also exist in `remediationPlan` but are not read from it |
| `Catalog`, `Profile`, `System Security Plan` previews contain only the common block | `08_Export.tsx:71-72` | derived | — |
| Modal file name, e.g. `assessment-results.json` | `08_Export.tsx:92` | derived | `model.toLowerCase().replace(/\W+/g, '-')` + `.json` |

### D.11 Compliance Chat — `src/screens/09_Chat.tsx`

All content is `hardcoded` in the `CANNED` array (`09_Chat.tsx:20-91`); nothing is computed, retrieved or read from the store. The numbers inside the answers (`43 of 512`, `102 of 512`, `71`, `22 servers`, `14 internet-facing services`, `70.8–81.4%`, `89.4%`, `48-hour`) are literals in answer strings. Verbatim text of all eight questions, answers and citation passages is in Section E.6. Other displayed text:

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Card `Compliance chat` / `Grounded Q&A over the pinned catalogue and this assessment — every answer carries citations` | `09_Chat.tsx:127` | hardcoded | — |
| `Pick a question below to start.` | `09_Chat.tsx:129` | hardcoded | — |
| Eight question buttons (disabled once asked) | `09_Chat.tsx:160-169` | hardcoded | `asked` is local state |
| `Won't answer — outside what the assessment establishes` | `09_Chat.tsx:140` | hardcoded | for answers flagged `refusal` (`09_Chat.tsx:78`, `09_Chat.tsx:87`) |
| `Grounded in your evidence` | `09_Chat.tsx:145` | hardcoded | for answers flagged `grounded` (`09_Chat.tsx:32`, `09_Chat.tsx:44`, `09_Chat.tsx:53`) |
| `Free-text input is disabled in this demo — use the grounded prompts above.` | `09_Chat.tsx:173` | hardcoded | — |
| Footer `On-premise · read-only`, `cannot change control states`, `cannot compute scores`, `cannot access the internet`, `cannot see other organisations' data` | `09_Chat.tsx:179-183` | hardcoded | — |

### D.12 Scope Exclusions — `src/screens/10_Exclusions.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| Card `Scope exclusion register`; subtitle `19 of 576 JNCSF controls excluded from this assessment` | `10_Exclusions.tsx:41` | fixture | `TOTALS.notApplicable`, `TOTALS.totalControls` (`capabilities.ts:92`, `capabilities.ts:91`) |
| `3.3%` / `Not-Applicable rate` | `10_Exclusions.tsx:44-45`, `10_Exclusions.tsx:30` | derived | `(TOTALS.notApplicable / TOTALS.totalControls) * 100` |
| `5.0%` / `{sector label} sector baseline` (+ `· above` when the rate exceeds it) | `10_Exclusions.tsx:48-52` | fixture | `SECTOR_BASELINE.naRatePct`; label via `sectorById(s.profile.sector).label` (`10_Exclusions.tsx:14`) |
| `8` / `without recorded justification` | `10_Exclusions.tsx:55-56`, `10_Exclusions.tsx:31` | derived | `EXCLUSIONS.filter(e => !e.justification).length` |
| Card `Excluded by capability`: `Architecture & Portfolio 0`, `Development 19`, `Delivery 0`, `Operations 0`, `Foundational 0`, and `National obligation (Capability 6)` `—` | `10_Exclusions.tsx:62-79` | fixture | `EXCLUSION_COUNTS`, `src/data/exclusions.ts:49-55`; names from `capabilities`; the last row is a literal. Clicking a name sets the capability filter |
| Card `Excluded by triggering fact`: `No in-house software development` `19` | `10_Exclusions.tsx:81-90` | fixture | `EXCLUSION_TRIGGERS`, `exclusions.ts:58-60` |
| Card title `Exclusions — 19 shown of 19 seeded` | `10_Exclusions.tsx:94` | derived | `rows.length`, `EXCLUSIONS.length` |
| Filters `Any capability` + 5 names; `Any triggering fact` + `inHouseDevelopment = no`; checkbox `Unjustified only` | `10_Exclusions.tsx:97-112` | derived | facts via `Array.from(new Set(EXCLUSIONS.map(e => e.triggerFact)))` (`10_Exclusions.tsx:33`) |
| Table headers `Control`, `Description`, `Excluded because`, `Triggered by`, `Justification` | `10_Exclusions.tsx:120-124` | hardcoded | — |
| 19 rows (D.17.2) with `Triggered by` `Profile declaration` and, when `justification` is empty, pill `none recorded` | `10_Exclusions.tsx:128-143` | fixture | `EXCLUSIONS` |
| `Showing all 19 of 19 exclusions — the full register for this organisation, not a sample.` | `10_Exclusions.tsx:148-151` | derived | `EXCLUSIONS.length`, `TOTALS.notApplicable`; remaining words literal |
| Back link `Dashboard` | `10_Exclusions.tsx:37-39` | hardcoded | — |

The exclusion list is **not** recomputed from the Profile: changing the five toggles changes the Profile's applicable count (D.3) but the register, `TOTALS.notApplicable` and every other screen keep the fixture values (`19`, `557`).

### D.13 Roles & Access — `src/screens/11_Admin.tsx`

All content is `hardcoded` (`FEATURES`, `11_Admin.tsx:35-76`; `ROLES`, `11_Admin.tsx:10`). Header `Roles & access` and paragraph (`11_Admin.tsx:96-102`); card `RBAC matrix` / `feature × role, with the control each boundary implements` (`11_Admin.tsx:108`); legend `full`, `scoped`, `none` (`11_Admin.tsx:141-145`).

| Feature (line) | Implements | Owner | Analyst | Executive | Contributor | Regulator | Appliance Admin | Note |
|---|---|---|---|---|---|---|---|---|
| `Read assessment content (controls, evidence, personal data in excerpts)` (`11_Admin.tsx:37`) | `JNCSF-102` Least privilege (`11_Admin.tsx:38`) | full | full | none | none | none | none | `Appliance Admin operates the box but is cryptographically walled off from assessment content.` (`11_Admin.tsx:40`) |
| `View interval, coverage and assurance only (no drill-down)` (`11_Admin.tsx:43`) | `JNCSF-440` Enforce access restrictions (`11_Admin.tsx:44`) | full | full | full | none | scoped | none | — |
| `Set organisation profile and scope exclusions` (`11_Admin.tsx:48`) | `JNCSF-100` Separation of duties (`11_Admin.tsx:49`) | full | scoped | none | none | none | none | `Owner sets scope; Analyst can challenge but not silently change it.` (`11_Admin.tsx:51`) |
| `Override a control verdict (analyst-signed, audit-logged)` (`11_Admin.tsx:54`) | `JNCSF-30` Generate audit records (`11_Admin.tsx:55`) | scoped | full | none | none | none | none | — |
| `Submit evidence against an assigned artifact slot` (`11_Admin.tsx:59`) | `JNCSF-146` Session lock / least function (`11_Admin.tsx:60`) | full | full | none | scoped | none | none | `Contributor sees only their own assigned slots and submission status.` (`11_Admin.tsx:62`) |
| `Approve the OSCAL submission package for the regulator` (`11_Admin.tsx:65`) | `JNCSF-435` Multi-factor authentication (`11_Admin.tsx:66`) | full | none | none | none | none | none | `Sign-off requires the Owner and step-up MFA.` (`11_Admin.tsx:68`) |
| `Manage appliance: updates, backups, TLS certificates, log forwarding` (`11_Admin.tsx:71`) | `JNCSF-107` Separate privileged IDs (`11_Admin.tsx:72`) | none | none | none | none | none | full | `A separate privileged identity; cannot read a single control.` (`11_Admin.tsx:74`) |

Cell symbols: `full` = check mark, `some` = text `scoped`, `none` = minus (`11_Admin.tsx:78-85`). The `Implements` pill links to `/control/<id>` (`11_Admin.tsx:128`).

### D.14 My Tasks — `src/screens/12_Tasks.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| `My tasks`; `You have been asked to provide evidence for the Ministry of Digital Services assessment. You can see your own submissions and their status — not the assessment result.` | `12_Tasks.tsx:30-33` | hardcoded | organisation name is a literal |
| `{n} accepted` / `{n} awaiting review` / `{n} to do` (initially `1`, `1`, `3`) | `12_Tasks.tsx:36-38` | derived | counts over `tasks` by status (`12_Tasks.tsx:23-25`); `to do` counts `to do` + `changes requested` |
| Five task cards: title, status pill, `Artifact: … · due … · unlocks N controls`, optional note | `12_Tasks.tsx:44-66` | fixture | `contributorTasks`, `src/data/collaboration.ts:52-56` (rows below) |
| Status shown | `12_Tasks.tsx:17` | derived | `uploadedSlots[t.artifact] ? 'submitted' : t.status` — applies to every task, including the `accepted` one |
| `unlocks N controls` | `12_Tasks.tsx:18` | derived | `requestPlan.find(r => r.artifact === t.artifact)?.controlsUnlocked ?? 0` (14, 8, 11, 4, 8) |
| Button `Submit` (for `to do` / `changes requested`) | `12_Tasks.tsx:60-64` | hardcoded | calls `uploadSlot(artifact)` |

| Task (line) | `title` | `artifact` | `due` | `status` | `note` |
|---|---|---|---|---|---|
| `t1` (`collaboration.ts:52`) | `Export privileged group membership from AD` | `Privileged group membership` | `2026-09-10` | accepted | — |
| `t2` (`collaboration.ts:53`) | `Export SIEM log source inventory + retention` | `SIEM log source inventory` | `2026-09-11` | changes requested | `Retention column missing — re-export with retention days per source.` |
| `t3` (`collaboration.ts:54`) | `Export EDR agent inventory as CSV` | `EDR agent inventory` | `2026-09-11` | submitted | — |
| `t4` (`collaboration.ts:55`) | `Provide the current IR plan and last tabletop record` | `Incident response plan + exercise record` | `2026-09-14` | to do | — |
| `t5` (`collaboration.ts:56`) | `Export firewall running configuration` | `Firewall rule base` | `2026-09-14` | to do | — |

### D.15 National Rollup — `src/screens/13_Rollup.tsx`

| What is displayed | Where it is defined | Origin | Detail |
|---|---|---|---|
| `National rollup — Defence, Security & Government Services sector` | `13_Rollup.tsx:17` | fixture | `nationalRollup.sector`, `src/data/remediation.ts:93` (independent of the profile's sector) |
| Paragraph `Anonymised regulator view. Distribution is over interval lower-bound bands, not point estimates, and is segmented by assurance level — an L1 entity "at 75%" and an L2 entity "at 75%" are not the same claim.` | `13_Rollup.tsx:18-21` | hardcoded | — |
| `12 / 47` `entities submitted` | `13_Rollup.tsx:29-30` | fixture | `submitted: 12`, `entitiesInScope: 47` (`remediation.ts:94-95`) |
| `8` `overdue — no package received` | `13_Rollup.tsx:33-34` | fixture | `overdue: 8` (`remediation.ts:96`) |
| `27` `not yet due` | `13_Rollup.tsx:37-38` | derived | `r.entitiesInScope - r.submitted - r.overdue` |
| Card `Compliance distribution` / `interval lower-bound band × assurance level` | `13_Rollup.tsx:42` | hardcoded | — |
| Four bands and L1/L2/L3 counts: `lower ≥ 80%` 0/2/1; `lower 70–80%` 1/3/0; `lower 55–70%` 2/1/0; `lower < 55%` 2/0/0 | `13_Rollup.tsx:44-58` | fixture | `distribution`, `remediation.ts:100-103` |
| Row totals `3`, `4`, `3`, `2` | `13_Rollup.tsx:57` | derived | `L1 + L2 + L3` (`13_Rollup.tsx:5`) |
| Bar segment widths | `13_Rollup.tsx:53` | derived | `(v / maxRow) * 100 %` with `maxRow = Math.max(...totals)` (`13_Rollup.tsx:8`) = 4 |
| Segment colours `#047857` (L3), `#1d4ed8` (L2), `#94a3b8` (L1) | `13_Rollup.tsx:51` | hardcoded | — |
| `(1 cell)` / `suppressed — fewer than 5 entities` | `13_Rollup.tsx:61-63` | hardcoded | `5` from `kAnonymityFloor` (`remediation.ts:97`); `(1 cell)` is a literal (the fixture only has the comment at `remediation.ts:104`) |
| Legend `L1 Documented`, `L2 Tool-evidenced`, `L3 Analyst-signed` | `13_Rollup.tsx:68-70` | hardcoded | — |
| `Cells with fewer than 5 entities are suppressed so a single organisation cannot be re-identified from the aggregate.` | `13_Rollup.tsx:72-75` | hardcoded | `5` from fixture |
| Card `Most frequently failed controls` / `across submitted entities` | `13_Rollup.tsx:79` | hardcoded | — |
| Five rows `{id} · {description}` with pill `9/12`, `8/12`, `7/12`, `7/12`, `6/12` | `13_Rollup.tsx:81-86` | fixture | `mostFailedControls`, `remediation.ts:107-111`; the denominator `12` is a literal in the JSX (`13_Rollup.tsx:84`) |
| Card `Submission import log` / `signed packages arriving at NCSC`; headers `Entity`, `Received`, `Signature`, `Assurance` | `13_Rollup.tsx:90-97` | hardcoded | — |
| Four rows: `Entity A-14` `2026-09-07 08:12` verified `L2`; `Entity A-31` `2026-09-07 09:40` verified `L1`; `Entity A-06` `2026-09-07 11:03` rejected `—` with `signature does not match published key — not ingested`; `Entity A-22` `2026-09-08 07:55` verified `L2` | `13_Rollup.tsx:101-115` | fixture | `imports`, `remediation.ts:114-117` |

### D.16 Guided tour, per-screen help, welcome modal, glossary — `src/tour/`

These are copy modules, so all text is `hardcoded`. Verbatim text is in Sections E.7–E.9. What matters for the data inventory is the numbers embedded in that copy, which are literals and are not read from any fixture:

| Number in copy | Where | Origin | Detail |
|---|---|---|---|
| `576` controls | `src/tour/steps.ts:45`; `src/tour/glossary.ts:12`, `glossary.ts:44`; `src/tour/helpContent.ts:14` | hardcoded | — |
| `557 of 576 controls apply here`; `93% universal` | `src/tour/steps.ts:69` | hardcoded | — |
| `The list is calculated from the 557 applicable controls` | `src/tour/steps.ts:97` | hardcoded | — |
| `12 of 400 machines` | `src/tour/steps.ts:182` | hardcoded | — |
| `37.2 points wide; now it is 10.6` | `src/tour/steps.ts:202` | hardcoded | — |
| `498 of 557 controls now have evidence` | `src/tour/steps.ts:210` | hardcoded | — |
| `an 85% at L1 is a weaker statement than a 72% at L2` | `src/tour/steps.ts:218` | hardcoded | illustrative numbers |
| `only 35% of controls carry any mapping at all` | `src/tour/steps.ts:280` | hardcoded | — |
| `Fixing multi-factor authentication for 43 privileged accounts resolves 11 controls at once — and removes exposure to three named attack techniques.` | `src/tour/steps.ts:298` | hardcoded | — |
| `about 3 minutes` | `src/tour/WelcomeGate.tsx:89` | hardcoded | — |
| `Cells covering fewer than five organisations are suppressed` | `src/tour/helpContent.ts:96` | hardcoded | — |
| Tour length: 30 steps | `src/tour/steps.ts:36-307`; `TOUR_TOTAL` at `steps.ts:309` | derived | `TOUR_STEPS.length`; shown as `Step N of 30` (`src/tour/Tour.tsx:292`) and the progress bar (`Tour.tsx:307`) |
| Welcome gate shown on first visit | `src/tour/WelcomeGate.tsx:27-29` | user input | `localStorage['jccp-tour-seen']` (`WelcomeGate.tsx:4`, `WelcomeGate.tsx:8`, `WelcomeGate.tsx:15`) |
| Help text for the current page | `src/tour/helpContent.ts:117-121` | derived | longest-prefix match of the pathname over the 13 keys in `SCREEN_HELP` (`helpContent.ts:10-115`); unmatched → the `/profile` text |
| Glossary tooltips (10 terms) | `src/tour/glossary.ts:9-50` | hardcoded | used by `Term` in Profile and Dashboard only |

### D.17 Remaining fixture tables

#### D.17.1 Evidence Request Plan rows (22) — `src/data/scenario.ts:142-163`

Origin of every cell: `fixture` (`src/data/scenario.ts`, line in the third column). `formatHint` and `command` strings for each row are at the same line and are shown on the Request Plan and Intake screens (`02_RequestPlan.tsx:29`, `02_RequestPlan.tsx:39`; `03_Intake.tsx:219`).

| # | Artifact (displayed) | Defined at | Source system | Owner | Method | Controls unlocked | Effort | Decline cost |
|---|---|---|---|---|---|---|---|---|
| 1 | `All accounts + state` | `src/data/scenario.ts:142` | `Active Directory` | `Identity team` | automated | 22 | `3 min` | 8 |
| 2 | `Linux hardening baseline` | `src/data/scenario.ts:143` | `Linux servers` | `Server team` | automated | 18 | `10 min` | 18 |
| 3 | `Privileged group membership` | `src/data/scenario.ts:144` | `Active Directory` | `Identity team` | automated | 14 | `2 min` | 6 |
| 4 | `GPO baseline export` | `src/data/scenario.ts:145` | `Active Directory` | `Server team` | automated | 12 | `4 min` | 12 |
| 5 | `EDR agent inventory` | `src/data/scenario.ts:146` | `EDR console` | `SOC` | manual | 11 | `5 min` | 5 |
| 6 | `Audit policy configuration` | `src/data/scenario.ts:147` | `Windows servers` | `Server team` | automated | 9 | `1 min` | 9 |
| 7 | `Local admin rights inventory` | `src/data/scenario.ts:148` | `Windows endpoints` | `Endpoint team` | automated | 9 | `6 min` | 4 |
| 8 | `SIEM log source inventory` | `src/data/scenario.ts:149` | `SIEM` | `SOC` | manual | 8 | `5 min` | 8 |
| 9 | `Firewall rule base` | `src/data/scenario.ts:150` | `SIEM` | `Network team` | manual | 8 | `8 min` | 8 |
| 10 | `Defender status` | `src/data/scenario.ts:151` | `Windows endpoints` | `Endpoint team` | automated | 7 | `2 min` | 3 |
| 11 | `Vulnerability scan results` | `src/data/scenario.ts:152` | `SIEM` | `SOC` | automated | 7 | `5 min` | 7 |
| 12 | `Patch compliance report` | `src/data/scenario.ts:153` | `Windows servers` | `Server team` | automated | 6 | `4 min` | 6 |
| 13 | `MFA registration report` | `src/data/scenario.ts:154` | `Active Directory` | `Identity team` | automated | 6 | `3 min` | 3 |
| 14 | `Backup job report` | `src/data/scenario.ts:155` | `Backup system` | `Infrastructure` | automated | 5 | `3 min` | 5 |
| 15 | `Joiner/mover/leaver log` | `src/data/scenario.ts:156` | `HR & LMS` | `HR` | manual | 5 | `7 min` | 5 |
| 16 | `Encryption-at-rest inventory (servers)` | `src/data/scenario.ts:157` | `Windows servers` | `Server team` | manual | 5 | `6 min` | 5 |
| 17 | `BitLocker state` | `src/data/scenario.ts:158` | `Windows endpoints` | `Endpoint team` | automated | 4 | `2 min` | 2 |
| 18 | `Security awareness completion` | `src/data/scenario.ts:159` | `HR & LMS` | `HR / L&D` | manual | 4 | `3 min` | 4 |
| 19 | `Incident response plan + exercise record` | `src/data/scenario.ts:160` | `SIEM` | `SOC` | manual | 4 | `5 min` | 4 |
| 20 | `Session/idle-timeout policy` | `src/data/scenario.ts:161` | `Active Directory` | `Server team` | automated | 4 | `2 min` | 2 |
| 21 | `Removable-media control policy` | `src/data/scenario.ts:162` | `Windows endpoints` | `Endpoint team` | automated | 3 | `3 min` | 3 |
| 22 | `Media sanitisation records` | `src/data/scenario.ts:163` | `HR & LMS` | `Facilities` | manual | 2 | `10 min` | 2 |

Totals computed from these rows: `controlsUnlocked` sums to 173 (automated 126, manual 47); `declineCost` sums to 129; the displayed `source` values are the 8 distinct systems listed in D.4.

#### D.17.2 Scope-exclusion rows (19) — `src/data/exclusions.ts:27-45`

Origin of every cell: `fixture`. `triggeredBy` is `Profile declaration` and `capability` is `dev` on every row (same lines). Eight rows have an empty `justification`: `JNCSF-58`, `-62`, `-65`, `-66`, `-68`, `-71`, `-73`, `-77`.

| Control | Defined at | Description (displayed) | `triggerFact` (displayed) | `justification` (displayed; empty = pill `none recorded`) |
|---|---|---|---|---|
| `JNCSF-58` | `src/data/exclusions.ts:27` | `Perform secure code review on all developed applications` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-59` | `src/data/exclusions.ts:28` | `Apply secure coding standards to in-house development` | `inHouseDevelopment = no` | `No in-house development; all software is COTS or vendor-delivered.` |
| `JNCSF-60` | `src/data/exclusions.ts:29` | `Maintain a secure coding training programme for developers` | `inHouseDevelopment = no` | `No developers employed by the entity.` |
| `JNCSF-61` | `src/data/exclusions.ts:30` | `Apply static application security testing (SAST) in the build pipeline` | `inHouseDevelopment = no` | `No in-house development; all software is COTS or vendor-delivered.` |
| `JNCSF-62` | `src/data/exclusions.ts:31` | `Apply software composition analysis to identify vulnerable dependencies` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-63` | `src/data/exclusions.ts:32` | `Apply dynamic application security testing (DAST) before release` | `inHouseDevelopment = no` | `No in-house development; all software is COTS or vendor-delivered.` |
| `JNCSF-64` | `src/data/exclusions.ts:33` | `Conduct manual penetration testing of developed applications before release` | `inHouseDevelopment = no` | `No developed applications to test; vendor products are assessed under the outsourced-development controls.` |
| `JNCSF-65` | `src/data/exclusions.ts:34` | `Remediate application security findings prior to production deployment` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-66` | `src/data/exclusions.ts:35` | `Maintain a software bill of materials (SBOM) for developed products` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-67` | `src/data/exclusions.ts:36` | `Sign and verify the integrity of build artifacts` | `inHouseDevelopment = no` | `No in-house build pipeline.` |
| `JNCSF-68` | `src/data/exclusions.ts:37` | `Operate a secrets-management solution for development pipelines` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-69` | `src/data/exclusions.ts:38` | `Scan container images built in-house for vulnerabilities pre-deployment` | `inHouseDevelopment = no` | `No container images are built by the entity.` |
| `JNCSF-70` | `src/data/exclusions.ts:39` | `Operate a secure software development lifecycle (SDLC) policy` | `inHouseDevelopment = no` | `No in-house development.` |
| `JNCSF-71` | `src/data/exclusions.ts:40` | `Conduct design-stage security reviews for new application features` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-72` | `src/data/exclusions.ts:41` | `Separate development, test and production environments for in-house software` | `inHouseDevelopment = no` | `No in-house development.` |
| `JNCSF-73` | `src/data/exclusions.ts:42` | `Restrict production data from being used in development or test environments` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-77` | `src/data/exclusions.ts:43` | `Manage source code repository access and integrity` | `inHouseDevelopment = no` | *(empty)* |
| `JNCSF-79` | `src/data/exclusions.ts:44` | `Maintain a code-signing key management procedure` | `inHouseDevelopment = no` | `No in-house build pipeline.` |
| `JNCSF-80` | `src/data/exclusions.ts:45` | `Threat-model developed applications during design` | `inHouseDevelopment = no` | `No in-house development.` |

#### D.17.3 Remediation plan (6) and evidence requests (5) — `src/data/remediation.ts`

All `fixture`.

| Id | Defined at | `controlsClosed` | `controlIds` (count) | `removesExposureTo` | `effort` | `affectedAssets` |
|---|---|---|---|---|---|---|
| `rem-mfa` | `remediation.ts:16-22` | 11 | `JNCSF-102, -435, -440, -107, -116` (5) | `T1110, T1078, T1550` | medium | `43 privileged accounts` |
| `rem-audit` | `remediation.ts:25-31` | 9 | `JNCSF-30, -167, -173, -179` (4) | `T1070, T1562` | low | `38 servers, 400 endpoints (GPO-wide)` |
| `rem-patch` | `remediation.ts:34-40` | 7 | `JNCSF-307, -407, -32` (3) | `T1190` | high | `14 internet-facing services, 22 servers with overdue patches` |
| `rem-leavers` | `remediation.ts:43-49` | 6 | `JNCSF-141, -515, -139` (3) | `T1078, T1098` | medium | `17 orphaned accounts, HR↔IdP integration` |
| `rem-usb` | `remediation.ts:52-58` | 4 | `JNCSF-163, -105` (2) | `T1200` | low | `400 endpoints` |
| `rem-edr` | `remediation.ts:61-67` | 4 | `JNCSF-394, -87` (2) | `T1204, T1566` | medium | `~320 workstations, 71 contractor machines` |

| Id | Defined at | `artifact` | `source` | `controlsUnlocked` |
|---|---|---|---|---|
| `req-siem` | `remediation.ts:83` | `SIEM log source inventory + retention` | `SIEM` | 8 |
| `req-linux` | `remediation.ts:84` | `Linux hardening baseline (CIS)` | `Linux servers` | 18 |
| `req-priv` | `remediation.ts:85` | `Re-run identity module with endpoint read permission` | `Active Directory` | 14 |
| `req-backup` | `remediation.ts:86` | `Backup job report + restore test log` | `Backup system` | 5 |
| `req-lms` | `remediation.ts:87` | `Security awareness completion export` | `LMS` | 4 |

#### D.17.4 Sectors (10) — `src/data/sectors.ts:18-27`, all `fixture`

| `id` | Line | `label` | `regulator` (empty → `not designated`) |
|---|---|---|---|
| `energy` | `sectors.ts:18` | `Energy` | `EMRC` |
| `water` | `sectors.ts:19` | `Water` | `Jordan Water Authority` |
| `telecom` | `sectors.ts:20` | `Telecommunications and IT` | `TRC` |
| `gov_services` | `sectors.ts:21` | `Government Services` | *(empty)* |
| `industry_trade` | `sectors.ts:22` | `Industry and Trade` | `Ministry of Industry and Trade` |
| `finance` | `sectors.ts:23` | `Financial and Banking` | `Central Bank of Jordan` |
| `health` | `sectors.ts:24` | `Health` | `Ministry of Health` |
| `transport` | `sectors.ts:25` | `Transport` | `Land / Aviation / Maritime commissions` |
| `education` | `sectors.ts:26` | `Education` | *(empty)* |
| `defence_security` | `sectors.ts:27` | `Defence and Security` | *(empty)* |

The Arabic label for each sector is on the same line (`arabicLabel`) and is rendered right-to-left under the Profile dropdown (`01_Profile.tsx:106`).

#### D.17.5 Interview extracted claims (7) — `src/data/interviews.ts`, all `fixture`

| Role | Claim `text` (line) | `confidence` | `note` |
|---|---|---|---|
| operator | `EDR enforcing (block mode) on all servers` (`interviews.ts:52`) | 0.82 | `Servers: enforcing` |
| operator | `EDR on workstations is monitor-only, ~80% agent coverage` (`interviews.ts:53`) | 0.71 | `Workstations: detect-only, 80%` |
| operator | `Contractor-managed machines have no EDR agent (named exception)` (`interviews.ts:54`) | 0.9 | `Exception population retained` |
| exec | `Crown-jewel systems: citizen services portal, internal HR system` (`interviews.ts:69`) | 0.86 | — |
| exec | `PDPL-sensitive health data held in HR (medical leave records)` (`interviews.ts:70`) | 0.93 | `48-hour breach-notification obligation now in scope` |
| defender | `SIEM ingests DC, firewall and EDR logs` (`interviews.ts:84`) | 0.8 | — |
| defender | `Firewall logs collected but not alerting — no use cases built` (`interviews.ts:85`) | 0.88 | `Demotes related detection controls to Yellow` |

---

## E. Every claim the interface makes

Verbatim text, quoted from source. `{…}` marks a value interpolated at render time. JSX entities (`&amp;`) are written as the character they render. Long fixture-driven text (interviews, tour, help, glossary, chat, evidence excerpts) is reproduced in E.4–E.9 by extracting the strings from the source files, with their line numbers.

### E.1 Status vocabulary and the colours the code gives each status

**Control states** — the type is `ControlState = 'green' | 'yellow' | 'red' | 'grey' | 'unknown'` (`src/data/controls.ts:7`). `STATE_META` (`src/components/StateBadge.tsx:6-15`) maps each key to what is shown:

| Key | Label shown | Text colour | Background | Border | Glyph | `shape` string (used in the tooltip `{label} — {shape}`, `StateBadge.tsx:30`) | Line |
|---|---|---|---|---|---|---|---|
| `green` | `Compliant` | `#047857` | `#ecfdf5` | `#a7f3d0` | `●` | `filled circle` | `StateBadge.tsx:10` |
| `yellow` | `Partial` | `#b45309` | `#fffbeb` | `#fde68a` | `◐` | `half-filled triangle` | `StateBadge.tsx:11` |
| `red` | `Gap` | `#b91c1c` | `#fef2f2` | `#fecaca` | `■` | `filled square` | `StateBadge.tsx:12` |
| `grey` | `N/A` | `#475569` | `#f1f5f9` | `#cbd5e1` | `─` | `dash` | `StateBadge.tsx:13` |
| `unknown` | `Unknown` | `#6d28d9` | `#f5f3ff` | `#ddd6fe` | `◇` | `hollow diamond` | `StateBadge.tsx:14` |

The Gap Matrix state filter shows the raw keys `green`, `yellow`, `red`, `unknown` as option text (`src/screens/05_GapMatrix.tsx:98-99`). The Dashboard donut and the gap-reason chart use a second set of colours that are not `STATE_META` (listed in Section I.3): `#059669` `Artifact-evidenced`, `#d97706` `Testimony only`, `#7c3aed` `Unevidenced — collectable`, `#64748b` `Structurally uncollectable` (`04_Dashboard.tsx:147-150`).

**Other vocabularies defined in code**

| Vocabulary | Values (exact) | Where |
|---|---|---|
| Evidence class labels | `none` → `No evidence`; `testimonial` → `Testimonial`; `artifact` → `Artifact`; `analyst_signed` → `Analyst-signed` | `src/data/controls.ts:277-280` |
| Evidence-class ceiling (the highest state allowed) | `none` → `unknown`; `testimonial` → `yellow`; `artifact` → `green`; `analyst_signed` → `green` | `controls.ts:285-288` |
| Evidence-class pill tone | `artifact` → `green`; `testimonial` → `blue`; `analyst_signed` → `violet`; otherwise `slate` | `src/components/ControlRow.tsx:13-14`; `06_ControlDetail.tsx:139` |
| Gap reasons (label shown) | `not_provided` `Not provided`; `declined` `Declined by client`; `module_failed` `Module failed`; `insufficient_permission` `Insufficient permission`; `unparseable` `Unparseable`; `stale` `Stale`; `insufficient_signal` `Insufficient signal`; `uncollectable_by_design` `Uncollectable by design`; `not_requested` `Not requested` | `controls.ts:265-273` |
| Gap-reason pill | shown in `violet` only when state is `unknown` | `ControlRow.tsx:44-46` |
| Evidence-basis labels | `negative_capable` `Negative-capable`; `by_rule` `By rule`; `judgement` `Judgement`; `uncertainty` `Uncertainty` | `controls.ts:32-35` |
| Evidence-basis meanings | `Absence of a positive finding proves the negative.`; `Documentary — absence proves nothing, by the nature of the evidence.`; `A named mechanism makes absence uninformative.`; `We could not establish completeness — the recoverable case.` | `controls.ts:39-42` |
| Assurance ladder | `L0` `Declared` — `Profile declared; no evidence of any kind supplied.`; `L1` `Documented` — `Policy and testimonial evidence only; no machine-collected artifacts.`; `L2` `Tool-evidenced` — `Machine-collected artifacts corroborate a majority of controls.`; `L3` `Analyst-signed` — `An accredited assessor has reviewed and signed the evidence set.` | `src/lib/scoring.ts:118-121` |
| Assurance strings in the completeness statement | `L2 — Tool-evidenced`, `L1 — Documented` | `src/lib/coverage.ts:35` |
| Scoping answers | `Yes`, `No`, `Don't know` (`yes`/`no`/`unknown`; `unknown` is held in scope) | `01_Profile.tsx:33`; `scenario.ts:8` |
| Module status | `success` (green), `partial` (amber), `failed` (red), `declined` (slate) | `03_Intake.tsx:158-161` |
| Interview review status | `not started`, `in progress`, `submitted`, `under review`, `accepted`; pill tone `accepted` green, `under review` amber, `submitted` blue, else slate | `src/data/collaboration.ts:4`; `03_Intake.tsx:490` |
| Interview card status | `done` (green) / `not started` (slate) | `03_Intake.tsx:432-436` |
| Contributor task status | `to do`, `submitted`, `accepted`, `changes requested`; tone `accepted` green, `submitted` blue, `changes requested` red, else slate | `collaboration.ts:47`; `12_Tasks.tsx:44-45` |
| Roles | `owner` `Assessment Owner`; `analyst` `Analyst`; `executive` `Executive`; `contributor` `Contributor`; `regulator` `Regulator` (the RBAC matrix adds `Appliance Admin`) | `src/store/useAssessment.ts:10-16`; `11_Admin.tsx:10` |
| Phases | `Profile`, `Planning`, `Intake`, `Assessed` | `nav.ts:47-52` |
| ATT&CK mapping source | `official` (green badge `Official — NCSC Threat Annex`), `derived` (slate badge `Derived — transitive via NIST, reviewed`); fixture labels `Official — NCSC Threat Annex`, `Derived — transitive via NIST 800-53, manually reviewed` | `AttackExposure.tsx:49-63`; `attack.ts:33-34` |
| Effort | `low`, `medium`, `high` (remediation) shown as `1 day`, `1 week`, `1 month` on the All-actions tab | `remediation.ts:10`; `07_Remediation.tsx:189` |
| Collection method | `automated`, `manual` | `scenario.ts:126` |
| OSCAL finding states (JSON preview) | `not-satisfied`, `not-evaluated`; attestation `analyst-attested`, `engine` | `08_Export.tsx:51-53` |
| Pill tones (colour names used in code) | `slate`, `blue`, `amber`, `red`, `green`, `violet` | `src/components/ui.tsx:40`, `ui.tsx:44-49` |
| Capability keys | `arch`, `dev`, `del`, `ops`, `found`, `natl` | `src/data/capabilities.ts:19` |

### E.2 Claims in screens and shared components

Each row: location, then the exact text.

**Shell and layout**

| Location | Text |
|---|---|
| `src/App.tsx:45` | `Demonstration prototype · fictional organisation · no data is stored or transmitted.` |
| `src/components/layout/TopBar.tsx:9-13` | `full access + collection progress` · `full access + review queue; can override` · `interval, coverage, assurance only — no evidence or personal data` · `own task list and submission status only` · `submitted packages and the national rollup only` |
| `TopBar.tsx:72`, `TopBar.tsx:85`, `TopBar.tsx:80` | `Demo switcher — no authentication` · `On-premise · read-only` · tooltip `Restart the guided tour`; `Reset demo` tooltip `Reset the demo to the pre-upload state` (`TopBar.tsx:90`) |
| `src/components/layout/Sidebar.tsx:88` | `Evidence bundle loaded · L2` / `Testimony only · L1` |

**Profile (`src/screens/01_Profile.tsx`)**

| Location | Text |
|---|---|
| `01_Profile.tsx:97` | `Scoping inputs — these set which of the 576 JNCSF controls apply` |
| `01_Profile.tsx:25-29` | `declaring "no" removes 19 Development controls` · `declaring "no" removes 9 controls` · `declaring "no" removes 4 controls` · `declaring "no" removes 4 controls` · `declaring "no" removes 2 controls` |
| `01_Profile.tsx:66` | `Held in scope; related controls flagged for verification during collection.` |
| `01_Profile.tsx:172` | `does not change the applicable count — cloud is governed by the MoDEE cloud policy, not JNCSF. Declarations are still cross-checked against evidence.` |
| `01_Profile.tsx:184-185` | `Subjects this organisation to CICSC (405 controls, 3 implementation levels) in addition to JNCSF — not yet assessed by this tool` |
| `01_Profile.tsx:201-205` | `Critical infrastructure scope note.` `This organisation is also subject to the Critical Infrastructure Cyber Security Controls (CICSC) — 405 controls across three implementation levels, with Level 1 (135 controls) mandatory. A substantial number of Level 2/3 controls have no JNCSF correspondence at all. This assessment does not evaluate CICSC.` |
| `01_Profile.tsx:239-244` | `Contradiction — scoping decision blocked` · `Your profile declares no cloud services, but the collected bundle contains cloud agent entries in the software inventory and cloud endpoints in the firewall configuration. Cloud use does not change which controls apply — JNCSF does not gate on it — but a declaration the evidence contradicts is blocked pending review regardless.` |
| `01_Profile.tsx:264-269` | `Confirm this scoping decision` · `{sector} entities of {size} almost always consume at least one cloud service. This declaration does not change which controls apply — cloud is governed by the MoDEE cloud policy, not JNCSF — but it will be cross-checked against the evidence bundle. Please confirm and record a justification.` |
| `01_Profile.tsx:300` | `A substantive justification is required to proceed.` |
| `01_Profile.tsx:311`, `01_Profile.tsx:314` | `Scoping decision recorded` · `Cloud exclusion confirmed` / `Cloud scope restored` |
| `01_Profile.tsx:345` | `of {576} total · {n} excluded` |
| `01_Profile.tsx:354`, `01_Profile.tsx:358` | `Sector N/A baseline` · `Your N/A rate` |
| `01_Profile.tsx:365` | `{n} controls held in scope by a “Don't know” answer — flagged for verification.` |
| `01_Profile.tsx:370-371` | `Cloud declared absent — the applicable count is unaffected (cloud is not a JNCSF scoping condition), but this declaration is cross-checked against collected evidence.` |
| `01_Profile.tsx:375-377` | `Grey (not-applicable) controls are excluded from the denominator entirely. Under-scoping is the first way a score gets inflated — every exclusion is cross-checked against collected evidence.` |

**Request plan (`src/screens/02_RequestPlan.tsx`)**

| Location | Text |
|---|---|
| `02_RequestPlan.tsx:80-82` | `To assess your {557} applicable controls, we need {22} artifacts from {8} systems.` |
| `02_RequestPlan.tsx:84-88` | `Generated before any collection — the "how would I know what I'm missing" answer made concrete. Provide all {22} → projected coverage {93}%. The remaining {39} controls are structurally uncollectable and stay Unknown regardless.` |
| `02_RequestPlan.tsx:97`, `02_RequestPlan.tsx:121` | `{14} artifacts collected by the signed collector · covers {126} controls · ~15 min` · `{8} artifacts requiring a console export by the named owner` |
| `02_RequestPlan.tsx:43` | `Declining leaves {n} control(s) permanently Unknown.` |
| `02_RequestPlan.tsx:110` | `{collector} collector package prepared (simulated) · Ed25519-signed · run on-premise` |

**Intake (`src/screens/03_Intake.tsx`)**

| Location | Text |
|---|---|
| `03_Intake.tsx:106` | `Coverage fallacy defeated` |
| `03_Intake.tsx:124` | `Extracted claims` · `Testimony is capped at Yellow — never Green` |
| `03_Intake.tsx:137` | `Testimony only — capped at Yellow` |
| `03_Intake.tsx:240` | `Other evidence — drop anything not listed above. Simulated; no file is parsed.` |
| `03_Intake.tsx:276` | `Module execution ledger` · `Which collector modules ran, and with what result` |
| `03_Intake.tsx:316-319` | `Only modules with status success may produce a negative finding. The logging module failed, so its controls remain Unknown, not Gap. A permission error must never manufacture a confident failure.` |
| `03_Intake.tsx:326-328` | `148 evidence gaps closed` · `Interval collapses 49.9–87.1% → 70.8–81.4% · coverage 62.8% → 89.4% · assurance L1 → L2` |
| `03_Intake.tsx:358-363` | `Declaration contradiction — blocked pending review` · `The collected bundle contains cloud agent entries, but the profile declares no cloud services. Cloud use is not a JNCSF scoping condition, but a contradicted declaration is blocked pending review on the Profile screen.` |
| `03_Intake.tsx:456` | `Internal network only — this link does not traverse the internet` |
| `03_Intake.tsx:503-504` | `Conflict: {Executive and Operator disagree on MFA enforcement scope} — operator wins on configuration per trust ordering.` |

**Dashboard (`src/screens/04_Dashboard.tsx`) and `ScoreInterval`**

| Location | Text |
|---|---|
| `04_Dashboard.tsx:49` | `Compliance interval` · `Executive summary — the band, not a number` |
| `04_Dashboard.tsx:57` | `Assurance {L2 — Tool-evidenced \| L1 — Documented}. {n} controls still unevidenced.` |
| `04_Dashboard.tsx:61`, `04_Dashboard.tsx:78` | `Trend` · `last four collection cycles` · `band narrowing as coverage improves` |
| `04_Dashboard.tsx:83` | `Top 3 risks` · `what to escalate` |
| `04_Dashboard.tsx:33-35` | `Vulnerability scanning not established` · `22 servers overdue for patches · exposes T1190` · `Least privilege not enforced` · `43 privileged accounts without MFA · exposes T1078` · `Audit records incomplete` · `3 of 9 audit subcategories off · reduces detection` |
| `04_Dashboard.tsx:101`, `04_Dashboard.tsx:103-106` | `Completeness statement` · `This assessment covers {n} of {n} applicable controls. {n} are unevidenced. Compliance is reported as an interval because a point estimate would conceal what was not established.` |
| `04_Dashboard.tsx:110-114` | `This organisation operates critical infrastructure and is subject to the Critical Infrastructure Cyber Security Controls (405 controls, three implementation levels) in addition to the Jordan National Cybersecurity Framework. This assessment does not evaluate CICSC compliance, and a favourable JNCSF result does not represent complete assurance against the organisation's full regulatory obligation.` |
| `04_Dashboard.tsx:119-122` | `Executive view — evidence excerpts, personal data and per-control detail are not shown. Switch role (top right) for the full assessment.` |
| `04_Dashboard.tsx:171-175` | `Pre-upload state — testimony only. Run the collector bundle on the Intake screen to see the interval collapse.` |
| `04_Dashboard.tsx:183-191` | `Scoping contradiction — blocked pending review` · `Your profile declares no cloud services, but the evidence bundle contains cloud agent entries in the software inventory. This scoping decision is blocked pending review on the Profile screen.` |
| `04_Dashboard.tsx:218`, `04_Dashboard.tsx:220-222` | `Compliance Interval` · `Never a single percentage — the band is the cost of missing evidence` · `The compliance interval: true compliance lies somewhere in this band. Its width is what the assessment could not establish.` |
| `04_Dashboard.tsx:232-233`, `04_Dashboard.tsx:238-241` | `Interval narrowed after the Windows/AD collector bundle closed 90 evidence gaps.` · `Width is the cost of missing evidence.` · `Provide 5 more artifacts to narrow this toward ~10 points.` |
| `ScoreInterval.tsx:28`, `ScoreInterval.tsx:98-99`, `ScoreInterval.tsx:106` | `Compliance interval` · `width {n} points` · `coverage {n}%` · `width {n} pts` |
| `04_Dashboard.tsx:247`, `04_Dashboard.tsx:271-273` | `Coverage` · `{n} of {n} applicable controls` · `Coverage is the share of applicable controls with evidence.` |
| `04_Dashboard.tsx:276-278` | `Oldest evidence: {84} days ({JNCSF-459}) · {6} controls approaching staleness · assessed {2026-09-08}` |
| `04_Dashboard.tsx:283` | `Assurance level` · `How the evidence was established` |
| `04_Dashboard.tsx:302-308` | `Why L2, not L3.` `L3 requires analyst sign-off and every declared-estate module succeeding — the logging module failed.` `Demotion risks: 1 declined module · {n} analyst override(s) · N/A rate above sector baseline` |
| `04_Dashboard.tsx:315`, `04_Dashboard.tsx:323`, `04_Dashboard.tsx:325` | `By capability` · `Each capability carries its own interval and coverage figure` · `Not organisationally assessable — national obligation` · `0 numbered controls` |
| `04_Dashboard.tsx:358`, `04_Dashboard.tsx:366` | `Derived from NIST SP 800-53B baselines — an additive view, not a replacement for the interval above` · `Unweighted (default)` / `Weighted` |
| `04_Dashboard.tsx:372-373` | `Showing the unweighted interval — every control counts equally. Switch on to see the same assessment scored by NIST-baseline risk weight.` |
| `04_Dashboard.tsx:391`, `04_Dashboard.tsx:394` | `({30}% of framework)` · `(conservative default)` |
| `04_Dashboard.tsx:403`, `04_Dashboard.tsx:407` | `Derived-only` · `Including underived` |
| `04_Dashboard.tsx:412-418` | `Both totals are shown together — never one derived from the other. The {167}-control gap between them is real uncertainty about weight, not noise to average away. Under weighting, band width is also independent of coverage — an unknown high-weight control widens the interval more than a low-weight one; this profile's weighted width is currently {14.9} pts, which is not derivable from the {n}% coverage figure above.` |
| `04_Dashboard.tsx:429`, `04_Dashboard.tsx:432-437` | `Completeness statement — cannot be dismissed` · `This assessment covers {n} of {n} applicable controls. {n} are unevidenced. {n} are outside the tool's collection reach. Assurance level: {L1 — Documented \| L2 — Tool-evidenced}. Compliance is reported as an interval because a point estimate would conceal what was not established.` |
| `04_Dashboard.tsx:441-446` | CICSC paragraph, same wording as `04_Dashboard.tsx:110-114` |
| `04_Dashboard.tsx:452`, `04_Dashboard.tsx:455-460` | `Scope exclusions — {19} of {576} controls` · `{19} controls ({3.3}%) are marked Not Applicable. Sector baseline for {sector}: {5.0}% — ` then `⚠ your rate is above baseline` or `in line with baseline` |
| `04_Dashboard.tsx:466-467`, `04_Dashboard.tsx:473` | `{8} exclusions carry no recorded justification · ` then `1 scoping challenge recorded` / `1 scoping challenge overridden` / `no scoping challenges` · `Review all {19} exclusions →` |
| `04_Dashboard.tsx:481-484` | `Why controls are unevidenced` · `Breakdown of the {n} Unknowns after the evidence bundle` / `before the evidence bundle` |
| `04_Dashboard.tsx:505-507` | `not_requested = 0` `is a` `design invariant` `. The tool always asks for every artifact it needs; a non-zero value here would indicate a defect in the request planner.` |
| `04_Dashboard.tsx:512-518` | `Every evidence signal records why it is or isn't negative-capable, framework-wide: of {115} signals, {1} is false through uncertainty rather than rule or judgement — the recoverable case. Also, {7} of {66} authored controls have no conclusive path at all — each such control's detail page states the limit.` |
| `04_Dashboard.tsx:526` | `See the 90 promoted controls in the Gap Matrix` |
| Donut/series names `04_Dashboard.tsx:147-150` | `Artifact-evidenced`, `Testimony only`, `Unevidenced — collectable`, `Structurally uncollectable` |
| Per-capability counts `04_Dashboard.tsx:339`, `04_Dashboard.tsx:347` | `{n}G · {n}Y · {n}R · {n} unknown` · `coverage` |

**Gap Matrix (`src/screens/05_GapMatrix.tsx`)**

| Location | Text |
|---|---|
| `05_GapMatrix.tsx:116` | `Show only what changed after evidence upload` |
| `05_GapMatrix.tsx:132` | `Not organisationally assessable — national obligation` |
| `05_GapMatrix.tsx:150` | `{n} applicable · {n} of {n} seeded shown` |
| `05_GapMatrix.tsx:155` | tooltip `Two independent figures from the capability fixture — never an average, and unaffected by filters` |
| `05_GapMatrix.tsx:158`, `05_GapMatrix.tsx:165` | `worst established` · `unestablished` |
| `05_GapMatrix.tsx:176` | `No seeded controls match the current filters.` |
| `ControlRow.tsx:49`, `ControlRow.tsx:52` | `promoted` · `showcase` |

**Control Detail (`src/screens/06_ControlDetail.tsx`) and its components**

| Location | Text |
|---|---|
| `06_ControlDetail.tsx:130-132` | `showcase control` · `promoted by upload` · `analyst override` |
| `06_ControlDetail.tsx:135` | `Assessment as of {2026-09-08}` |
| `06_ControlDetail.tsx:145` | `evidence {n}d old` · ` · past {n}d window` |
| `06_ControlDetail.tsx:153` | `Standards mapping` · `ISO/IEC 27002 and NIST SP 800-53` |
| `06_ControlDetail.tsx:178` | `Evidence trail` · `Every finding traces to a quote or an artifact locator with a hash` |
| `06_ControlDetail.tsx:182-184` | `Evidence basis: {label}.` · `{meaning}` · `This is why an absent finding here can be a Gap rather than Unknown.` |
| `06_ControlDetail.tsx:192-193` | `Evidence excerpts are hidden in the {role} view — they may contain account names and other personal data.` |
| `06_ControlDetail.tsx:202-205` | `No conclusive evidence path.` `This control requires an organisational arrangement rather than a system state. It can reach Partial on documentary evidence, but never Compliant without analyst attestation.` |
| `06_ControlDetail.tsx:212` | `Evidence sufficiency` · `The evidence class sets the highest state a control may reach` |
| `06_ControlDetail.tsx:222`, `06_ControlDetail.tsx:223` | `ceiling: {label}` · `current` |
| `06_ControlDetail.tsx:229-231` | `This control's evidence is {class}, so it can reach at most {state}. Testimony alone can never mark a control Compliant — only machine-collected artifacts or an analyst signature.` |
| `06_ControlDetail.tsx:236` | `ATT&CK exposure` · `Control → Mitigation → Techniques` |
| `06_ControlDetail.tsx:242` | `Population data` · `Numerator / denominator with provenance` |
| `06_ControlDetail.tsx:252-253` | `Deployment share: {80}% — partial-credit quartile applied to the Yellow weighting.` |
| `06_ControlDetail.tsx:258` | `Named exception retained: {text}` |
| `06_ControlDetail.tsx:267` | `How to evidence this` · `Move this control out of Unknown / off the Yellow ceiling` |
| `06_ControlDetail.tsx:283` | `Open in Remediation → What you didn't provide` |
| `06_ControlDetail.tsx:289` | `Analyst actions` · `Overrides are recorded and move the dashboard interval` / `Read-only in the {role} view` |
| `06_ControlDetail.tsx:291-302` | `Accept as Compliant` · `Override to Gap` · `Set to Unknown — request more evidence` · `Clear override (engine verdict: {label})` |
| `06_ControlDetail.tsx:310`, `06_ControlDetail.tsx:315` | `Override audit record` · `{state} · analyst-signed` |
| `06_ControlDetail.tsx:46`, `06_ControlDetail.tsx:50-53`, `06_ControlDetail.tsx:59` | `Analyst override — {id}` · `An override sets the evidence class to analyst-signed — it does not bypass the state ceiling, it asserts a higher class of evidence. It is recorded in the audit trail and surfaced in the OSCAL Assessment Results as analyst-attested.` · `Justification (required) — what did you review, and why does it warrant this verdict?` |
| `AttackExposure.tsx:22-25` | `No ATT&CK mapping.` `This is a governance control with no direct adversary-technique correspondence. {203} of 576 controls ({35.2}%) carry a mapping — the ones where a specific technique is enabled or blocked by the control.` |
| `AttackExposure.tsx:98-101` | `Derived mapping with a long transitive tail — showing the {4} highest-confidence techniques. A finding naming all {n} tells a reader nothing; ` then `expanded on request.` / `the rest are collapsed by default.` |
| `AttackExposure.tsx:107`, `AttackExposure.tsx:110` | `Because {id} is enforced, exposure to these techniques is mitigated by {mitigation}.` · `Because {id} is not enforced, you are exposed to {T-id name, …}` |
| `EvidenceTrail.tsx:12-13` | `No evidence items recorded for this control yet. It sits at its evidence-class ceiling until an artifact is provided.` |

**Remediation, Export, Chat, Exclusions, Roles, Tasks, Rollup**

| Location | Text |
|---|---|
| `07_Remediation.tsx:83` | `Providing an artifact makes its controls known — pass or fail. The band narrows either way; its position depends on what the evidence shows.` |
| `07_Remediation.tsx:100-101` | `The band cannot fall below {7.0} pts of width — the {39} structurally uncollectable controls stay Unknown regardless of what is provided.` |
| `07_Remediation.tsx:129-132` | `Interval becomes {a – b%} (all pass) or {c – d%} (all fail) — either way you learn where you stand.` |
| `07_Remediation.tsx:95` | `{n} controls become known. Band width falls to {n} pts. Best case {a – b%} · worst case {c – d%}.` |
| `07_Remediation.tsx:182`, `07_Remediation.tsx:194-195` | `Done when the {source} export is accepted and its {n} controls move out of Unknown.` · `Done when the AD export shows 0 privileged accounts without MFA.` · `Done when re-collection shows the {n} linked controls satisfied.` |
| `08_Export.tsx:30` | `Point estimates are intentionally omitted. A regulator reads the interval.` |
| `08_Export.tsx:37-38` | `CICSC (405 controls) not assessed. JNCSF result alone does not represent complete assurance for this organisation.` · `Organisation does not operate critical infrastructure; CICSC does not apply.` |
| `08_Export.tsx:151-152` | `Five OSCAL models. Coverage metadata and the assurance level travel inside the package, so the regulator sees the interval — not a bare number.` |
| `08_Export.tsx:155` | `Validates against OSCAL 1.1.2 · 5 models · 557 control implementations · 0 errors` |
| `08_Export.tsx:189-190` | `Packages are signed so a submission cannot be altered undetected.` |
| `08_Export.tsx:206-209` | `The Catalog model is the first machine-readable representation of the JNCSF: 576 controls with their ISO 27002 and NIST 800-53 mappings, ATT&CK bridges and evidence signal requirements. It can be published by NCSC as the authoritative reference every entity assesses against — so every assessment in the country is scored against exactly the same catalogue version.` |
| `08_Export.tsx:112-118` | `The package discloses to NCSC:` · `The compliance interval, coverage and assurance level` · `Per-control findings, evidence class and gap reasons (557 controls)` · `The POA&M and its target dates` · `Evidence locators and hashes — not the raw files` · `Evidence excerpts may contain account names (e.g. svc-backup, a.haddad-adm)` |
| `08_Export.tsx:123-124` | `Redact personal data in evidence excerpts before submission` · `recommended — replaces account names with role-typed placeholders` |
| `10_Exclusions.tsx:51`, `10_Exclusions.tsx:148-150` | `· above` · `Showing all {19} of {19} exclusions — the full register for this organisation, not a sample.` |
| `11_Admin.tsx:98-102` | `Every role boundary in JCCP implements a JNCSF access-control requirement. The Appliance Admin can run the box but cannot read one line of assessment content — separation of duties by design. Use the Viewing as switcher (top right) to see each view.` |
| `12_Tasks.tsx:32-33` | `You have been asked to provide evidence for the Ministry of Digital Services assessment. You can see your own submissions and their status — not the assessment result.` |
| `13_Rollup.tsx:19-21` | `Anonymised regulator view. Distribution is over interval lower-bound bands, not point estimates, and is segmented by assurance level — an L1 entity "at 75%" and an L2 entity "at 75%" are not the same claim.` |
| `13_Rollup.tsx:63`, `13_Rollup.tsx:73-74` | `suppressed — fewer than {5} entities` · `Cells with fewer than {5} entities are suppressed so a single organisation cannot be re-identified from the aggregate.` |

**Shared data-module strings that surface in the UI**

| Location | Text |
|---|---|
| `src/data/riskWeighting.ts:43-45` | `30% of the framework carries no derived weight because those controls have no NIST correspondence. They contribute at full weight so that uncertainty never reduces the assessment — and the derived-only figure is published alongside.` |
| `src/data/collaboration.ts:22` | `Executive and Operator disagree on MFA enforcement scope` (`CONFLICT_FLAG.summary`) |
| `src/data/attack.ts:33-34` | `Official — NCSC Threat Annex` · `Derived — transitive via NIST 800-53, manually reviewed` |
| `src/data/sectors.ts:32` | `not designated` |
| `src/data/exclusions.ts:28-45` | the eleven non-empty `justification` strings — see D.17.2 |

### E.3 Placeholders, tooltips and labels that assert a number

| Location | Text |
|---|---|
| `03_Intake.tsx:204` | `Simulate collector bundle upload (fills 14)` |
| `03_Intake.tsx:431` | `{8} turns · {3} claims` (counts computed from the fixture) |
| `01_Profile.tsx:132` | placeholder `Accountable officer name` |
| `01_Profile.tsx:275` | placeholder `Justification (required) — e.g. all workloads run on the MoDEE Government Private Cloud, which is assessed separately…` |
| `05_GapMatrix.tsx:92` | placeholder `Search controls…` |
| `CoverageBar.tsx:22` | `{label}: {value}` (title on each bar segment; component unused) |
| `StateBadge.tsx:30` | `{label} — {shape}` |
| `13_Rollup.tsx:53` | `{L1\|L2\|L3}: {n}` (title on each bar segment) |

### E.4 Evidence excerpts (shown in the evidence trail and the `View raw` modal)

Extracted from `src/data/evidence.ts`; `raw` text is shown exactly as stored (the source uses `\n`).

**`JNCSF-102` / `ev-102-1`** (`src/data/evidence.ts:25`)

- Quote shown (`src/data/evidence.ts:28`): `Around 80% [of workstations have the agent]. Contractor machines don’t have the agent.`
- `View raw` modal text (`src/data/evidence.ts:32`):

```text
AGENT: What share of workstations have the agent installed?
USER: Around 80%.
AGENT: Are there populations excluded from deployment?
USER: Contractor machines don’t have the agent.

[extraction] claim=workstation_coverage value=0.80 confidence=0.71
[extraction] claim=named_exception value="contractor_machines" confidence=0.90
```

**`JNCSF-102` / `ev-102-2`** (`src/data/evidence.ts:35`)

- `View raw` modal text (`src/data/evidence.ts:42`):

```text
SamAccountName,Group,Enabled,MFAEnforced,LastLogonDate,PasswordLastSet
svc-backup,Domain Admins,True,False,2026-09-04,2024-02-11
a.haddad-adm,Domain Admins,True,True,2026-09-05,2026-06-30
m.qasem-adm,Enterprise Admins,True,False,2026-09-01,2025-11-20
... (509 more rows)

SUMMARY: 512 privileged group members · 469 MFA-enforced · 43 without MFA · 6 stale (>90d no logon)
```

**`JNCSF-102` / `ev-102-3`** (`src/data/evidence.ts:45`)

- `View raw` modal text (`src/data/evidence.ts:52`):

```text
TOTAL AD computer objects: 512
Reconciled with EDR agent inventory: 410 (80.1%)
No matching EDR agent: 102
  - contractor-managed: 71
  - decommissioned (stale object): 19
  - unresolved: 12

Sample ratio 410/512 sufficient for estate-level claim (threshold 0.70).
```

**`JNCSF-30` / `ev-30-1`** (`src/data/evidence.ts:57`)

- `View raw` modal text (`src/data/evidence.ts:64`):

```text
System audit policy
Category/Subcategory                      Setting
Logon/Logoff
  Logon                                   Success and Failure
  Logoff                                  Success
  Account Lockout                         Failure
Object Access
  File System                             No Auditing        <-- gap
  Registry                               No Auditing        <-- gap
Detailed Tracking
  Process Creation                        No Auditing        <-- gap (T1059 blind spot)
Policy Change
  Audit Policy Change                     Success

FINDING: 3 of 9 required subcategories not enabled. Negative-capable module (configuration) = success → Gap.
```

**`JNCSF-435` / `ev-435-1`** (`src/data/evidence.ts:69`)

- Quote shown (`src/data/evidence.ts:72`): `MFA is on for the admin portal, and we are rolling it out to the rest.`

**`JNCSF-435` / `ev-435-2`** (`src/data/evidence.ts:78`)

- `View raw` modal text (`src/data/evidence.ts:85`):

```text
MFAEnforced tally over 512 privileged group members:
  True  : 469
  False : 43

43 privileged accounts accept single-factor authentication. Module status = success → Gap.
```

**`JNCSF-173` / `ev-173-1`** (`src/data/evidence.ts:90`)

- `View raw` modal text (`src/data/evidence.ts:97`):

```text
module=logging status=FAILED reason=wineventlog_access_denied

The logging module could not read the Windows Event Log collection.
Per the scoring rule, a failed module MUST NOT produce a negative finding.
Controls depending on logging evidence remain Unknown (gapReason=module_failed), not Gap.
```

**`JNCSF-394` / `ev-394-1`** (`src/data/evidence.ts:102`)

- `View raw` modal text (`src/data/evidence.ts:109`):

```text
Hosts reporting: 388 of 400
RealTimeProtectionEnabled=true : 331
AntivirusSignatureAge <= 2 days : 344
Managed AV absent (contractor image): 44

Coverage ~80%. Named exception: contractor-managed workstations.
```

**`JNCSF-459` / `ev-459-1`** (`src/data/evidence.ts:114`)

- `View raw` modal text (`src/data/evidence.ts:121`):

```text
Reporting period: 2026-Q2
Active staff in scope: 620
Completed mandatory awareness module: 484 (78.1%)
Overdue > 30 days: 92
Never started: 44

NOTE: export is from Q2. A current export is required — this evidence is 84 days old
against a 365-day freshness window but the training cycle itself is quarterly.
```

**`JNCSF-7` / `ev-7-1`** (`src/data/evidence.ts:126`)

- `View raw` modal text (`src/data/evidence.ts:133`):

```text
AD computer objects: 512
CMDB configuration items: 512
Matched: 512 (100%)
Authorized flag present on all CIs.
Last full sync: 2026-09-04T23:00:00+03:00
```

### E.5 Interview turns, ingestion stages and module ledger text

Extracted from `src/data/interviews.ts` and `src/data/scenario.ts`.

| Role | Speaker | Text | Line |
|---|---|---|---|
| operator | JCCP agent (`agent`) | `Let's start with endpoint protection. Do you have endpoint detection deployed across the estate?` | `src/data/interviews.ts:33` |
| operator | Interviewee (`user`) | `Yes, we run CrowdStrike across the estate.` | `src/data/interviews.ts:34` |
| operator | JCCP agent (`agent`) | `Is it configured to block, or is it detect-only?` | `src/data/interviews.ts:35` |
| operator | Interviewee (`user`) | `It blocks on servers. On workstations it's detect-only for now.` | `src/data/interviews.ts:36` |
| operator | JCCP agent (`agent`) | `What share of workstations have the agent installed?` | `src/data/interviews.ts:37` |
| operator | Interviewee (`user`) | `Around 80%.` | `src/data/interviews.ts:38` |
| operator | JCCP agent (`agent`) | `Are there populations excluded from deployment?` | `src/data/interviews.ts:39` |
| operator | Interviewee (`user`) | `Contractor machines don't have the agent.` | `src/data/interviews.ts:40` |
| exec | JCCP agent (`agent`) | `Which systems would cause the most disruption if unavailable for a day?` | `src/data/interviews.ts:62` |
| exec | Interviewee (`user`) | `The citizen services portal and the internal HR system.` | `src/data/interviews.ts:63` |
| exec | JCCP agent (`agent`) | `Do you hold data classified as sensitive under PDPL — health, biometric, financial, religious or political?` | `src/data/interviews.ts:64` |
| exec | Interviewee (`user`) | `Yes, HR holds health records for medical leave.` | `src/data/interviews.ts:65` |
| exec | JCCP agent (`agent`) | `Noted. That brings the 48-hour breach-notification obligation into scope.` | `src/data/interviews.ts:66` |
| defender | JCCP agent (`agent`) | `Which log sources are forwarded to your SIEM?` | `src/data/interviews.ts:78` |
| defender | Interviewee (`user`) | `Domain controllers, firewalls, and the EDR console.` | `src/data/interviews.ts:79` |
| defender | JCCP agent (`agent`) | `Are all three alert-capable, or are some collected but not monitored?` | `src/data/interviews.ts:80` |
| defender | Interviewee (`user`) | `Firewall logs are collected but nobody has built alerts on them.` | `src/data/interviews.ts:81` |

| # | Ingestion stage `label` (line) | `detail` | `result` |
|---|---|---|---|
| 1 | `Verifying signature` (`src/data/scenario.ts:203`) | `Ed25519 · collector build 2026.08.2` | ok |
| 2 | `Reading module execution ledger` (`src/data/scenario.ts:204`) | `7 modules recorded` | ok |
| 3 | `Parsing identity.json (1,842 records)` (`src/data/scenario.ts:205`) | `accounts, groups, MFA state` | ok |
| 4 | `Parsing endpoint.json` (`src/data/scenario.ts:206`) | `partial — insufficient permission (12 of 400 hosts)` | warn |
| 5 | `Parsing logging.json` (`src/data/scenario.ts:207`) | `failed — wineventlog_access_denied` | error |
| 6 | `Module 'cloud'` (`src/data/scenario.ts:208`) | `declined by client` | error |
| 7 | `Corroborating 90 claims` (`src/data/scenario.ts:209`) | `testimony cross-checked against artifacts` | ok |

| Module | `status` | `detail` | Line |
|---|---|---|---|
| `identity` | success | `identity.json parsed — 1,842 records` | `src/data/scenario.ts:193` |
| `endpoint` | partial | `insufficient permission — 12 of 400 hosts readable` | `src/data/scenario.ts:194` |
| `logging` | failed | `wineventlog_access_denied` | `src/data/scenario.ts:195` |
| `cloud` | declined | `declined by client at collection time` | `src/data/scenario.ts:196` |
| `configuration` | success | `GPO + registry baseline parsed — 214 objects` | `src/data/scenario.ts:197` |
| `vulnerability` | success | `scanner export parsed — 3,908 findings` | `src/data/scenario.ts:198` |
| `backup` | success | `job history parsed — 30 days` | `src/data/scenario.ts:199` |

### E.6 Compliance Chat — questions, answers, citations

Extracted from `CANNED` in `src/screens/09_Chat.tsx`. Citation chips with a `to` are links; those with a passage expand on click.

| # | Question (line) | Flags | Answer (line) | Citations: `label` → `to` / passage (line) |
|---|---|---|---|---|
| 1 | `What does JNCSF-102 require?` (`09_Chat.tsx:22`) | — | `JNCSF-102 requires that access rights are managed consistent with the principle of least privilege — users and services hold only the permissions their role needs, privileged access is separated and regularly re-certified, and use of privileged utility programs is restricted and logged.` (`09_Chat.tsx:23`) | `JNCSF-102` → `/control/JNCSF-102` — passage `Manage access rights to be consistent with the principle of least privilege.` (`09_Chat.tsx:25`)<br>`ISO 27002 · 9.2.3` — passage `9.2.3 Management of privileged access rights — allocation and use of privileged access rights shall be restricted and controlled.` (`09_Chat.tsx:26`)<br>`NIST 800-53 · AC-6` — passage `AC-6 Least Privilege — employ the principle of least privilege, allowing only authorized accesses for users which are necessary to accomplish assigned tasks.` (`09_Chat.tsx:27`) |
| 2 | `Why is JNCSF-102 a gap for us?` (`09_Chat.tsx:31`) | `grounded` | `The Active Directory privileged-group export shows 43 of 512 privileged accounts with no MFA enforcement, and 102 of 512 endpoints have no reconciled EDR agent (71 contractor-managed). Machine evidence, not testimony, so the control is a Gap. This exposes you to T1078 Valid Accounts, T1548 Abuse Elevation Control Mechanism and T1021 Remote Services.` (`09_Chat.tsx:33`) | `JNCSF-102` → `/control/JNCSF-102`<br>`raw/ad-privileged-groups.csv row 412` — passage `SUMMARY: 512 privileged group members · 469 MFA-enforced · 43 without MFA · 6 stale (>90d no logon)` (`09_Chat.tsx:36`)<br>`T1078` — passage `Valid Accounts — adversaries obtain and abuse credentials of existing accounts.` (`09_Chat.tsx:37`)<br>`T1548` — passage `Abuse Elevation Control Mechanism — adversaries circumvent mechanisms designed to control elevated privileges.` (`09_Chat.tsx:33`)<br>`T1021` — passage `Remote Services — adversaries use valid accounts to log into remote services.` (`09_Chat.tsx:39`) |
| 3 | `What's blocking L3 assurance?` (`09_Chat.tsx:43`) | `grounded` | `Two things. The logging module failed at collection (wineventlog_access_denied), so its controls stay Unknown rather than being established — L3 requires every declared-estate module to succeed. And L3 requires an accredited assessor to review and sign the evidence set; no analyst sign-off has been recorded.` (`09_Chat.tsx:45`) | `Module ledger · logging` → `/intake` — passage `module=logging status=FAILED reason=wineventlog_access_denied` (`09_Chat.tsx:47`)<br>`Assurance ladder` → `/dashboard` — passage `L3 — Analyst-signed: an accredited assessor has reviewed and signed the evidence set.` (`09_Chat.tsx:48`) |
| 4 | `Which gaps would an attacker exploit first?` (`09_Chat.tsx:52`) | `grounded` | `JNCSF-307 (vulnerability scanning) is a Gap and maps to T1190 Exploit Public-Facing Application — the scan export shows 22 servers with overdue patches and 14 internet-facing services. That is the shortest path from outside. JNCSF-435 (MFA) is next: T1110 Brute Force against the 43 unprotected privileged accounts.` (`09_Chat.tsx:54`) | `JNCSF-307` → `/control/JNCSF-307`<br>`T1190` — passage `Exploit Public-Facing Application — adversaries exploit a weakness in an Internet-facing host or system.` (`09_Chat.tsx:54`)<br>`JNCSF-435` → `/control/JNCSF-435` |
| 5 | `Which controls cover the 48-hour breach rule?` (`09_Chat.tsx:62`) | — | `The 48-hour breach-notification obligation is supported by JNCSF-30 (audit records), JNCSF-252 (incident handling) and JNCSF-257 (user reporting within a defined period). The obligation itself derives from PDPL Art. 2023.` (`09_Chat.tsx:63`) | `JNCSF-30` → `/control/JNCSF-30`<br>`JNCSF-252` → `/control/JNCSF-252`<br>`JNCSF-257` → `/control/JNCSF-257`<br>`PDPL Art. 2023` — passage `Personal Data Protection Law — controllers must notify the Unit of a personal-data breach within 48 hours of becoming aware of it.` (`09_Chat.tsx:68`) |
| 6 | `What is our compliance score?` (`09_Chat.tsx:72`) | — | `Your interval is 70.8–81.4% at 89.4% coverage — read from the assessment, not computed by me. The scoring engine is deterministic; I only retrieve. Open the dashboard for the breakdown.` (`09_Chat.tsx:73`) | `Dashboard · Compliance interval` → `/dashboard` |
| 7 | `Are we compliant enough to pass an NCSC audit?` (`09_Chat.tsx:77`) | `refusal` | `I can't predict a regulator's determination. I can show you what the assessment establishes and what it doesn't — the interval, the coverage, the unevidenced controls and the scope exclusions.` (`09_Chat.tsx:79`) | `Completeness statement` → `/dashboard`<br>`Scope exclusions` → `/exclusions` |
| 8 | `Tell me about JNCSF-9999` (`09_Chat.tsx:86`) | `refusal` | `No such control exists in the pinned catalogue (JNCSF-1 to JNCSF-576).` (`09_Chat.tsx:88`) | `Pinned catalogue: JNCSF-1 … JNCSF-576` |

### E.7 Guided-tour script (30 steps)

Extracted from `TOUR_STEPS` in `src/tour/steps.ts`.

| # | Act | `id` | Title | Body | Lines (title / body) |
|---|---|---|---|---|---|
| 1 | Scoping | `where-we-are` | `Where we are` | `This is the starting point of an assessment. Before we can measure compliance, we have to work out which of the framework’s 576 controls actually apply to this organisation. Not all of them apply to everyone.` | `steps.ts:44` / `steps.ts:45` |
| 2 | Scoping | `who-we-assess` | `Who we are assessing` | `Tell the system what kind of organisation this is. Sector determines which regulator oversees this entity and which additional rules apply. Size tells the system how large the estate should be, so it can later tell a full survey apart from a small sample.` | `steps.ts:52` / `steps.ts:53` |
| 3 | Scoping | `what-technology` | `What technology they run` | `These are the five variables that actually gate anything in this framework — measured, not guessed: in-house development, outsourced development, mobile devices, wireless networks, remote access. An organisation that writes no software of its own isn’t meaningfully assessed against secure-coding controls. Each switch adds or removes a small, named group of controls; nothing else in the framework is conditional.` | `steps.ts:60` / `steps.ts:61` |
| 4 | Scoping | `the-number` | `The number that matters` | `This is the denominator for everything that follows. 557 of 576 controls apply here — the framework is 93% universal, so only the five variables below can move this number. Watch it change as switches are flipped — scoping is visible, not hidden. Under-scoping is the easiest way to inflate a compliance score, which is why the system records and publishes every exclusion.` | `steps.ts:68` / `steps.ts:69` |
| 5 | Scoping | `challenge` | `The system challenges the answers` | `Declarations are treated as claims, not facts — even ones that don’t change the scope. “Uses cloud services” doesn’t gate any controls here; cloud is governed by a separate policy. But turning it off is still a claim worth checking. The system pushes back and asks for a written justification before allowing it — and later, if collected evidence contradicts the declaration, it blocks the assessment entirely.` | `steps.ts:76` / `steps.ts:77` |
| 6 | Scoping | `move-on-1` | `Move on` | `Scoping is done. Next: what evidence do we need?` | `steps.ts:84` / `steps.ts:85` |
| 7 | The evidence plan | `plan-first` | `The plan comes first` | `The system says what it needs before collection starts. This answers the question every organisation asks: “how would I know what I’m missing?” The list is calculated from the 557 applicable controls — not written by hand.` | `steps.ts:96` / `steps.ts:97` |
| 8 | The evidence plan | `reading-a-row` | `Reading a row` | `Each row is one artefact the organisation must produce. “Controls” is how many controls this single file would establish. “Effort” is roughly how long it takes. “How to produce it” is the exact command to run. Rows are ordered by value, so the most useful evidence comes first.` | `steps.ts:105` / `steps.ts:106` |
| 9 | The evidence plan | `auto-manual` | `Automated vs manual` | `Most evidence is collected automatically. The organisation downloads a read-only script, runs it on its own systems, reviews the output, and uploads the result. The platform never connects to their network — which keeps this outside the licensing rules that govern cybersecurity services.` | `steps.ts:114` / `steps.ts:115` |
| 10 | The evidence plan | `move-on-2` | `Move on` | `Now we go and gather the evidence.` | `steps.ts:122` / `steps.ts:123` |
| 11 | Gathering evidence | `two-ways` | `Two ways in` | `Evidence arrives from two directions. “Interviews” capture what people know. “Evidence bundle” carries what machines can prove. Both are needed; only one of them can establish compliance.` | `steps.ts:134` / `steps.ts:135` |
| 12 | Gathering evidence | `three-interviews` | `Why three separate interviews` | `Different people know different truths. Executives know what matters to the business. Operators know how systems are actually configured. Security staff know what is actually monitored. Asking one person all three questions produces a confident, wrong answer.` | `steps.ts:142` / `steps.ts:143` |
| 13 | Gathering evidence | `one-becomes-three` | `One sentence becomes three findings` | `Watch what happens to a simple claim. “We run endpoint detection across the estate” sounds like one compliant control. After follow-up questions it becomes three separate findings: enforcing on servers, detect-only on workstations, and contractor machines with no agent at all.` | `steps.ts:151` / `steps.ts:152` |
| 14 | Gathering evidence | `testimony-ceiling` | `Testimony has a ceiling` | `Nothing here can be marked compliant yet. A claim supported only by someone’s word is capped at “Partial”, however confidently it was said. Reaching “Compliant” requires machine-collected proof. This single rule is what separates this from a questionnaire.` | `steps.ts:161` / `steps.ts:162` |
| 15 | Gathering evidence | `upload` | `Upload the evidence` | `Now we add what the machines can prove. Click to simulate the organisation running the collector and uploading the result.` | `steps.ts:170` / `steps.ts:171` |
| 16 | Gathering evidence | `module-ledger` | `Read the module ledger` | `Notice that not everything worked. One module ran, one only reached 12 of 400 machines, one failed on permissions, one was declined. This is deliberate, and it is the most important idea in the system: a module that failed proves nothing. Its controls stay “Unknown” — they are never recorded as failures. A permissions error must never manufacture a confident bad result.` | `steps.ts:181` / `steps.ts:182` |
| 17 | Gathering evidence | `see-the-effect` | `See the effect` | `The evidence is in. Let’s look at what it changed.` | `steps.ts:189` / `steps.ts:190` |
| 18 | The result | `never-one-number` | `Never one number` | `Compliance is reported as a range, never a single percentage. The lower figure assumes every unestablished control fails. The upper assumes they all pass. The truth is somewhere between. The width of this band is exactly how much the assessment did not establish — before the evidence arrived it was 37.2 points wide; now it is 10.6.` | `steps.ts:201` / `steps.ts:202` |
| 19 | The result | `coverage` | `Coverage` | `How much was actually examined. 498 of 557 controls now have evidence. The remainder splits into controls that could still be evidenced, and controls no supported method can ever reach — shown separately, because one is a to-do list and the other is a permanent limit.` | `steps.ts:209` / `steps.ts:210` |
| 20 | The result | `assurance` | `How the evidence was obtained` | `Not all assessments are equally trustworthy. “L1” means documents and interviews. “L2” means machine-collected evidence. This is what allows a regulator to compare two organisations’ submissions meaningfully — an 85% at L1 is a weaker statement than a 72% at L2.` | `steps.ts:217` / `steps.ts:218` |
| 21 | The result | `disclosure` | `The disclosure that cannot be turned off` | `Every assessment states its own limits. How many controls were covered, how many were not established, how many are beyond the tool’s reach, and how many were excluded from scope. This box cannot be dismissed or hidden.` | `steps.ts:225` / `steps.ts:226` |
| 22 | The result | `where-gaps` | `Where the gaps are` | `Two different problems, shown separately. A low score means known weakness. A wide band means we don’t yet know. They call for different responses — fix one, investigate the other.` | `steps.ts:233` / `steps.ts:234` |
| 23 | Proof and action | `go-gap-matrix` | `Go to the gap matrix` | `Let’s look at the individual controls.` | `steps.ts:243` / `steps.ts:244` |
| 24 | Proof and action | `every-control` | `Every control, one state` | `Each control is Compliant, Partial, a Gap, Not Applicable, or Unknown. “Unknown” is a first-class result, not a blank. It means the assessment did not establish this — and it says why.` | `steps.ts:253` / `steps.ts:254` |
| 25 | Proof and action | `open-control` | `Open a control` | `Let’s see what a finding is actually built on.` | `steps.ts:261` / `steps.ts:262` |
| 26 | Proof and action | `evidence-trail` | `The evidence trail` | `This is what makes a finding defensible. Every claim links to the exact quote or the exact row of the exact file, with a cryptographic fingerprint. An auditor can re-check the original rather than trusting the tool.` | `steps.ts:271` / `steps.ts:272` |
| 27 | Proof and action | `attack` | `What an attacker gains` | `A compliance gap is translated into real-world risk. Because privileged accounts lack multi-factor authentication, this organisation is exposed to specific, named attack techniques. The badge says whether that mapping is official — straight from the NCSC’s own published Threat Annex — or derived and reviewed; only 35% of controls carry any mapping at all, and this is one of them.` | `steps.ts:279` / `steps.ts:280` |
| 28 | Proof and action | `go-remediation` | `What to do about it` | `Finally: the plan of action.` | `steps.ts:287` / `steps.ts:288` |
| 29 | Proof and action | `ranked` | `Ranked by value` | `Actions ordered by how many controls each one closes. Fixing multi-factor authentication for 43 privileged accounts resolves 11 controls at once — and removes exposure to three named attack techniques.` | `steps.ts:297` / `steps.ts:298` |
| 30 | Done | `closing` | `That’s the full journey` | `What you have just seen: scoping that is visible and challenged · evidence that must be proven, not claimed · a result that states its own uncertainty · findings traceable to source · and a prioritised plan of action. Everything ran in your browser. No data was collected or transmitted.` | `steps.ts:303` / `steps.ts:304` |

### E.8 Per-screen help (the corner `?` button)

Extracted from `SCREEN_HELP` in `src/tour/helpContent.ts`. The panel heading is `What am I looking at?` (`src/tour/HelpPanel.tsx:42`).

| Path key | Title (line) | Line text (line) |
|---|---|---|
| `/profile` | `Organisation Profile` (`helpContent.ts:12`) | `This is where an assessment begins. You describe the organisation so the system can work out which of the framework’s 576 controls apply to it.` (`helpContent.ts:14`)<br>`The big number on the right is the count of applicable controls — the denominator for every result that follows.` (`helpContent.ts:15`)<br>`When you’re done, use “Continue to request plan”.` (`helpContent.ts:16`) |
| `/request-plan` | `Evidence Request Plan` (`helpContent.ts:20`) | `A list of the evidence the organisation needs to gather, calculated from the applicable controls — not written by hand.` (`helpContent.ts:22`)<br>`Each row is one file. “Controls” is how many controls that file would establish; rows are ordered so the most useful evidence is first.` (`helpContent.ts:23`)<br>`Most rows are collected by a read-only script the organisation runs itself; the rest are manual console exports.` (`helpContent.ts:24`) |
| `/intake` | `Intake` (`helpContent.ts:28`) | `Where evidence is gathered. “Interviews” capture what people say; “Evidence bundle” carries what machines can prove.` (`helpContent.ts:30`)<br>`Testimony from an interview can only reach “Partial”. Reaching “Compliant” needs machine-collected evidence.` (`helpContent.ts:31`)<br>`Use the “Evidence bundle” tab and “Simulate collector bundle upload” to see the assessment update.` (`helpContent.ts:32`) |
| `/dashboard` | `Compliance Dashboard` (`helpContent.ts:36`) | `The result. Compliance is shown as a range, never a single percentage — the band’s width is how much the assessment did not establish.` (`helpContent.ts:38`)<br>`“Coverage” is how much was examined. “Assurance level” is how trustworthy the evidence is (L1 documents, L2 machine-collected).` (`helpContent.ts:39`)<br>`The bordered “completeness statement” states the assessment’s own limits and cannot be hidden.` (`helpContent.ts:40`) |
| `/gap-matrix` | `Gap Matrix` (`helpContent.ts:44`) | `Every control, one at a time. Each is Compliant, Partial, a Gap, Not Applicable, or Unknown.` (`helpContent.ts:46`)<br>`“Unknown” means the assessment did not establish this — it is a real result, and each one says why.` (`helpContent.ts:47`)<br>`Click any control to see the evidence behind its state.` (`helpContent.ts:48`) |
| `/control` | `Control Detail` (`helpContent.ts:52`) | `One control, and everything the assessment knows about it.` (`helpContent.ts:54`)<br>`The “evidence trail” links every finding to the exact quote or file row, with a fingerprint an auditor can re-check.` (`helpContent.ts:55`)<br>`The “ATT&CK exposure” panel translates a gap into the specific attack techniques it leaves the organisation open to.` (`helpContent.ts:56`) |
| `/remediation` | `Remediation & Requests` (`helpContent.ts:60`) | `What to do next, ordered by value — how many controls each action closes.` (`helpContent.ts:62`)<br>`“What you didn’t provide” shows what each missing piece of evidence would tell you, as a range of outcomes.` (`helpContent.ts:63`)<br>`These are recommendations; nothing here changes the assessment.` (`helpContent.ts:64`) |
| `/export` | `OSCAL Export` (`helpContent.ts:68`) | `The package a regulator receives. It carries the compliance range and the assurance level inside it — not a bare number.` (`helpContent.ts:70`)<br>`It is cryptographically signed so a submission cannot be altered undetected.` (`helpContent.ts:71`)<br>`The “Catalog” model is a machine-readable copy of the whole framework, so every organisation is scored against the same version.` (`helpContent.ts:72`) |
| `/exclusions` | `Scope Exclusions` (`helpContent.ts:76`) | `The register of every control that was excluded from this assessment, and why.` (`helpContent.ts:78`)<br>`Excluding a control that should apply is the easiest way to inflate a score, so each exclusion is recorded and, where it lacks a justification, flagged.` (`helpContent.ts:79`)<br>`The rate is compared to a sector baseline.` (`helpContent.ts:80`) |
| `/admin` | `Roles & Access` (`helpContent.ts:84`) | `Who can see and do what. Use the “Viewing as” switch at the top right to try each role.` (`helpContent.ts:86`)<br>`Each access boundary implements a specific framework control — shown in the “Implements” column.` (`helpContent.ts:87`)<br>`The appliance administrator can run the box but cannot read a single assessment result.` (`helpContent.ts:88`) |
| `/rollup` | `National Rollup` (`helpContent.ts:92`) | `The regulator’s view across many organisations in a sector.` (`helpContent.ts:94`)<br>`Distribution is shown by the lower bound of each organisation’s compliance range, split by assurance level — so like is compared with like.` (`helpContent.ts:95`)<br>`Cells covering fewer than five organisations are suppressed so no single one can be identified.` (`helpContent.ts:96`) |
| `/tasks` | `My Tasks` (`helpContent.ts:100`) | `The view for a contributor who has been asked to provide one or two pieces of evidence.` (`helpContent.ts:102`)<br>`You see only your own submissions and their status — never the assessment result.` (`helpContent.ts:103`)<br>`Use “Submit” to mark a task done.` (`helpContent.ts:104`) |
| `/chat` | `Compliance Chat` (`helpContent.ts:108`) | `Ask questions about the framework and this assessment. Every answer carries a citation you can open.` (`helpContent.ts:110`)<br>`It retrieves and explains; it cannot change any control state or compute a score.` (`helpContent.ts:111`)<br>`Pick a question from the buttons to start.` (`helpContent.ts:112`) |

### E.9 Glossary tooltips and welcome modal

| Key | `term` | `short` | Line |
|---|---|---|---|
| `applicable controls` | `Applicable controls` | `The controls that apply to this organisation, out of 576 in the framework.` | `src/tour/glossary.ts:12` |
| `coverage` | `Coverage` | `The share of applicable controls the assessment actually established.` | `src/tour/glossary.ts:16` |
| `compliance interval` | `Compliance interval` | `The range within which true compliance must lie; the width is what remains unknown.` | `src/tour/glossary.ts:20` |
| `assurance level` | `Assurance level` | `How the evidence was obtained: declared, documented, machine-collected, or analyst-signed.` | `src/tour/glossary.ts:24` |
| `unknown` | `Unknown` | `Not established either way — different from non-compliant.` | `src/tour/glossary.ts:28` |
| `not applicable` | `Not applicable` | `Excluded because it doesn’t apply to this architecture; requires justification.` | `src/tour/glossary.ts:32` |
| `evidence class` | `Evidence class` | `What kind of proof supports a claim; determines the highest state it can reach.` | `src/tour/glossary.ts:36` |
| `module ledger` | `Module ledger` | `The record of which collection routines ran, failed, or were declined.` | `src/tour/glossary.ts:40` |
| `jncsf` | `JNCSF` | `The Jordan National Cybersecurity Framework: 576 controls across six capabilities.` | `src/tour/glossary.ts:44` |
| `oscal` | `OSCAL` | `An international machine-readable format for exchanging compliance results.` | `src/tour/glossary.ts:48` |

Welcome modal (`src/tour/WelcomeGate.tsx`):

- `WelcomeGate.tsx:60` `Jordan Cyber Compliance Platform` · `WelcomeGate.tsx:62` `A prototype demonstration`
- `WelcomeGate.tsx:65-66` `This system lets a Jordanian organisation measure its own compliance with the National Cybersecurity Framework — using collected evidence rather than self-declaration.`
- `WelcomeGate.tsx:69-70` `Everything you see is demonstration data for a fictional organisation, the Ministry of Digital Services. Nothing you do here is saved or transmitted.`
- `WelcomeGate.tsx:79`, `WelcomeGate.tsx:85` `Start guided tour →` · `Explore on my own`
- `WelcomeGate.tsx:89` `The tour takes about 3 minutes and walks through a complete assessment.`

---

## F. State and data flow

### F.1 Where state lives

**Global — one Zustand store, `useAssessment`** (`src/store/useAssessment.ts:101-169`). Initial values are in `initial` (`useAssessment.ts:85-99`) and `navOpen: false` (`useAssessment.ts:105`).

| Field (`useAssessment.ts` line) | Initial | Written by | Read by |
|---|---|---|---|
| `phase` (`useAssessment.ts:42`) | `'profile'` | `setPhase('planning')` `01_Profile.tsx:329`; `setPhase('intake')` `02_RequestPlan.tsx:141`; `uploadEvidence` → `'assessed'` (`useAssessment.ts:118`) | `PhaseStepper.tsx:6` only |
| `role` (`useAssessment.ts:43`) | `'owner'` | `setRole` from `TopBar.tsx:63` | `App.tsx:26`, `Sidebar.tsx:10`, `TopBar.tsx:24`, `01_Profile.tsx:76`, `04_Dashboard.tsx:133`, `06_ControlDetail.tsx:77` |
| `profile` (`useAssessment.ts:44`) | `defaultProfile` (`scenario.ts:41-65`) | `setProfile` (`useAssessment.ts:115`), `setPdpl` (`useAssessment.ts:116-117`) from `01_Profile.tsx:101-225` | `TopBar.tsx:23`, `01_Profile.tsx:75`, `03_Intake.tsx:349`, `04_Dashboard.tsx:41`, `04_Dashboard.tsx:131`, `08_Export.tsx:86`, `10_Exclusions.tsx:14` |
| `evidenceUploaded` (`useAssessment.ts:46`) | `false` | `uploadEvidence` (`useAssessment.ts:118`) from `03_Intake.tsx:184`; `resetEvidence` (`useAssessment.ts:119`) is never called | `Sidebar.tsx:9`, `01_Profile.tsx:80`, `03_Intake.tsx:167`, `03_Intake.tsx:348`, `04_Dashboard.tsx:39`, `04_Dashboard.tsx:129`, `05_GapMatrix.tsx:32`, `06_ControlDetail.tsx:76`, `08_Export.tsx:84` |
| `interviewsCompleted` (`useAssessment.ts:47`) | `[]` | `completeInterview` (`useAssessment.ts:121-127`) from `03_Intake.tsx:396` | `03_Intake.tsx:347` |
| `interviewStatus` (`useAssessment.ts:48`) | `{}` | `completeInterview` sets `'submitted'` (`useAssessment.ts:126`); `setInterviewStatus` (`useAssessment.ts:128-129`) is never called | **no reader** |
| `providedRequests` (`useAssessment.ts:49`) | `[]` | `provideRequest` (`useAssessment.ts:130-135`) from `07_Remediation.tsx:138` | `07_Remediation.tsx:65` |
| `uploadedSlots` (`useAssessment.ts:50`) | `{}` | `uploadSlot` (`useAssessment.ts:136-142`) from `03_Intake.tsx:226`, `12_Tasks.tsx:61`; `uploadSlotsBulk` (`useAssessment.ts:143-149`) from `03_Intake.tsx:176` | `03_Intake.tsx:168`, `12_Tasks.tsx:10` |
| `overriddenControls` (`useAssessment.ts:51`) | `{}` | `overrideControl` (`useAssessment.ts:150-151`), `clearOverride` (`useAssessment.ts:152-157`) from `06_ControlDetail.tsx:351`, `06_ControlDetail.tsx:301` | `04_Dashboard.tsx:40`, `04_Dashboard.tsx:130`, `05_GapMatrix.tsx:33`, `06_ControlDetail.tsx:78`, `08_Export.tsx:85` |
| `profileChallenge` (`useAssessment.ts:53`) | `null` | `resolveProfileChallenge` (`useAssessment.ts:158`), `clearProfileChallenge` (`useAssessment.ts:159`) from `01_Profile.tsx:247`, `01_Profile.tsx:283`, `01_Profile.tsx:292`, `01_Profile.tsx:317` | `01_Profile.tsx:81`, `04_Dashboard.tsx:132` |
| `reviewedExclusions` (`useAssessment.ts:55`) | `[]` | **no writer** | **no reader** |
| `tourActive`, `tourStep` (`useAssessment.ts:58-59`) | `false`, `0` | `startTour` (`useAssessment.ts:112`), `endTour` (`useAssessment.ts:113`), `tourGoto` (`useAssessment.ts:114`) | `Tour.tsx:34-35`, `HelpPanel.tsx:11`, `WelcomeGate.tsx:23` |
| `navOpen` (`useAssessment.ts:61`) | `false` | `setNavOpen` (`useAssessment.ts:109`) from `Sidebar.tsx`, `TopBar.tsx:32`, `Tour.tsx` | `Sidebar.tsx:11`, `HelpPanel.tsx:12` |

`resetDemo` (`useAssessment.ts:120`) sets every `initial` field back (it does not touch `navOpen`). **`startTour` does the same reset** (`useAssessment.ts:110-112`: `set({ ...initial, tourActive: true, tourStep: 0 })`), so pressing `Guided tour` in the top bar (`TopBar.tsx:77-79`), `Start guided tour →` in the welcome modal (label `WelcomeGate.tsx:79`; handler `WelcomeGate.tsx:38-42`) or `Restart tour` (`Tour.tsx:322`) discards profile edits, role, uploads and overrides and persists that reset.

**Local component state (`useState`)** — not shared, lost on navigation: `Profile.justification`; `RequestPlan.showAll`, `.collector`; `Intake.tab`, `.activeRole`, `InterviewPanel.shown/.playing`, `BundlePanel.stage/.done/.lastFeedback`, `InterviewList.links/.sent`; `Dashboard.weighted`; `GapMatrix.open/.stateF/.evF/.gapF/.q/.onlyChanged/.onlyOverrides`; `ControlDetail.pending`; `Remediation.tab`, `AllActionsTab.sort`; `ExportScreen.open/.review/.prepared`; `Chat.thread`; `Exclusions.capF/.factF/.onlyUnjustified`; `TopBar.open`; `HelpPanel.open`; `Term.open/.above`; `EvidenceTrail.raw`; `AttackExposure.expanded`; `Tour.box/.ready/.ttSize`; `WelcomeGate.open`.

**URL state**: the route path (hash). Query parameters are read by `GapMatrix` (`useSearchParams`, `05_GapMatrix.tsx:31`; keys `cap`, `state`, `ev`, `gap`, `changed`, `overrides`, `05_GapMatrix.tsx:36-44`) which copies them into local state and then clears them with `setParams({}, { replace: true })` (`05_GapMatrix.tsx:59`); and by `Exclusions` (`cap`, `10_Exclusions.tsx:13-15`), which never clears them.

### F.2 Persistence

| Mechanism | Key | What | Where |
|---|---|---|---|
| `localStorage` via zustand `persist` | `jccp-assessment-v3` | Every store field except `tourActive`, `tourStep`, `navOpen` (`partialize`) — including `role`, `profile`, `evidenceUploaded`, `uploadedSlots`, `overriddenControls` (with justification text and `analystId`), `profileChallenge` | `src/store/useAssessment.ts:164-167`. No `storage`, `version` or `merge` option is passed; the library defaults apply: `localStorage` JSON storage and a shallow merge (`node_modules/zustand/middleware.js:472-473`, `node_modules/zustand/middleware.js:479`). The comment at `useAssessment.ts:161-163` says the key suffix was bumped because the profile shape changed |
| `localStorage` direct | `jccp-tour-seen` | `'1'` once the welcome modal has been dismissed | `src/tour/WelcomeGate.tsx:4-19` (wrapped in `try/catch`) |
| Cookies, `sessionStorage`, `IndexedDB` | — | none found (`grep -rnE "document\.cookie\|sessionStorage\|indexedDB"` over `src/` finds nothing) | — |

Everything else resets on reload (Gap Matrix filters, tab selections, chat thread, Dashboard weighting toggle, etc.).

### F.3 How data reaches the screen

1. **Static imports.** Screens import fixtures from `src/data/*` at module load (for example `04_Dashboard.tsx:19-27`). Nothing is loaded asynchronously, and there is no data-fetching library.
2. **Derivation helpers** in `src/lib/`: `scoring.ts` (`boundedScore`, `projectProvision`, `applyOverrides`, `ASSURANCE_LEVELS`), `coverage.ts` (`coverageBreakdown`, `completenessStatement`), `derive.ts` (`dashboardView`, `engineBuckets`, `engineStateOf`).
3. **The before/after switch** is one boolean. `evidenceUploaded` picks `TOTALS.after`/`TOTALS.before` (`derive.ts:12`, `coverage.ts:18`, `coverage.ts:29`), `controls[i].after`/`.before` (`controls.ts:210-212`), `capabilities[i].after`/`.before` (`04_Dashboard.tsx:329`, `05_GapMatrix.tsx:136`), and the gap-reason `after`/`before` columns (`04_Dashboard.tsx:158`).
4. **Overrides** enter in two places only: the Gap Matrix row state (`05_GapMatrix.tsx:65-68`) and `dashboardView` (`derive.ts:53-66`) — which adjusts the aggregate bucket counts, not the per-capability rows (`04_Dashboard.tsx:329-349` read the capability fixture directly) and not the donut/gap-reason/completeness figures (`TOTALS`-based).
5. **The profile** feeds `computeApplicable` on the Profile screen only (`01_Profile.tsx:87`). Every other screen reads `TOTALS.applicable` (557) or literals; `profile` elsewhere supplies only `orgName`, `sector`, `usesCloud`, `operatesCriticalInfrastructure`.

### F.4 What each interaction does

| Interaction | Handler | Effect |
|---|---|---|
| Change a Profile field / toggle | `setProfile` (`01_Profile.tsx:101-190`) | Store updates and persists. The Live-scoping count, N/A rate and unknown-scoped note recompute (`01_Profile.tsx:87-88`, `01_Profile.tsx:341-367`). No other screen's numbers change |
| Set `Cloud services` to `No` | `01_Profile.tsx:175` → `stage1Pending` (`01_Profile.tsx:89`) | Amber challenge card appears; `Continue to request plan` (`01_Profile.tsx:333`) is disabled (`01_Profile.tsx:327`) until a ≥ 12-character justification is confirmed (`01_Profile.tsx:281`) or cloud is restored |
| Confirm / restore the challenge | `01_Profile.tsx:283`, `01_Profile.tsx:291-292` | `profileChallenge` stored with `decidedBy` = role label and a timestamp |
| Switch role | `TopBar.tsx:62-65` → `setRole` | Sidebar items filter (`nav.ts:42`); `RoleGate` redirects if the current path is no longer allowed (`App.tsx:31-34`); Dashboard swaps to `ExecutiveDashboard` for `executive` (`04_Dashboard.tsx:136`). Persisted |
| Play / Skip an interview | `03_Intake.tsx:61-65`, `03_Intake.tsx:30-49` | Reveals turns every 650 ms; at the end `completeInterview` runs once (card pill turns `done`). Claims shown = `Math.round(shown/turns*claims)` |
| Generate scoped link | `03_Intake.tsx:460` | `scopedLinkFor` builds a `ScopedLink` with a random token (`collaboration.ts:34-39`); held in local state only |
| Upload one artifact slot | `03_Intake.tsx:225-228` | `uploadSlot` records the slot; Intake counters recompute (`03_Intake.tsx:192-195`). `evidenceUploaded` does **not** change |
| `Simulate collector bundle upload` | `03_Intake.tsx:204` (label), `03_Intake.tsx:175-178`, `03_Intake.tsx:180-189` | `uploadSlotsBulk` fills the 14 automated slots, then the 7 ingestion stages advance every 300 ms; after the last, the module ledger and banner appear and `uploadEvidence()` sets `evidenceUploaded = true` and `phase = 'assessed'` — every `uploaded` consumer switches to the `after` data |
| `Reveal on dashboard` | `03_Intake.tsx:331` | Navigates to `/dashboard` |
| Dashboard weighting toggle | `04_Dashboard.tsx:360-367` | Local flag; shows the risk-weight table (no effect on the interval) |
| Gap Matrix search / filters / checkboxes | `05_GapMatrix.tsx:89-123` | Local state; `useMemo` filters the 48 seeds (`05_GapMatrix.tsx:62-79`); group header numbers do not change |
| Open a control | `ControlRow.tsx:31` | Navigates to `/control/<id>` |
| Override a control | `06_ControlDetail.tsx:291-299` → modal (`06_ControlDetail.tsx:337-355`) | `overrideControl` stores `{ state, previousState, justification, analystId, timestamp }`; Dashboard interval/override banner recompute via `applyOverrides`; Gap Matrix row state changes; the OSCAL preview's `analyst-overrides` count changes |
| Clear override | `06_ControlDetail.tsx:301` | `clearOverride` deletes the record |
| Provide a requested artifact (Remediation tab 3) | `07_Remediation.tsx:138` | `provideRequest` appends the id; projected interval recomputes (`07_Remediation.tsx:71-77`). Persisted |
| Remediation sort pills | `07_Remediation.tsx:213-218` | Local state; re-ranks via `rank()` (`07_Remediation.tsx:198-203`) |
| Export: `Download package (.zip)` → `Prepare signed package` | `08_Export.tsx:159`, `08_Export.tsx:129`, `08_Export.tsx:226-229` | Sets local `prepared`; nothing is downloaded |
| Chat question button | `09_Chat.tsx:119-122`, `09_Chat.tsx:160-169` | Appends the canned Q and A to local `thread`; button disables |
| Exclusions filters | `10_Exclusions.tsx:19-28` | Local filter over the 19 rows |
| Contributor `Submit` | `12_Tasks.tsx:61` | `uploadSlot(artifact)` — the same store map the Intake screen reads; the task status then reads `submitted` (`12_Tasks.tsx:17`) |
| `Reset demo` | `TopBar.tsx:87-93` → `resetDemo` | All store fields back to `initial` (including `profile`, `role`) |
| Guided tour | `src/tour/Tour.tsx:79-149` | Navigates with `useNavigate` (`Tour.tsx:89`, `Tour.tsx:93`), opens/closes the mobile drawer (`Tour.tsx:107`), and performs real DOM clicks on elements found by `document.querySelector('[data-tour="…"]')` (`Tour.tsx:21`, `Tour.tsx:63-76`) — e.g. the `Play` and `Skip` buttons — which mutate the real store |

---

## G. Backend contract

**There is no backend, and no application code makes a network request.** Everything is local to the browser.

Evidence:

- A search of `src/` and `index.html` for `fetch(`, `XMLHttpRequest`, `axios`, `WebSocket`, `EventSource`, `sendBeacon`, `import.meta.env` and `process.env` returns no matches. The only `http` strings in `src/` are the display/clipboard text `https://jccp.ministry.local/respond/{token}` at `src/screens/03_Intake.tsx:442` and `03_Intake.tsx:448` — it is rendered and copied with `navigator.clipboard?.writeText`, never requested.
- `package.json:11-30` lists no HTTP client, query/cache library, or API SDK.
- `index.html:1-12` loads only `/src/main.tsx`; the font is bundled (`src/main.tsx:4`, comment `self-hosted — no CDN dependency (on-premise)`), and the built `dist/index.html` and `dist/assets/*.css` contain no `http`/`googleapis` references (checked after the production build).
- There are therefore no endpoints, request shapes, response shapes or error-handling paths to document.

**What stands in for a backend**

| Backend function the UI pretends to have | Stand-in | Where |
|---|---|---|
| Assessment data (controls, totals, evidence, ATT&CK, exclusions, interviews, rollup) | Static TypeScript fixtures imported at load | `src/data/*.ts` (Section D.1) |
| Scoring engine | Pure functions run in the browser over fixture counts | `src/lib/scoring.ts`, `src/lib/derive.ts`, `src/lib/coverage.ts` |
| "Before / after evidence" | One boolean selecting between two pre-written datasets | `src/store/useAssessment.ts:46`; `src/data/capabilities.ts:94`, `capabilities.ts:105`; `src/data/controls.ts:210-212` |
| Collector bundle upload and ingestion | A timer-driven animation (`setTimeout` 300 ms per stage) over `bundleStages`; no file is read | `src/screens/03_Intake.tsx:175-189`; text `Simulated; no file is parsed.` at `03_Intake.tsx:240` |
| Artifact slot upload | Writes a timestamp into the store | `src/store/useAssessment.ts:136-149` |
| Scripted interviews | Pre-written turns revealed on a timer (650 ms) | `src/screens/03_Intake.tsx:30-49`; `src/data/interviews.ts` |
| Chat / retrieval | Eight canned Q&A pairs; free text disabled | `src/screens/09_Chat.tsx:20-91`, `09_Chat.tsx:171-174` |
| OSCAL export, signing, validation | `JSON.stringify` of an in-memory object; constant hash and signing identity; `.json`/`.zip` buttons only set a flag | `src/screens/08_Export.tsx:8-9`, `08_Export.tsx:11-73`, `08_Export.tsx:87`, `08_Export.tsx:178`, `08_Export.tsx:198` |
| Collector download | Button sets a text message | `src/screens/02_RequestPlan.tsx:101-110` |
| Authentication and roles | A dropdown that sets `role` in the store; the label reads `Demo switcher — no authentication` | `src/components/layout/TopBar.tsx:46-73` |
| National rollup (other organisations' data) | Fixture | `src/data/remediation.ts:92-119` |
| Persistence | Browser `localStorage` | Section F.2 |
| Scoped respondent links | Random token string shown in the UI; no server route exists | `src/data/collaboration.ts:34-39` |

**Error handling that does exist (all client-side)**: unknown control id → `No such control.` (`src/screens/06_ControlDetail.tsx:84-92`); `localStorage` access wrapped in `try/catch` (`src/tour/WelcomeGate.tsx:7-12`, `WelcomeGate.tsx:14-18`); clipboard calls use optional chaining (`src/components/ui.tsx:110`, `src/screens/03_Intake.tsx:448`); unknown glossary key renders plain text (`src/tour/Term.tsx:17`); a tour step whose target element is missing logs `console.warn` and skips (`src/tour/Tour.tsx:125-132`). There is no React error boundary (`grep -rn "componentDidCatch\|ErrorBoundary" src` finds nothing — see L).

---

## H. Types and models

There is no runtime schema library (no `zod`, `yup`, `io-ts` or similar in `package.json:11-30`) and no JSON schema file; the models are TypeScript declarations only, checked by `tsc --noEmit` at build time (`package.json:8`). Definitions are reproduced below directly from the source files (extracted by line range, not retyped). Types that only describe UI plumbing (`NavItem`, `TourStep`, `TourAction`, chat `QA`/`Citation`, RBAC `FeatureRow`/`Perm`) are not assessment models and are not reproduced; they are at `src/components/layout/nav.ts:17-25`, `src/tour/steps.ts:6-34`, `src/screens/09_Chat.tsx:6-18`, `src/screens/11_Admin.tsx:8-17`.

### H.1 Control, state, evidence and gap vocabulary

**`src/data/controls.ts:7-18`**

```ts
export type ControlState = 'green' | 'yellow' | 'red' | 'grey' | 'unknown';
export type EvidenceClass = 'none' | 'testimonial' | 'artifact' | 'analyst_signed';
export type GapReason =
  | 'not_provided'
  | 'declined'
  | 'module_failed'
  | 'insufficient_permission'
  | 'unparseable'
  | 'stale'
  | 'insufficient_signal'
  | 'uncollectable_by_design'
  | 'not_requested';
```

**`src/data/controls.ts:20-25`**

```ts
export interface ControlSnapshot {
  state: ControlState;
  evidenceClass: EvidenceClass;
  gapReason?: GapReason;
  providedSignals: string[];
}
```

**`src/data/controls.ts:27-29`**

```ts
// Why a signal is (or isn't) negative-capable — the reason a control can be a Gap
// rather than Unknown (brief §Change 7).
export type EvidenceBasis = 'negative_capable' | 'by_rule' | 'judgement' | 'uncertainty';
```

**`src/data/controls.ts:45-71`**

```ts
export interface Control {
  id: string; // "JNCSF-102"
  num: number;
  description: string;
  capability: 'arch' | 'dev' | 'del' | 'ops' | 'found';
  iso: string[];
  isoNames: string[];
  nist: string[];
  nistNames: string[];
  requiredSignals: string[];
  attackKey?: string; // key into attackBridge
  deploymentSharePct?: number;
  exceptionPopulation?: string;
  populationNote?: string;
  /** how old the evidence for this control may be before it goes stale (days) */
  maxAgeDays: number;
  before: ControlSnapshot;
  after: ControlSnapshot;
  /** promoted / meaningfully changed by the evidence-bundle upload */
  changed: boolean;
  showcase?: boolean;
  /** why this control's evidence is or isn't negative-capable */
  evidenceBasis: EvidenceBasis;
  /** requires an organisational arrangement no module can observe — can reach Partial on
   *  documentary evidence, but never Compliant without analyst attestation */
  noConclusivePath?: boolean;
}
```

**`src/data/controls.ts:73-91`**

```ts
type Snap = [ControlState, EvidenceClass, GapReason?];

interface Seed {
  n: number;
  d: string;
  cap: Control['capability'];
  iso: string[];
  nist: string[];
  req: string[];
  before: Snap;
  after: Snap;
  changed?: boolean;
  attackKey?: string;
  share?: number;
  exception?: string;
  population?: string;
  showcase?: boolean;
  maxAge?: number;
}
```

**`src/data/controls.ts:217-222`**

```ts
export interface GapReasonRow {
  reason: GapReason;
  before: number;
  after: number;
  invariant?: boolean;
}
```

**`src/data/controls.ts:241-244`**

```ts
export interface EvidenceBasisRow {
  basis: EvidenceBasis;
  count: number;
}
```

### H.2 Capability and portfolio totals

**`src/data/capabilities.ts:5-27`**

```ts
export interface CapabilityStat {
  applicable: number;
  evidenced: number;
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  /** coverage percent, pre-computed and shown verbatim */
  coveragePct: number;
  /** compliance interval, pre-computed, [lower, upper] as percentages */
  interval: [number, number];
}

export interface Capability {
  id: 'arch' | 'dev' | 'del' | 'ops' | 'found' | 'natl';
  name: string;
  shortName: string;
  totalControls: number;
  /** national obligation — structurally unassessable at org level */
  organisationallyAssessable: boolean;
  before?: CapabilityStat;
  after?: CapabilityStat;
}
```

The `TOTALS` object has no declared type; its inferred shape is the literal:

**`src/data/capabilities.ts:90-117`**

```ts
export const TOTALS = {
  totalControls: 576,
  notApplicable: 19,
  applicable: 557,
  before: {
    evidenced: 350,
    green: 245,
    yellow: 66,
    red: 39,
    unknown: 207,
    coveragePct: 62.8,
    interval: [49.9, 87.1] as [number, number],
    widthPts: 37.2,
    assurance: 'L1',
  },
  after: {
    evidenced: 498,
    green: 345,
    yellow: 99,
    red: 54,
    unknown: 59,
    coveragePct: 89.4,
    interval: [70.8, 81.4] as [number, number],
    widthPts: 10.6,
    assurance: 'L2',
    gapsClosed: 148,
  },
};
```

### H.3 Organisation profile, scoping, request plan, module ledger

**`src/data/scenario.ts:8-8`**

```ts
export type Ternary = 'yes' | 'no' | 'unknown';
```

**`src/data/scenario.ts:10-39`**

```ts
export interface OrgProfile {
  orgName: string;
  /** sector id — see data/sectors.ts. Drives the regulator label. */
  sector: string;
  sizeBand: string;
  endpoints: number;
  servers: number;
  users: number;
  hostingModel: 'gov-private-cloud' | 'own-datacentre' | 'third-party-jordan' | 'foreign-cloud';
  namedAttestation: string;
  /** The five measured JNCSF applicability variables (38 controls gated in total). */
  inHouseDevelopment: Ternary;
  outsourcedDevelopment: Ternary;
  mobileDevices: Ternary;
  wirelessNetwork: Ternary;
  remoteAccess: Ternary;
  /** NOT a JNCSF scoping condition — cloud is governed separately by the MoDEE cloud
   *  policy, so this never changes the applicable count. Kept only to drive the
   *  profile-challenge demo (a declaration the system cross-checks against evidence). */
  usesCloud: Ternary;
  /** subjects the org to CICSC (405 controls) in addition to JNCSF — separate framework,
   *  NOT a JNCSF applicability condition, so it does not change the 557 count. */
  operatesCriticalInfrastructure: boolean;
  pdplHoldings: {
    health: boolean;
    biometric: boolean;
    financial: boolean;
    religiousOrPolitical: boolean;
  };
}
```

**`src/data/scenario.ts:76-83`**

```ts
export interface ProfileDelta {
  key: keyof OrgProfile;
  label: string;
  /** delta applied when the toggle is in scope ('yes' or 'unknown') */
  inScopeDelta: number;
  /** delta applied when the toggle is an explicit 'no' */
  noDelta: number;
}
```

**`src/data/scenario.ts:126-139`**

```ts
export type CollectionMethod = 'automated' | 'manual';

export interface RequestArtifact {
  artifact: string;
  source: string;
  controlsUnlocked: number;
  effort: string;
  command: string;
  method: CollectionMethod;
  owner: string;
  formatHint: string;
  /** controls left permanently Unknown if this artifact is declined */
  declineCost?: number;
}
```

**`src/data/scenario.ts:181-190`**

```ts
export type ModuleStatus = 'success' | 'partial' | 'failed' | 'declined';

export interface ModuleResult {
  module: string;
  status: ModuleStatus;
  detail: string;
  records?: number;
  /** may this module produce a negative (Red) finding? only when status === 'success' */
  negativeCapable: boolean;
}
```

### H.4 Store types (roles, phases, overrides, challenge decisions, uploads, the store itself)

**`src/store/useAssessment.ts:6-8`**

```ts
export type Phase = 'profile' | 'planning' | 'intake' | 'assessed';

export type Role = 'owner' | 'analyst' | 'executive' | 'contributor' | 'regulator';
```

**`src/store/useAssessment.ts:18-39`**

```ts
/** An analyst override — never a silent state swap. Carries its own audit trail. */
export interface OverrideRecord {
  state: ControlState;
  previousState: ControlState;
  justification: string;
  analystId: string;
  timestamp: string;
}

/** A scoping-challenge decision. Recorded, not just a boolean. */
export interface ChallengeDecision {
  decision: 'confirmed' | 'restored';
  justification: string;
  decidedBy: string;
  decidedAt: string;
}

/** Uploaded evidence slot state (typed intake). */
export interface SlotUpload {
  artifact: string;
  acceptedAt: string;
}
```

**`src/store/useAssessment.ts:41-83`**

```ts
interface AssessmentState {
  phase: Phase;
  role: Role;
  profile: OrgProfile;
  /** the single flag that flips the whole before/after transformation */
  evidenceUploaded: boolean;
  interviewsCompleted: string[]; // role ids
  interviewStatus: Record<string, 'not started' | 'in progress' | 'submitted' | 'under review' | 'accepted'>;
  providedRequests: string[]; // evidence-request ids (Remediation Tab B simulation)
  uploadedSlots: Record<string, SlotUpload>; // typed intake slots, keyed by artifact name
  overriddenControls: Record<string, OverrideRecord>;
  /** cloud scoping challenge — null until the user decides */
  profileChallenge: ChallengeDecision | null;
  /** exclusions the user has opened / acknowledged (demo affordance) */
  reviewedExclusions: string[];

  /** guided-tour overlay — ephemeral, never persisted */
  tourActive: boolean;
  tourStep: number;
  /** mobile nav drawer — ephemeral, never persisted */
  navOpen: boolean;

  setPhase: (p: Phase) => void;
  setRole: (r: Role) => void;
  startTour: () => void;
  endTour: () => void;
  tourGoto: (n: number) => void;
  setNavOpen: (v: boolean) => void;
  setProfile: (patch: Partial<OrgProfile>) => void;
  setPdpl: (patch: Partial<OrgProfile['pdplHoldings']>) => void;
  uploadEvidence: () => void;
  resetEvidence: () => void;
  resetDemo: () => void;
  completeInterview: (id: string) => void;
  setInterviewStatus: (id: string, s: AssessmentState['interviewStatus'][string]) => void;
  provideRequest: (id: string) => void;
  uploadSlot: (artifact: string) => void;
  uploadSlotsBulk: (artifacts: string[]) => void;
  overrideControl: (id: string, rec: OverrideRecord) => void;
  clearOverride: (id: string) => void;
  resolveProfileChallenge: (decision: ChallengeDecision) => void;
  clearProfileChallenge: () => void;
}
```

### H.5 Score and coverage results

**`src/lib/scoring.ts:17-23`**

```ts
export interface BoundedScore {
  lower: number;
  upper: number;
  coverage: number;
  width: number;
  confidence: number;
}
```

**`src/lib/scoring.ts:88-94`**

```ts
export interface Buckets {
  applicable: number;
  green: number;
  yellow: number;
  red: number;
  unknown: number;
}
```

**`src/lib/coverage.ts:6-12`**

```ts
export interface CoverageBreakdown {
  evidenced: number; // artifact-backed (green + red)
  testimonyOnly: number;
  unevidenced: number;
  uncollectable: number;
  applicable: number;
}
```

**`src/lib/derive.ts:28-34`**

```ts
export interface DashboardFigures {
  buckets: Buckets;
  lowerPct: number;
  upperPct: number;
  coveragePct: number;
  widthPts: number;
}
```

**`src/lib/derive.ts:47-51`**

```ts
export interface DashboardView {
  engine: DashboardFigures;
  effective: DashboardFigures;
  overridesActive: number;
}
```

### H.6 Evidence, exclusions, interviews, remediation, risk weighting, ATT&CK, sectors, collaboration

**`src/data/evidence.ts:5-18`**

```ts
export type EvidenceType = 'testimonial' | 'artifact';

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  /** verbatim quote (testimonial) or artifact locator (artifact) */
  locator: string;
  quote?: string;
  sha256: string; // truncated display hash
  source: string;
  timestamp: string;
  module?: string;
  raw?: string; // plausible raw output for the "View raw" modal
}
```

**`src/data/exclusions.ts:7-16`**

```ts
export interface Exclusion {
  id: string;
  description: string;
  capability: 'arch' | 'dev' | 'del' | 'ops' | 'found';
  /** the profile fact that removed it from scope */
  triggeredBy: string;
  triggerFact: string; // machine-readable-ish, for filtering
  /** recorded rationale — empty string means UNJUSTIFIED (flagged) */
  justification: string;
}
```

**`src/data/interviews.ts:3-25`**

```ts
export type Turn = { who: 'agent' | 'user'; text: string };

export interface ExtractedClaim {
  text: string;
  confidence: number;
  /** every testimonial claim is capped at Yellow — never Green */
  cappedAtYellow: true;
  relatedControls: string[];
  note?: string;
}

export interface InterviewRole {
  id: 'exec' | 'operator' | 'defender';
  title: string;
  persona: string;
  turns: Turn[];
  claims: ExtractedClaim[];
  /** shown for the operator when the CrowdStrike line lands (Coverage Fallacy) */
  coverageFallacy?: {
    naive: string;
    refined: string[];
  };
}
```

**`src/data/remediation.ts:4-12`**

```ts
export interface RemediationAction {
  id: string;
  action: string;
  controlsClosed: number;
  controlIds: string[];
  removesExposureTo: string[]; // ATT&CK technique IDs
  effort: 'low' | 'medium' | 'high';
  affectedAssets: string;
}
```

**`src/data/remediation.ts:71-77`**

```ts
export interface EvidenceRequest {
  id: string;
  artifact: string;
  source: string;
  controlsUnlocked: number;
  command: string;
}
```

**`src/data/riskWeighting.ts:6-12`**

```ts
export interface RiskWeightRow {
  basis: string;
  controls: number;
  weight: number;
  /** true for the row of controls with no NIST correspondence at all */
  underived?: boolean;
}
```

**`src/data/attack.ts:17-31`**

```ts
export interface AttackTechnique {
  id: string;
  name: string;
}

export type AttackSource = 'official' | 'derived';

export interface AttackEntry {
  mitigation: string;
  mitigationName: string;
  /** ordered highest-confidence first — the UI shows the top few and collapses the rest */
  techniques: AttackTechnique[];
  source: AttackSource;
  sourceLabel: string;
}
```

**`src/data/sectors.ts:8-15`**

```ts
export interface Sector {
  id: string;
  /** Arabic source label, verbatim from the NCSC sector designation document */
  arabicLabel: string;
  label: string;
  /** empty string = not designated by either source document */
  regulator: string;
}
```

**`src/data/collaboration.ts:4-13`**

```ts
export type ReviewStatus = 'not started' | 'in progress' | 'submitted' | 'under review' | 'accepted';

export interface ReviewRow {
  roleId: string; // interview role id
  roleTitle: string;
  assignee: string;
  status: ReviewStatus;
  submittedAt?: string;
  conflict?: string;
}
```

**`src/data/collaboration.ts:27-32`**

```ts
export interface ScopedLink {
  roleId: string;
  token: string;
  scopeLabel: string;
  expiresInDays: number;
}
```

**`src/data/collaboration.ts:42-49`**

```ts
export interface ContributorTask {
  id: string;
  title: string;
  artifact: string;
  due: string;
  status: 'to do' | 'submitted' | 'accepted' | 'changes requested';
  note?: string;
}
```

The shape of `nationalRollup` (`src/data/remediation.ts:92-119`) and the `ASSURANCE_LEVELS` array (`src/lib/scoring.ts:117-122`, `as const`) are also declared by their literals only; both are reproduced in Sections D.15 and E.1.

---

## I. Styling

### I.1 Where the design tokens are defined

- **Tailwind theme extension** — `tailwind.config.js:4-31`. Scans `./index.html` and `./src/**/*.{ts,tsx}` (`tailwind.config.js:3`). No plugins (`tailwind.config.js:33`). This is the only token source.
- **Global stylesheet** — `src/index.css` (44 lines): Tailwind layers (`index.css:1-3`); `:root { color-scheme: light; }` (`index.css:5-7`); `html, body, #root { height: 100% }` (`index.css:9-13`); `body` background `#f1f5f9`, colour `#0f172a`, font stack `'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif`, antialiasing (`index.css:15-21`); `.tnum` (`font-variant-numeric: tabular-nums`, `index.css:23-25`); `.scroll-slim` thin scrollbars, thumb `#cbd5e1` (`index.css:27-35`); `@keyframes pulse-ring` and `.pulse-ring` (`index.css:37-44`, rgba of `#1d4ed8`).
- **No CSS custom properties are defined**: the only `:root` rule sets `color-scheme` (`src/index.css:5-7`). No CSS modules, styled-components, Sass, or `cn()`/`clsx` helper exist. There are no `dark:` classes anywhere in `src/` and `color-scheme` is fixed to `light`.
- **Component-level theme data in TypeScript**: `STATE_META` (`src/components/StateBadge.tsx:6-15`, hex values) and the `tones` map of `Pill` (`src/components/ui.tsx:43-50`) and `variants` map of `Button` (`ui.tsx:84-89`).

### I.2 Palette defined in `tailwind.config.js`

| Token | Hex | Defined at | Used in `src/`? |
|---|---|---|---|
| `ink-900` | `#0b1220` | `tailwind.config.js:8` | yes — sidebar background (`src/components/layout/Sidebar.tsx:31`) |
| `ink-800` | `#111a2e` | `tailwind.config.js:9` | yes — `Sidebar.tsx:45`, `Sidebar.tsx:52`, `Sidebar.tsx:67` |
| `ink-700` | `#1c2740` | `tailwind.config.js:10` | yes — `Sidebar.tsx:67` (active item), `Sidebar.tsx:78`, `Sidebar.tsx:82` (borders as `border-ink-700`) |
| `ink-600` | `#2b3a5c` | `tailwind.config.js:11` | no usage found |
| `accent` (DEFAULT) | `#1d4ed8` | `tailwind.config.js:14` | yes — 87 token-class uses (accent or ink) across 21 files (`text-accent` 38, `bg-accent` 17, `border-accent` 8, `bg-accent/10` 8, …); signifies the primary action, the active/selected item, and the interval band |
| `accent-fg` | `#1e3a8a` | `tailwind.config.js:15` | no usage found |
| `accent-soft` | `#dbeafe` | `tailwind.config.js:16` | no usage found |
| `state-green` | `#059669` | `tailwind.config.js:19` | no class usage found; the same hex is hardcoded for the donut (`04_Dashboard.tsx:147`) |
| `state-yellow` | `#d97706` | `tailwind.config.js:20` | no class usage found; same hex at `04_Dashboard.tsx:148` |
| `state-red` | `#dc2626` | `tailwind.config.js:21` | no usage found anywhere |
| `state-grey` | `#64748b` | `tailwind.config.js:22` | no class usage found; same hex at `04_Dashboard.tsx:150` |
| `state-unknown` | `#7c3aed` | `tailwind.config.js:23` | no class usage found; same hex at `04_Dashboard.tsx:149`, `04_Dashboard.tsx:495` |

(Usage counts are from `grep -rhoE "\b(bg|text|border|ring|…)-(accent|ink|state)…" src`. Tailwind-generated CSS was not inspected for purged classes.)

**What colours signify in the code** — Tailwind's *default* palette is what screens actually use for meaning (666 default-palette class occurrences vs 87 custom-token occurrences, same grep method):

| Colour family | Meaning as used (examples) |
|---|---|
| emerald / green | Compliant, success, accepted, verified, positive evidence: `STATE_META.green` (`StateBadge.tsx:10`), `Pill tone="green"` (`ui.tsx:48`), module `success` (`03_Intake.tsx:158`), `verified` (`13_Rollup.tsx:107`), `Sidebar` evidence-loaded badge (`Sidebar.tsx:85`) |
| amber | Partial, warning, testimony-only, caution banners: `STATE_META.yellow`, `showcase` pill (`ControlRow.tsx:52`), the demo banner (`App.tsx:44`), `Testimony only` pill (`03_Intake.tsx:137`), `under review`, module `partial` |
| red | Gap, failure, danger, exposure: `STATE_META.red`, module `failed`, `changes requested` (`12_Tasks.tsx:45`), technique cards when not enforced (`AttackExposure.tsx:73`), `Button variant="danger"` (`ui.tsx:88`), contradiction banners |
| violet | Unknown, gap reasons, analyst-signed/override, "Don't know": `STATE_META.unknown`, gap-reason pill (`ControlRow.tsx:45`), `analyst_signed` tone (`ControlRow.tsx:14`), `Don't know` button (`01_Profile.tsx:54`) |
| blue | Information, testimonial evidence, mitigation cards, `promoted`: `Pill tone="blue"`, `Testimonial` tone (`ControlRow.tsx:14`), mitigation card (`AttackExposure.tsx:42`); the brand `accent` is a separate blue token |
| slate | Neutral text, borders, `N/A`, not-started, uncollectable: `STATE_META.grey`, page text/borders throughout |

### I.3 Hardcoded colours that bypass the token system

| File:line | Value(s) | Purpose |
|---|---|---|
| `src/components/StateBadge.tsx:10-14` | `#047857 #ecfdf5 #a7f3d0`, `#b45309 #fffbeb #fde68a`, `#b91c1c #fef2f2 #fecaca`, `#475569 #f1f5f9 #cbd5e1`, `#6d28d9 #f5f3ff #ddd6fe` | Text/background/border for the five control states; applied with inline `style` (`StateBadge.tsx:29`). None equals the `state.*` tokens |
| `src/screens/04_Dashboard.tsx:147-150` | `#059669`, `#d97706`, `#7c3aed`, `#64748b` | Coverage donut segment fills |
| `src/screens/04_Dashboard.tsx:495` | `#94a3b8`, `#7c3aed` | Gap-reason bar fills (invariant row vs others) |
| `src/screens/13_Rollup.tsx:51` | `#047857`, `#1d4ed8`, `#94a3b8` | L3 / L2 / L1 bar segments |
| `src/tour/Tour.tsx:270` | `rgba(29,78,216,0.25)` | Spotlight ring shadow (the `accent` colour in rgb) |
| `src/index.css:17-18` | `#f1f5f9`, `#0f172a` | Body background and text |
| `src/index.css:33` | `#cbd5e1` | Scrollbar thumb |
| `src/index.css:38-40` | `rgba(29, 78, 216, 0.4)`, `rgba(29, 78, 216, 0)` | `pulse-ring` keyframes |
| `src/components/CoverageBar.tsx:18`, `CoverageBar.tsx:29` | colours passed in via props (`Seg.colour`) | unused component |
| Hover blues | `hover:bg-blue-700` / `text-blue-700` used for accent hover instead of a token: `ui.tsx:85`, `TopBar.tsx:79`, `01_Profile.tsx:346`, `Tour.tsx:329`, `WelcomeGate.tsx:77` | — |
| `text-white`, `bg-white` | 21 and 24 occurrences | no `white` token |

Inline `style={{…}}` is otherwise used only for geometry (percent widths/positions) in `ScoreInterval.tsx`, `Tour.tsx`, `13_Rollup.tsx`, `04_Dashboard.tsx:71`.

### I.4 Typography

- Family: Inter Variable, self-hosted via `@fontsource-variable/inter` (`src/main.tsx:4`); Tailwind `sans` = `Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif` (`tailwind.config.js:27`); `mono` = `ui-monospace, SFMono-Regular, Menlo, monospace` (`tailwind.config.js:28`), used by `font-mono` (24 occurrences) for ids, codes and commands.
- Sizes in use (occurrence counts across `src/`): arbitrary pixel sizes `text-[11px]` 104, `text-[12px]` 34, `text-[10px]` 22, `text-[13px]` 7; Tailwind scale `text-sm` 116, `text-xs` 40, `text-lg` 7, `text-2xl` 6, `text-xl` 2, `text-base` 2, `text-3xl` 2, `text-4xl` 1.
- Weights: `font-semibold` 103, `font-bold` 50, `font-medium` 16, `font-normal` 3.
- Numerals: the `.tnum` class (`src/index.css:23-25`) is added to numeric elements. `fontVariantNumeric: ['tabular-nums']` at `tailwind.config.js:30` sits under `theme.extend`; whether Tailwind generates anything from it — **could not determine** (I did not inspect generated CSS for it).
- Headings in practice: page title `h1` `text-sm … sm:text-base font-semibold` (`TopBar.tsx:39`); screen headers `h2` `text-lg font-bold` (e.g. `02_RequestPlan.tsx:79`); card titles `h3` `text-sm font-semibold` (`ui.tsx:23`).

### I.5 Spacing, shape, layout

- Spacing is Tailwind's default scale; recurring values: page container `mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6` (`App.tsx:48`); card body `p-5` (`ui.tsx:29`), card header `px-5 py-3.5` (`ui.tsx:21`); vertical stacks `space-y-5`/`space-y-6`.
- Radii: `rounded-lg` 70, `rounded-md` 27, `rounded-xl` 16, `rounded` 13, `rounded-full` 11, `rounded-2xl` 4, `rounded-sm` 5. Cards use `rounded-xl border border-slate-200 bg-white shadow-sm` (`ui.tsx:19`).
- Breakpoints are Tailwind defaults (`sm` 640, `lg` 1024): the sidebar becomes a drawer below `lg` (`Sidebar.tsx:31`); `Tour.tsx:223` switches to a docked card below 640 px.
- Page frame: fixed-height flex layout `flex h-screen overflow-hidden` with the content area scrolling (`App.tsx:40`, `App.tsx:47`).

### I.6 How a new component picks these up (as the code does it — no written convention exists in the repository)

1. Import layout primitives from `src/components/ui.tsx` (`Card`, `Pill`, `SectionLabel`, `Button`, `CodeBlock`) — every screen does.
2. Render control states with `StateBadge`, which reads its colours from `STATE_META`, not from the Tailwind `state.*` tokens.
3. Style everything else with inline Tailwind utility classes in the JSX; brand colour via the `accent` token, neutrals via `slate-*`, status tones via Tailwind's default `emerald/amber/red/violet/blue` palettes.
4. Use `font-mono` for identifiers, `.tnum` for numbers, and `data-tour="…"` attributes only if the guided tour must find the element (`src/tour/Tour.tsx:21`).

---

## J. Tests, linting, CI

| Item | Finding | Evidence |
|---|---|---|
| Unit / integration / e2e tests | **None.** No test files are tracked (`git ls-files` matches no `test`/`spec` path); `package.json` has no `test` script and no test dependency (Vitest, Jest, Testing Library, Playwright, Cypress are absent) | `package.json:6-30` |
| Linting | **No ESLint or Prettier configuration or dependency exists** (no `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, and no `eslint`/`prettier` in `package.json`). Three `// eslint-disable-next-line …` comments exist in the source and refer to rules (`no-console`, `react-hooks/exhaustive-deps`) that nothing in the repo enforces | `src/tour/Tour.tsx:127`, `Tour.tsx:148`; `src/screens/07_Remediation.tsx:76` |
| Type checking | `tsc --noEmit` is the first half of `npm run build`; `strict: true`; `noUnusedLocals` and `noUnusedParameters` are `false` (so unused code is not an error) | `package.json:8`; `tsconfig.json:15-17` |
| Formatting | No formatter configured; `.gitattributes` normalises line endings to LF | `.gitattributes:1` |
| Did the available check pass? | Yes — `tsc --noEmit` and `vite build` both exited `0` (Section A.5). There is nothing else to run | — |
| CI | One GitHub Actions workflow, `Deploy to GitHub Pages`: on push to `main`/`master` and manual dispatch → `actions/checkout@v4`, Node `20` with npm cache, `npm ci`, `npm run build`, upload `dist`, `actions/deploy-pages@v4`. It runs no tests or linters beyond the type-check inside the build. I did not run the workflow | `.github/workflows/deploy.yml:1-40` |
| Pre-commit hooks / other automation | None found in tracked files (`.claude/launch.json` only defines a dev-server launch config) | `.claude/launch.json:1-11` |

---

## K. Dependencies

### K.1 Direct dependencies (`package.json`; installed versions from `package-lock.json`)

| Package | Range (`package.json`) | Locked | Used for | Used? |
|---|---|---|---|---|
| `react` | `^18.3.1` (`package.json:15`) | `18.3.1` | UI | yes |
| `react-dom` | `^18.3.1` (`package.json:16`) | `18.3.1` | Rendering (`src/main.tsx:2`) | yes |
| `react-router-dom` | `^6.26.0` (`package.json:17`) | `6.30.6` | `HashRouter`, `Routes`, `NavLink`, `useSearchParams` | yes |
| `zustand` | `^4.5.4` (`package.json:19`) | `4.5.7` | Global store with `persist` (`src/store/useAssessment.ts:1-2`) | yes |
| `recharts` | `^2.12.7` (`package.json:18`) | `2.15.4` | Donut and horizontal bar chart in `src/screens/04_Dashboard.tsx:3-14` only | yes |
| `framer-motion` | `^11.3.19` (`package.json:13`) | `11.18.2` | Layout/enter animations (`ScoreInterval`, `CoverageBar`, `ControlRow`, several screens) | yes |
| `lucide-react` | `^0.427.0` (`package.json:14`) | `0.427.0` | Icons | yes |
| `@fontsource-variable/inter` | `^5.3.0` (`package.json:12`) | `5.3.0` | Self-hosted font (`src/main.tsx:4`) | yes |

### K.2 Dev dependencies

| Package | Range | Locked | Used for |
|---|---|---|---|
| `vite` (`package.json:29`) | `^5.4.0` | `5.4.21` | Dev server and bundler (`vite.config.ts`) |
| `@vitejs/plugin-react` (`package.json:24`) | `^4.3.1` | `4.7.0` | JSX transform (`vite.config.ts:7`) |
| `typescript` (`package.json:28`) | `^5.5.4` | `5.9.3` | Type checking (`tsc --noEmit`) |
| `tailwindcss` (`package.json:27`) | `^3.4.10` | `3.4.19` | Styling (`tailwind.config.js`) |
| `postcss` (`package.json:26`), `autoprefixer` (`package.json:25`) | `^8.4.41`, `^10.4.20` | `8.5.28`, `10.5.5` | CSS pipeline (`postcss.config.js:1-6`) |
| `@types/react` (`package.json:22`), `@types/react-dom` (`package.json:23`) | `^18.3.3`, `^18.3.0` | `18.3.31`, `18.3.7` | Types |

### K.3 Installed but unused, and dead exports

- **No direct dependency is unused**: each of the 8 runtime and 9 dev packages above is referenced by source or config.
- **Declared but not wired up**: `tsconfig.json:19-20` defines the path alias `@/*` → `src/*`, but `vite.config.ts` defines no `resolve.alias` and no source file imports `@/…` (`grep -rn "from '@/" src` finds nothing).
- **Tailwind tokens defined but unused**: `ink-600`, `accent-fg`, `accent-soft`, `state-green/yellow/red/grey/unknown` (Section I.2).
- **Exports with no reference anywhere else in `src/`** (found by scanning every `export` for its name; "own refs" = uses inside the defining file):
  - Components: `Kbd` (`src/components/ui.tsx:103`), `CoverageBar` (`src/components/CoverageBar.tsx:10`).
  - Functions/values never called: `interviewById` (`src/data/interviews.ts:90`), `regulatorForSector` (`src/data/sectors.ts:38`), `yellowWeightForShare` (`src/lib/scoring.ts:9`), `pct` (`src/lib/scoring.ts:43`), `pts` (`src/lib/scoring.ts:44`). `YELLOW_QUARTILE` (`scoring.ts:6`) is referenced only by the never-called `yellowWeightForShare`.
  - Store members: `setInterviewStatus` (`useAssessment.ts:128`), `resetEvidence` (`useAssessment.ts:119`), field `interviewStatus` (`useAssessment.ts:48`), field `reviewedExclusions` (`useAssessment.ts:55`) have no callers/readers outside the store.
  - Exported only as types or consumed within their own file: `NavItem`, `AttackTechnique`, `AttackSource`, `CapabilityStat`, `ReviewStatus`, `ReviewRow`, `ContributorTask`, `EvidenceBasis`, `GapReasonRow`, `EvidenceBasisRow`, `EvidenceType`, `Exclusion`, `Turn`, `ExtractedClaim`, `RemediationAction`, `EvidenceRequest`, `RiskWeightRow`, `ProfileDelta`, `CollectionMethod`, `ModuleResult`, `BoundedScore`, `CoverageBreakdown`, `DashboardFigures`, `DashboardView`, `ChallengeDecision`, `SlotUpload`, `GlossaryEntry`, `ScreenHelp`, `SCREEN_HELP`, `PROFILE_DELTAS`, `BASELINE_APPLICABLE`, `NO_REGULATOR_LABEL`, `ISO_NAMES`, `NIST_NAMES`, `WEIGHTS`, `engineBuckets`, `evidenceByControl`, `tourSeen`, `markTourSeen`.
- **Fixture fields never read by the UI** are in D.1.

### K.4 Possibly abandoned or out of date — only what the tooling reported

- **Recharts**: `npm ci` printed `npm warn deprecated recharts@2.15.4: 1.x and 2.x branches are no longer active. Bump to Recharts v3 to receive latest features and bugfixes.` — locked `2.15.4`, `npm outdated` reports latest `3.10.1`.
- `npm audit` (run after install) reported **12 vulnerabilities (5 moderate, 7 high, 0 critical)**: direct — `vite` (high), `tailwindcss` (high), `react-router-dom` (moderate); transitive — `braces`, `chokidar`, `fast-glob`, `micromatch`, `source-map-js` (high); `esbuild`, `postcss-nested`, `postcss-selector-parser`, `react-router` (moderate). Fix suggestions offered by npm are semver-major bumps (`vite` 8.3.4, `tailwindcss` 4.3.3, `react-router-dom` 7.18.4). I did not apply any.
- `npm outdated` (current → latest): `react`/`react-dom` 18.3.1 → 19.3.1; `react-router-dom` 6.30.6 → 7.18.4; `vite` 5.4.21 → 8.3.4; `tailwindcss` 3.4.19 → 4.3.3; `typescript` 5.9.3 → 7.0.2; `framer-motion` 11.18.2 → 14.3.0; `lucide-react` 0.427.0 → 1.58.0; `zustand` 4.5.7 → 5.0.15; `@vitejs/plugin-react` 4.7.0 → 6.1.2; `@types/react*` 18.x → 19.3.0.
- Whether any package is *abandoned* (no recent releases) — **could not determine**: I did not check publish dates. Only the Recharts deprecation notice above is an explicit signal.

---

## L. What I could not determine, and what is dead, ambiguous or contradictory

### L.1 Limits of this inventory (read first)

- **I never ran the app in a browser.** I ran `npm ci` and `npm run build` (both succeeded) and I executed the repository's own data and `src/lib` functions under Node to obtain computed values (those results are labelled "computed" where used). Everything about what renders — layout, animation, Recharts tooltips, the guided tour's DOM clicking, how `ScoreInterval` looks when `lower > upper` — comes from reading the code, not from observing it.
- The generated CSS and JS bundles were not inspected beyond file sizes and a search for external URLs.
- I did not read `package-lock.json` in full (only the entries listed in Section A and K), and I did not analyse the three pre-existing prose documents beyond searching them for the statements quoted in L.5.
- `node_modules/` and `dist/` now exist on disk because the install and build were run; both are untracked (`.gitignore:1-2`).

### L.2 Facts the code does not let me establish

| Item | What I looked at | Why it is unresolved |
|---|---|---|
| Required Node version | `package.json` (no `engines`), `.github/workflows/deploy.yml:24` (`node-version: 20`) | Only CI's choice is stated; this session ran Node `v22.22.0` |
| Source and correctness of the fixture figures (`557`, `576`, `38`, `93%`, the per-capability counts, `115` signals, `66`/`7` authored controls, `203`/`35.2%` ATT&CK coverage, risk-weight table, …) | Comments in `src/data/*.ts` cite `brief §…` and `measured` tables (e.g. `src/data/capabilities.ts:1-3`, `capabilities.ts:86-89`; `src/data/controls.ts:1-3`, `controls.ts:214`) | The "brief" those comments refer to is not in the repository. I verified internal arithmetic only (D.6, L.3) — not agreement with any real framework |
| Whether the 48 control descriptions, ISO and NIST mappings are accurate | `src/data/controls.ts:100-153`, `src/data/standards.ts` | `controls.ts:1-2` says `verbatim from the NCSC Activity & Control Mapping`; the source document is not in the repository |
| How `RISK_WEIGHTED_TOTALS` (`331.4`, `498.4`) and `WEIGHTED_WIDTH_PTS` (`14.9`) were obtained | `src/data/riskWeighting.ts:14-40` | They are literals. Summing the table in the same file (`controls × weight`) over its 576 controls gives `341.4` (non-underived rows) and `514.4` (all rows), not `331.4`/`498.4`. The file says the totals are `For this ministry profile` (`riskWeighting.ts:25`); the method is not given |
| What `PDPL Art. 2023` refers to | `src/screens/09_Chat.tsx:63`, `09_Chat.tsx:68` | The string appears in a canned answer and citation; nothing in the repository defines it |
| Whether `fontVariantNumeric: ['tabular-nums']` produces any CSS | `tailwind.config.js:30`; `src/index.css:23-25` | Generated CSS not inspected (the `.tnum` class is what the components use) |
| Which packages are abandoned | `npm outdated`/`npm audit` output only (K.4) | Publish dates were not checked |
| Intended meaning of `NavItem.step` values `1,2,3,4,5,5,3,7,8,8,9,9` | `src/components/layout/nav.ts:28-39` | Nothing reads `step`; numbering has no `6` and repeats `3`, `5`, `8`, `9` |
| Intended role of `Appliance Admin` | `src/screens/11_Admin.tsx:10`, `11_Admin.tsx:72-74` | Appears in the RBAC matrix but is not a value of `Role` (`src/store/useAssessment.ts:8`) and has no screen |
| Whether the `useEffect` in `InterviewPanel` (which lists the inline `onComplete` closure created at `src/screens/03_Intake.tsx:396` among its dependencies, `03_Intake.tsx:39`) misbehaves at runtime | Read only | Not run |

### L.3 Contradictions between numbers and statements inside the prototype

Each item is two or more places in this repository that disagree or are independent. No judgement is made about which is right.

1. **`90` vs `148` vs `25`.** The Dashboard says the bundle `closed 90 evidence gaps` (`src/screens/04_Dashboard.tsx:232`) and links `See the 90 promoted controls in the Gap Matrix` (`04_Dashboard.tsx:526`); the Intake banner says `148 evidence gaps closed` (`src/screens/03_Intake.tsx:326`; `TOTALS.before.unknown − TOTALS.after.unknown = 207 − 59 = 148`, `capabilities.ts:99`/`capabilities.ts:110`, and `gapsClosed: 148` at `capabilities.ts:115`); the Gap Matrix filter that `?changed=1` opens lists the seeded controls with `changed: true`, which number 25 (D.7.1). `Corroborating 90 claims` (`src/data/scenario.ts:209`, `scenario.ts:218`) is a fourth, apparently unrelated, use of 90.
2. **Applicable-control count has two sources.** The Profile computes it from the toggles (`src/data/scenario.ts:98-105`: 557 by default, 538 if all five are `No`), while every other screen uses the constant `557` (`capabilities.ts:93`, `scenario.ts:174`, `03_Intake.tsx:195`, `08_Export.tsx:77`, `08_Export.tsx:115`, `08_Export.tsx:155`, `steps.ts:69`, `steps.ts:97`, `steps.ts:210`). Changing a toggle does not change any of them.
3. **"Not stored" vs persisted.** `Demonstration prototype · fictional organisation · no data is stored or transmitted.` (`src/App.tsx:45`) and `Nothing you do here is saved or transmitted.` (`src/tour/WelcomeGate.tsx:69-71`) are shown while the store is persisted to `localStorage` under `jccp-assessment-v3` (`src/store/useAssessment.ts:164-167`), including override justifications and scoping justifications.
4. **Projected-interval card disagrees with itself.** For one provided artifact the hero shows a width (e.g. `7.7 points` for `req-siem`) that differs from `Band width falls to 9.2 pts` in the subline of the same card; with all five provided the hero shows `79.6% — 72.6%` and `width -7.0 points` while the subline says `Band width falls to 1.8 pts` (D.9 table; `src/screens/07_Remediation.tsx:86-96`). The footnote says `The band cannot fall below 7.0 pts of width` (`07_Remediation.tsx:100-101`), and the Dashboard says `Provide 5 more artifacts to narrow this toward ~10 points.` (`04_Dashboard.tsx:238-241`). The projection pool is the whole `unknown` count (59), capped by `Math.min(controlsUnlocked, unknown)` (`src/lib/scoring.ts:64`), not the 20 collectable ones (`coverage.ts:22`).
5. **Partial-credit quartile is described but not applied.** `Deployment share: 80% — partial-credit quartile applied to the Yellow weighting.` (`06_ControlDetail.tsx:252-253`). `yellowWeightForShare` (`src/lib/scoring.ts:9-15`), the only user of `YELLOW_QUARTILE`, has no callers, and `boundedScore` is called with the default `yellowWeight = 0.5` (`src/lib/derive.ts:37`). `deploymentSharePct` is otherwise only displayed.
6. **`N/A` / `grey` is defined but never produced.** `STATE_META.grey` is `N/A` (`StateBadge.tsx:13`) and help text says `Each is Compliant, Partial, a Gap, Not Applicable, or Unknown.` (`src/tour/helpContent.ts:46`, `src/tour/steps.ts:254`). No seeded control is `grey` (D.7.1), the override buttons offer only Compliant/Gap/Unknown (`06_ControlDetail.tsx:291-299`), the ceilings are `unknown`/`yellow`/`green` (`controls.ts:285-288`), and the Gap Matrix state filter omits it (`05_GapMatrix.tsx:98`). Excluded controls live in a separate register (`src/data/exclusions.ts`) with no per-control page.
7. **Risk-weight table vs totals**: see L.2 (`341.4`/`514.4` by the table, `331.4`/`498.4` displayed). The gap sentence uses `167` (`riskWeighting.ts:31-33`) while the table's `Underived` row is `173` controls (`riskWeighting.ts:19`).
8. **`module_failed` is absent from the gap-reason chart.** `GAP_REASON_BREAKDOWN` has seven rows and no `module_failed` (`controls.ts:225-231`, summing to 59 after upload), but two seeded controls carry `module_failed` after upload (`JNCSF-173`, `JNCSF-179`, `controls.ts:131-132`), the Gap Matrix gap-reason filter offers it (`05_GapMatrix.tsx:110-112`), and the Intake ledger shows the `logging` module `failed` (`scenario.ts:195`).
9. **Review-queue status vs interview status.** Intake shows a `done` pill for an interview once Play/Skip completes (`03_Intake.tsx:432-436`, from the store) and, in the same screen, a fixture-driven status for the same role (`accepted`, `under review`, `submitted`, `03_Intake.tsx:485-498`, `collaboration.ts:16-18`); the two are not connected. `interviewStatus` in the store, which looks designed for this, is written but never read (F.1).
10. **Overrides reach some figures and not others.** They change the hero interval and the override banner (`derive.ts:53-66`), the Gap Matrix row state (`05_GapMatrix.tsx:65-68`) and the Control Detail state, but not the per-capability rows (`04_Dashboard.tsx:329-349`), the donut, completeness statement, gap-reason chart (`TOTALS`/fixture based) or the OSCAL `compliance-interval` (`08_Export.tsx:27`, fixture interval). The Gap Matrix row keeps the snapshot's evidence-class pill after an override (`05_GapMatrix.tsx:67`), whereas Control Detail shows `analyst-signed` (`06_ControlDetail.tsx:97`).
11. **Tasks change status after the bundle simulation.** `uploadSlotsBulk` marks the 14 automated artifacts (`03_Intake.tsx:176`), including `Privileged group membership`, and `12_Tasks.tsx:17` turns any task whose artifact is in `uploadedSlots` into `submitted` — so task `t1`, fixture status `accepted` (`collaboration.ts:52`), displays `submitted` afterwards.
12. **RBAC matrix vs implemented gating.** The matrix gives `Regulator` `scoped` access to `View interval, coverage and assurance only` (`11_Admin.tsx:45`) while the regulator's navigation has only `OSCAL Export` and `National Rollup` (`nav.ts:36-37`); it gives `Owner` `scoped` override rights (`11_Admin.tsx:56`) while `canOverride` is the same for owner and analyst (`06_ControlDetail.tsx:102`); it gives `Analyst` `scoped` profile editing (`11_Admin.tsx:50`) while the Profile inputs are enabled for every role that can reach the page. The matrix is a static array; gating is in `nav.ts` and `App.tsx`; nothing links them.
13. **Rollup sector.** `National rollup — Defence, Security & Government Services sector` (`13_Rollup.tsx:17`, `remediation.ts:93`) is not one of the ten sector labels in `sectors.ts:18-27`.
14. **State-independent chat.** The chat answers `Your interval is 70.8–81.4% at 89.4% coverage` (`09_Chat.tsx:73`) regardless of `evidenceUploaded` (the Dashboard shows `49.9%`–`87.1%` before upload). Its refusal says `No such control exists in the pinned catalogue (JNCSF-1 to JNCSF-576)` (`09_Chat.tsx:88`) although `/control/<id>` answers `No such control.` for 528 of those ids (`06_ControlDetail.tsx:84-92`; only 48 are seeded) — including the ids in the Exclusions register.
15. **`93` means two things.** `projected coverage 93%` (`scenario.ts:176`) and `the framework is 93% universal` (`steps.ts:69`).
16. **Glyph vs shape text.** `STATE_META.yellow` has glyph `◐` and `shape: 'half-filled triangle'`, shown in the tooltip (`StateBadge.tsx:11`, `StateBadge.tsx:30`).
17. **Assurance-demotion copy is partly static.** `Demotion risks: 1 declined module …` (`04_Dashboard.tsx:305-308`) and `the logging module failed` (`04_Dashboard.tsx:304`) are literals; the ledger it describes has one declined, one failed and one partial module (`scenario.ts:194-196`).
18. **Cloud challenge is not re-armed.** `profileChallenge` stays set after a decision even if the Cloud toggle is switched back and forth (`01_Profile.tsx:89`, `01_Profile.tsx:175`); it is cleared only by `Reopen decision` (`01_Profile.tsx:317`) or `Restore cloud scope and re-run` (`01_Profile.tsx:247`).
19. **Guided tour wipes state.** `startTour` resets the whole store (`useAssessment.ts:112`) — profile edits, role, uploads and overrides are lost and the reset is persisted.

### L.4 Figures that exist as separate literals in several files

(Useful when planning a change: updating one place does not update the others.)

| Figure | Places |
|---|---|
| `557` | `src/data/capabilities.ts:93`; `src/data/scenario.ts:174`; `src/screens/03_Intake.tsx:195`; `src/screens/08_Export.tsx:77`, `08_Export.tsx:115`, `08_Export.tsx:155`; `src/tour/steps.ts:69`, `steps.ts:97`, `steps.ts:210` (and the computed default at `scenario.ts:98-105`) |
| `576` | `src/data/capabilities.ts:91`; `src/data/scenario.ts:70`, `scenario.ts:71`; `src/data/attack.ts:38`; `src/components/AttackExposure.tsx:23`; `src/screens/01_Profile.tsx:97`; `src/screens/08_Export.tsx:76`, `08_Export.tsx:206`; `src/screens/09_Chat.tsx:88`, `09_Chat.tsx:89`; `src/tour/glossary.ts:12`, `glossary.ts:44`; `src/tour/helpContent.ts:14`; `src/tour/steps.ts:45`, `steps.ts:69` |
| `19` (excluded controls) | `src/data/capabilities.ts:92`; `src/data/scenario.ts:91`; `src/screens/01_Profile.tsx:25`; `src/data/exclusions.ts:51`, `exclusions.ts:59`; plus the 19 rows themselves (`exclusions.ts:27-45`) |
| `39` (uncollectable) | `src/data/controls.ts:226`, `controls.ts:236`; `src/data/scenario.ts:175` |
| `148` | `src/screens/03_Intake.tsx:326`; `src/data/capabilities.ts:115` (unread) |
| `90` | `src/screens/04_Dashboard.tsx:232`, `04_Dashboard.tsx:526`; `src/data/scenario.ts:209`, `scenario.ts:218` |
| `43` privileged accounts without MFA | `src/data/remediation.ts:22`; `src/data/collaboration.ts:24`; `src/screens/04_Dashboard.tsx:34`; `src/screens/09_Chat.tsx:33`, `09_Chat.tsx:36`, `09_Chat.tsx:54`; `src/tour/steps.ts:298`; `src/data/controls.ts:120`, `controls.ts:141`; `src/data/evidence.ts` (raw excerpts) |
| `49.9`, `87.1`, `62.8` / `70.8`, `81.4`, `89.4` / `37.2`, `10.6` | `src/data/capabilities.ts:100-102`, `capabilities.ts:111-113`; `src/screens/03_Intake.tsx:194-195`, `03_Intake.tsx:328`; `src/screens/09_Chat.tsx:73`; `src/tour/steps.ts:202` |
| `405` (CICSC controls) | `src/data/scenario.ts:30`; `src/data/attack.ts:42` (edge count, different meaning); `src/screens/01_Profile.tsx:184`, `01_Profile.tsx:202`; `src/screens/04_Dashboard.tsx:111`, `04_Dashboard.tsx:442`; `src/screens/08_Export.tsx:37` |
| `1,842` identity records | `src/data/scenario.ts:193`, `scenario.ts:205`, `scenario.ts:217` |

### L.5 Pre-existing documents disagree with the code (not used as sources here)

Searching them for specific statements only:

- `README.md:38-39` says `340 of 576` and `22 artifacts from 6 systems`; code: `557` and `8` systems (D.4). `README.md:42` gives `50.0–87.1% → 70.6–81.2%`; the fixture/computed values are `49.9–87.1%` → `70.8–81.4%` (D.6).
- `PROTOTYPE_AS_BUILT.md:16` and `PROTOTYPE_AS_BUILT.md:88` say the app loads Inter from a Google Fonts CDN; `index.html:1-12` has no such link and the font is bundled (`src/main.tsx:4`).
- `PROTOTYPE_AS_BUILT.md:30` says the build `does not typecheck`; `package.json:8` runs `tsc --noEmit` first.
- `PROTOTYPE_AS_BUILT.md:34` and `PROTOTYPE_AS_BUILT.md:103` give the storage key `jccp-assessment`; the code uses `jccp-assessment-v3` (`useAssessment.ts:165`).
- Code comments that disagree with the code: `src/data/controls.ts:1-3` (`~50 seeded` — there are 48); `src/components/CoverageBar.tsx:9` (`used on capability rows and the dashboard` — it is imported nowhere).

### L.6 Dead or unreachable code

| Item | Evidence |
|---|---|
| Unused components `Kbd`, `CoverageBar` | C.5 |
| Unused functions/values `interviewById`, `regulatorForSector`, `yellowWeightForShare`, `pct`, `pts`, `YELLOW_QUARTILE` (only used by the unused function) | K.3 |
| Store members with no callers/readers: `setInterviewStatus`, `resetEvidence`, `interviewStatus`, `reviewedExclusions` | F.1 |
| Fixture fields never read by the UI | D.1 (last column) |
| `NavItem.step`, `NavItem.phase`; `ControlSnapshot.providedSignals` (always `[]`); `Control.num` (only builds `id`) | `nav.ts:21-22`; `controls.ts:97`; `controls.ts:186` |
| Tailwind tokens and the `@/*` alias that nothing uses | I.2, K.3 |
| `ControlDetail` branches for roles that `RoleGate` never lets onto `/control/…`: the hidden-evidence card (`06_ControlDetail.tsx:189-196`) and the read-only subtitle (`06_ControlDetail.tsx:289`) | `App.tsx:29-34`; B.3 |
| Query params `state`, `ev`, `gap` on `/gap-matrix` and `cap` on `/exclusions` that no link sets | B.4 |
| Profile `Viewing as {role} — read only` pill while the inputs stay enabled | `01_Profile.tsx:379-381` vs `01_Profile.tsx:101-176` |
| Profile fields collected but read nowhere else: `namedAttestation`, `hostingModel`, `endpoints`, `servers`, `users`, `pdplHoldings` (`orgName` is shown but has no input) | `01_Profile.tsx:113-149`, `01_Profile.tsx:225`; grep of `src/` |
| No React error boundary | `grep -rn "componentDidCatch\|ErrorBoundary" src` → no matches |

### L.7 Files or code I could not make sense of

No file was unreadable. Two things were read but not exercised: the `.github/workflows/deploy.yml` workflow (never run here) and `.claude/launch.json` (a launch configuration for Claude Code tooling, not application code).

---

## Verification of this document

After writing, the file on disk was re-read by a script that (1) extracts every backticked `file:line` or `file:start-end` citation, (2) resolves the file name to a unique tracked file, (3) confirms the line or range exists in that file, and (4) checks that quoted prose appears within ±4 lines of the cited range.

- **2,084 `file:line` citations checked** (including ranges and citations into `package.json`, `package-lock.json`, `tsconfig.json`, `tailwind.config.js`, `vite.config.ts`, the workflow and `index.html`): all 2,084 point at a file that exists and a line or range within it. Zero out-of-range. Three further citations into `node_modules/zustand/middleware.js` (an installed dependency, not a tracked file) were checked by hand with `grep -n`.
- **1,218 quoted fragments checked** against the cited lines: 1,090 found. Of the 128 not found, none is a mismatch in prose I could trace to a wrong citation after review: they are values substituted at render time (for example `350 of 557 applicable controls`, which appears in source as `{cs.covered} of {cs.applicable}`), computed results from running the code, my own notation (`Step N of 30`, `controls × weight`), fixture strings whose line is the object's first line rather than the field's line, or labels cited by their handler rather than the button text.
- The check found and I corrected about twenty-five citations that pointed at the wrong file or line while the document was being assembled (for example short-hand `:NNN` references that resolved against the wrong file, and a `Capability.totalControls` line). A further manual pass compared every short-hand-resolved citation against the source line it lands on.
- **Not verifiable by script and therefore only spot-checked against the repository's own functions**: computed values in Sections D.6, D.9 and L (interval, coverage, projection, risk-weight arithmetic), the counts over the 48 seeded controls, and claims of the form "no other code reads X" (each backed by the `grep` named in the text).
- No source file, lock file or configuration file was modified; `git status` shows only `docs/`.
