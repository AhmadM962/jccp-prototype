import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  right,
  dataTour,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  dataTour?: string;
}) {
  return (
    <div data-tour={dataTour} className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Pill({
  children,
  tone = 'slate',
  title,
}: {
  children: ReactNode;
  tone?: 'slate' | 'blue' | 'amber' | 'red' | 'green' | 'violet';
  title?: string;
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
  dataTour,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  dataTour?: string;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-accent text-white hover:bg-blue-700 disabled:bg-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      type={type}
      data-tour={dataTour}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-100">{children}</code>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const copy = () => navigator.clipboard?.writeText(code);
  return (
    <div className="group relative rounded-lg border border-slate-800 bg-slate-900">
      <pre className="scroll-slim max-h-40 overflow-auto whitespace-pre-wrap break-words p-3 pr-14 text-[12px] leading-relaxed text-slate-100">
        <code className="font-mono">{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 opacity-0 transition group-hover:opacity-100"
      >
        Copy
      </button>
    </div>
  );
}
