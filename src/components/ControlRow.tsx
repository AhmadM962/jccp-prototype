import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import StateBadge from './StateBadge';
import { Pill } from './ui';
import {
  EVIDENCE_CLASS_LABEL,
  GAP_REASON_LABEL,
  type Control,
  type ControlSnapshot,
} from '../data/controls';

const evTone = (c: string): 'slate' | 'blue' | 'green' | 'violet' =>
  c === 'artifact' ? 'green' : c === 'testimonial' ? 'blue' : c === 'analyst_signed' ? 'violet' : 'slate';

export default function ControlRow({
  control,
  snap,
  highlight = false,
}: {
  control: Control;
  snap: ControlSnapshot;
  highlight?: boolean;
}) {
  return (
    <motion.div layout initial={false}>
      <Link
        to={`/control/${control.id}`}
        className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm transition hover:bg-slate-50 ${
          highlight ? 'bg-blue-50/60' : ''
        }`}
      >
        <div className="w-24 shrink-0">
          <StateBadge state={snap.state} size="sm" />
        </div>
        <div className="tnum w-24 shrink-0 font-mono text-xs font-semibold text-slate-500">{control.id}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-slate-800">{control.description}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pill tone={evTone(snap.evidenceClass)}>{EVIDENCE_CLASS_LABEL[snap.evidenceClass]}</Pill>
            {snap.state === 'unknown' && snap.gapReason && (
              <Pill tone="violet">{GAP_REASON_LABEL[snap.gapReason]}</Pill>
            )}
            {highlight && (
              <Pill tone="blue">
                <Sparkles size={11} /> promoted
              </Pill>
            )}
            {control.showcase && <Pill tone="amber">showcase</Pill>}
          </div>
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-300" />
      </Link>
    </motion.div>
  );
}
