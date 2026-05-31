'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  scrollable?: boolean;
  fullHeightMobile?: boolean;
}

export function BaseModal({ children, onClose, scrollable = true, fullHeightMobile = false }: Props) {
  const [dragLimit, setDragLimit] = useState(520);
  const [isDesktop, setIsDesktop] = useState(false);
  const closeOnceRef = useRef(false);

  useBodyScrollLock(true);

  useEffect(() => {
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
  }, []);

  function requestClose() {
    if (closeOnceRef.current) return;
    closeOnceRef.current = true;
    onClose();
  }

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } },
  ) {
    if (isDesktop) return;
    if (info.offset.y > 72 || info.velocity.y > 420) requestClose();
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
        transition={{ duration: 0.14, ease: 'easeOut' }}
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
          transition={{ type: 'spring', stiffness: 520, damping: 44, mass: 0.72 }}
          drag={isDesktop ? false : 'y'}
          dragConstraints={{ top: 0, bottom: dragLimit }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          className={`flex transform-gpu flex-col overflow-hidden rounded-t-[32px] bg-[var(--app-surface)] shadow-[var(--app-shadow)] will-change-transform sm:max-h-[min(92dvh,680px)] sm:rounded-[28px] ${fullHeightMobile ? 'h-[92dvh] max-h-[92dvh] sm:h-auto' : 'max-h-[92dvh]'}`}
          style={{ willChange: 'transform', backfaceVisibility: 'hidden', contain: 'layout paint', overscrollBehavior: 'contain' }}
        >
          <button
            type="button"
            onClick={requestClose}
            className="mx-auto mb-1 mt-3 h-1.5 w-11 shrink-0 rounded-full bg-[var(--app-border)] transition-colors active:bg-[var(--app-text-muted)] sm:hidden"
            aria-label="Fechar arrastando ou tocando"
          />
          <div
            className={contentClass}
            onWheel={event => event.stopPropagation()}
            onTouchMove={event => event.stopPropagation()}
            style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </>
  );
}
