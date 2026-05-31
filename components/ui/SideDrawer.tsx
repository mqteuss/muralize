'use client';

import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Props {
  title: string;
  description?: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
  onClose: () => void;
}

export function SideDrawer({ title, description, side = 'right', children, onClose }: Props) {
  const [dragLimit, setDragLimit] = useState(420);
  const fromX = side === 'right' ? '100%' : '-100%';
  const sideClass = side === 'right' ? 'right-0' : 'left-0';
  const roundedClass = side === 'right' ? 'rounded-l-[32px]' : 'rounded-r-[32px]';
  const dragConstraints = side === 'right'
    ? { left: 0, right: dragLimit }
    : { left: -dragLimit, right: 0 };

  useEffect(() => {
    setDragLimit(Math.max(320, Math.min(window.innerWidth, 520)));
  }, []);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) {
    const shouldCloseRight = side === 'right' && (info.offset.x > 76 || info.velocity.x > 520);
    const shouldCloseLeft = side === 'left' && (info.offset.x < -76 || info.velocity.x < -520);

    if (shouldCloseRight || shouldCloseLeft) onClose();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[var(--app-overlay)] backdrop-blur-sm"
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-drawer-title"
        initial={{ x: fromX }}
        animate={{ x: 0 }}
        exit={{ x: fromX }}
        transition={{ type: 'spring', stiffness: 420, damping: 37, mass: 0.9 }}
        drag="x"
        dragDirectionLock
        dragConstraints={dragConstraints}
        dragElastic={0.02}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className={`fixed top-0 ${sideClass} z-50 flex h-dvh w-[min(88vw,390px)] touch-pan-y flex-col border border-[var(--app-border-soft)] bg-[var(--app-surface)] shadow-[var(--app-shadow)] ${roundedClass}`}
      >
        <div className="flex cursor-grab items-start justify-between gap-4 border-b border-[var(--app-border-soft)] px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] active:cursor-grabbing">
          <div className="min-w-0">
            <h3 id="side-drawer-title" className="text-lg font-semibold text-[var(--app-text)]">
              {title}
            </h3>
            {description && <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            onPointerDown={event => event.stopPropagation()}
            className="rounded-full p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)]"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </motion.aside>
    </>
  );
}
