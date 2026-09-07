import { motion } from 'framer-motion';

// ⭐ The signature component. Compliance is ALWAYS an interval, never a single number.
// The band's width is the visible cost of missing evidence.

interface Props {
  lower: number; // percent, e.g. 50.0
  upper: number; // percent, e.g. 87.1
  coveragePct?: number;
  widthPts?: number;
  variant?: 'hero' | 'row';
  caption?: string;
  subline?: string;
}

const fmt = (n: number) => n.toFixed(1);

export default function ScoreInterval({
  lower,
  upper,
  coveragePct,
  widthPts,
  variant = 'hero',
  caption = 'Compliance interval',
  subline,
}: Props) {
  const width = widthPts ?? upper - lower;
  const hero = variant === 'hero';

  return (
    <div className={hero ? 'w-full' : 'w-full'}>
      {hero && (
        <div className="mb-3 flex items-baseline justify-center gap-3">
          <span className="tnum text-3xl font-bold text-slate-900">{fmt(lower)}%</span>
          <span className="text-slate-300">—</span>
          <span className="tnum text-3xl font-bold text-slate-900">{fmt(upper)}%</span>
        </div>
      )}

      <div className={`relative w-full ${hero ? 'h-9' : 'h-5'} rounded-md bg-slate-100 ring-1 ring-inset ring-slate-200`}>
        {/* gridlines at 25/50/75 */}
        {[25, 50, 75].map((g) => (
          <div key={g} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ left: `${g}%` }} />
        ))}
        {/* the shaded interval band */}
        <motion.div
          className="absolute top-0 bottom-0 rounded-md bg-accent/25 ring-1 ring-inset ring-accent/50"
          initial={false}
          animate={{ left: `${lower}%`, width: `${Math.max(upper - lower, 0.5)}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
        {/* lower + upper edge markers */}
        <motion.div
          className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-accent"
          initial={false}
          animate={{ left: `${lower}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
        <motion.div
          className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-accent"
          initial={false}
          animate={{ left: `${upper}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
        {hero && (
          <>
            <span className="absolute -bottom-6 -translate-x-1/2 text-[11px] text-slate-400" style={{ left: '0%' }}>
              0%
            </span>
            <span className="absolute -bottom-6 -translate-x-1/2 text-[11px] text-slate-400" style={{ left: '100%' }}>
              100%
            </span>
          </>
        )}
      </div>

      {hero ? (
        <div className="mt-8 text-center">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{caption}</div>
          <div className="tnum mt-1 text-sm text-slate-600">
            width {fmt(width)} points
            {coveragePct !== undefined && <> · coverage {fmt(coveragePct)}%</>}
          </div>
          {subline && <div className="mx-auto mt-3 max-w-md text-xs text-slate-400">{subline}</div>}
        </div>
      ) : (
        <div className="tnum mt-1 flex justify-between text-[11px] text-slate-500">
          <span>{fmt(lower)}%</span>
          <span className="text-slate-400">width {fmt(width)} pts</span>
          <span>{fmt(upper)}%</span>
        </div>
      )}
    </div>
  );
}
