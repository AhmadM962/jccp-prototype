import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileJson, FileText, ShieldCheck, X, Download, Info, Eye } from 'lucide-react';
import { Card, Pill, Button } from '../components/ui';
import { Provenance, StateProvenance } from '../components/Provenance';
import { useAssessment } from '../store/useAssessment';
import { TOTALS } from '../data/capabilities';
import { CURRENT } from '../data/current';
import { CICSC_CONTROLS } from '../data/figures';
import { controls, snapshotFor } from '../data/controls';
import { assuranceLabel } from '../lib/assurance';

const HASH = 'e7c1 9a02 44bd 8f10 55ce 7731 a9b0 2d4f 88e0 1c6a 90ff 43d2';
const SIGNING = { alg: 'Ed25519', identity: 'JCCP Appliance — MoDS-JCCP-01', at: '2026-09-08T10:04:00+03:00' };

const FINDING_STATE = { green: 'satisfied', yellow: 'partially-satisfied', red: 'not-satisfied', unknown: 'not-evaluated', grey: 'not-applicable' } as const;

/** A few findings for the preview, taken from the real claims (one of each state that exists, and one Unknown for a collection
 *  reason): what the engine concluded, not an invented story. */
function exampleFindings(uploaded: boolean) {
  const all = controls().map((c) => ({ c, s: snapshotFor(c, uploaded) }));
  const pick = [
    all.find((x) => x.s.state === 'red'),
    all.find((x) => x.s.state === 'yellow'),
    all.find((x) => x.s.state === 'green'),
    all.find((x) => x.s.state === 'unknown' && x.s.gapReason && x.s.gapReason !== 'unauthored' && x.s.gapReason !== 'not_provided'),
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));
  return pick.map(({ c, s }) => ({
    'target-id': c.id,
    state: FINDING_STATE[s.state],
    'evidence-class': s.evidenceClass,
    ...(s.gapReason ? { 'gap-reason': s.gapReason } : {}),
    ...(s.gapBasis ? { 'gap-basis': s.gapBasis } : {}),
    ...(s.runId ? { 'module-run': s.runId } : {}),
    ...(s.partialBasis ? { 'partial-basis': s.partialBasis } : {}),
  }));
}

function oscalDoc(model: string, uploaded: boolean, overrideCount: number) {
  const t = uploaded ? TOTALS.after : TOTALS.before;
  const cicsc = CURRENT.cicsc;
  const common = {
    uuid: '0b9d5f2c-8a41-4e77-9c1e-6f2b3a5d7e10',
    metadata: {
      title: `JNCSF Assessment — ${useAssessment.getState().profile.orgName} — ${model}`,
      'last-modified': SIGNING.at,
      version: '1.0.0',
      'oscal-version': '1.1.2',
      roles: [{ id: 'assessor', title: 'JCCP Automated Assessor' }],
    },
    'jccp:coverage-metadata': {
      'assurance-level': assuranceLabel(t.assurance),
      'controls-applicable': CURRENT.totals.applicable,
      'controls-evidenced': t.evidenced,
      'controls-unevidenced': t.unknown - t.unknownUnauthored,
      'controls-unauthored': t.unknownUnauthored,
      'compliance-interval': { lower: t.interval[0] / 100, upper: t.interval[1] / 100 },
      'interval-width-points': t.widthPts,
      'analyst-overrides': overrideCount,
      note: 'Point estimates are intentionally omitted. A regulator reads the interval.',
    },
    'jccp:scope-boundary': {
      framework: 'JNCSF',
      'operates-critical-infrastructure': cicsc.criticalInfrastructure === 'yes',
      'sector': cicsc.sectorName,
      'cicsc-applies': cicsc.applies,
      'cicsc-assessed': false,
      note: cicsc.applies
        ? `CICSC (${CICSC_CONTROLS} controls) not assessed. JNCSF result alone does not represent complete assurance for this organisation.`
        : 'CICSC does not apply to this organisation.',
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
            findings: exampleFindings(uploaded),
          },
        ],
      },
    };
  }
  if (model === 'POA&M') {
    return {
      'plan-of-action-and-milestones': {
        ...common,
        'poam-items': (uploaded ? CURRENT.ranking.items : []).slice(0, 2).map((it, n) => ({
          uuid: `p${n + 1}`,
          title: it.description,
          'related-findings': [it.controlId],
          rank: it.rank,
          'magnitude-points': it.magnitudePoints,
        })),
      },
    };
  }
  const key = model === 'Catalog' ? 'catalog' : model === 'Profile' ? 'profile' : 'system-security-plan';
  return { [key]: { ...common } };
}

