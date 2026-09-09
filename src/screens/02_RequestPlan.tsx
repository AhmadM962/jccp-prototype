import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Server, Cpu, HardDriveDownload, ClipboardList } from 'lucide-react';
import { Card, Button, CodeBlock, Pill } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { requestPlan, REQUEST_PLAN_SUMMARY, type RequestArtifact } from '../data/scenario';

const TOP_N = 10;

function ArtifactTable({ rows, tourFirstRow }: { rows: RequestArtifact[]; tourFirstRow?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
            <th className="py-2 pr-4">Artifact</th>
            <th className="py-2 pr-4">Source system</th>
            <th className="py-2 pr-4">Owner</th>
            <th className="py-2 pr-4 text-right">Controls</th>
            <th className="py-2 pr-4">Effort</th>
            <th className="py-2">How to produce it</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => (
            <tr key={a.artifact} data-tour={i === 0 ? tourFirstRow : undefined} className="border-b border-slate-100 align-top">
              <td className="py-3 pr-4 font-medium text-slate-800">
                {a.artifact}
                <div className="text-[11px] font-normal text-slate-400">{a.formatHint}</div>
              </td>
              <td className="py-3 pr-4 text-slate-600">{a.source}</td>
              <td className="py-3 pr-4 text-slate-600">{a.owner}</td>
              <td className="py-3 pr-4 text-right">
                <span className="tnum font-bold text-slate-900">{a.controlsUnlocked}</span>
              </td>
              <td className="py-3 pr-4"><Pill tone="slate">{a.effort}</Pill></td>
              <td className="py-3">
                <div className="max-w-md">
                  <CodeBlock code={a.command} />
                </div>
                {a.declineCost !== undefined && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Declining leaves {a.declineCost} control{a.declineCost === 1 ? '' : 's'} permanently Unknown.
                  </p>
                )}
              </td>
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
  const [showAll, setShowAll] = useState(false);
  const [collector, setCollector] = useState<string | null>(null);

  const automated = useMemo(
    () => requestPlan.filter((r) => r.method === 'automated').sort((a, b) => b.controlsUnlocked - a.controlsUnlocked),
    [],
  );
  const manual = useMemo(
    () => requestPlan.filter((r) => r.method === 'manual').sort((a, b) => b.controlsUnlocked - a.controlsUnlocked),
    [],
  );
  const allSorted = useMemo(() => [...requestPlan].sort((a, b) => b.controlsUnlocked - a.controlsUnlocked), []);

  return (
    <div className="space-y-6">
      <Card dataTour="plan-header">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Server size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              To assess your {REQUEST_PLAN_SUMMARY.applicable} applicable controls, we need{' '}
              {REQUEST_PLAN_SUMMARY.artifactCount} artifacts from {REQUEST_PLAN_SUMMARY.systemCount} systems.
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Generated before any collection — the "how would I know what I'm missing" answer made concrete.
              Provide all {REQUEST_PLAN_SUMMARY.artifactCount} → projected coverage{' '}
              <span className="tnum font-semibold text-slate-700">{REQUEST_PLAN_SUMMARY.projectedCoveragePct}%</span>.
              The remaining {REQUEST_PLAN_SUMMARY.uncollectable} controls are structurally uncollectable and stay
              Unknown regardless.
            </p>
          </div>
        </div>
      </Card>

      <Card
        dataTour="plan-automated"
        title="Automated"
        subtitle={`${REQUEST_PLAN_SUMMARY.automatedCount} artifacts collected by the signed collector · covers ${REQUEST_PLAN_SUMMARY.automatedControls} controls · ~15 min`}
        right={
          <div data-tour="plan-collectors" className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCollector('Windows/AD')}>
                <HardDriveDownload size={13} /> Windows/AD collector
              </Button>
              <Button variant="outline" onClick={() => setCollector('Linux')}>
                <Cpu size={13} /> Linux collector
              </Button>
            </div>
            {collector && (
              <span className="text-[11px] text-emerald-600">
                {collector} collector package prepared (simulated) · Ed25519-signed · run on-premise
              </span>
            )}
          </div>
        }
      >
        <ArtifactTable rows={automated} tourFirstRow="plan-firstrow" />
      </Card>

      <Card
        title="Manual"
        subtitle={`${REQUEST_PLAN_SUMMARY.manualCount} artifacts requiring a console export by the named owner`}
      >
        <ArtifactTable rows={manual} />
      </Card>

      <Card
        title="Full plan"
        subtitle={showAll ? `All ${allSorted.length} artifacts by controls unlocked` : `Top ${TOP_N} of ${allSorted.length} by controls unlocked`}
        right={
          <button onClick={() => setShowAll((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
            <ClipboardList size={13} /> {showAll ? 'Show top 10' : `Show all ${allSorted.length}`}
          </button>
        }
      >
        <ArtifactTable rows={showAll ? allSorted : allSorted.slice(0, TOP_N)} />
      </Card>

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
