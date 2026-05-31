'use client';

import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function BottomSheet({ title, description, children, onClose }: Props) {
  const [dragLimit, setDragLimit] = useState(520);
  const closeOnceRef = useRef(false);

  useBodyScrollLock(true);

  useEffect(() => {
    const updateLimit = () => setDragLimit(Math.max(280, Math.min(window.innerHeight * 0.72, 720)));
    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
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
    if (info.offset.y > 72 || info.velocity.y > 420) requestClose();
  }

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
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        initial={{ y: '104%' }}
        animate={{ y: 0 }}
        exit={{ y: '104%' }}
        transition={{ type: 'spring', stiffness: 520, damping: 44, mass: 0.72 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: dragLimit }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] transform-gpu flex-col overflow-hidden rounded-t-[32px] bg-[var(--app-surface)] shadow-[var(--app-shadow)] will-change-transform sm:bottom-6 sm:w-[min(520px,calc(100%-2rem))] sm:rounded-[32px]"
        style={{ willChange: 'transform', backfaceVisibility: 'hidden', contain: 'layout paint', overscrollBehavior: 'contain' }}
      >
        <div className="shrink-0 bg-[var(--app-surface)] px-5 pb-4 pt-3">
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
          onWheel={event => event.stopPropagation()}
          onTouchMove={event => event.stopPropagation()}
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </motion.section>
    </>
  );
}
