import type {Metadata} from 'next';
import './globals.css';
import Providers from './providers';


export const metadata: Metadata = {
  title: 'Mural da Escola',
  description: 'Calendário e Lembretes Escolares',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-[#fefefe] text-[#1D1B20] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
