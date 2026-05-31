'use client';

import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface Props {
  title: string;
  description?: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
  onClose: () => void;
}

export function SideDrawer({ title, description, side = 'right', children, onClose }: Props) {
  const [dragLimit, setDragLimit] = useState(420);
  const closeOnceRef = useRef(false);
  const fromX = side === 'right' ? '100%' : '-100%';
  const sideClass = side === 'right' ? 'right-0' : 'left-0';
  const roundedClass = side === 'right' ? 'rounded-l-[32px]' : 'rounded-r-[32px]';
  const dragConstraints = side === 'right'
    ? { left: 0, right: dragLimit }
    : { left: -dragLimit, right: 0 };

  useBodyScrollLock(true);

  useEffect(() => {
    const updateLimit = () => setDragLimit(Math.max(280, Math.min(window.innerWidth * 0.9, 520)));
    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, []);

  function requestClose() {
    if (closeOnceRef.current) return;
    closeOnceRef.current = true;
    onClose();
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) {
    const shouldCloseRight = side === 'right' && (info.offset.x > 64 || info.velocity.x > 420);
    const shouldCloseLeft = side === 'left' && (info.offset.x < -64 || info.velocity.x < -420);

    if (shouldCloseRight || shouldCloseLeft) requestClose();
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
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-drawer-title"
        initial={{ x: fromX }}
        animate={{ x: 0 }}
        exit={{ x: fromX }}
        transition={{ type: 'spring', stiffness: 520, damping: 44, mass: 0.72 }}
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className={`fixed top-0 ${sideClass} z-50 flex h-dvh w-[min(88vw,390px)] transform-gpu flex-col bg-[var(--app-surface)] shadow-[var(--app-shadow)] will-change-transform ${roundedClass}`}
        style={{ willChange: 'transform', backfaceVisibility: 'hidden', contain: 'layout paint', overscrollBehavior: 'contain' }}
      >
        <div className="flex cursor-grab items-start justify-between gap-4 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] active:cursor-grabbing">
          <div className="min-w-0">
            <h3 id="side-drawer-title" className="text-lg font-semibold text-[var(--app-text)]">
              {title}
            </h3>
            {description && <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={requestClose}
            onPointerDown={event => event.stopPropagation()}
            className="rounded-full p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)]"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className="muralize-sheet-scroll flex-1 overflow-y-auto px-5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          onWheel={event => event.stopPropagation()}
          onTouchMove={event => event.stopPropagation()}
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </motion.aside>
    </>
  );
}
