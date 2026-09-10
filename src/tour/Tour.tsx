import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAssessment } from '../store/useAssessment';
import { TOUR_STEPS, TOUR_TOTAL, type TourAction, type TourStep } from './steps';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function pollFor<T>(fn: () => T | null | undefined, timeout: number, interval = 100): Promise<T | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const v = fn();
      if (v) return resolve(v);
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(tick, interval);
    };
    tick();
  });
}

const el = (id: string) => document.querySelector<HTMLElement>(`[data-tour="${id}"]`) ?? null;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const TW = 360; // tooltip width

export default function Tour() {
  const active = useAssessment((s) => s.tourActive);
  const step = useAssessment((s) => s.tourStep);
  const goto = useAssessment((s) => s.tourGoto);
  const end = useAssessment((s) => s.endTour);
  const startTour = useAssessment((s) => s.startTour);
  const setNavOpen = useAssessment((s) => s.setNavOpen);
  const navigate = useNavigate();
  const location = useLocation();

  const [box, setBox] = useState<Box | null>(null); // spotlight cutout, null while preparing
  const [ready, setReady] = useState(false);
  const [ttSize, setTtSize] = useState({ w: TW, h: 220 });
  const ttRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);
  const targetElRef = useRef<HTMLElement | null>(null);

  const s: TourStep | undefined = TOUR_STEPS[step];
  const isLast = step >= TOUR_TOTAL - 1;

  const next = useCallback(() => {
    if (step >= TOUR_TOTAL - 1) end();
    else goto(step + 1);
  }, [step, goto, end]);
  const prev = useCallback(() => goto(Math.max(0, step - 1)), [goto, step]);

  const runAction = useCallback(async (a: TourAction, myRun: number) => {
    const guard = () => runId.current === myRun;
    if (a.type === 'wait') {
      await sleep(a.ms);
    } else if (a.type === 'click') {
      const t = await pollFor(() => el(a.target), 3000);
      if (!guard()) return;
      t?.click();
      await sleep(a.wait ?? 400);
    } else if (a.type === 'clickSeq') {
      for (const id of a.targets) {
        if (!guard()) return;
        const t = await pollFor(() => el(id), 3000);
        t?.click();
        await sleep(a.wait ?? 450);
      }
    }
  }, []);

  // ─── prepare the current step ──────────────────────────────────────────────
  useEffect(() => {
    if (!active || !s) return;
    const myRun = ++runId.current;
    setReady(false);
    setBox(null);
    targetElRef.current = null;

    (async () => {
      const routePath = s.route?.split('?')[0];
      if (routePath && location.pathname !== routePath) {
        navigate(s.route!);
        await sleep(160);
      } else if (s.route && s.route.includes('?') && location.search === '') {
        // same path but a query param is wanted (e.g. ?cap=del) — re-navigate
        navigate(s.route);
        await sleep(160);
      }
      if (runId.current !== myRun) return;

      // On mobile the nav lives in an off-canvas drawer: open it for steps that
      // target or click a sidebar item, close it for every other step.
      const actionTargets =
        s.preAction && s.preAction.type === 'click'
          ? [s.preAction.target]
          : s.preAction && s.preAction.type === 'clickSeq'
          ? s.preAction.targets
          : [];
      const needsNav = [s.target, ...actionTargets].some((t) => t?.startsWith('nav-'));
      setNavOpen(needsNav);
      if (needsNav) await sleep(240); // let the drawer slide in

      if (s.preAction) {
        await runAction(s.preAction, myRun);
        if (runId.current !== myRun) return;
      }

      if (!s.target) {
        setReady(true); // centred card
        return;
      }

      let node = await pollFor(() => el(s.target!), s.waitMs ?? 3500);
      if (runId.current !== myRun) return;
      if (!node && s.fallbackTarget) node = await pollFor(() => el(s.fallbackTarget!), 2000);
      if (runId.current !== myRun) return;

      if (!node) {
        // graceful: log and skip forward (never dead-end)
        // eslint-disable-next-line no-console
        console.warn(`[tour] step ${step + 1} "${s.id}": no target element, skipping`);
        if (step < TOUR_TOTAL - 1) goto(step + 1);
        else end();
        return;
      }

      targetElRef.current = node;
      // instant scroll — reliable regardless of tab visibility; the interval sync keeps
      // the spotlight glued afterwards if anything shifts
      node.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
      await sleep(120);
      if (runId.current !== myRun) return;
      const r = node.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
      setReady(true);
    })();

    return () => {
      runId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  // ─── keep the spotlight glued to the target (scroll / resize / layout shift) ──
  // setInterval + capture-phase scroll/resize listeners (works even when rAF is throttled,
  // e.g. a background tab).
  useEffect(() => {
    if (!active || !ready) return;
    const sync = () => {
      const n = targetElRef.current;
      if (!n || !n.isConnected) return;
      const r = n.getBoundingClientRect();
      setBox((b) =>
        b && Math.abs(b.top - r.top) < 0.5 && Math.abs(b.left - r.left) < 0.5 && b.width === r.width && b.height === r.height
          ? b
          : { top: r.top, left: r.left, width: r.width, height: r.height },
      );
    };
    sync();
    const iv = window.setInterval(sync, 120);
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    const ro = 'ResizeObserver' in window && targetElRef.current ? new ResizeObserver(sync) : null;
    if (ro && targetElRef.current) ro.observe(targetElRef.current);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
      ro?.disconnect();
    };
  }, [active, ready, step]);

  // ─── click-to-advance ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !ready || !s || s.advanceOn !== 'click' || !s.target) return;
    const onClick = (e: MouseEvent) => {
      const hit = (e.target as HTMLElement | null)?.closest?.(`[data-tour="${s.target}"]`);
      if (hit) setTimeout(() => next(), 80);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [active, ready, s, next]);

  // ─── Esc exits ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, end]);

  // ─── leave the mobile nav drawer closed once the tour is over ─────────────
  useEffect(() => {
    if (!active) setNavOpen(false);
  }, [active, setNavOpen]);

  // ─── measure the tooltip so we can flip it near edges ─────────────────────
  useLayoutEffect(() => {
    if (ttRef.current) {
      const r = ttRef.current.getBoundingClientRect();
      setTtSize((prev) => (Math.abs(prev.h - r.height) < 2 && Math.abs(prev.w - r.width) < 2 ? prev : { w: r.width, h: r.height }));
    }
  });

  if (!active || !s) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clickAdvance = s.advanceOn === 'click';
  // if a click-advance target is missing or disabled (e.g. after going Back), fall back to Next
  const targetDisabled = clickAdvance && (!targetElRef.current || targetElRef.current.hasAttribute('disabled'));

  // ── tooltip position ──
  const isNarrow = vw < 640;
  let ttLeft = vw / 2 - ttSize.w / 2;
  let ttTop = vh / 2 - ttSize.h / 2;
  let caret: 'up' | 'down' | null = null;
  if (box && isNarrow) {
    // phone: dock the card to whichever end is clear of the spotlight — no caret,
    // never covering the highlighted element
    const hole = { top: box.top - PAD, height: box.height + PAD * 2 };
    const spotMid = hole.top + hole.height / 2;
    ttTop = spotMid > vh / 2 ? 12 : vh - ttSize.h - 12;
    ttLeft = Math.min(Math.max(8, vw / 2 - ttSize.w / 2), vw - ttSize.w - 8);
  } else if (box) {
    const hole = { top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 };
    const below = hole.top + hole.height + 14;
    const above = hole.top - ttSize.h - 14;
    if (below + ttSize.h <= vh - 8) {
      ttTop = below;
      caret = 'up';
    } else if (above >= 8) {
      ttTop = above;
      caret = 'down';
    } else {
      // side
      ttTop = Math.min(Math.max(8, hole.top), vh - ttSize.h - 8);
      caret = null;
    }
    ttLeft = hole.left + hole.width / 2 - ttSize.w / 2;
    ttLeft = Math.min(Math.max(8, ttLeft), vw - ttSize.w - 8);
  }

  const dim = 'bg-slate-900/60';
  const hole = box
    ? { top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      {/* dimmer — either 4 frame rects around the target, or a full backdrop */}
      {hole ? (
        <>
          <div className={`absolute left-0 top-0 w-full ${dim}`} style={{ height: Math.max(0, hole.top) }} />
          <div className={`absolute left-0 w-full ${dim}`} style={{ top: hole.top + hole.height, bottom: 0 }} />
          <div className={`absolute ${dim}`} style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <div className={`absolute ${dim}`} style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          {/* ring */}
          <div
            className="absolute rounded-lg ring-2 ring-accent ring-offset-2 ring-offset-transparent"
            style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height, boxShadow: '0 0 0 4px rgba(29,78,216,0.25)' }}
          />
        </>
      ) : (
        <div className={`absolute inset-0 ${dim}`} />
      )}

      {/* tooltip card */}
      {ready && (
        <div
          ref={ttRef}
          role="dialog"
          aria-modal="false"
          aria-label={`Guided tour, step ${step + 1} of ${TOUR_TOTAL}`}
          className="pointer-events-auto fixed w-[360px] max-w-[calc(100vw-16px)] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
          style={{ top: ttTop, left: ttLeft }}
        >
          {caret === 'up' && <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white" />}
          {caret === 'down' && <div className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />}

          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
              {s.final ? 'Done' : `Step ${step + 1} of ${TOUR_TOTAL}`}
            </span>
            <button
              onClick={end}
              className="text-[11px] font-medium text-slate-400 underline underline-offset-2 hover:text-slate-600"
            >
              Skip tour
            </button>
          </div>

          <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
          <p className="mt-1 text-[13px] leading-snug text-slate-700">{s.body}</p>

          {/* progress bar */}
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / TOUR_TOTAL) * 100}%` }} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={prev}
              disabled={step === 0}
              className="rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              Back
            </button>

            {s.final ? (
              <div className="flex gap-2">
                <button
                  onClick={() => startTour()}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Restart tour
                </button>
                <button
                  onClick={end}
                  className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700"
                >
                  Explore freely
                </button>
              </div>
            ) : clickAdvance && !targetDisabled ? (
              <span className="text-[12px] font-semibold text-accent">
                {s.clickInstruction ?? 'Click the highlighted button to continue'}
              </span>
            ) : (
              <button
                onClick={next}
                className="rounded-md bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