const models = () => [
  { name: 'Catalog', desc: `The pinned JNCSF control catalogue (${CURRENT.totals.framework} controls).` },
  { name: 'Profile', desc: `The applicable-control baseline for this organisation (${CURRENT.totals.applicable}).` },
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
          <li>· Per-control findings, evidence class and gap reasons ({CURRENT.totals.applicable} controls)</li>
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

/** The Word report: a real .docx generated in the browser from the active assessment. The `docx` library is loaded when the
 *  button is clicked, not before. Every sentence is a template filled from the result. */
function WordReport() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const orgName = useAssessment((s) => s.profile.orgName);
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  const generate = async () => {
    setState('working');
    try {
      const { generateReportBlob, reportFileName } = await import('../lib/report');
      const blob = await generateReportBlob({ organisation: orgName });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportFileName();
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <StateProvenance uploaded={uploaded} from="after.views" note="Every figure is the engine's; every sentence is a template.">
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <FileText size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Word report</h2>
            <p className="mt-1 text-sm text-slate-500">
              A real .docx for this assessment: the interval and whose limitation its width is, the four views, the exclusions, the completeness statement, the ranked
              actions with their tie group, the assurance level and its demotion checks, and a provenance appendix naming the source file and its SHA-256. No prose in
              it is written by a model.
            </p>
            {!uploaded && <p className="mt-1 text-[12px] text-slate-400">A report is made from an assessment: run the evidence bundle on the Intake screen first.</p>}
            {state === 'error' && <p className="mt-1 text-[12px] text-red-700">The report could not be generated.</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Button variant="primary" disabled={!uploaded || state === 'working'} onClick={generate} dataTour="word-report">
              <Download size={14} /> {state === 'working' ? 'Generating…' : 'Generate Word report (.docx)'}
            </Button>
            {state === 'done' && <span className="text-[11px] text-emerald-600">Generated in your browser; nothing was sent anywhere.</span>}
          </div>
        </div>
      </Card>
    </StateProvenance>
  );
}

export default function ExportScreen() {
  const [open, setOpen] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [prepared, setPrepared] = useState<{ redacted: boolean } | null>(null);

  return (
    <div className="space-y-6">
      <WordReport />
      <Provenance tier="planned"><Card>
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
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-slate-500">
              <Info size={14} /> OSCAL 1.1.2 · 5 models · {CURRENT.totals.applicable} control implementations. Validation runs in the assessment engine, not in this preview.
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
      </Card></Provenance>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models().map((m) => (
          <Provenance key={m.name} tier="illustrative"><Card>
            <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
            <p className="mt-1 text-[12px] leading-snug text-slate-500">{m.desc}</p>
            <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-accent">
              <button onClick={() => setOpen(m.name)} className="hover:underline">Preview JSON</button>
              <Provenance tier="planned" as="span" className="inline-block"><button onClick={() => setPrepared({ redacted: true })} className="inline-flex items-center gap-1 hover:underline">
                <Download size={12} /> .json
              </button></Provenance>
            </div>
          </Card></Provenance>
        ))}
        <Provenance tier="planned"><Card>
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
        </Card></Provenance>
      </div>

      <Provenance tier="illustrative"><Card title="JNCSF Catalog — a national reference" subtitle="not just an export">
        <p className="text-sm text-slate-600">
          The Catalog model is the first machine-readable representation of the JNCSF: {CURRENT.totals.framework} controls with their
          ISO 27002 and NIST 800-53 mappings, ATT&amp;CK bridges and evidence signal requirements. It can be
          published by NCSC as the authoritative reference every entity assesses against — so every assessment
          in the country is scored against exactly the same catalogue version.
        </p>
        <button onClick={() => setOpen('Catalog')} className="mt-2 text-xs font-semibold text-accent hover:underline">
          Preview the Catalog model
        </button>
      </Card></Provenance>

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
