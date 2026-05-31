'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

export function BaseModal({ children, onClose }: Props) {
  const [dragLimit, setDragLimit] = useState(420);

  useEffect(() => {
    setDragLimit(Math.max(360, window.innerHeight));
  }, []);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) {
    if (info.offset.y > 78 || info.velocity.y > 520) onClose();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--app-overlay)] backdrop-blur-sm z-40"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2">
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: 42, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 42, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: dragLimit }}
          dragElastic={{ top: 0, bottom: 0.18 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          className="max-h-[92dvh] touch-pan-y overflow-y-auto rounded-t-[32px] bg-[var(--app-surface)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[var(--app-shadow)] sm:rounded-[28px]"
        >
          <div className="mx-auto mb-4 h-1.5 w-11 cursor-grab rounded-full bg-[var(--app-border)] active:cursor-grabbing sm:hidden" />
          {children}
        </motion.div>
      </div>
    </>
  );
}
