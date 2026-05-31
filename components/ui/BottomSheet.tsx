import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function BottomSheet({ title, description, children, onClose }: Props) {
  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) {
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
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.22 }}
        onDragEnd={handleDragEnd}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] overflow-hidden rounded-t-[32px] border border-[var(--app-border-soft)] bg-[var(--app-surface)] shadow-[var(--app-shadow)] sm:bottom-6 sm:w-[min(520px,calc(100%-2rem))] sm:rounded-[32px]"
      >
        <div className="sticky top-0 z-10 bg-[var(--app-surface)] px-5 pt-3 pb-4">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[var(--app-border)] sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 id="bottom-sheet-title" className="text-lg font-semibold text-[var(--app-text)]">
                {title}
              </h3>
              {description && <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)]"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(92dvh-84px)] overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </motion.section>
    </>
  );
}
