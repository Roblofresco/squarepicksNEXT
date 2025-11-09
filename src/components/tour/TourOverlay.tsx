'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';

const StarfieldBackground = dynamic(() => import('@/components/effects/StarfieldBackground'), { ssr: false });

const FOCUSABLE_SELECTORS = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

type Step = {
  id: string;
  anchor: string;
  title: string;
  description: string;
  side?: 'top'|'bottom';
  scroll?: 'bottom' | 'center' | 'popoverTop';
  arrowTarget?: string;
  holePadding?: number;
  popoverOffsetY?: number;
  legend?: { color: string; label: string }[];
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
  hasWallet: boolean;
  onShowWallet?: () => void;
  onSweepstakesAgreement?: (agreed: boolean) => void;
  tourPhase?: 'A' | 'B';
  agreeToSweepstakes?: boolean | null;
  onMarkTourDone?: () => Promise<void> | void;
  enableGuidelinesFlow?: boolean;
  onFinalComplete?: () => Promise<void> | void;
}

export default function TourOverlay({ steps, open, stepIndex, onNext, onClose, nextEnabled = true, onNextBlocked, allowClickSelectors = [], hasWallet, onShowWallet, onSweepstakesAgreement, tourPhase = 'A', agreeToSweepstakes, onMarkTourDone, enableGuidelinesFlow = true, onFinalComplete }: TourOverlayProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[stepIndex];
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const popRef = useRef<HTMLDivElement | null>(null);
  const descriptionLines = useMemo(() => (step?.description ? step.description.split(/\n+/) : []), [step]);
  const [reflowTick, setReflowTick] = useState(0);
  const [finalOverlayOpen, setFinalOverlayOpen] = useState(false);
  const [showHomePrompt, setShowHomePrompt] = useState(false);
  const suppressedFocusRef = useRef<Array<{ el: HTMLElement; tabIndex: string | null; ariaHidden: string | null }>>([]);
  const bypassElementsRef = useRef<HTMLElement[]>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const inertElementsRef = useRef<Array<{ el: HTMLElement; alreadyInert: boolean }>>([]);



  const handleFinalClose = useCallback(async () => {
    if (step?.id === 'sports-board-track' && (agreeToSweepstakes ?? true) && !hasWallet) {
      onShowWallet?.();
    }

    if (onFinalComplete) {
      try {
        await onFinalComplete();
      } catch (err) {
        console.error('[TourOverlay] onFinalComplete failed', err);
      }
    }

    onClose();
  }, [step?.id, agreeToSweepstakes, hasWallet, onShowWallet, onFinalComplete, onClose]);

  useEffect(() => {
    if (stepIndex !== steps.length - 1) {
      setFinalOverlayOpen(false);
      setShowHomePrompt(false);
    }
  }, [stepIndex, steps.length]);

  const closeFinalOverlay = useCallback(async (shouldCloseTour = true) => {
    setFinalOverlayOpen(false);
    setShowHomePrompt(false);
    if (shouldCloseTour) await handleFinalClose();
  }, [handleFinalClose]);

  const handleGuidelinesAction = (action: 'skip' | 'agree') => {
    onSweepstakesAgreement?.(action === 'agree');
    setShowHomePrompt(true);
  };

  const handleHomePromptContinue = () => {
    setShowHomePrompt(false);
    closeFinalOverlay(true);
  };

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

  const holeSource = (() => {
    if (!step) return null;
    if (step.id === 'response') {
      return document.querySelector('[data-tour-card="sweepstakes"]') as HTMLElement | null;
    }
    if (step.id === 'sports-quick-entry-response') {
      const dialog = document.querySelector('[data-tour="sports-entry-response-dialog"]') as HTMLElement | null;
      if (dialog) return dialog;
    }
    return document.querySelector(step.anchor) as HTMLElement | null;
  })();
  const holeRect = holeSource ? holeSource.getBoundingClientRect() : null;

  useEffect(() => {
    if (!open || !step) return;
    const anchorSelector = step.id === 'sports-quick-entry-response'
      ? '[data-tour="sports-entry-response-dialog"]'
      : step.anchor;

    if (step.id === 'response') {
      const card = document.querySelector('[data-tour-card="sweepstakes"]') as HTMLElement | null;
      setRect(card ? card.getBoundingClientRect() : null);
      setPlacement('top');
      return;
    }
    let target = anchorSelector ? document.querySelector(anchorSelector) as HTMLElement | null : null;
    if (!target && step.id === 'sports-quick-entry-response') {
      const rafId = requestAnimationFrame(() => {
        const dialog = document.querySelector('[data-tour="sports-entry-response-dialog"]') as HTMLElement | null;
        if (dialog) {
          setRect(dialog.getBoundingClientRect());
          setPlacement('top');
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
    if (target) {
      try {
        if (step.scroll === 'bottom') {
          const scrollEl = document.scrollingElement || document.documentElement;
          const bottom = Math.max(scrollEl.scrollHeight - window.innerHeight, 0);
          window.scrollTo({ top: bottom, behavior: 'smooth' });
        } else {
          const r = target.getBoundingClientRect();
          const viewportH = window.innerHeight || 0;
          const centerOffset = (viewportH / 2) - (r.height / 2);
          const additionalOffset = step.side === 'top' ? 80 : 0;
          const desiredTop = window.scrollY + r.top - centerOffset + additionalOffset;
          window.scrollTo({ top: Math.max(0, desiredTop), behavior: 'smooth' });
        }
      } catch {}
      const r = target.getBoundingClientRect();
      setRect(r);
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

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setReflowTick(t => t + 1));
    return () => cancelAnimationFrame(id);
  }, [open, step, rect]);

  // After measurement, optionally align page scroll so popover top sits near viewport top
  useEffect(() => {
    if (!open || !step) return;
    if (step.id === 'response') return;
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
    const cleanupBypass = () => {
      bypassElementsRef.current.forEach((el) => {
        el.removeAttribute('data-tour-bypass');
      });
      bypassElementsRef.current = [];
    };

    if (!open) {
      cleanupBypass();
      return;
    }

    cleanupBypass();
    const selectors = new Set<string>([...allowClickSelectors]);
    if (step?.anchor) selectors.add(step.anchor);
    if (step?.arrowTarget) selectors.add(step.arrowTarget);

    const collected: HTMLElement[] = [];
    selectors.forEach((sel) => {
      if (!sel) return;
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        el.setAttribute('data-tour-bypass', 'true');
        collected.push(el);
      });
    });
    bypassElementsRef.current = collected;

    return cleanupBypass;
  }, [open, step, stepIndex, allowClickSelectors]);

  useEffect(() => {
    const restoreInert = () => {
      inertElementsRef.current.forEach(({ el, alreadyInert }) => {
        if (!alreadyInert) {
          el.removeAttribute('inert');
        }
      });
      inertElementsRef.current = [];
    };

    if (!open) {
      restoreInert();
      return;
    }

    restoreInert();

    const pop = popRef.current;
    if (!pop) return;

    const allowed = new Set<HTMLElement>();
    allowed.add(pop);
    bypassElementsRef.current.forEach((el) => {
      if (el) allowed.add(el);
    });

    const processTree = (node: HTMLElement) => {
      if (node === pop) {
        return;
      }

      const shouldAllow = Array.from(allowed).some((allowedNode) => {
        if (!allowedNode) return false;
        return allowedNode === node || allowedNode.contains(node) || node.contains(allowedNode);
      });
      if (shouldAllow) {
        Array.from(node.children).forEach((child) => {
          if (child instanceof HTMLElement) processTree(child);
        });
        return;
      }

      const alreadyInert = node.hasAttribute('inert');
      if (!alreadyInert) node.setAttribute('inert', '');
      inertElementsRef.current.push({ el: node, alreadyInert });
    };

    const root = document.body;
    Array.from(root.children).forEach((child) => {
      if (child instanceof HTMLElement) processTree(child);
    });

    return restoreInert;
  }, [open, step, stepIndex, allowClickSelectors]);

  useEffect(() => {
    const restoreFocus = () => {
      suppressedFocusRef.current.forEach(({ el, tabIndex, ariaHidden }) => {
        if (tabIndex === null) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', tabIndex);
        if (ariaHidden === null) el.removeAttribute('aria-hidden');
        else el.setAttribute('aria-hidden', ariaHidden);
      });
      suppressedFocusRef.current = [];
    };

    if (!open) {
      restoreFocus();
      return;
    }

    restoreFocus();

    const root = document.getElementById('__next');
    if (!root) return;

    const allowedSelectors = new Set<string>([...allowClickSelectors]);
    if (step?.anchor) allowedSelectors.add(step.anchor);
    if (step?.arrowTarget) allowedSelectors.add(step.arrowTarget);

    suppressedFocusRef.current = suppressedFocusRef.current.filter(({ el }) => {
      if (!el.parentElement) {
        if (!suppressedFocusRef.current.length) return false;
      }
      const shouldKeep = !(el.matches('[data-tour-allow]') || el.closest('[data-tour-allow]'));
      if (!shouldKeep) {
        if (el.hasAttribute('tabindex')) el.removeAttribute('tabindex');
        if (el.hasAttribute('aria-hidden')) el.removeAttribute('aria-hidden');
      }
      return shouldKeep;
    });

    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));

    focusables.forEach((el) => {
      if (popRef.current && popRef.current.contains(el)) return;
      const isAllowed = Array.from(allowedSelectors).some((sel) => sel && (el.matches(sel) || el.closest(sel)));
      if (isAllowed) return;

      const existingTabIndex = el.getAttribute('tabindex');
      const existingAriaHidden = el.getAttribute('aria-hidden');
      suppressedFocusRef.current.push({ el, tabIndex: existingTabIndex, ariaHidden: existingAriaHidden });
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    });

    return restoreFocus;
  }, [open, step, stepIndex, allowClickSelectors]);

  useEffect(() => {
    const pop = popRef.current;
    if (!pop || !open || finalOverlayOpen) return;

    const focusables = Array.from(pop.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter((el) => !el.hasAttribute('disabled'));
    const firstFocusable = focusables[0] ?? pop;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusTarget = firstFocusable;
    if (focusTarget) {
      if (focusTarget === pop && !pop.hasAttribute('tabindex')) {
        pop.setAttribute('tabindex', '-1');
      }
      requestAnimationFrame(() => {
        focusTarget.focus({ preventScroll: true });
      });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const currentFocusables = Array.from(pop.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter((el) => !el.hasAttribute('disabled'));
      if (currentFocusables.length === 0) {
        event.preventDefault();
        pop.focus({ preventScroll: true });
        return;
      }
      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      const previous = previousFocusRef.current;
      if (previous && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true } as FocusOptions);
      }
    };
  }, [open, stepIndex, finalOverlayOpen]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: Event) => {
      const el = (event.target as HTMLElement | null)?.closest('[data-tour-allow]') as HTMLElement | null;
      if (!el) return;
      const kind = el.getAttribute('data-tour-allow');
      if (!kind) return;
      window.dispatchEvent(new CustomEvent('tour-allow', { detail: { kind } }));
    };

    document.addEventListener('click', handler, true);
    return () => {
      document.removeEventListener('click', handler, true);
    };
  }, [open]);

  const flashActiveTab = useCallback(() => {
    if (step?.id !== 'selector') return;
    const selector = tourPhase === 'A' ? '[data-tour-allow="more"]' : '[data-tour-allow="sweepstakes"]';
    const className = tourPhase === 'A' ? 'tour-hover-flash-more' : 'tour-hover-flash-sweepstakes';
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
    targets.forEach((el) => {
      const applyOnce = () => {
        el.classList.add(className);
        setTimeout(() => {
          el.classList.remove(className);
        }, 160);
      };
      applyOnce();
      setTimeout(applyOnce, 220);
    });
  }, [step?.id, tourPhase]);

  if (!open || !container) return null;

  // spotlight overlay with four rectangles to carve a hole (expanded by holePadding)
  const hp = step?.holePadding ?? 0;
  const hole = step?.id === 'response' && holeRect
    ? {
        top: Math.max(0, holeRect.top - hp),
        left: Math.max(0, holeRect.left - hp),
        right: Math.min(window.innerWidth, holeRect.right + hp),
        bottom: Math.min(window.innerHeight, holeRect.bottom + hp),
        width: Math.min(window.innerWidth, holeRect.right + hp) - Math.max(0, holeRect.left - hp),
        height: Math.min(window.innerHeight, holeRect.bottom + hp) - Math.max(0, holeRect.top - hp),
      }
    : rect
    ? {
        top: Math.max(0, rect.top - hp),
        left: Math.max(0, rect.left - hp),
        right: Math.min(window.innerWidth, rect.right + hp),
        bottom: Math.min(window.innerHeight, rect.bottom + hp),
        width: Math.min(window.innerWidth, rect.right + hp) - Math.max(0, rect.left - hp),
        height: Math.min(window.innerHeight, rect.bottom + hp) - Math.max(0, rect.top - hp),
      }
    : null;
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
    const offsetY = step?.popoverOffsetY ?? 0;
    popTop = placement === 'top' ? popTop - offsetY : popTop + offsetY;
    popTop = Math.max(padding, Math.min(popTop, window.innerHeight - popH - padding));
  }

  // Compute arrow horizontal offset inside the popover so it points to arrow target
  const arrowCenterX = base ? base.left + base.width / 2 : popLeft + popW / 2;
  const rawArrowLeft = arrowCenterX - popLeft;
  const arrowLeft = Math.max(12, Math.min(rawArrowLeft, popW - 12));

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none" data-tour-portal="true">
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
        style={{ left: Math.round(popLeft), top: Math.round(popTop), display: finalOverlayOpen ? 'none' : undefined }}
      >
        {/* arrow */}
        <div
          className="absolute w-0 h-0 border-l-8 border-r-8 border-transparent"
          style={placement === 'top'
            ? { left: `${Math.round(arrowLeft)}px`, top: '100%', transform: 'translateX(-50%)', borderTop: '8px solid rgba(0,0,0,0.9)' }
            : { left: `${Math.round(arrowLeft)}px`, bottom: '100%', transform: 'translateX(-50%)', borderBottom: '8px solid rgba(0,0,0,0.9)' }}
        />
        <div className="font-bold text-base">{step?.title}</div>
        <div className="text-white/80 text-sm mt-1 space-y-2">
          {descriptionLines.length > 0
            ? descriptionLines.map((line, i) => (
                <div key={i}>{renderBold(line)}</div>
              ))
            : step?.description}
          {step?.legend && step.legend.length > 0 && (
            <div className="flex flex-col gap-2">
              {step.legend.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 rounded-sm border border-white/20 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-3">
          {stepIndex === steps.length - 1 ? (
            <button
              onClick={async () => {
                try {
                  if (onMarkTourDone) {
                    await onMarkTourDone();
                  }
                } catch (err) {
                  console.error('[TourOverlay] Failed to mark tour done', err);
                }

                if (enableGuidelinesFlow && !agreeToSweepstakes) {
                  setFinalOverlayOpen(true);
                  setShowHomePrompt(false);
                  return;
                }

                await closeFinalOverlay(true);
              }}
              className="px-3 py-1 rounded bg-gradient-to-r from-[#1bb0f2] to-[#6366f1]"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => {
                if (nextEnabled) {
                  onNext();
                } else {
                  if (onNextBlocked) onNextBlocked();
                  flashActiveTab();
                }
              }}
              className={`px-3 py-1 rounded ${nextEnabled ? 'bg-gradient-to-r from-[#1bb0f2] to-[#6366f1]' : 'bg-white/10 text-white/50 cursor-not-allowed'}`}
            >
              Next
            </button>
          )}
        </div>
      </div>
      <Dialog open={finalOverlayOpen} onOpenChange={(open) => {
        if (!open && finalOverlayOpen) closeFinalOverlay(true);
      }}>
        {finalOverlayOpen && (
          <StarfieldBackground className="fixed inset-0 z-[1200] opacity-90" />
        )}
        <DialogContent className="z-[1201] sm:max-w-md bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] backdrop-saturate-150">
          <AnimatePresence mode="wait">
            {showHomePrompt ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
              >
                <DialogHeader className="text-center space-y-2">
                  <DialogTitle className="text-2xl font-bold">Add SquarePicks to Your Home Screen</DialogTitle>
                  <DialogDescription className="text-white/70">
                    On mobile, add the app to your home screen for one-tap access. On desktop you can continue without installing.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-5 space-y-4 text-left text-sm text-white/85">
                  <div>
                    <h4 className="font-semibold text-white">How to add (iOS Safari)</h4>
                    <ol className="mt-2 space-y-1 list-decimal list-inside text-white/80">
                      <li>Tap the share icon.</li>
                      <li>Choose “Add to Home Screen”.</li>
                      <li>Tap “Add” to finish.</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">How to add (Android Chrome)</h4>
                    <ol className="mt-2 space-y-1 list-decimal list-inside text-white/80">
                      <li>Open the browser menu (⋮).</li>
                      <li>Tap “Add to Home screen”.</li>
                      <li>Confirm “Add”.</li>
                    </ol>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleHomePromptContinue}
                    data-tour-allow="home-continue"
                    className="w-full sm:w-auto rounded-md bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="guidelines"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
              >
                <DialogHeader className="text-center space-y-2">
                  <DialogTitle className="text-2xl font-bold">Sweepstakes Guidelines</DialogTitle>
                  <DialogDescription className="text-white/70">
                    SquarePicks contests are promotional sweepstakes. Review the guidelines before continuing.
                  </DialogDescription>
                </DialogHeader>
                <div
                  className="mt-5 max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4 text-left text-sm text-white/85 space-y-3"
                >
                  <ul className="space-y-2 list-disc list-inside">
                    <li>One free weekly entry is available on the featured $1 board. Use it once per weekly period.</li>
                    <li>Unclaimed squares at kickoff convert to house squares and are not eligible to win.</li>
                    <li>Prizes pay out across four periods (end of Q1, halftime, end of Q3, final score) with $25 credited for each period.</li>
                    <li>Confirm profile and wallet details so winnings can be credited immediately. Review full rules and other entry options in the Help Center.</li>
                  </ul>
                  <p className="text-xs text-white/60">
                    By agreeing, you confirm you are eligible to play and agree to share your personal information for tax purposes and location checks.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => handleGuidelinesAction('skip')}
                    data-tour-allow="guidelines-skip"
                    className="flex-1 rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGuidelinesAction('agree')}
                    data-tour-allow="guidelines-agree"
                    className="flex-1 rounded-md bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Agree
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>,
    container
  );
}


