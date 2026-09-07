import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Users } from 'lucide-react';
import { Card, Pill, Button, SectionLabel } from '../components/ui';
import StateBadge from '../components/StateBadge';
import EvidenceTrail from '../components/EvidenceTrail';
import AttackExposure from '../components/AttackExposure';
import { useAssessment } from '../store/useAssessment';
import {
  controlById,
  snapshotFor,
  EVIDENCE_CLASS_LABEL,
  GAP_REASON_LABEL,
  EVIDENCE_CEILING,
  type EvidenceClass,
  type ControlState,
} from '../data/controls';
import { capabilityById } from '../data/capabilities';
import { attackBridge } from '../data/attack';
import { evidenceFor } from '../data/evidence';
import { STATE_META } from '../components/StateBadge';

const LADDER: EvidenceClass[] = ['none', 'testimonial', 'artifact', 'analyst_signed'];

export default function ControlDetail() {
  const { id } = useParams();
  const control = id ? controlById(id) : undefined;
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrides = useAssessment((s) => s.overriddenControls);
  const overrideControl = useAssessment((s) => s.overrideControl);
  const clearOverride = useAssessment((s) => s.clearOverride);

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
  const effectiveState: ControlState = overrides[control.id] ?? base.state;
  const cap = capabilityById(control.capability);
  const attack = control.attackKey ? attackBridge[control.attackKey] : undefined;
  const evItems = evidenceFor(control.id).filter((it) => uploaded || it.type === 'testimonial');
  const ceiling = EVIDENCE_CEILING[base.evidenceClass];

  return (
    <div className="space-y-5">
      <Link to="/gap-matrix" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <ArrowLeft size={15} /> Gap Matrix
      </Link>

      {/* 1. Header */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{control.id}</span>
              {cap && <Pill tone="slate">{cap.shortName}</Pill>}
              {control.showcase && <Pill tone="amber">showcase control</Pill>}
              {uploaded && control.changed && <Pill tone="blue">promoted by upload</Pill>}
            </div>
            <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-900">{control.description}</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StateBadge state={effectiveState} size="lg" />
            <Pill tone={base.evidenceClass === 'artifact' ? 'green' : base.evidenceClass === 'testimonial' ? 'blue' : 'slate'}>
              {EVIDENCE_CLASS_LABEL[base.evidenceClass]}
            </Pill>
            {base.state === 'unknown' && base.gapReason && (
              <Pill tone="violet">{GAP_REASON_LABEL[base.gapReason]}</Pill>
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
                <Pill key={ref} tone="blue" title={control.isoNames[i]}>
                  {ref} · {control.isoNames[i]}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>NIST 800-53</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {control.nist.length === 0 && <span className="text-sm text-slate-400">—</span>}
              {control.nist.map((ref, i) => (
                <Pill key={ref} tone="slate" title={control.nistNames[i]}>
                  {ref} · {control.nistNames[i]}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Signals */}
      <Card title="Required signals" subtitle="What the assessment engine needs to reach a verdict">
        <div className="flex flex-wrap gap-1.5">
          {control.requiredSignals.map((sig) => {
            const have = uploaded && base.evidenceClass === 'artifact';
            return (
              <span
                key={sig}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] ${
                  have ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                {have && <Check size={10} />} {sig}
              </span>
            );
          })}
        </div>
      </Card>

      {/* 3. Evidence trail */}
      <Card title="Evidence trail" subtitle="Every finding traces to a quote or an artifact locator with a hash">
        <EvidenceTrail items={evItems} />
      </Card>

      {/* 4. Evidence sufficiency ladder */}
      <Card title="Evidence sufficiency" subtitle="The evidence class sets the highest state a control may reach">
        <div className="flex items-stretch gap-2">
          {LADDER.map((cls) => {
            const current = cls === base.evidenceClass;
            return (
              <div
                key={cls}
                className={`flex-1 rounded-lg border p-3 text-center ${
                  current ? 'border-accent bg-accent/5' : 'border-slate-200'
                }`}
              >
                <div className={`text-xs font-semibold ${current ? 'text-slate-900' : 'text-slate-400'}`}>
                  {EVIDENCE_CLASS_LABEL[cls]}
                </div>
                <div className="mt-1.5 flex justify-center">
                  <StateBadge state={EVIDENCE_CEILING[cls]} size="sm" showLabel={false} />
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  ceiling: {STATE_META[EVIDENCE_CEILING[cls]].label}
                </div>
                {current && <div className="mt-1 text-[10px] font-bold uppercase text-accent">current</div>}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-slate-500">
          This control's evidence is <strong>{EVIDENCE_CLASS_LABEL[base.evidenceClass]}</strong>, so it can
          reach at most <strong>{STATE_META[ceiling].label}</strong>. Testimony alone can never mark a control
          Compliant.
        </p>
      </Card>

      {/* 5. ATT&CK exposure */}
      {attack && (
        <Card title="ATT&CK exposure" subtitle="Control → Mitigation → Techniques">
          <AttackExposure
            controlId={control.id}
            entry={attack}
            enforced={effectiveState === 'green'}
          />
        </Card>
      )}

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

      {/* 7. Analyst actions */}
      <Card title="Analyst actions" subtitle="Local to this demo session — does not alter the scoring engine">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={effectiveState === 'green' ? 'primary' : 'outline'}
            onClick={() => overrideControl(control.id, 'green')}
          >
            Accept as Compliant
          </Button>
          <Button
            variant={effectiveState === 'red' ? 'danger' : 'outline'}
            onClick={() => overrideControl(control.id, 'red')}
          >
            Override to Gap
          </Button>
          <Button variant="outline" onClick={() => overrideControl(control.id, 'unknown')}>
            Request more evidence
          </Button>
          {overrides[control.id] && (
            <Button variant="ghost" onClick={() => clearOverride(control.id)}>
              Clear override (engine verdict: {STATE_META[base.state].label})
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
