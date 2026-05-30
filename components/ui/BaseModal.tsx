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
        className="fixed inset-0 bg-[#1D1B20]/40 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-[28px] shadow-2xl z-50 p-6"
      >
        {children}
      </motion.div>
    </>
  );
}
