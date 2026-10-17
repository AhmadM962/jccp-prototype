import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Server, Cpu, HardDriveDownload, ClipboardList } from 'lucide-react';
import { Card, Button, Pill } from '../components/ui';
import { Provenance, StateProvenance } from '../components/Provenance';
import { useAssessment } from '../store/useAssessment';
import { planSignals, planSummary, REASON_WORDS, type PlanSignal } from '../lib/plan';

const TOP_N = 10;

function statusPill(s: PlanSignal['status']) {
  if (s === 'provided') return <Pill tone="green">provided</Pill>;
  return <Pill tone="orange">{REASON_WORDS[s] ?? s}</Pill>;
}

/** The signals the plan asks for. Each row is the engine's: the signal's name and the controls whose requirement names it. */
function SignalTable({ rows, showStatus, tourFirstRow }: { rows: PlanSignal[]; showStatus: boolean; tourFirstRow?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
            <th className="py-2 pr-4">Signal</th>
            <th className="py-2 pr-4 text-right">Controls</th>
            <th className="py-2 pr-4">Needed by</th>
            {showStatus && <th className="py-2">After the upload</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.signal} data-testid={`signal-${s.signal}`} data-controls={s.controls.length} data-status={s.status} data-tour={i === 0 ? tourFirstRow : undefined} className="border-b border-slate-100 align-top">
              <td className="py-2.5 pr-4 font-mono text-[12px] font-medium text-slate-800">{s.signal}</td>
              <td className="py-2.5 pr-4 text-right">
                <span className="tnum font-bold text-slate-900">{s.controls.length}</span>
              </td>
              <td className="py-2.5 pr-4">
                <div className="flex max-w-md flex-wrap gap-x-2 gap-y-0.5">
                  {s.controls.map((c) => (
                    <Link key={c} to={`/control/${c}`} className="font-mono text-[11px] text-accent hover:underline">{c}</Link>
                  ))}
                </div>
              </td>
              {showStatus && <td className="py-2.5">{statusPill(s.status)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RequestPlan() {
  const navigate = useNavigate();
  const setPhase = useAssessment((s) => s.setPhase);
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [collector, setCollector] = useState<string | null>(null);

  const sum = planSummary();
  const sigs = planSignals();
  const documents = sigs.filter((s) => s.documentary);
  const fromSystems = sigs.filter((s) => !s.documentary);

  const card = (key: 'documents' | 'systems', title: string, subtitle: string, rows: PlanSignal[], tourFirstRow?: string, right?: React.ReactNode) => {
    const open = showAll[key];
    return (
      <StateProvenance uploaded={uploaded} from="coverage" key={key}>
        <Card
          dataTour={key === 'systems' ? 'plan-automated' : undefined}
          title={title}
          subtitle={subtitle}
          right={
            right ?? (
              <button onClick={() => setShowAll((o) => ({ ...o, [key]: !open }))} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                <ClipboardList size={13} /> {open ? `Show top ${TOP_N}` : `Show all ${rows.length}`}
              </button>
            )
          }
        >
          <SignalTable rows={open ? rows : rows.slice(0, TOP_N)} showStatus={uploaded} tourFirstRow={tourFirstRow} />
          {right && rows.length > TOP_N && (
            <button onClick={() => setShowAll((o) => ({ ...o, [key]: !open }))} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <ClipboardList size={13} /> {open ? `Show top ${TOP_N}` : `Show all ${rows.length}`}
            </button>
          )}
        </Card>
      </StateProvenance>
    );
  };

  return (
    <div className="space-y-6">
      <StateProvenance uploaded={uploaded} from="coverage">
        <Card dataTour="plan-header">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Server size={22} />
            </div>
            <div>
              <h2 data-testid="plan-headline" className="text-lg font-bold text-slate-900">
                To assess the {sum.authoredScope} controls that have an authored evidence requirement, we need {sum.signals} signals: {sum.documentary} documents
                and {sum.fromSystems} states read from systems.
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Calculated from the evidence requirements the engine holds, before any collection: the &ldquo;how would I know what I&rsquo;m missing&rdquo;
                answer made concrete. Provide all {sum.signals} → coverage can reach at most{' '}
                <span className="tnum font-semibold text-slate-700">{sum.maxCoveragePct}%</span>.
                The other {sum.unauthored} controls have no evidence requirement authored, so the
                plan cannot ask for anything that would establish that any of them is met. They stay Unknown unless an artifact collected for another control happens to show one unmet.
              </p>
            </div>
          </div>
        </Card>
      </StateProvenance>

      {card(
        'systems',
        'Read from systems',
        `${fromSystems.length} signals, collected by a read-only collector the organisation runs on its own systems`,
        fromSystems,
        'plan-firstrow',
        <Provenance tier="planned">
          <div data-tour="plan-collectors" className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCollector('Windows/AD')}>
                <HardDriveDownload size={13} /> Windows/AD collector
              </Button>
              <Button variant="outline" onClick={() => setCollector('Linux')}>
                <Cpu size={13} /> Linux collector
              </Button>
            </div>
            {collector && <span className="text-[11px] text-emerald-600">{collector} collector package prepared (simulated) · run on-premise</span>}
          </div>
        </Provenance>,
      )}

      {card('documents', 'Documents', `${documents.length} signals, supplied by the organisation`, documents)}

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setPhase('intake');
            navigate('/intake');
          }}
        >
          Continue to intake <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
