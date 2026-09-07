import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileJson, ShieldCheck, X, Download, BadgeCheck, Eye } from 'lucide-react';
import { Card, Pill, Button } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { TOTALS } from '../data/capabilities';

const HASH = 'e7c1 9a02 44bd 8f10 55ce 7731 a9b0 2d4f 88e0 1c6a 90ff 43d2';
const SIGNING = { alg: 'Ed25519', identity: 'JCCP Appliance — MoDS-JCCP-01', at: '2026-09-08T10:04:00+03:00' };

function oscalDoc(model: string, uploaded: boolean, overrideCount: number) {
  const t = uploaded ? TOTALS.after : TOTALS.before;
  const common = {
    uuid: '0b9d5f2c-8a41-4e77-9c1e-6f2b3a5d7e10',
    metadata: {
      title: `JNCSF Assessment — Ministry of Digital Services — ${model}`,
      'last-modified': SIGNING.at,
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
      'analyst-overrides': overrideCount,
      note: 'Point estimates are intentionally omitted. A regulator reads the interval.',
    },
  };
  if (model === 'Assessment Results') {
    return {
      'assessment-results': {
        ...common,
        results: [
          {
            uuid: 'a1c2e3f4-0000-4444-8888-abcabcabcabc',
            title: 'Automated collection run 2026-09-05',
            start: '2026-09-05T09:00:00+03:00',
            findings: [
              { 'target-id': 'JNCSF-102', state: uploaded ? 'not-satisfied' : 'not-evaluated', 'evidence-class': uploaded ? 'artifact' : 'testimonial', attestation: overrideCount > 0 ? 'analyst-attested' : 'engine' },
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
  const key = model === 'Catalog' ? 'catalog' : model === 'Profile' ? 'profile' : 'system-security-plan';
  return { [key]: { ...common } };
}

const MODELS = [
  { name: 'Catalog', desc: 'The pinned JNCSF control catalogue (576 controls).' },
  { name: 'Profile', desc: 'The applicable-control baseline for this organisation (340).' },
  { name: 'System Security Plan', desc: 'Declared implementation of each applicable control.' },
  { name: 'Assessment Results', desc: 'Findings, evidence class, and gap reasons per control.' },
  { name: 'POA&M', desc: 'Plan of action & milestones — ranked remediation.' },
];

function JsonModal({ model, onClose }: { model: string; onClose: () => void }) {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrideCount = Object.keys(useAssessment((s) => s.overriddenControls)).length;
  const json = JSON.stringify(oscalDoc(model, uploaded, overrideCount), null, 2);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
          <span className="font-mono text-xs text-slate-300">{model.toLowerCase().replace(/\W+/g, '-')}.json</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        <pre className="scroll-slim max-h-[72vh] overflow-auto p-4 text-[12px] leading-relaxed">
          <code className="font-mono whitespace-pre text-emerald-200">{json}</code>
        </pre>
      </div>
    </div>
  );
}

function ReviewModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (redact: boolean) => void }) {
  const [redact, setRedact] = useState(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Pre-submission review</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
        </div>
        <p className="mt-2 text-sm text-slate-600">The package discloses to NCSC:</p>
        <ul className="mt-1.5 space-y-1 text-[13px] text-slate-700">
          <li>· The compliance interval, coverage and assurance level</li>
          <li>· Per-control findings, evidence class and gap reasons (340 controls)</li>
          <li>· The POA&amp;M and its target dates</li>
          <li>· Evidence <em>locators and hashes</em> — not the raw files</li>
          <li className="text-amber-700">· Evidence excerpts may contain account names (e.g. <code className="font-mono">svc-backup</code>, <code className="font-mono">a.haddad-adm</code>)</li>
        </ul>
        <label className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
          <input type="checkbox" checked={redact} onChange={(e) => setRedact(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>
            Redact personal data in evidence excerpts before submission
            <span className="block text-[11px] text-slate-400">recommended — replaces account names with role-typed placeholders</span>
          </span>
        </label>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSubmit(redact)}>Prepare signed package</Button>
        </div>
      </div>
    </div>
  );
}

export default function ExportScreen() {
  const [open, setOpen] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [prepared, setPrepared] = useState<{ redacted: boolean } | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <FileJson size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">OSCAL submission package</h2>
            <p className="mt-1 text-sm text-slate-500">
              Five OSCAL models. Coverage metadata and the assurance level travel inside the package, so the
              regulator sees the interval — not a bare number.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-emerald-700">
              <BadgeCheck size={14} /> Validates against OSCAL 1.1.2 · 5 models · 340 control implementations · 0 errors
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Button variant="primary" onClick={() => setReview(true)}>
              <Download size={14} /> Download package (.zip)
            </Button>
            {prepared && (
              <span className="text-[11px] text-emerald-600">
                Package prepared (simulated) · {prepared.redacted ? 'personal data redacted' : 'not redacted'} · Ed25519-signed
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODELS.map((m) => (
          <Card key={m.name}>
            <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
            <p className="mt-1 text-[12px] leading-snug text-slate-500">{m.desc}</p>
            <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-accent">
              <button onClick={() => setOpen(m.name)} className="hover:underline">Preview JSON</button>
              <button onClick={() => setPrepared({ redacted: true })} className="inline-flex items-center gap-1 hover:underline">
                <Download size={12} /> .json
              </button>
            </div>
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
          <dl className="mt-2 space-y-0.5 text-[11px] text-slate-600">
            <div className="flex justify-between"><dt className="text-slate-400">algorithm</dt><dd>{SIGNING.alg}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">signing identity</dt><dd className="text-right">{SIGNING.identity}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">timestamp</dt><dd className="tnum">{SIGNING.at}</dd></div>
          </dl>
          <code className="mt-2 block break-all rounded bg-slate-100 px-2 py-1.5 font-mono text-[10px] text-slate-600">{HASH}</code>
          <button onClick={() => setPrepared((p) => p ?? { redacted: true })} className="mt-2 text-[11px] font-semibold text-accent hover:underline">
            Verify signature
          </button>
        </Card>
      </div>

      <Card title="JNCSF Catalog — a national reference" subtitle="not just an export">
        <p className="text-sm text-slate-600">
          The Catalog model is the first machine-readable representation of the JNCSF: 576 controls with their
          ISO 27002 and NIST 800-53 mappings, ATT&amp;CK bridges and evidence signal requirements. It can be
          published by NCSC as the authoritative reference every entity assesses against — so every assessment
          in the country is scored against exactly the same catalogue version.
        </p>
        <button onClick={() => setOpen('Catalog')} className="mt-2 text-xs font-semibold text-accent hover:underline">
          Preview the Catalog model
        </button>
      </Card>

      <div className="flex justify-end">
        <Link to="/rollup" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          <Eye size={14} /> National rollup (Analyst / Regulator)
        </Link>
      </div>

      {open && <JsonModal model={open} onClose={() => setOpen(null)} />}
      {review && (
        <ReviewModal
          onClose={() => setReview(false)}
          onSubmit={(redact) => {
            setPrepared({ redacted: redact });
            setReview(false);
          }}
        />
      )}
    </div>
  );
}
