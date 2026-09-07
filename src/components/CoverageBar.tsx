import { motion } from 'framer-motion';

interface Seg {
  label: string;
  value: number;
  colour: string;
}

// Stacked horizontal coverage bar (used on capability rows and the dashboard).
export default function CoverageBar({ segments, total }: { segments: Seg[]; total: number }) {
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            className="h-full"
            style={{ backgroundColor: s.colour }}
            initial={false}
            animate={{ width: `${(s.value / total) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.04 }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.colour }} />
            {s.label} <span className="tnum font-semibold text-slate-800">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
