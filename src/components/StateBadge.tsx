import type { ControlState } from '../data/controls';

// State = colour + distinct icon shape + text label. Readable in greyscale.
// (brief §4 — accessibility is a functional requirement)

export const STATE_META: Record<
  ControlState,
  { label: string; colour: string; bg: string; border: string; glyph: string; shape: string }
> = {
  green: { label: 'Compliant', colour: '#047857', bg: '#ecfdf5', border: '#a7f3d0', glyph: '●', shape: 'filled circle' },
  yellow: { label: 'Partial', colour: '#b45309', bg: '#fffbeb', border: '#fde68a', glyph: '◐', shape: 'half-filled triangle' },
  red: { label: 'Gap', colour: '#b91c1c', bg: '#fef2f2', border: '#fecaca', glyph: '■', shape: 'filled square' },
  grey: { label: 'N/A', colour: '#475569', bg: '#f1f5f9', border: '#cbd5e1', glyph: '─', shape: 'dash' },
  unknown: { label: 'Unknown', colour: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', glyph: '◇', shape: 'hollow diamond' },
};

interface Props {
  state: ControlState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StateBadge({ state, size = 'md', showLabel = true }: Props) {
  const m = STATE_META[state];
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${pad}`}
      style={{ color: m.colour, backgroundColor: m.bg, borderColor: m.border }}
      title={`${m.label} — ${m.shape}`}
    >
      <span aria-hidden className="leading-none" style={{ fontSize: size === 'lg' ? 15 : 12 }}>
        {m.glyph}
      </span>
      {showLabel && <span className="tracking-tight">{m.label}</span>}
    </span>
  );
}
