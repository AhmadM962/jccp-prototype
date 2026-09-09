import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { GLOSSARY, glossaryKey } from './glossary';

/**
 * Wrap a jargon term: <Term k="compliance interval">compliance interval</Term>.
 * Renders a dotted underline plus a hover/focus/tap tooltip with the plain-language
 * definition. Keyboard accessible; the tooltip flips above/below to stay on screen.
 */
export function Term({ k, children }: { k: string; children?: ReactNode }) {
  const entry = GLOSSARY[glossaryKey(k)];
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  if (!entry) return <>{children ?? k}</>;

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    setAbove(!!r && r.top > window.innerHeight - 160);
    setOpen(true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open ? setOpen(false) : show();
    }
  };

  // A <span> (not <button>) so it can safely nest inside links, table cells, other buttons.
  return (
    <span className="relative inline-block">
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onKeyDown={onKey}
        className="cursor-help border-b border-dotted border-slate-400 underline-offset-2 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {children ?? entry.term}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute left-1/2 z-[60] w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2.5 text-left text-[12px] font-normal leading-snug text-slate-700 shadow-lg ${
            above ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          <span className="mb-0.5 block font-semibold text-slate-900">{entry.term}</span>
          {entry.short}
        </span>
      )}
    </span>
  );
}
