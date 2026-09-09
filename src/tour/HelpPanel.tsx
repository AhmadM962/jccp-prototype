import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, X } from 'lucide-react';
import { useAssessment } from '../store/useAssessment';
import { helpFor } from './helpContent';

/** The corner "?" button — a plain-language "what am I looking at?" for every screen,
 *  independent of the guided tour. */
export default function HelpPanel() {
  const { pathname } = useLocation();
  const tourActive = useAssessment((s) => s.tourActive);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const help = helpFor(pathname);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (tourActive) return null; // the tour is doing the explaining

  return (
    <div className="fixed bottom-4 right-4 z-[55] flex flex-col items-end gap-2">
      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label={`Help: ${help.title}`}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          className="w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl focus:outline-none"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{help.title}</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close help">
              <X size={15} />
            </button>
          </div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            What am I looking at?
          </div>
          <ul className="space-y-1.5 text-[13px] leading-snug text-slate-700">
            {help.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="What am I looking at?"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <HelpCircle size={20} />
      </button>
    </div>
  );
}
