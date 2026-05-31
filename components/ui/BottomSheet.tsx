'use client';

import { X } from 'lucide-react';
import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}

interface PullGestureState {
  startY: number;
  lastY: number;
  lastTime: number;
  velocityY: number;
  active: boolean;
  canPull: boolean;
}

export function BottomSheet({ title, description, children, onClose }: Props) {
  const y = useMotionValue(0);
  const [dragLimit, setDragLimit] = useState(520);
  const closeOnceRef = useRef(false);
  const pullGestureRef = useRef<PullGestureState | null>(null);

  useBodyScrollLock(true);

  useEffect(() => {
    y.set(0);

    const updateLimit = () => setDragLimit(Math.max(280, Math.min(window.innerHeight * 0.72, 720)));
    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, [y]);

  function requestClose() {
    if (closeOnceRef.current) return;
    closeOnceRef.current = true;
    onClose();
  }

  function resetPosition() {
    animate(y, 0, { type: 'spring', stiffness: 640, damping: 48, mass: 0.55 });
  }

  function beginPull(clientY: number, canPull: boolean) {
    pullGestureRef.current = {
      startY: clientY,
      lastY: clientY,
      lastTime: performance.now(),
      velocityY: 0,
      active: false,
      canPull,
    };
  }

  function updatePull(clientY: number, event?: React.TouchEvent<HTMLElement>) {
    const gesture = pullGestureRef.current;
    if (!gesture || !gesture.canPull) return;

    const now = performance.now();
    const deltaY = clientY - gesture.startY;
    const timeDelta = Math.max(now - gesture.lastTime, 1);
    gesture.velocityY = ((clientY - gesture.lastY) / timeDelta) * 1000;
    gesture.lastY = clientY;
    gesture.lastTime = now;

    if (deltaY <= 0) {
      if (gesture.active) y.set(0);
      return;
    }

    if (!gesture.active && deltaY < 6) return;

    gesture.active = true;
    y.set(Math.min(deltaY, dragLimit));

    event?.preventDefault();
    event?.stopPropagation();
  }

  function endPull() {
    const gesture = pullGestureRef.current;
    const currentY = y.get();
    pullGestureRef.current = null;

    if (gesture?.active && (currentY > 74 || gesture.velocityY > 520)) {
      requestClose();
      return;
    }

    resetPosition();
  }

  function handleHandleTouchStart(event: React.TouchEvent<HTMLElement>) {
    beginPull(event.touches[0].clientY, true);
  }

  function handleHandleTouchMove(event: React.TouchEvent<HTMLElement>) {
    updatePull(event.touches[0].clientY, event);
  }

  function handleScrollTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    beginPull(event.touches[0].clientY, target.scrollTop <= 1);
  }

  function handleScrollTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const gesture = pullGestureRef.current;
    const target = event.currentTarget;

    if (target.scrollTop > 1) {
      pullGestureRef.current = null;
      if (y.get() !== 0) resetPosition();
      return;
    }

    if (gesture) gesture.canPull = true;
    updatePull(event.touches[0].clientY, event);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        onClick={requestClose}
        className="fixed inset-0 z-40 bg-[var(--app-overlay)]"
        style={{ overscrollBehavior: 'none', touchAction: 'none' }}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        initial={{ y: '104%' }}
        animate={{ y: 0 }}
        exit={{ y: '104%' }}
        transition={{ type: 'spring', stiffness: 620, damping: 50, mass: 0.58 }}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] min-h-[280px] transform-gpu flex-col overflow-hidden rounded-t-[32px] bg-[var(--app-surface)] shadow-[var(--app-shadow)] will-change-transform sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2"
        style={{ y, backfaceVisibility: 'hidden', contain: 'layout paint', overscrollBehavior: 'contain' }}
      >
        <div
          className="shrink-0 px-5 pb-3 pt-3"
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={endPull}
          onTouchCancel={endPull}
          style={{ touchAction: 'none' }}
        >
          <button
            type="button"
            onClick={requestClose}
            className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-[var(--app-border)] transition-colors active:bg-[var(--app-text-muted)] sm:hidden"
            aria-label="Fechar arrastando ou tocando"
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 id="bottom-sheet-title" className="text-lg font-semibold text-[var(--app-text)]">
                {title}
              </h3>
              {description && <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>}
            </div>
            <button
              type="button"
              onClick={requestClose}
              onPointerDown={event => event.stopPropagation()}
              className="rounded-full p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)]"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
          className="muralize-sheet-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(2.25rem+env(safe-area-inset-bottom))] sm:pb-6"
          onTouchStart={handleScrollTouchStart}
          onTouchMove={handleScrollTouchMove}
          onTouchEnd={endPull}
          onTouchCancel={endPull}
          onWheel={event => event.stopPropagation()}
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {children}
        </div>
      </motion.section>
    </>
  );
}
