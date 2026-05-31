import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  scrollable?: boolean;
}

export function BaseModal({ children, onClose, scrollable = true }: Props) {
  const [dragLimit, setDragLimit] = useState(520);

  useEffect(() => {
    const updateLimit = () => setDragLimit(Math.max(360, Math.min(window.innerHeight * 0.65, 720)));
    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, []);

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } },
  ) {
    if (info.offset.y > 86 || info.velocity.y > 540) onClose();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[var(--app-overlay)] backdrop-blur-sm"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2">
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: 56, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 56, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.9 }}
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: dragLimit }}
          dragElastic={0.02}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          className="flex max-h-[92dvh] touch-pan-y flex-col overflow-hidden rounded-t-[32px] bg-[var(--app-surface)] shadow-[var(--app-shadow)] sm:max-h-[min(92dvh,680px)] sm:rounded-[28px]"
        >
          <button
            type="button"
            onClick={onClose}
            className="mx-auto mb-1 mt-3 h-1.5 w-11 shrink-0 rounded-full bg-[var(--app-border)] transition-colors active:bg-[var(--app-text-muted)] sm:hidden"
            aria-label="Fechar arrastando ou tocando"
          />
          <div className={scrollable ? 'min-h-0 flex-1 overflow-y-auto px-6 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 sm:p-6' : 'min-h-0 flex-1 overflow-hidden'}>
            {children}
          </div>
        </motion.div>
      </div>
    </>
  );
}
