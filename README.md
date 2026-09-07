# JCCP — Jordan Cyber Compliance Platform (Interactive Prototype)

A polished, front-end-only demonstration of the **JCCP** platform: an on-premise,
evidence-grounded compliance and gap-analysis tool for the **Jordan National
Cybersecurity Framework (JNCSF)**.

This is a **demonstration artifact** for a capstone defence. There is no backend, no
database, and no AI inference — every number is a pre-computed fixture and every
"upload" is simulated. The point is to show, end to end, how the real system would
behave.

## The three ideas the demo lands

1. **Evidence-grounded, not a questionnaire.** Testimony alone can never mark a
   control Compliant. Machine-collected evidence is what promotes a control to Green.
2. **Honest about what it doesn't know.** Compliance is a **bounded interval**, never a
   single percentage. The interval's width is the visible cost of missing evidence.
3. **Threat-informed.** Every gap maps to concrete MITRE ATT&CK techniques.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static bundle.

- **Stack:** Vite · React 18 · TypeScript · Tailwind · React Router · Recharts ·
  lucide-react · framer-motion · Zustand (persisted to `localStorage`).
- State lives behind one flag, `evidenceUploaded`, which selects between two fixture
  datasets. **Reset demo** (top-right) returns everything to the pre-upload state.

## Demo script (~10 minutes)

| # | Screen | What to show |
|---|--------|--------------|
| 1 | **Profile** | Set the org profile; watch *Applicable controls* recompute (340 of 576). Toggle **Uses cloud services** off → after a beat the **Profile challenge** banner fires and the denominator drops to 317. |
| 2 | **Request Plan** | "To assess your 340 applicable controls, we need 22 artifacts from 6 systems." Each row carries the actual command to produce it, sorted by controls unlocked. |
| 3 | **Intake › Interviews** | Play the **Infrastructure / Operator** interview. One sentence ("we run CrowdStrike across the estate") decomposes into three claims — servers enforcing, workstations detect-only at 80%, contractor exception — each stamped *Testimony only — capped at Yellow*. |
| 4 | **Intake › Evidence bundle** | *Simulate collector bundle upload.* Watch the staged ingestion: `identity.json` OK, `endpoint.json` **partial**, `logging.json` **failed**, `cloud` **declined**. Then the **module execution ledger** and the rule: *a failed module yields Unknown, never Gap.* |
| 5 | **Dashboard — THE MOMENT** | The compliance interval animates **50.0–87.1% → 70.6–81.2%** (width 37.1 → 10.6 pts). Coverage **62.9% → 89.4%**. Assurance **L1 → L2**. The completeness statement box cannot be dismissed. `not_requested = 0` is annotated as a design invariant. |
| 6 | **Gap Matrix** | Filter to *Show only what changed after evidence upload* — the promoted controls light up. Parent capability headers show the state of their **weakest child**, never an average. |
| 7 | **Control detail — JNCSF-102** | Open it. Evidence trail with a verbatim operator quote, a corroborating AD export (`raw/ad-privileged-groups.csv row 412`), truncated SHA-256, **View raw**, a population figure (410 of 512 endpoints), and the ATT&CK chain to **T1078 / T1548 / T1021**. State: **Gap** — 43 privileged accounts without MFA. |
| 8 | **Remediation** | "Enforce MFA on all privileged accounts — closes 11 controls · removes exposure to T1110, T1078, T1550." |
| 9 | **Remediation › What you didn't provide** | "Provide the SIEM source inventory: −8.2 interval points." *Simulate providing this* re-runs the narrowing animation. |
| 10 | **OSCAL Export** | Five OSCAL models. **Preview JSON** shows the coverage metadata and assurance level travelling *inside* the package — the regulator sees the interval, not a bare number. National rollup preview for the NCSC-facing view. |
| 11 | **Chat** | Ask *"What does JNCSF-102 require?"* — answer with citation chips. Then ask *"What is our compliance score?"* — it **refuses**, because it is read-only and cannot influence scoring. |

## Accessibility

Every control state renders as **colour + distinct icon shape + text label** and stays
readable in greyscale:

| State | Colour | Shape | Label |
|---|---|---|---|
| Compliant | emerald | ● filled circle | "Compliant" |
| Partial | amber | ◐ half-filled triangle | "Partial" |
| Gap | red | ■ filled square | "Gap" |
| N/A | slate | ─ dash | "N/A" |
| Unknown | violet | ◇ hollow diamond | "Unknown" |

## Scoring math

`src/lib/scoring.ts` is pure and deterministic:

```
numerator = green·1.0 + yellow·0.5 + red·0.0
lower  = numerator / applicable                  (all unknowns fail)
upper  = (numerator + unknown) / applicable       (all unknowns pass)
```

- `boundedScore(340, 150, 40, 24, 126)` → lower `0.500`, upper `0.871`, coverage `0.629`
- `boundedScore(340, 210, 60, 34, 36)` → lower `0.706`, upper `0.812`, coverage `0.894`

Grey (N/A) is excluded from the denominator entirely. Unknown is excluded from the
numerator but present in the denominator — it *is* the interval width. Testimony caps a
control at Yellow. A control may only be Red if its signal is negative-capable **and**
the producing module reported `success`.

## Non-goals

No real backend, LLM calls, file parsing, OSCAL schema validation, authentication, a
real collector, or Arabic/RTL support (documented future work). ~50 real JNCSF controls
are seeded as clickable rows; the remaining 576 total live as aggregate counts.
