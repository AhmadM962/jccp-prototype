import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertCircle, Upload } from 'lucide-react';
import { Card, Pill, Button } from '../components/ui';
import { Provenance } from '../components/Provenance';
import { useAssessment } from '../store/useAssessment';
import { planSignals, requestedSignals } from '../lib/plan';

// The Contributor role's home screen — NOT the dashboard. Own submissions only. The tasks are the signals the engine's
// evidence requests ask for (the same ones Remediation lists): derived, with the controls that need each. The assessment
// carries no due dates, owners or notes, so none is shown.
export default function Tasks() {
  const uploadedSlots = useAssessment((s) => s.uploadedSlots);
  const uploadSlot = useAssessment((s) => s.uploadSlot);
  const orgName = useAssessment((s) => s.profile.orgName);

  const tasks = useMemo(() => {
    const asked = requestedSignals();
    return planSignals()
      .filter((s) => asked.has(s.signal))
      .map((s) => ({ signal: s.signal, controls: s.controls, submitted: Boolean(uploadedSlots[s.signal]) }));
  }, [uploadedSlots]);

  const submitted = tasks.filter((t) => t.submitted).length;
  const todo = tasks.length - submitted;

  return (
    <Provenance tier="illustrative" className="space-y-5" note="The tasks are derived from the engine's evidence requests; the assignment itself (who is asked, and when) is a demonstration.">
      <Card>
        <h2 className="text-lg font-bold text-slate-900">My tasks</h2>
        <p className="mt-1 text-sm text-slate-500">
          You have been asked to provide evidence for the {orgName} assessment. You can see your own submissions and their status — not the assessment result.
        </p>
        <div data-testid="task-counts" className="mt-3 flex gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={14} /> 0 accepted</span>
          <span className="inline-flex items-center gap-1.5 text-blue-700"><Clock size={14} /> {submitted} awaiting review</span>
          <span className="inline-flex items-center gap-1.5 text-amber-700"><AlertCircle size={14} /> {todo} to do</span>
        </div>
      </Card>

      <div className="space-y-3">
        {tasks.map((t) => (
          <Card key={t.signal}>
            <div data-testid={`task-${t.signal}`} className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Pill tone={t.submitted ? 'blue' : 'slate'}>{t.submitted ? 'submitted' : 'to do'}</Pill>
                  <h3 className="font-mono text-sm font-bold text-slate-900">{t.signal}</h3>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                  <span>asked for by {t.controls.length} control{t.controls.length === 1 ? '' : 's'}:</span>
                  {t.controls.map((c) => (
                    <Link key={c} to={`/control/${c}`} className="font-mono text-[11px] text-accent hover:underline">{c}</Link>
                  ))}
                </div>
              </div>
              {!t.submitted && (
                <Button variant="primary" onClick={() => uploadSlot(t.signal)}>
                  <Upload size={13} /> Submit
                </Button>
              )}
            </div>
          </Card>
        ))}
        {tasks.length === 0 && <Card><p className="text-sm text-slate-500">The engine asks for no further evidence in this assessment.</p></Card>}
      </div>
    </Provenance>
  );
}
