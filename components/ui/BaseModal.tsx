import { motion } from 'motion/react';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

export function BaseModal({ children, onClose }: Props) {
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
          className="max-h-[92dvh] overflow-y-auto rounded-t-[32px] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow)] sm:rounded-[28px]"
        >
          <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-[var(--app-border)] sm:hidden" />
          {children}
        </motion.div>
      </div>
    </>
  );
}
