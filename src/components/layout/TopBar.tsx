import { useLocation } from 'react-router-dom';
import { RotateCcw, Lock, ChevronDown, Compass, Menu } from 'lucide-react';
import { useState } from 'react';
import { NAV } from './nav';
import { useAssessment, ROLE_LABEL, type Role } from '../../store/useAssessment';
import { sectorById } from '../../data/sectors';

const ROLE_NOTE: Record<Role, string> = {
  owner: 'full access + collection progress',
  analyst: 'full access + review queue; can override',
  executive: 'interval, coverage, assurance only — no evidence or personal data',
  contributor: 'own task list and submission status only',
  regulator: 'submitted packages and the national rollup only',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const item = NAV.find((n) => pathname.startsWith(n.to));
  const title = pathname.startsWith('/control/') ? 'Control Detail / Evidence Inspector' : item?.label ?? 'JCCP';
  const resetDemo = useAssessment((s) => s.resetDemo);
  const startTour = useAssessment((s) => s.startTour);
  const setNavOpen = useAssessment((s) => s.setNavOpen);
  const profile = useAssessment((s) => s.profile);
  const role = useAssessment((s) => s.role);
  const setRole = useAssessment((s) => s.setRole);
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-6 sm:py-3">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => setNavOpen(true)}
          className="-ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 data-tour="page-title" className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {profile.orgName} · {sectorById(profile.sector).label} · Regulator: {sectorById(profile.sector).regulator}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex max-w-[34vw] items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:max-w-none sm:gap-1.5"
          >
            <span className="hidden sm:inline">Viewing as:&nbsp;</span>
            <span className="truncate">{ROLE_LABEL[role]}</span>
            <ChevronDown size={12} className="shrink-0" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setOpen(false);
                    }}
                    className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs ${r === role ? 'bg-accent/10 font-semibold text-accent' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {ROLE_LABEL[r]}
                    <span className="block text-[10px] font-normal text-slate-400">{ROLE_NOTE[r]}</span>
                  </button>
                ))}
                <div className="border-t border-slate-100 px-2.5 py-1 text-[10px] text-slate-400">Demo switcher — no authentication</div>
              </div>
            </>
          )}
        </div>
        <button
          onClick={startTour}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
          title="Restart the guided tour"
        >
          <Compass size={12} /> <span className="hidden sm:inline">Guided tour</span>
        </button>
        <span className="hidden items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 lg:inline-flex">
          <Lock size={12} /> On-premise · read-only
        </span>
        <button
          onClick={resetDemo}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          title="Reset the demo to the pre-upload state"
        >
          <RotateCcw size={12} /> <span className="hidden sm:inline">Reset demo</span>
        </button>
      </div>
    </header>
  );
}
