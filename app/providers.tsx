'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import { PwaRegistrar } from '@/components/pwa/PwaRegistrar';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <PwaRegistrar />
      </AuthProvider>
    </ThemeProvider>
  );
}
