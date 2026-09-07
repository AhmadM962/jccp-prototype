import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, Pill } from '../components/ui';
import StateBadge from '../components/StateBadge';
import ControlRow from '../components/ControlRow';
import { useAssessment } from '../store/useAssessment';
import { capabilities } from '../data/capabilities';
import {
  controls,
  snapshotFor,
  EVIDENCE_CLASS_LABEL,
  GAP_REASON_LABEL,
  type ControlState,
  type EvidenceClass,
  type GapReason,
} from '../data/controls';

const SEVERITY: Record<ControlState, number> = { red: 4, unknown: 3, yellow: 2, green: 1, grey: 0 };

export default function GapMatrix() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrides = useAssessment((s) => s.overriddenControls);

  const [open, setOpen] = useState<Record<string, boolean>>({ ops: true });
  const [stateF, setStateF] = useState<ControlState | 'all'>('all');
  const [evF, setEvF] = useState<EvidenceClass | 'all'>('all');
  const [gapF, setGapF] = useState<GapReason | 'all'>('all');
  const [q, setQ] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(false);

  const rows = useMemo(() => {
    return controls
      .map((c) => {
        const base = snapshotFor(c, uploaded);
        const state = overrides[c.id] ?? base.state;
        return { c, snap: { ...base, state } };
      })
      .filter(({ c, snap }) => {
        if (stateF !== 'all' && snap.state !== stateF) return false;
        if (evF !== 'all' && snap.evidenceClass !== evF) return false;
        if (gapF !== 'all' && snap.gapReason !== gapF) return false;
        if (onlyChanged && !(uploaded && c.changed)) return false;
        if (q && !(`${c.id} ${c.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
        return true;
      });
  }, [uploaded, overrides, stateF, evF, gapF, q, onlyChanged]);

  const byCap = (capId: string) => rows.filter((r) => r.c.capability === capId);

  const weakest = (capId: string): ControlState | null => {
    const rs = byCap(capId);
    if (rs.length === 0) return null;
    return rs.reduce<ControlState>((worst, r) => (SEVERITY[r.snap.state] > SEVERITY[worst] ? r.snap.state : worst), 'grey');
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search controls…"
              className="w-56 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm"
            />
          </div>
          <select value={stateF} onChange={(e) => setStateF(e.target.value as ControlState | 'all')} className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm">
            <option value="all">Any state</option>
            {(['green', 'yellow', 'red', 'unknown'] as ControlState[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={evF} onChange={(e) => setEvF(e.target.value as EvidenceClass | 'all')} className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm">
            <option value="all">Any evidence class</option>
            {(Object.keys(EVIDENCE_CLASS_LABEL) as EvidenceClass[]).map((s) => (
              <option key={s} value={s}>{EVIDENCE_CLASS_LABEL[s]}</option>
            ))}
          </select>
          <select value={gapF} onChange={(e) => setGapF(e.target.value as GapReason | 'all')} className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm">
            <option value="all">Any gap reason</option>
            {(Object.keys(GAP_REASON_LABEL) as GapReason[]).map((s) => (
              <option key={s} value={s}>{GAP_REASON_LABEL[s]}</option>
            ))}
          </select>
          <label className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${uploaded ? 'cursor-pointer border-slate-300' : 'cursor-not-allowed border-slate-200 opacity-50'}`}>
            <input
              type="checkbox"
              disabled={!uploaded}
              checked={onlyChanged}
              onChange={(e) => setOnlyChanged(e.target.checked)}
              className="h-4 w-4"
            />
            Show only what changed after evidence upload
          </label>
        </div>
      </Card>

      {capabilities.map((cap) => {
        if (!cap.organisationallyAssessable) {
          return (
            <div key={cap.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4 opacity-70">
              <div className="text-sm font-semibold text-slate-500">{cap.name}</div>
              <div className="text-[11px] text-slate-400">Not organisationally assessable — national obligation</div>
            </div>
          );
        }
        const w = weakest(cap.id);
        const capRows = byCap(cap.id);
        const isOpen = open[cap.id] ?? false;
        return (
          <div key={cap.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              onClick={() => setOpen((o) => ({ ...o, [cap.id]: !isOpen }))}
              className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <ChevronDown size={16} className={`text-slate-400 transition ${isOpen ? '' : '-rotate-90'}`} />
                <span className="text-sm font-semibold text-slate-800">{cap.name}</span>
                <span className="text-[11px] text-slate-400">
                  {capRows.length} shown of {cap.totalControls}
                </span>
              </div>
              <div className="flex items-center gap-2" title="Parent shows the state of its weakest child, never an average">
                <span className="text-[11px] text-slate-400">weakest child</span>
                {w ? <StateBadge state={w} size="sm" /> : <Pill tone="slate">—</Pill>}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  {capRows.length === 0 ? (
                    <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-400">
                      No seeded controls match the current filters.
                    </div>
                  ) : (
                    <div className="border-t border-slate-100">
                      {capRows.map(({ c, snap }) => (
                        <ControlRow
                          key={c.id}
                          control={c}
                          snap={snap}
                          highlight={onlyChanged || (uploaded && c.changed)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
