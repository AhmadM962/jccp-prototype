import { useLocation } from 'react-router-dom';
import { RotateCcw, Lock } from 'lucide-react';
import { NAV } from './nav';
import { useAssessment } from '../../store/useAssessment';
import { defaultProfile } from '../../data/scenario';

export default function TopBar() {
  const { pathname } = useLocation();
  const item = NAV.find((n) => pathname.startsWith(n.to));
  const title = pathname.startsWith('/control/') ? 'Control Detail / Evidence Inspector' : item?.label ?? 'JCCP';
  const resetDemo = useAssessment((s) => s.resetDemo);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">
          {defaultProfile.orgName} · {defaultProfile.sector} · Regulator: NCSC
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          <Lock size={12} /> On-premise · read-only
        </span>
        <button
          onClick={resetDemo}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          title="Reset the demo to the pre-upload state"
        >
          <RotateCcw size={12} /> Reset demo
        </button>
      </div>
    </header>
  );
}
