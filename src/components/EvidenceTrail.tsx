import { useState } from 'react';
import { FileText, MessageSquareQuote, Hash, X } from 'lucide-react';
import { Pill } from './ui';
import type { EvidenceItem } from '../data/evidence';

export default function EvidenceTrail({ items }: { items: EvidenceItem[] }) {
  const [raw, setRaw] = useState<EvidenceItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        No evidence items recorded for this control yet. It sits at its evidence-class ceiling until an
        artifact is provided.
      </div>
    );
  }

  return (
    <>
      <ol className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {it.type === 'artifact' ? (
                  <FileText size={15} className="text-emerald-600" />
                ) : (
                  <MessageSquareQuote size={15} className="text-blue-600" />
                )}
                <span className="text-sm font-semibold text-slate-800">
                  {it.type === 'artifact' ? 'Artifact' : 'Testimonial'}
                </span>
                {it.module && <Pill tone="slate">module: {it.module}</Pill>}
              </div>
              <span className="tnum text-[11px] text-slate-400">{it.timestamp}</span>
            </div>

            {it.quote && (
              <blockquote className="mt-2 border-l-2 border-blue-300 pl-3 text-sm italic text-slate-600">
                “{it.quote}”
              </blockquote>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="font-mono text-slate-700">{it.locator}</span>
              <span className="inline-flex items-center gap-1">
                <Hash size={11} /> {it.sha256}
              </span>
              <span>source: {it.source}</span>
            </div>

            {it.raw && (
              <button
                onClick={() => setRaw(it)}
                className="mt-2 text-xs font-semibold text-accent hover:underline"
              >
                View raw
              </button>
            )}
          </li>
        ))}
      </ol>

      {raw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setRaw(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
              <span className="font-mono text-xs text-slate-300">{raw.locator}</span>
              <button onClick={() => setRaw(null)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <pre className="scroll-slim max-h-[68vh] overflow-auto p-4 text-[12px] leading-relaxed text-slate-100">
              <code className="font-mono whitespace-pre">{raw.raw}</code>
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
