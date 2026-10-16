// Where the figures on screen came from, and how to check it: the golden file's name and its full SHA-256.
// Someone who distrusts the prototype can hash that file (it is the engine's output for this assessment) and compare.

import { useState } from 'react';
import { CURRENT } from '../data/current';

export default function SourceStamp() {
  const [open, setOpen] = useState(false);
  const { source, framework, asOf } = CURRENT;
  return (
    <div data-testid="source-stamp" className="border-b border-slate-200 bg-white px-4 py-1 text-[10px] leading-tight text-slate-500 sm:text-[11px]">
      <span className="font-semibold text-slate-600">Assessment source</span>{' '}
      <code data-testid="source-file" className="font-mono text-slate-700">{source.file}</code>
      {' · '}SHA-256{' '}
      <code data-testid="source-sha256" className="break-all font-mono text-slate-700">{source.sha256}</code>{' '}
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="font-semibold text-accent underline">
        {open ? 'hide' : 'how to check'}
      </button>
      {open && (
        <p data-testid="source-how" className="mt-1 text-slate-600">
          The figures after the evidence upload are read from the engine&rsquo;s output for this assessment ({framework.name} {framework.version}, as of{' '}
          {asOf.slice(0, 10)}): hash that file and compare it with the value above, e.g. <code className="font-mono">sha256sum {source.file}</code>. The state
          before the upload is a projection of the same data (rule R), not an engine run.
        </p>
      )}
    </div>
  );
}
