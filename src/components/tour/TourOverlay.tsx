'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Step = {
  id: string;
  anchor: string;
  title: string;
  description: string;
  side?: 'top'|'bottom';
  scroll?: 'bottom' | 'center' | 'popoverTop';
  arrowTarget?: string;
  holePadding?: number;
};

interface TourOverlayProps {
  steps: Step[];
  open: boolean;
  stepIndex: number;
  onNext: () => void;
  onClose: () => void;
  // Optional gating and whitelists
  nextEnabled?: boolean;
  onNextBlocked?: () => void;
  allowClickSelectors?: string[];
}

export default function TourOverlay({ steps, open, stepIndex, onNext, onClose, nextEnabled = true, onNextBlocked, allowClickSelectors = [] }: TourOverlayProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[stepIndex];
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const popRef = useRef<HTMLDivElement | null>(null);
  const descriptionLines = useMemo(() => (step?.description ? step.description.split(/\n+/) : []), [step]);
  const [reflowTick, setReflowTick] = useState(0);

  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      const match = part.match(/^\*\*(.+)\*\*$/);
      if (match) {
        return <strong key={idx} className="font-semibold text-white">{match[1]}</strong>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  useEffect(() => {
    if (!open) return;
    setContainer(document.body);
  }, [open]);

  useEffect(() => {
    if (!open || !step) return;
    const target = document.querySelector(step.anchor) as HTMLElement | null;
    if (target) {
      // Scroll behavior per step
      try {
        if (step.scroll === 'bottom') {
          const scrollEl = document.scrollingElement || document.documentElement;
          const bottom = Math.max(scrollEl.scrollHeight - window.innerHeight, 0);
          window.scrollTo({ top: bottom, behavior: 'smooth' });
        } else {
          // Center the target in the viewport with a slight offset when popover is above
          const r = target.getBoundingClientRect();
          const viewportH = window.innerHeight || 0;
          const centerOffset = (viewportH / 2) - (r.height / 2);
          const additionalOffset = step.side === 'top' ? 80 : 0; // leave room for popover above
          const desiredTop = window.scrollY + r.top - centerOffset + additionalOffset;
          window.scrollTo({ top: Math.max(0, desiredTop), behavior: 'smooth' });
        }
      } catch {}
      const r = target.getBoundingClientRect();
      setRect(r);
      // honor explicit side if provided; otherwise simple flip based on available space
      if (step.side) {
        setPlacement(step.side);
      } else {
        const needBottom = r.top < 160;
        setPlacement(needBottom ? 'bottom' : 'top');
      }
    } else {
      setRect(null);
    }
  }, [open, step]);

  // Reflow once after rect or step changes so popover size is measured before positioning
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setReflowTick(t => t + 1));
    return () => cancelAnimationFrame(id);
  }, [open, step, rect]);

  // After measurement, optionally align page scroll so popover top sits near viewport top
  useEffect(() => {
    if (!open || !step) return;
    if (step.scroll !== 'popoverTop') return;
    const baseEl = document.querySelector(step.arrowTarget || step.anchor) as HTMLElement | null;
    if (!baseEl || !popRef.current) return;
    const baseRect = baseEl.getBoundingClientRect();
    const popH = popRef.current.offsetHeight || 150;
    const padding = 16;
    const topMargin = 16; // desired space from viewport top
    const desiredTop = window.scrollY + baseRect.top - (popH + padding) - topMargin;
    window.scrollTo({ top: Math.max(0, desiredTop), behavior: 'smooth' });
  }, [open, step, reflowTick]);

  useEffect(() => {
    if (!open) return;
    const onRecalc = () => {
      if (!step) return;
      const target = document.querySelector(step.anchor) as HTMLElement | null;
      if (!target) return;
      const r = target.getBoundingClientRect();
      setRect(r);
      if (step.side) {
        setPlacement(step.side);
      } else {
        const needBottom = r.top < 160;
        setPlacement(needBottom ? 'bottom' : 'top');
      }
    };
    window.addEventListener('resize', onRecalc);
    window.addEventListener('scroll', onRecalc, true);
    return () => {
      window.removeEventListener('resize', onRecalc);
      window.removeEventListener('scroll', onRecalc, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const blockClick = (e: Event) => {
      const t = e.target as Node | null;
      if (popRef.current && t && popRef.current.contains(t)) return; // allow clicks inside popover
      if (t instanceof HTMLElement) {
        // First, handle our explicit tour-allow buttons so phase flags update
        if (t.closest('[data-tour-allow="more"]')) {
          window.dispatchEvent(new CustomEvent('tour-allow', { detail: { kind: 'more' } }));
          return; // allow click through
        }
        if (t.closest('[data-tour-allow="sweepstakes"]')) {
          window.dispatchEvent(new CustomEvent('tour-allow', { detail: { kind: 'sweepstakes' } }));
          return; // allow click through
        }
        // Then allow any other explicit whitelist selectors (if provided)
        for (const sel of allowClickSelectors) {
          if (t.closest(sel)) return;
        }
      }
      e.preventDefault();
      e.stopPropagation();
    };
    const blockKeys = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (popRef.current && active && popRef.current.contains(active)) return; // allow keys in popover
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener('click', blockClick, true);
    document.addEventListener('keydown', blockKeys, true);
    return () => {
      document.removeEventListener('click', blockClick, true);
      document.removeEventListener('keydown', blockKeys, true);
    };
  }, [open]);

  if (!open || !container) return null;

  // spotlight overlay with four rectangles to carve a hole (expanded by holePadding)
  const hp = step?.holePadding ?? 0;
  const hole = rect
    ? {
        top: Math.max(0, rect.top - hp),
        left: Math.max(0, rect.left - hp),
        right: Math.min(window.innerWidth, rect.right + hp),
        bottom: Math.min(window.innerHeight, rect.bottom + hp),
        width: Math.min(window.innerWidth, rect.right + hp) - Math.max(0, rect.left - hp),
        height: Math.min(window.innerHeight, rect.bottom + hp) - Math.max(0, rect.top - hp),
      } as DOMRect & { right: number; bottom: number }
    : rect;
  const padding = 16;
  const popW = popRef.current?.offsetWidth || 300;
  const popH = popRef.current?.offsetHeight || 150;

  // Determine where to point the arrow (defaults to the hole center)
  const arrowRect = (() => {
    if (!step?.arrowTarget) return hole;
    const el = document.querySelector(step.arrowTarget) as HTMLElement | null;
    return el ? el.getBoundingClientRect() : hole;
  })();

  // Position popover near the hole/arrow target with viewport clamping
  const base = arrowRect || hole;
  // Prefer aligning the popover's left edge to the target's left for input alignment, then clamp
  const preferredLeft = base ? base.left : 80;
  let popLeft = preferredLeft;
  popLeft = Math.max(padding, Math.min(popLeft, window.innerWidth - popW - padding));
  let popTop = 80;
  if (base) {
    popTop = placement === 'top' ? base.top - (popH + padding) : base.bottom + padding;
    popTop = Math.max(padding, Math.min(popTop, window.innerHeight - popH - padding));
  }

  // Compute arrow horizontal offset inside the popover so it points to arrow target
  const arrowCenterX = base ? base.left + base.width / 2 : popLeft + popW / 2;
  const rawArrowLeft = arrowCenterX - popLeft;
  const arrowLeft = Math.max(12, Math.min(rawArrowLeft, popW - 12));

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* darken around the focused rect */}
      <div className="absolute inset-0">
        {/* top mask */}
        <div className="absolute left-0 right-0 bg-black/60" style={{ top: 0, height: hole ? hole.top : '100%' }} />
        {/* left mask */}
        {hole && <div className="absolute bg-black/60" style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />}
        {/* right mask */}
        {hole && <div className="absolute bg-black/60" style={{ top: hole.top, left: hole.right, right: 0, height: hole.height }} />}
        {/* bottom mask */}
        <div className="absolute left-0 right-0 bg-black/60" style={{ top: hole ? hole.bottom : 0, bottom: 0 }} />
      </div>

      {/* popover */}
      <div
        ref={popRef}
        className="absolute max-w-sm bg-gradient-to-b from-black/90 via-black/85 to-black/90 text-white rounded-lg border border-white/10 p-4 shadow-2xl pointer-events-auto backdrop-blur-md"
        style={{ left: Math.round(popLeft), top: Math.round(popTop) }}
      >
        {/* arrow */}
        <div
          className="absolute w-0 h-0 border-l-8 border-r-8 border-transparent"
          style={placement === 'top'
            ? { left: `${Math.round(arrowLeft)}px`, top: '100%', transform: 'translateX(-50%)', borderTop: '8px solid rgba(0,0,0,0.9)' }
            : { left: `${Math.round(arrowLeft)}px`, bottom: '100%', transform: 'translateX(-50%)', borderBottom: '8px solid rgba(0,0,0,0.9)' }}
        />
        <div className="font-bold text-base">{step?.title}</div>
        <div className="text-white/80 text-sm mt-1 space-y-1">
          {descriptionLines.length > 0
            ? descriptionLines.map((line, i) => (
                <div key={i}>{renderBold(line)}</div>
              ))
            : step?.description}
        </div>
        <div className="flex justify-end gap-2 mt-3">
          {stepIndex === steps.length - 1 ? (
            <button onClick={onClose} className="px-3 py-1 rounded bg-gradient-to-r from-[#1bb0f2] to-[#6366f1]">Done</button>
          ) : (
            <button
              onClick={() => (nextEnabled ? onNext() : (onNextBlocked && onNextBlocked()))}
              className={`px-3 py-1 rounded ${nextEnabled ? 'bg-gradient-to-r from-[#1bb0f2] to-[#6366f1]' : 'bg-white/10 text-white/50 cursor-not-allowed'}`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>,
    container
  );
}


