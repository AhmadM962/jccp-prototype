import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

// Worst *established* state for a capability — from the fixture aggregate, never from
// visible rows. "Established" excludes Unknown: we do not know it's broken, so it does
// not count as the worst finding. Unknown is reported separately as "unestablished".
function worstEstablished(stat: { green: number; yellow: number; red: number }): ControlState | null {
  if (stat.red > 0) return 'red';
  if (stat.yellow > 0) return 'yellow';
  if (stat.green > 0) return 'green';
  return null;
}

export default function GapMatrix() {
  const [params, setParams] = useSearchParams();
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrides = useAssessment((s) => s.overriddenControls);

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const cap = params.get('cap');
    return cap ? { [cap]: true } : { ops: true };
  });
  const [stateF, setStateF] = useState<ControlState | 'all'>((params.get('state') as ControlState) ?? 'all');
  const [evF, setEvF] = useState<EvidenceClass | 'all'>((params.get('ev') as EvidenceClass) ?? 'all');
  const [gapF, setGapF] = useState<GapReason | 'all'>((params.get('gap') as GapReason) ?? 'all');
  const [q, setQ] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(params.get('changed') === '1');
  const [onlyOverrides, setOnlyOverrides] = useState(params.get('overrides') === '1');

  // consume params: open the requested capability / apply filters, then clear them so the
  // in-component state is the source of truth. Re-runs if params arrive after mount (the
  // guided tour navigates here with ?cap=del while the screen is already open).
  useEffect(() => {
    if (![...params.keys()].length) return;
    const cap = params.get('cap');
    if (cap) setOpen((o) => ({ ...o, [cap]: true }));
    const st = params.get('state');
    if (st) setStateF(st as ControlState);
    const gp = params.get('gap');
    if (gp) setGapF(gp as GapReason);
    if (params.get('changed') === '1') setOnlyChanged(true);
    if (params.get('overrides') === '1') setOnlyOverrides(true);
    setParams({}, { replace: true });
  }, [params, setParams]);

  const rows = useMemo(() => {
    return controls
      .map((c) => {
        const base = snapshotFor(c, uploaded);
        const ov = overrides[c.id];
        const state = ov?.state ?? base.state;
        return { c, snap: { ...base, state }, overridden: Boolean(ov) };
      })
      .filter(({ c, snap, overridden }) => {
        if (stateF !== 'all' && snap.state !== stateF) return false;
        if (evF !== 'all' && snap.evidenceClass !== evF) return false;
        if (gapF !== 'all' && snap.gapReason !== gapF) return false;
        if (onlyChanged && !(uploaded && c.changed)) return false;
        if (onlyOverrides && !overridden) return false;
        if (q && !`${c.id} ${c.description}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      });
  }, [uploaded, overrides, stateF, evF, gapF, q, onlyChanged, onlyOverrides]);

  const byCap = (capId: string) => rows.filter((r) => r.c.capability === capId);

  return (
    <div className="space-y-5">
      <Card dataTour="gm-filters">
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
            <input type="checkbox" disabled={!uploaded} checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} className="h-4 w-4" />
            Show only what changed after evidence upload
          </label>
          {Object.keys(overrides).length > 0 && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <input type="checkbox" checked={onlyOverrides} onChange={(e) => setOnlyOverrides(e.target.checked)} className="h-4 w-4" />
              Overridden only ({Object.keys(overrides).length})
            </label>
          )}
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
        const stat = uploaded ? cap.after! : cap.before!;
        const worst = worstEstablished(stat);
        const capRows = byCap(cap.id);
        const isOpen = open[cap.id] ?? false;
        return (
          <div key={cap.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              onClick={() => setOpen((o) => ({ ...o, [cap.id]: !isOpen }))}
              className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <ChevronDown size={16} className={`text-slate-400 transition ${isOpen ? '' : '-rotate-90'}`} />
                <span className="text-sm font-semibold text-slate-800">{cap.name}</span>
                <span className="tnum text-[11px] text-slate-400">
                  {stat.applicable} applicable · {capRows.length} of {controls.filter((c) => c.capability === cap.id).length} seeded shown
                </span>
              </div>
              <div
                className="flex items-center gap-4 text-[11px]"
                title="Two independent figures from the capability fixture — never an average, and unaffected by filters"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-slate-400">worst established</span>
                  {worst ? <StateBadge state={worst} size="sm" /> : <Pill tone="slate">—</Pill>}
                  <span className="tnum font-semibold text-slate-700">
                    {worst === 'red' ? stat.red : worst === 'yellow' ? stat.yellow : worst === 'green' ? stat.green : 0}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-slate-400">unestablished</span>
                  <StateBadge state="unknown" size="sm" showLabel={false} />
                  <span className="tnum font-semibold text-violet-700">{stat.unknown}</span>
                </span>
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
                          dataTour={c.id === 'JNCSF-102' ? 'gm-row-102' : undefined}
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
