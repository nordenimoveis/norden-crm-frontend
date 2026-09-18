import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Serifada discreta para títulos — dá o tom "alto padrão" sem exagero.
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Norden CRM',
  description: 'Painel de atendimento e gestão de leads da Norden Imóveis.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#f7f4ee',
  width: 'device-width',
  initialScale: 1,
  // O painel é uma ferramenta de trabalho; evita zoom acidental no chat mobile.
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
