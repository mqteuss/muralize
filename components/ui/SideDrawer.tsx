'use client';

import { X } from 'lucide-react';
import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface Props {
  title: string;
  description?: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
  onClose: () => void;
}

interface SwipeGestureState {
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
  active: boolean;
}

const calmSpring = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 34,
  mass: 0.92,
};

const settleSpring = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 44,
  mass: 0.62,
};

export function SideDrawer({ title, description, side = 'right', children, onClose }: Props) {
  const x = useMotionValue(0);
  const [dragLimit, setDragLimit] = useState(420);
  const closeOnceRef = useRef(false);
  const swipeGestureRef = useRef<SwipeGestureState | null>(null);
  const hiddenX = side === 'right' ? dragLimit : -dragLimit;
  const sideClass = side === 'right' ? 'right-0' : 'left-0';
  const roundedClass = side === 'right' ? 'rounded-l-[32px]' : 'rounded-r-[32px]';

  useBodyScrollLock(true);

  useEffect(() => {
    const updateLimit = () => setDragLimit(Math.max(280, Math.min(window.innerWidth * 0.9, 520)));
    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, []);

  useEffect(() => {
    const initialHiddenX = side === 'right' ? dragLimit : -dragLimit;
    x.set(initialHiddenX);
    const frame = window.requestAnimationFrame(() => {
      animate(x, 0, calmSpring);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [dragLimit, side, x]);

  function requestClose() {
    if (closeOnceRef.current) return;
    closeOnceRef.current = true;

    animate(x, hiddenX, {
      type: 'spring',
      stiffness: 340,
      damping: 38,
      mass: 0.82,
    });

    window.setTimeout(onClose, 230);
  }

  function resetPosition() {
    animate(x, 0, settleSpring);
  }

  function beginSwipe(clientX: number, clientY: number) {
    swipeGestureRef.current = {
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      lastTime: performance.now(),
      velocityX: 0,
      active: false,
    };
  }

  function updateSwipe(clientX: number, clientY: number, event: React.TouchEvent<HTMLElement>) {
    const gesture = swipeGestureRef.current;
    if (!gesture) return;

    const deltaX = clientX - gesture.startX;
    const deltaY = clientY - gesture.startY;
    const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) + 8;
    const closingDirection = side === 'right' ? deltaX > 0 : deltaX < 0;

    if (!horizontalIntent || !closingDirection) return;

    const now = performance.now();
    const timeDelta = Math.max(now - gesture.lastTime, 1);
    gesture.velocityX = ((clientX - gesture.lastX) / timeDelta) * 1000;
    gesture.lastX = clientX;
    gesture.lastTime = now;
    gesture.active = true;

    const clampedX = Math.max(-dragLimit, Math.min(dragLimit, deltaX));
    x.set(clampedX);

    event.preventDefault();
    event.stopPropagation();
  }

  function endSwipe() {
    const gesture = swipeGestureRef.current;
    const currentX = x.get();
    swipeGestureRef.current = null;

    const shouldCloseRight = side === 'right' && gesture?.active && (currentX > 70 || gesture.velocityX > 520);
    const shouldCloseLeft = side === 'left' && gesture?.active && (currentX < -70 || gesture.velocityX < -520);

    if (shouldCloseRight || shouldCloseLeft) {
      requestClose();
      return;
    }

    resetPosition();
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    beginSwipe(touch.clientX, touch.clientY);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    updateSwipe(touch.clientX, touch.clientY, event);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={requestClose}
        className="fixed inset-0 z-40 bg-[var(--app-overlay)]"
        style={{ overscrollBehavior: 'none', touchAction: 'none' }}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-drawer-title"
        className={`fixed top-0 ${sideClass} z-50 flex h-dvh w-[min(88vw,390px)] transform-gpu flex-col bg-[var(--app-surface)] shadow-[var(--app-shadow)] will-change-transform ${roundedClass}`}
        style={{ x, backfaceVisibility: 'hidden', contain: 'layout paint', overscrollBehavior: 'contain' }}
      >
        <div
          className="flex cursor-grab items-start justify-between gap-4 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={endSwipe}
          onTouchCancel={endSwipe}
          style={{ touchAction: 'none' }}
        >
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={endSwipe}
          onTouchCancel={endSwipe}
          onWheel={event => event.stopPropagation()}
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {children}
        </div>
      </motion.aside>
    </>
  );
}
