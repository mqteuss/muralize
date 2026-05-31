'use client';

import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  scrollable?: boolean;
  fullHeightMobile?: boolean;
}

interface PullGestureState {
  startY: number;
  lastY: number;
  lastTime: number;
  velocityY: number;
  active: boolean;
  canPull: boolean;
}

export function BaseModal({ children, onClose, scrollable = true, fullHeightMobile = false }: Props) {
  const y = useMotionValue(0);
  const [dragLimit, setDragLimit] = useState(520);
  const [isDesktop, setIsDesktop] = useState(false);
  const closeOnceRef = useRef(false);
  const pullGestureRef = useRef<PullGestureState | null>(null);

  useBodyScrollLock(true);

  useEffect(() => {
    y.set(0);

    const mediaQuery = window.matchMedia('(min-width: 640px)');
    const updateLayout = () => {
      setIsDesktop(mediaQuery.matches);
      setDragLimit(Math.max(280, Math.min(window.innerHeight * 0.72, 720)));
    };

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);
    window.addEventListener('resize', updateLayout);

    return () => {
      mediaQuery.removeEventListener('change', updateLayout);
      window.removeEventListener('resize', updateLayout);
    };
  }, [y]);

  function requestClose() {
    if (closeOnceRef.current) return;
    closeOnceRef.current = true;
    onClose();
  }

  function resetPosition() {
    animate(y, 0, { type: 'spring', stiffness: 640, damping: 48, mass: 0.55 });
  }

  function getGestureScrollTarget(event: React.TouchEvent<HTMLDivElement>) {
    const target = event.target instanceof HTMLElement ? event.target : event.currentTarget;
    return (target.closest('.muralize-sheet-scroll') as HTMLElement | null) || event.currentTarget;
  }

  function beginPull(clientY: number, canPull: boolean) {
    if (isDesktop) return;

    pullGestureRef.current = {
      startY: clientY,
      lastY: clientY,
      lastTime: performance.now(),
      velocityY: 0,
      active: false,
      canPull,
    };
  }

  function updatePull(clientY: number, event?: React.TouchEvent<HTMLDivElement>) {
    if (isDesktop) return;

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
    if (isDesktop) return;

    const gesture = pullGestureRef.current;
    const currentY = y.get();
    pullGestureRef.current = null;

    if (gesture?.active && (currentY > 74 || gesture.velocityY > 520)) {
      requestClose();
      return;
    }

    resetPosition();
  }

  function handleHandleTouchStart(event: React.TouchEvent<HTMLButtonElement>) {
    beginPull(event.touches[0].clientY, true);
  }

  function handleHandleTouchMove(event: React.TouchEvent<HTMLButtonElement>) {
    updatePull(event.touches[0].clientY);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleContentTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (isDesktop) return;

    const target = getGestureScrollTarget(event);
    beginPull(event.touches[0].clientY, target.scrollTop <= 1);
  }

  function handleContentTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (isDesktop) return;

    const target = getGestureScrollTarget(event);

    if (target.scrollTop > 1) {
      pullGestureRef.current = null;
      if (y.get() !== 0) resetPosition();
      return;
    }

    if (pullGestureRef.current) pullGestureRef.current.canPull = true;
    updatePull(event.touches[0].clientY, event);
  }

  const mobileMotion = {
    initial: { y: '104%' as const },
    animate: { y: 0 },
    exit: { y: '104%' as const },
  };

  const desktopMotion = {
    initial: { opacity: 0, y: 18, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 18, scale: 0.98 },
  };

  const motionState = isDesktop ? desktopMotion : mobileMotion;
  const contentClass = scrollable
    ? 'muralize-sheet-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 sm:p-6'
    : 'min-h-0 flex-1 overflow-hidden';

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
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2">
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={motionState.initial}
          animate={motionState.animate}
          exit={motionState.exit}
          transition={{ type: 'spring', stiffness: 620, damping: 50, mass: 0.58 }}
          className={`flex transform-gpu flex-col overflow-hidden rounded-t-[32px] bg-[var(--app-surface)] shadow-[var(--app-shadow)] will-change-transform sm:max-h-[min(92dvh,680px)] sm:rounded-[28px] ${fullHeightMobile ? 'h-[92dvh] max-h-[92dvh] sm:h-auto' : 'max-h-[92dvh]'}`}
          style={{ y, backfaceVisibility: 'hidden', contain: 'layout paint', overscrollBehavior: 'contain' }}
        >
          <button
            type="button"
            onClick={requestClose}
            onTouchStart={handleHandleTouchStart}
            onTouchMove={handleHandleTouchMove}
            onTouchEnd={endPull}
            onTouchCancel={endPull}
            className="mx-auto mb-1 mt-3 h-1.5 w-11 shrink-0 rounded-full bg-[var(--app-border)] transition-colors active:bg-[var(--app-text-muted)] sm:hidden"
            aria-label="Fechar arrastando ou tocando"
            style={{ touchAction: 'none' }}
          />
          <div
            className={contentClass}
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={endPull}
            onTouchCancel={endPull}
            onWheel={event => event.stopPropagation()}
            style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </>
  );
}
