import { motion } from 'motion/react';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

export function BaseModal({ children, onClose }: Props) {
  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } },
  ) {
    if (info.offset.y > 90 || info.velocity.y > 700) onClose();
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
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.22 }}
          onDragEnd={handleDragEnd}
          className="flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[32px] bg-[var(--app-surface)] shadow-[var(--app-shadow)] sm:max-h-[min(92dvh,680px)] sm:rounded-[28px]"
        >
          <button
            type="button"
            onClick={onClose}
            className="mx-auto mt-3 mb-1 h-1.5 w-11 shrink-0 rounded-full bg-[var(--app-border)] sm:hidden"
            aria-label="Fechar arrastando ou tocando"
          />
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </>
  );
}
