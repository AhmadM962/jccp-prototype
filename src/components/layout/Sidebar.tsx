import { NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { NAV } from './nav';
import PhaseStepper from './PhaseStepper';
import { useAssessment } from '../../store/useAssessment';

export default function Sidebar() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-ink-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white">JCCP</div>
          <div className="text-[10px] text-slate-400">Jordan Cyber Compliance</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
  );
}
