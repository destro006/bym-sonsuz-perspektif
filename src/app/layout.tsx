import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BYM İnşaat | Sonsuz Perspektif',
  description: 'BYM İnşaat için gerçek zamanlı 3D, kaydırma kontrollü sinematik web deneyimi prototipi.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
