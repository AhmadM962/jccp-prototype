import { useMemo } from 'react';
import { CheckCircle2, Clock, AlertCircle, Upload } from 'lucide-react';
import { Card, Pill, Button } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { contributorTasks } from '../data/collaboration';
import { requestPlan } from '../data/scenario';

// The Contributor role's home screen — NOT the dashboard. Own submissions only.
export default function Tasks() {
  const uploadedSlots = useAssessment((s) => s.uploadedSlots);
  const uploadSlot = useAssessment((s) => s.uploadSlot);

  const tasks = useMemo(
    () =>
      contributorTasks.map((t) => ({
        ...t,
        status: uploadedSlots[t.artifact] ? ('submitted' as const) : t.status,
        controls: requestPlan.find((r) => r.artifact === t.artifact)?.controlsUnlocked ?? 0,
      })),
    [uploadedSlots],
  );

  const done = tasks.filter((t) => t.status === 'accepted').length;
  const submitted = tasks.filter((t) => t.status === 'submitted').length;
  const todo = tasks.filter((t) => t.status === 'to do' || t.status === 'changes requested').length;

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-lg font-bold text-slate-900">My tasks</h2>
        <p className="mt-1 text-sm text-slate-500">
          You have been asked to provide evidence for the Ministry of Digital Services assessment. You can see
          your own submissions and their status — not the assessment result.
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={14} /> {done} accepted</span>
          <span className="inline-flex items-center gap-1.5 text-blue-700"><Clock size={14} /> {submitted} awaiting review</span>
          <span className="inline-flex items-center gap-1.5 text-amber-700"><AlertCircle size={14} /> {todo} to do</span>
        </div>
      </Card>

      <div className="space-y-3">
        {tasks.map((t) => {
          const tone =
            t.status === 'accepted' ? 'green' : t.status === 'submitted' ? 'blue' : t.status === 'changes requested' ? 'red' : 'slate';
          return (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill tone={tone}>{t.status}</Pill>
                    <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                  </div>
                  <div className="mt-1 text-[12px] text-slate-500">
                    Artifact: {t.artifact} · due {t.due}
                    {t.controls > 0 && <> · unlocks {t.controls} controls</>}
                  </div>
                  {t.note && <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-[12px] text-amber-800">{t.note}</p>}
                </div>
                {(t.status === 'to do' || t.status === 'changes requested') && (
                  <Button variant="primary" onClick={() => uploadSlot(t.artifact)}>
                    <Upload size={13} /> Submit
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
