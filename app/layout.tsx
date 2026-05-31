import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Muralize',
    template: '%s | Muralize',
  },
  description: 'Mural escolar para avisos, provas, reuniões, entregas e eventos.',
  applicationName: 'Muralize',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Muralize',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FEFEFE',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#fefefe] text-[#1D1B20] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
