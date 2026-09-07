import { useState } from 'react';
import { FileJson, ShieldCheck, X } from 'lucide-react';
import { Card, Pill, Button } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { TOTALS } from '../data/capabilities';
import { nationalRollup } from '../data/remediation';

const HASH = 'e7c1 9a02 44bd 8f10 55ce 7731 a9b0 2d4f 88e0 1c6a 90ff 43d2';

function oscalDoc(model: string, uploaded: boolean) {
  const t = uploaded ? TOTALS.after : TOTALS.before;
  const common = {
    uuid: '0b9d5f2c-8a41-4e77-9c1e-6f2b3a5d7e10',
    metadata: {
      title: `JNCSF Assessment — Ministry of Digital Services — ${model}`,
      'last-modified': '2026-09-07T10:04:00+03:00',
      version: '1.0.0',
      'oscal-version': '1.1.2',
      roles: [{ id: 'assessor', title: 'JCCP Automated Assessor' }],
    },
    'jccp:coverage-metadata': {
      'assurance-level': uploaded ? 'L2 — Tool-evidenced' : 'L1 — Documented',
      'controls-applicable': TOTALS.applicable,
      'controls-evidenced': t.evidenced,
      'controls-unevidenced': t.unknown,
      'compliance-interval': { lower: t.interval[0] / 100, upper: t.interval[1] / 100 },
      'interval-width-points': t.widthPts,
      note: 'Point estimates are intentionally omitted. A regulator reads the interval.',
    },
  };
  if (model === 'Assessment Results') {
    return {
      'assessment-results': {
        ...common,
        'local-definitions': {},
        results: [
          {
            uuid: 'a1c2e3f4-0000-4444-8888-abcabcabcabc',
            title: 'Automated collection run 2026-09-05',
            start: '2026-09-05T09:00:00+03:00',
            findings: [
              { 'target-id': 'JNCSF-102', state: uploaded ? 'not-satisfied' : 'not-evaluated', 'evidence-class': uploaded ? 'artifact' : 'testimonial' },
              { 'target-id': 'JNCSF-435', state: uploaded ? 'not-satisfied' : 'not-evaluated' },
              { 'target-id': 'JNCSF-173', state: 'not-evaluated', 'gap-reason': uploaded ? 'module_failed' : 'not_provided' },
            ],
          },
        ],
      },
    };
  }
  if (model === 'POA&M') {
    return {
      'plan-of-action-and-milestones': {
        ...common,
        'poam-items': [
          { uuid: 'p1', title: 'Enforce MFA on all privileged accounts', 'related-findings': ['JNCSF-102', 'JNCSF-435'], 'controls-closed': 11 },
          { uuid: 'p2', title: 'Enable missing audit subcategories', 'related-findings': ['JNCSF-30'], 'controls-closed': 9 },
        ],
      },
    };
  }
  const key =
    model === 'Catalog'
      ? 'catalog'
      : model === 'Profile'
      ? 'profile'
      : 'system-security-plan';
  return { [key]: { ...common } };
}

function JsonModal({ model, onClose }: { model: string; onClose: () => void }) {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const json = JSON.stringify(oscalDoc(model, uploaded), null, 2);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
          <span className="font-mono text-xs text-slate-300">{model.toLowerCase().replace(/\W+/g, '-')}.json</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <pre className="scroll-slim max-h-[72vh] overflow-auto p-4 text-[12px] leading-relaxed">
          <code className="font-mono whitespace-pre text-emerald-200">{json}</code>
        </pre>
      </div>
    </div>
  );
}

const MODELS = [
  { name: 'Catalog', desc: 'The pinned JNCSF control catalogue (576 controls).' },
  { name: 'Profile', desc: 'The applicable-control baseline for this organisation (340).' },
  { name: 'System Security Plan', desc: 'Declared implementation of each applicable control.' },
  { name: 'Assessment Results', desc: 'Findings, evidence class, and gap reasons per control.' },
  { name: 'POA&M', desc: 'Plan of action & milestones — ranked remediation.' },
];

export default function ExportScreen() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <FileJson size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">OSCAL submission package</h2>
            <p className="mt-1 text-sm text-slate-500">
              Five OSCAL models. Coverage metadata and the assurance level travel inside the package, so the
              regulator sees the interval — not a bare number.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODELS.map((m) => (
          <Card key={m.name}>
            <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
            <p className="mt-1 text-[12px] leading-snug text-slate-500">{m.desc}</p>
            <button
              onClick={() => setOpen(m.name)}
              className="mt-3 text-xs font-semibold text-accent hover:underline"
            >
              Preview JSON
            </button>
          </Card>
        ))}
        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Signed package</h3>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-slate-500">
            Packages are signed so a submission cannot be altered undetected.
          </p>
          <code className="mt-2 block break-all rounded bg-slate-100 px-2 py-1.5 font-mono text-[10px] text-slate-600">
            {HASH}
          </code>
        </Card>
      </div>

      <Card title="National rollup preview" subtitle="Anonymised NCSC-facing sector view — 12 fictional entities">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Compliance distribution
            </div>
            <div className="space-y-2">
              {nationalRollup.distribution.map((d) => (
                <div key={d.band} className="flex items-center gap-3">
                  <span className="tnum w-16 text-xs text-slate-500">{d.band}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(d.count / nationalRollup.entities) * 100}%` }}
                    />
                  </div>
                  <span className="tnum w-6 text-right text-xs font-semibold text-slate-700">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Most frequently failed controls
            </div>
            <ul className="space-y-1.5">
              {nationalRollup.mostFailedControls.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-700">
                    <span className="font-mono font-semibold">{c.id}</span> · {c.description}
                  </span>
                  <Pill tone="red">{c.failingEntities}/12</Pill>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {open && <JsonModal model={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
