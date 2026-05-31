'use client';

import { useEffect } from 'react';

let lockCount = 0;
let scrollY = 0;
let previousBodyPosition = '';
let previousBodyTop = '';
let previousBodyLeft = '';
let previousBodyRight = '';
let previousBodyWidth = '';
let previousBodyOverflow = '';
let previousHtmlOverscroll = '';
let previousBodyOverscroll = '';

export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const body = document.body;
    const html = document.documentElement;

    if (lockCount === 0) {
      scrollY = window.scrollY;
      previousBodyPosition = body.style.position;
      previousBodyTop = body.style.top;
      previousBodyLeft = body.style.left;
      previousBodyRight = body.style.right;
      previousBodyWidth = body.style.width;
      previousBodyOverflow = body.style.overflow;
      previousHtmlOverscroll = html.style.overscrollBehavior;
      previousBodyOverscroll = body.style.overscrollBehavior;

      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      html.style.overscrollBehavior = 'none';
      body.style.overscrollBehavior = 'none';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        body.style.position = previousBodyPosition;
        body.style.top = previousBodyTop;
        body.style.left = previousBodyLeft;
        body.style.right = previousBodyRight;
        body.style.width = previousBodyWidth;
        body.style.overflow = previousBodyOverflow;
        html.style.overscrollBehavior = previousHtmlOverscroll;
        body.style.overscrollBehavior = previousBodyOverscroll;
        window.scrollTo(0, scrollY);
      }
    };
  }, [active]);
}
