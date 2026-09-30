import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Users, Clock, X, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { Card, Pill, Button, SectionLabel } from '../components/ui';
import StateBadge, { STATE_META } from '../components/StateBadge';
import EvidenceTrail from '../components/EvidenceTrail';
import AttackExposure from '../components/AttackExposure';
import { useAssessment, ROLE_LABEL, type OverrideRecord } from '../store/useAssessment';
import {
  controlById,
  controls,
  snapshotFor,
  EVIDENCE_CLASS_LABEL,
  GAP_REASON_LABEL,
  EVIDENCE_CEILING,
  EVIDENCE_BASIS_LABEL,
  EVIDENCE_BASIS_MEANING,
  type EvidenceClass,
  type ControlState,
} from '../data/controls';
import { capabilityById } from '../data/capabilities';
import { attackBridge } from '../data/attack';
import { evidenceFor, ageDays, ASSESSMENT_DATE } from '../data/evidence';
import { requestPlan } from '../data/scenario';

const LADDER: EvidenceClass[] = ['none', 'testimonial', 'artifact', 'analyst_signed'];

function OverrideModal({
  controlId,
  from,
  to,
  onCancel,
  onConfirm,
}: {
  controlId: string;
  from: ControlState;
  to: ControlState;
  onCancel: () => void;
  onConfirm: (justification: string) => void;
}) {
  const [j, setJ] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Analyst override — {controlId}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Changing engine verdict <StateBadge state={from} size="sm" /> → <StateBadge state={to} size="sm" />.
          An override sets the evidence class to <strong>analyst-signed</strong> — it does not bypass the
          state ceiling, it asserts a higher class of evidence. It is recorded in the audit trail and
          surfaced in the OSCAL Assessment Results as analyst-attested.
        </p>
        <textarea
          value={j}
          onChange={(e) => setJ(e.target.value)}
          rows={3}
          placeholder="Justification (required) — what did you review, and why does it warrant this verdict?"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" disabled={j.trim().length < 12} onClick={() => onConfirm(j.trim())}>
            Record override
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ControlDetail() {
  const { id } = useParams();
  const control = id ? controlById(id) : undefined;
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const role = useAssessment((s) => s.role);
  const overrides = useAssessment((s) => s.overriddenControls);
  const overrideControl = useAssessment((s) => s.overrideControl);
  const clearOverride = useAssessment((s) => s.clearOverride);

  const [pending, setPending] = useState<ControlState | null>(null);

  if (!control) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          No such control. <Link to="/gap-matrix" className="text-accent underline">Back to the Gap Matrix</Link>.
        </p>
      </Card>
    );
  }

  const base = snapshotFor(control, uploaded);
  const ov = overrides[control.id];
  const effectiveState: ControlState = ov?.state ?? base.state;
  const effectiveClass: EvidenceClass = ov ? 'analyst_signed' : base.evidenceClass;
  const cap = capabilityById(control.capability);
  const attack = control.attackKey ? attackBridge[control.attackKey] : undefined;
  const evItems = evidenceFor(control.id).filter((it) => uploaded || it.type === 'testimonial');
  const ceiling = EVIDENCE_CEILING[effectiveClass];
  const canOverride = role === 'analyst' || role === 'owner';
  const canSeeEvidence = role !== 'executive' && role !== 'contributor';

  const oldest = evItems.reduce((m, it) => Math.max(m, ageDays(it.timestamp)), 0);
  const stale = oldest > control.maxAgeDays;

  const related = controls
    .filter((c) => c.id !== control.id && c.capability === control.capability)
    .slice(0, 4);

  const applyOverride = (to: ControlState) => {
    if (to === effectiveState && !ov) return;
    setPending(to);
  };

  return (
    <div className="space-y-5">
      <Link to="/gap-matrix" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <ArrowLeft size={15} /> Gap Matrix
      </Link>

      {/* 1. Header */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{control.id}</span>
              {cap && <Pill tone="slate">{cap.shortName}</Pill>}
              {control.showcase && <Pill tone="amber">showcase control</Pill>}
              {uploaded && control.changed && <Pill tone="blue">promoted by upload</Pill>}
              {ov && <Pill tone="violet">analyst override</Pill>}
            </div>
            <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-900">{control.description}</h2>
            <p className="mt-1 text-[11px] text-slate-400">Assessment as of {ASSESSMENT_DATE}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StateBadge state={effectiveState} size="lg" />
            <Pill tone={effectiveClass === 'artifact' ? 'green' : effectiveClass === 'testimonial' ? 'blue' : effectiveClass === 'analyst_signed' ? 'violet' : 'slate'}>
              {EVIDENCE_CLASS_LABEL[effectiveClass]}
            </Pill>
            {base.state === 'unknown' && base.gapReason && <Pill tone="violet">{GAP_REASON_LABEL[base.gapReason]}</Pill>}
            {oldest > 0 && (
              <span className={`inline-flex items-center gap-1 text-[11px] ${stale ? 'font-semibold text-amber-700' : 'text-slate-400'}`}>
                <Clock size={11} /> evidence {oldest}d old{stale ? ` · past ${control.maxAgeDays}d window` : ''}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Standards mapping */}
      <Card title="Standards mapping" subtitle="ISO/IEC 27002 and NIST SP 800-53">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SectionLabel>ISO 27002</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {control.iso.length === 0 && <span className="text-sm text-slate-400">—</span>}
              {control.iso.map((ref, i) => (
                <Pill key={ref} tone="blue" title={control.isoNames[i]}>{ref} · {control.isoNames[i]}</Pill>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>NIST 800-53</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {control.nist.length === 0 && <span className="text-sm text-slate-400">—</span>}
              {control.nist.map((ref, i) => (
                <Pill key={ref} tone="slate" title={control.nistNames[i]}>{ref} · {control.nistNames[i]}</Pill>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Evidence trail */}
      {canSeeEvidence ? (
        <Card dataTour="cd-evidence" title="Evidence trail" subtitle="Every finding traces to a quote or an artifact locator with a hash">
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px]">
            <ShieldQuestion size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span>
              <span className="font-semibold text-slate-700">Evidence basis: {EVIDENCE_BASIS_LABEL[control.evidenceBasis]}.</span>{' '}
              <span className="text-slate-600">{EVIDENCE_BASIS_MEANING[control.evidenceBasis]}</span>{' '}
              <span className="text-slate-400">This is why an absent finding here can be a Gap rather than Unknown.</span>
            </span>
          </div>
          <EvidenceTrail items={evItems} />
        </Card>
      ) : (
        <Card dataTour="cd-evidence" title="Evidence trail">
          <p className="text-sm text-slate-500">
            Evidence excerpts are hidden in the {ROLE_LABEL[role]} view — they may contain account names and
            other personal data.
          </p>
        </Card>
      )}

      {control.noConclusivePath && (
        <div className="flex items-start gap-2 rounded-lg border-2 border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <ShieldQuestion size={16} className="mt-0.5 shrink-0 text-violet-500" />
          <div>
            <p className="font-semibold">No conclusive evidence path.</p>
            <p className="mt-1 leading-relaxed text-violet-800">
              This control requires an organisational arrangement rather than a system state. It can reach
              Partial on documentary evidence, but never Compliant without analyst attestation.
            </p>
          </div>
        </div>
      )}

      {/* 4. Evidence sufficiency ladder */}
      <Card title="Evidence sufficiency" subtitle="The evidence class sets the highest state a control may reach">
        <div className="flex items-stretch gap-2">
          {LADDER.map((cls) => {
            const current = cls === effectiveClass;
            return (
              <div key={cls} className={`flex-1 rounded-lg border p-3 text-center ${current ? 'border-accent bg-accent/5' : 'border-slate-200'}`}>
                <div className={`text-xs font-semibold ${current ? 'text-slate-900' : 'text-slate-400'}`}>{EVIDENCE_CLASS_LABEL[cls]}</div>
                <div className="mt-1.5 flex justify-center">
                  <StateBadge state={EVIDENCE_CEILING[cls]} size="sm" showLabel={false} />
                </div>
                <div className="mt-1 text-[10px] text-slate-400">ceiling: {STATE_META[EVIDENCE_CEILING[cls]].label}</div>
                {current && <div className="mt-1 text-[10px] font-bold uppercase text-accent">current</div>}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-slate-500">
          This control's evidence is <strong>{EVIDENCE_CLASS_LABEL[effectiveClass]}</strong>, so it can reach
          at most <strong>{STATE_META[ceiling].label}</strong>. Testimony alone can never mark a control
          Compliant — only machine-collected artifacts or an analyst signature.
        </p>
      </Card>

      {/* 5. ATT&CK exposure — always rendered */}
      <Card dataTour="cd-attack" title="ATT&CK exposure" subtitle="Control → Mitigation → Techniques">
        <AttackExposure controlId={control.id} entry={attack} enforced={effectiveState === 'green'} />
      </Card>

      {/* 6. Population data */}
      {(control.populationNote || control.exceptionPopulation || control.deploymentSharePct !== undefined) && (
        <Card title="Population data" subtitle="Numerator / denominator with provenance">
          <div className="space-y-2 text-sm text-slate-700">
            {control.populationNote && (
              <div className="flex items-start gap-2">
                <Users size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <span>{control.populationNote}</span>
              </div>
            )}
            {control.deploymentSharePct !== undefined && (
              <div className="tnum">
                Deployment share: <strong>{control.deploymentSharePct}%</strong> — partial-credit quartile
                applied to the Yellow weighting.
              </div>
            )}
            {control.exceptionPopulation && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">
                Named exception retained: {control.exceptionPopulation}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* How to evidence this */}
      {(base.state === 'unknown' || base.evidenceClass === 'testimonial') && (
        <Card title="How to evidence this" subtitle="Move this control out of Unknown / off the Yellow ceiling">
          <ul className="space-y-1.5 text-sm text-slate-700">
            {control.requiredSignals.map((sig) => {
              const req = requestPlan.find((r) => r.command.toLowerCase().includes(sig.split('_')[0]) || r.formatHint.toLowerCase().includes(sig.split('_')[0]));
              return (
                <li key={sig} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-slate-300" />
                  <span>
                    <span className="font-medium">{sig.replace(/_/g, ' ')}</span>
                    {req && <span className="text-slate-500"> — via “{req.artifact}” ({req.effort}, unlocks {req.controlsUnlocked})</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link to="/remediation" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
            Open in Remediation → What you didn't provide
          </Link>
        </Card>
      )}

      {/* 7. Analyst actions + audit trail */}
      <Card title="Analyst actions" subtitle={canOverride ? 'Overrides are recorded and move the dashboard interval' : `Read-only in the ${ROLE_LABEL[role]} view`}>
        <div className="flex flex-wrap gap-2">
          <Button variant={effectiveState === 'green' ? 'primary' : 'outline'} disabled={!canOverride} onClick={() => applyOverride('green')}>
            Accept as Compliant
          </Button>
          <Button variant={effectiveState === 'red' ? 'danger' : 'outline'} disabled={!canOverride} onClick={() => applyOverride('red')}>
            Override to Gap
          </Button>
          <Button variant="outline" disabled={!canOverride} onClick={() => applyOverride('unknown')}>
            Set to Unknown — request more evidence
          </Button>
          {ov && (
            <Button variant="ghost" onClick={() => clearOverride(control.id)}>
              Clear override (engine verdict: {STATE_META[base.state].label})
            </Button>
          )}
        </div>

        {ov && (
          <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-[12px]">
            <div className="flex items-center gap-1.5 font-semibold text-violet-900">
              <ShieldCheck size={13} /> Override audit record
            </div>
            <table className="mt-1.5 text-slate-700">
              <tbody>
                <tr><td className="pr-3 text-slate-400">was</td><td>{STATE_META[ov.previousState].label}</td></tr>
                <tr><td className="pr-3 text-slate-400">now</td><td>{STATE_META[ov.state].label} · analyst-signed</td></tr>
                <tr><td className="pr-3 text-slate-400">by</td><td>{ov.analystId}</td></tr>
                <tr><td className="pr-3 text-slate-400">at</td><td className="tnum">{ov.timestamp}</td></tr>
                <tr><td className="pr-3 align-top text-slate-400">why</td><td>“{ov.justification}”</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Related controls */}
      <Card title="Related controls" subtitle={`Other ${cap?.shortName} controls`}>
        <div className="flex flex-wrap gap-2">
          {related.map((c) => (
            <Link key={c.id} to={`/control/${c.id}`} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs hover:border-accent">
              <span className="font-mono font-semibold text-slate-500">{c.id}</span>{' '}
              <span className="text-slate-600">{c.description.slice(0, 44)}…</span>
            </Link>
          ))}
        </div>
      </Card>

      {pending && (
        <OverrideModal
          controlId={control.id}
          from={base.state}
          to={pending}
          onCancel={() => setPending(null)}
          onConfirm={(justification) => {
            const rec: OverrideRecord = {
              state: pending,
              previousState: base.state,
              justification,
              analystId: `${ROLE_LABEL[role]} · demo`,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            };
            overrideControl(control.id, rec);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
