import { Check } from 'lucide-react';
import { useAssessment } from '../../store/useAssessment';
import { PHASE_ORDER, PHASE_LABEL } from './nav';

export default function PhaseStepper() {
  const phase = useAssessment((s) => s.phase);
  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div className="px-4 py-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Progress</div>
      <ol className="space-y-1.5">
        {PHASE_ORDER.map((p, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={p} className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'bg-accent text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {done ? <Check size={11} /> : i + 1}
              </span>
              <span className={`text-xs ${active ? 'font-semibold text-white' : 'text-slate-400'}`}>
                {PHASE_LABEL[p]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
