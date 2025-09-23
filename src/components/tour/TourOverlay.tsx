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
}

export default function TourOverlay({ steps, open, stepIndex, onNext, onClose }: TourOverlayProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[stepIndex];

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
    } else {
      setRect(null);
    }
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const block = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener('click', block, true);
    document.addEventListener('keydown', block, true);
    return () => {
      document.removeEventListener('click', block, true);
      document.removeEventListener('keydown', block, true);
    };
  }, [open]);

  if (!open || !container) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      <div className="absolute inset-0 bg-black/60" />
      {rect && (
        <div
          className="absolute border-2 border-white/80 rounded-lg shadow-[0_0_0_4px_rgba(255,255,255,0.3)]"
          style={{ left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height }}
        />
      )}
      <div
        className="absolute max-w-sm bg-black/90 text-white rounded-lg border border-white/10 p-4 shadow-xl pointer-events-auto"
        style={{ left: (rect?.left ?? 40) + window.scrollX, top: ((rect?.top ?? 40) + window.scrollY) - 12 - 120 }}
      >
        <div className="font-bold text-base">{step?.title}</div>
        <div className="text-white/80 text-sm mt-1">{step?.description}</div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Done</button>
          <button onClick={onNext} className="px-3 py-1 rounded bg-gradient-to-r from-[#1bb0f2] to-[#6366f1]">Next</button>
        </div>
      </div>
    </div>,
    container
  );
}


