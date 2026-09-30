import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, HelpCircle, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { Card, Button, SectionLabel, Pill } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { ROLE_LABEL } from '../store/useAssessment';
import {
  computeApplicable,
  unknownScopedControls,
  TOTAL_CONTROLS,
  HOSTING_LABEL,
  type OrgProfile,
  type Ternary,
} from '../data/scenario';
import { SECTORS, sectorById, regulatorDisplay } from '../data/sectors';
import { SECTOR_BASELINE } from '../data/exclusions';
import { Term } from '../tour/Term';

// The five measured JNCSF applicability variables (38 of 576 controls are conditional on
// these; the framework is 93% universal). "Operational technology", "cross-border
// processing" and similar candidates did not survive contact with the framework text —
// OT is governed by the separate CICSC instrument, so JNCSF does not gate on it.
const TOGGLES: { key: keyof OrgProfile; label: string; hint: string }[] = [
  { key: 'inHouseDevelopment', label: 'In-house software development', hint: 'declaring "no" removes 19 Development controls' },
  { key: 'outsourcedDevelopment', label: 'Outsourced development', hint: 'declaring "no" removes 9 controls' },
  { key: 'mobileDevices', label: 'Mobile devices', hint: 'declaring "no" removes 4 controls' },
  { key: 'wirelessNetwork', label: 'Wireless network', hint: 'declaring "no" removes 4 controls' },
  { key: 'remoteAccess', label: 'Remote access', hint: 'declaring "no" removes 2 controls' },
];

const TRI: Ternary[] = ['yes', 'no', 'unknown'];
const TRI_LABEL: Record<Ternary, string> = { yes: 'Yes', no: 'No', unknown: "Don't know" };

