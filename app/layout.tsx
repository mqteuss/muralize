import type {Metadata} from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Mural da Escola',
  description: 'Provas, reuniões e eventos escolares',
  applicationName: 'Mural da Escola',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
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
