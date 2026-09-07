import { useNavigate } from 'react-router-dom';
import { ArrowRight, Server } from 'lucide-react';
import { Card, Button, CodeBlock, Pill } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { requestPlan, REQUEST_PLAN_SUMMARY } from '../data/scenario';

export default function RequestPlan() {
  const navigate = useNavigate();
  const setPhase = useAssessment((s) => s.setPhase);
  const sorted = [...requestPlan].sort((a, b) => b.controlsUnlocked - a.controlsUnlocked);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Server size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              To assess your {REQUEST_PLAN_SUMMARY.applicable} applicable controls, we need{' '}
              {REQUEST_PLAN_SUMMARY.artifactCount} artifacts from {REQUEST_PLAN_SUMMARY.systemCount} systems.
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Generated before any collection. This is the "how would I know what I'm missing" answer, made
              concrete — sorted by controls unlocked per artifact.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Evidence request plan" subtitle={`Top ${sorted.length} of ${REQUEST_PLAN_SUMMARY.artifactCount} artifacts`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Artifact</th>
                <th className="py-2 pr-4">Source system</th>
                <th className="py-2 pr-4 text-right">Controls</th>
                <th className="py-2 pr-4">Effort</th>
                <th className="py-2">How to produce it</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.artifact} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 font-medium text-slate-800">{a.artifact}</td>
                  <td className="py-3 pr-4 text-slate-600">{a.source}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className="tnum font-bold text-slate-900">{a.controlsUnlocked}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <Pill tone="slate">{a.effort}</Pill>
                  </td>
                  <td className="py-3">
                    <div className="max-w-md">
                      <CodeBlock code={a.command} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