function TriToggle({ value, onChange, label, hint, dataTour }: { value: Ternary; onChange: (v: Ternary) => void; label: string; hint: string; dataTour?: string }) {
  return (
    <div data-tour={dataTour} className="rounded-lg border border-slate-200 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-800">{label}</div>
          <div className="text-[11px] text-slate-400">{hint}</div>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-md border border-slate-300 text-[11px] font-semibold">
          {TRI.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={`px-2 py-1 transition ${
                value === t
                  ? t === 'no'
                    ? 'bg-amber-500 text-white'
                    : t === 'unknown'
                    ? 'bg-violet-500 text-white'
                    : 'bg-accent text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {TRI_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      {value === 'unknown' && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-violet-600">
          <HelpCircle size={11} /> Held in scope; related controls flagged for verification during collection.
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const profile = useAssessment((s) => s.profile);
  const role = useAssessment((s) => s.role);
  const setProfile = useAssessment((s) => s.setProfile);
  const setPdpl = useAssessment((s) => s.setPdpl);
  const setPhase = useAssessment((s) => s.setPhase);
  const evidenceUploaded = useAssessment((s) => s.evidenceUploaded);
  const challenge = useAssessment((s) => s.profileChallenge);
  const resolveProfileChallenge = useAssessment((s) => s.resolveProfileChallenge);
  const clearProfileChallenge = useAssessment((s) => s.clearProfileChallenge);

  const [justification, setJustification] = useState('');

  const applicable = computeApplicable(profile);
  const unknownScoped = unknownScopedControls(profile);
  const stage1Pending = profile.usesCloud === 'no' && !challenge;
  const stage2Contradiction = evidenceUploaded && profile.usesCloud === 'no';

  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card dataTour="profile-header" title="Organisation profile" subtitle="Scoping inputs — these set which of the 576 JNCSF controls apply">
          <div data-tour="profile-identity" className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <SectionLabel>Sector</SectionLabel>
              <select value={profile.sector} onChange={(e) => setProfile({ sector: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {SECTORS.map((s) => (
                  <option key={s.id} value={s.id} title={s.arabicLabel}>{s.label}</option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-slate-400" dir="rtl">{sectorById(profile.sector).arabicLabel}</span>
              <span className={`mt-1 block text-[11px] ${sectorById(profile.sector).regulator ? 'text-slate-400' : 'font-medium text-amber-700'}`}>
                Regulator: {regulatorDisplay(profile.sector)}
              </span>
            </label>
            <label className="block">
              <SectionLabel>Size band</SectionLabel>
              <select value={profile.sizeBand} onChange={(e) => setProfile({ sizeBand: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {['< 50 staff', '50–250 staff', '250–1000 staff', '> 1000 staff'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <SectionLabel>Hosting model</SectionLabel>
              <select value={profile.hostingModel} onChange={(e) => setProfile({ hostingModel: e.target.value as OrgProfile['hostingModel'] })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {(Object.keys(HOSTING_LABEL) as OrgProfile['hostingModel'][]).map((k) => (
                  <option key={k} value={k}>{HOSTING_LABEL[k]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <SectionLabel>Named attestation</SectionLabel>
              <input
                value={profile.namedAttestation}
                onChange={(e) => setProfile({ namedAttestation: e.target.value })}
                placeholder="Accountable officer name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <SectionLabel>Endpoints</SectionLabel>
              <input type="number" value={profile.endpoints} onChange={(e) => setProfile({ endpoints: +e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tnum" />
            </label>
            <label className="block">
              <SectionLabel>Servers</SectionLabel>
              <input type="number" value={profile.servers} onChange={(e) => setProfile({ servers: +e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tnum" />
            </label>
            <label className="block">
              <SectionLabel>Users</SectionLabel>
              <input type="number" value={profile.users} onChange={(e) => setProfile({ users: +e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tnum" />
            </label>
          </div>

          <SectionLabel>
            <span className="mt-5 block">Applicability variables — answer Yes, No, or Don't know</span>
          </SectionLabel>
          <div data-tour="profile-toggles" className="grid gap-2">
            {TOGGLES.map((t) => (
              <TriToggle
                key={t.key}
                label={t.label}
                hint={t.hint}
                value={profile[t.key] as Ternary}
                onChange={(v) => setProfile({ [t.key]: v } as Partial<OrgProfile>)}
              />
            ))}

            {/* Cloud services — NOT a JNCSF applicability condition (governed separately by
                the MoDEE cloud policy). Kept only to drive the scoping-challenge demo below:
                a declaration the system cross-checks against collected evidence. */}
            <TriToggle
              label="Cloud services"
              hint="does not change the applicable count — cloud is governed by the MoDEE cloud policy, not JNCSF. Declarations are still cross-checked against evidence."
              dataTour="profile-cloud"
              value={profile.usesCloud}
              onChange={(v) => setProfile({ usesCloud: v })}
            />

            {/* CICSC scope boundary — a separate framework, not a JNCSF applicability condition */}
            <div className="rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">Operates critical infrastructure</div>
                  <div className="text-[11px] text-slate-400">
                    Subjects this organisation to CICSC (405 controls, 3 implementation levels) in addition to
                    JNCSF — not yet assessed by this tool
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProfile({ operatesCriticalInfrastructure: !profile.operatesCriticalInfrastructure })}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${profile.operatesCriticalInfrastructure ? 'bg-accent' : 'bg-slate-300'}`}
                  aria-pressed={profile.operatesCriticalInfrastructure}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${profile.operatesCriticalInfrastructure ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              {profile.operatesCriticalInfrastructure && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2.5 text-[11px] leading-snug text-blue-900">
                  <Info size={13} className="mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    <span className="font-semibold">Critical infrastructure scope note.</span> This organisation
                    is also subject to the Critical Infrastructure Cyber Security Controls (CICSC) — 405
                    controls across three implementation levels, with Level 1 (135 controls) mandatory. A
                    substantial number of Level 2/3 controls have no JNCSF correspondence at all. This
                    assessment does not evaluate CICSC.
                  </span>
                </div>
              )}
            </div>
          </div>

          <SectionLabel>
            <span className="mt-5 block">PDPL data holdings</span>
          </SectionLabel>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['health', 'Health records'],
                ['biometric', 'Biometric data'],
                ['financial', 'Financial data'],
                ['religiousOrPolitical', 'Religious or political affiliation'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                <input type="checkbox" checked={profile.pdplHoldings[key]} onChange={(e) => setPdpl({ [key]: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                {label}
              </label>
            ))}
          </div>
        </Card>

        {/* Stage 2 — hard contradiction, post-upload */}
        <AnimatePresence>
          {stage2Contradiction && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-600" />
                <div>
                  <h3 className="text-sm font-bold text-red-900">Contradiction — scoping decision blocked</h3>
                  <p className="mt-1 text-sm leading-relaxed text-red-800">
                    Your profile declares no cloud services, but the collected bundle contains cloud agent
                    entries in the software inventory and cloud endpoints in the firewall configuration. Cloud
                    use does not change which controls apply — JNCSF does not gate on it — but a declaration
                    the evidence contradicts is <strong>blocked pending review</strong> regardless.
                  </p>
                  <div className="mt-3">
                    <Button variant="danger" onClick={() => { setProfile({ usesCloud: 'yes' }); clearProfileChallenge(); }}>
                      Restore cloud scope and re-run
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 1 — soft prior-based challenge */}
        <AnimatePresence>
          {stage1Pending && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border border-amber-300 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-amber-900">Confirm this scoping decision</h3>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">
                    {sectorById(profile.sector).label} entities of {profile.sizeBand} almost always consume at
                    least one cloud service. This declaration does not change which controls apply — cloud is
                    governed by the MoDEE cloud policy, not JNCSF — but it will be cross-checked against the
                    evidence bundle. Please confirm and record a justification.
                  </p>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={2}
                    placeholder="Justification (required) — e.g. all workloads run on the MoDEE Government Private Cloud, which is assessed separately…"
                    className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      disabled={justification.trim().length < 12}
                      onClick={() =>
                        resolveProfileChallenge({ decision: 'confirmed', justification: justification.trim(), decidedBy: ROLE_LABEL[role], decidedAt: now() })
                      }
                    >
                      Confirm exclusion &amp; record
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProfile({ usesCloud: 'yes' });
                        resolveProfileChallenge({ decision: 'restored', justification: 'Declaration corrected — cloud services are in use.', decidedBy: ROLE_LABEL[role], decidedAt: now() });
                        setJustification('');
                      }}
                    >
                      Restore cloud services
                    </Button>
                  </div>
                  {justification.trim().length > 0 && justification.trim().length < 12 && (
                    <p className="mt-1 text-[11px] text-amber-700">A substantive justification is required to proceed.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {challenge && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 size={13} className="text-emerald-600" /> Scoping decision recorded
            </div>
            <div className="mt-1">
              <strong>{challenge.decision === 'confirmed' ? 'Cloud exclusion confirmed' : 'Cloud scope restored'}</strong> by{' '}
              {challenge.decidedBy} on {challenge.decidedAt}. “{challenge.justification}”
            </div>
            <button onClick={() => clearProfileChallenge()} className="mt-1 text-[11px] text-accent hover:underline">
              Reopen decision
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {stage1Pending && <span className="text-[11px] text-amber-700">Record the scoping decision to continue.</span>}
          <Button
            dataTour="profile-continue"
            disabled={stage1Pending}
            onClick={() => {
              setPhase('planning');
              navigate('/request-plan');
            }}
          >
            Continue to request plan <ArrowRight size={15} />
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-2 lg:self-start">
        <Card dataTour="profile-applicable" title="Live scoping">
          <div className="text-center">
            <div className="tnum text-4xl font-bold text-slate-900">{applicable}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Term k="applicable controls">Applicable controls</Term>
            </div>
            <div className="tnum mt-1 text-sm text-slate-500">of {TOTAL_CONTROLS} total · {TOTAL_CONTROLS - applicable} excluded</div>
            <button onClick={() => navigate('/exclusions')} className="mt-0.5 text-[11px] text-accent underline hover:text-blue-700">
              view exclusion register
            </button>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div className="h-full bg-accent" animate={{ width: `${(applicable / TOTAL_CONTROLS) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sector N/A baseline</span>
            <span className="tnum font-semibold text-slate-700">{SECTOR_BASELINE.naRatePct}%</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Your N/A rate</span>
            <span className={`tnum font-semibold ${(TOTAL_CONTROLS - applicable) / TOTAL_CONTROLS * 100 > SECTOR_BASELINE.naRatePct ? 'text-amber-700' : 'text-slate-700'}`}>
              {(((TOTAL_CONTROLS - applicable) / TOTAL_CONTROLS) * 100).toFixed(1)}%
            </span>
          </div>
          {unknownScoped > 0 && (
            <p className="mt-3 rounded-md bg-violet-50 px-2.5 py-1.5 text-[11px] text-violet-700">
              {unknownScoped} controls held in scope by a “Don't know” answer — flagged for verification.
            </p>
          )}
          {profile.usesCloud === 'no' && (
            <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700">
              Cloud declared absent — the applicable count is unaffected (cloud is not a JNCSF scoping
              condition), but this declaration is cross-checked against collected evidence.
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Grey (<Term k="not applicable">not-applicable</Term>) controls are excluded from the denominator
            entirely. Under-scoping is the first way a score gets inflated — every exclusion is cross-checked
            against collected evidence.
          </p>
          {role !== 'owner' && role !== 'analyst' && (
            <Pill tone="slate">Viewing as {ROLE_LABEL[role]} — read only</Pill>
          )}
        </Card>
      </div>
    </div>
  );
}
