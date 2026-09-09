import { useEffect, useRef, useState } from 'react';
import { useAssessment } from '../store/useAssessment';

const SEEN_KEY = 'jccp-tour-seen';

export const tourSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
export const markTourSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private mode — fine, gate just shows again */
  }
};

export default function WelcomeGate() {
  const startTour = useAssessment((s) => s.startTour);
  const tourActive = useAssessment((s) => s.tourActive);
  const [open, setOpen] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!tourSeen()) setOpen(true);
  }, []);

  useEffect(() => {
    if (open) startRef.current?.focus();
  }, [open]);

  // if the tour starts (e.g. from the top-bar button), never show the gate over it
  if (tourActive || !open) return null;

  const start = () => {
    markTourSeen();
    setOpen(false);
    startTour();
  };
  const explore = () => {
    markTourSeen();
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') explore();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
        <h2 id="welcome-title" className="text-lg font-bold text-slate-900">
          Jordan Cyber Compliance Platform
        </h2>
        <p className="text-sm font-medium text-slate-500">A prototype demonstration</p>

        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          This system lets a Jordanian organisation measure its own compliance with the National
          Cybersecurity Framework — using collected evidence rather than self-declaration.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Everything you see is demonstration data for a fictional organisation, the Ministry of Digital
          Services. Nothing you do here is saved or transmitted.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            ref={startRef}
            onClick={start}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Start guided tour →
          </button>
          <button
            onClick={explore}
            className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-700"
          >
            Explore on my own
          </button>
        </div>
        <p className="mt-3 text-[12px] text-slate-400">
          The tour takes about 3 minutes and walks through a complete assessment.
        </p>
      </div>
    </div>
  );
}
