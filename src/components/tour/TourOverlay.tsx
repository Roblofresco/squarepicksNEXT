'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Step = { id: string; anchor: string; title: string; description: string; side?: 'top'|'bottom'|'left'|'right' };

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
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const r = target.getBoundingClientRect();
      setRect(r);
      // simple flip based on available space
      const needBottom = r.top < 160;
      setPlacement(needBottom ? 'bottom' : 'top');
    } else {
      setRect(null);
    }
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onRecalc = () => {
      if (!step) return;
      const target = document.querySelector(step.anchor) as HTMLElement | null;
      if (!target) return;
      const r = target.getBoundingClientRect();
      setRect(r);
      const needBottom = r.top < 160;
      setPlacement(needBottom ? 'bottom' : 'top');
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
      // allow clicks on whitelisted selectors
      if (t instanceof HTMLElement) {
        for (const sel of allowClickSelectors) {
          if (t.closest(sel)) return;
        }
        // emit specific events for known selectors
        if (t.closest('[data-tour-allow="more"]')) {
          window.dispatchEvent(new CustomEvent('tour-allow', { detail: { kind: 'more' } }));
          return;
        }
        if (t.closest('[data-tour-allow="sweepstakes"]')) {
          window.dispatchEvent(new CustomEvent('tour-allow', { detail: { kind: 'sweepstakes' } }));
          return;
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

  // spotlight overlay with four rectangles to carve a hole
  const hole = rect;
  const popLeft = hole ? hole.left + hole.width / 2 : 80;
  const popTop = hole ? (placement === 'top' ? hole.top - 12 : hole.bottom + 12) : 80;

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
        style={{ left: popLeft, top: popTop, transform: 'translate(-50%, 0)' }}
      >
        {/* arrow */}
        <div
          className="absolute w-0 h-0 border-l-8 border-r-8 border-transparent"
          style={placement === 'top'
            ? { left: '50%', transform: 'translateX(-50%)', top: '100%', borderTop: '8px solid rgba(0,0,0,0.9)' }
            : { left: '50%', transform: 'translateX(-50%)', bottom: '100%', borderBottom: '8px solid rgba(0,0,0,0.9)' }}
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


