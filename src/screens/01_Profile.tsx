import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, Button, SectionLabel } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { computeApplicable, TOTAL_CONTROLS, type OrgProfile } from '../data/scenario';

const TOGGLES: { key: keyof OrgProfile; label: string; hint: string }[] = [
  { key: 'hasOperationalTech', label: 'Has operational technology', hint: 'adds ~41 OT controls' },
  { key: 'usesCloud', label: 'Uses cloud services', hint: 'removing this shrinks the denominator' },
  { key: 'crossBorderCloud', label: 'Cross-border cloud processing', hint: 'adds ~12 controls' },
  { key: 'inHouseDevelopment', label: 'In-house software development', hint: 'adds ~49 Development controls' },
  { key: 'hasSOC', label: 'Has a security operations centre', hint: 'no denominator change' },
  { key: 'byodPermitted', label: 'BYOD permitted', hint: 'adds ~8 mobile controls' },
];

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50"
    >
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-[11px] text-slate-400">{hint}</div>
      </div>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-accent' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${on ? 'left-4' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const profile = useAssessment((s) => s.profile);
  const setProfile = useAssessment((s) => s.setProfile);
  const setPdpl = useAssessment((s) => s.setPdpl);
  const setPhase = useAssessment((s) => s.setPhase);

  const [showChallenge, setShowChallenge] = useState(false);
  const applicable = computeApplicable(profile);

  useEffect(() => {
    if (!profile.usesCloud) {
      const t = setTimeout(() => setShowChallenge(true), 900);
      return () => clearTimeout(t);
    }
    setShowChallenge(false);
  }, [profile.usesCloud]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card title="Organisation profile" subtitle="Scoping inputs — these set which of the 576 JNCSF controls apply">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <SectionLabel>Sector</SectionLabel>
              <select
                value={profile.sector}
                onChange={(e) => setProfile({ sector: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {['Government', 'Financial services', 'Healthcare', 'Energy & utilities', 'Telecommunications', 'Education'].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            <label className="block">
              <SectionLabel>Size band</SectionLabel>
              <select
                value={profile.sizeBand}
                onChange={(e) => setProfile({ sizeBand: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {['< 50 staff', '50–250 staff', '250–1000 staff', '> 1000 staff'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <SectionLabel>
            <span className="mt-5 block">Architecture toggles</span>
          </SectionLabel>
          <div className="grid gap-2 sm:grid-cols-2">
            {TOGGLES.map((t) => (
              <Toggle
                key={t.key}
                label={t.label}
                hint={t.hint}
                on={Boolean(profile[t.key])}
                onChange={(v) => setProfile({ [t.key]: v } as Partial<OrgProfile>)}
              />
            ))}
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
              <label
                key={key}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={profile.pdplHoldings[key]}
                  onChange={(e) => setPdpl({ [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {label}
              </label>
            ))}
          </div>
        </Card>

        <AnimatePresence>
          {showChallenge && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-amber-300 bg-amber-50 p-5"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Profile challenge</h3>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">
                    Your declared profile says no cloud services, but the evidence bundle contains cloud
                    agent entries in the software inventory and cloud endpoints in firewall configuration. A
                    wrong profile silently shrinks the assessment denominator and inflates your score.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="primary" onClick={() => setProfile({ usesCloud: true })}>
                      Review — restore cloud scope
                    </Button>
                    <Button variant="outline" onClick={() => setShowChallenge(false)}>
                      Keep declaration
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <Button
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
        <Card title="Live scoping">
          <div className="text-center">
            <div className="tnum text-4xl font-bold text-slate-900">{applicable}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Applicable controls
            </div>
            <div className="tnum mt-1 text-sm text-slate-500">of {TOTAL_CONTROLS} total</div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${(applicable / TOTAL_CONTROLS) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            Grey (not-applicable) controls are excluded from the denominator entirely. Under-scoping is the
            first way a score gets inflated — the tool cross-checks this declaration against collected
            evidence.
          </p>
          {!profile.usesCloud && (
            <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700">
              Cloud declared absent — {23} cloud-conditional controls removed from scope.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
