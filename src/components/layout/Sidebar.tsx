import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { navForRole } from './nav';
import PhaseStepper from './PhaseStepper';
import { useAssessment, ROLE_LABEL } from '../../store/useAssessment';

export default function Sidebar() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const role = useAssessment((s) => s.role);
  const navOpen = useAssessment((s) => s.navOpen);
  const setNavOpen = useAssessment((s) => s.setNavOpen);
  const NAV = navForRole(role);
  const { pathname } = useLocation();

  // close the drawer whenever the route changes (e.g. after tapping a nav item)
  useEffect(() => setNavOpen(false), [pathname, setNavOpen]);

  return (
    <>
      {/* backdrop — only on mobile, only when the drawer is open */}
      {navOpen && (
        <div
          className="fixed inset-0 z-[45] bg-slate-900/50 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[50] flex h-full w-64 shrink-0 flex-col bg-ink-900 text-slate-300 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-white">JCCP</div>
            <div className="truncate text-[10px] text-slate-400">Jordan Cyber Compliance</div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            className="ml-auto rounded-md p-1 text-slate-400 hover:bg-ink-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-3 mb-1 rounded-md bg-ink-800 px-2.5 py-1.5 text-[10px] text-slate-400">
          {ROLE_LABEL[role]} view
        </div>

        <nav className="scroll-slim flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-tour={`nav-${item.to}`}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition ${
                    isActive ? 'bg-ink-700 font-semibold text-white' : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-ink-700">
          <PhaseStepper />
        </div>

        <div className="border-t border-ink-700 px-4 py-3">
          <div
            className={`rounded-md px-2.5 py-1.5 text-center text-[11px] font-semibold ${
              uploaded ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            {uploaded ? 'Evidence bundle loaded · L2' : 'Testimony only · L1'}
          </div>
        </div>
      </aside>
    </>
  );
}
