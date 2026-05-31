import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

const themeBootScript = `
  try {
    const savedTheme = localStorage.getItem('muralize-theme') || 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = savedTheme === 'dark' || (savedTheme === 'system' && prefersDark) ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#101014' : '#FEFEFE');
  } catch (_) {}
`;

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
    statusBarStyle: 'black-translucent',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FEFEFE' },
    { media: '(prefers-color-scheme: dark)', color: '#101014' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-[#fefefe] text-[#1D1B20] antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
