import type { Metadata, Viewport } from 'next';
import './globals.css';
import '../styles/bym-portfolio.css';
import '../styles/bym-stage.css';
import '../styles/bym-journey.css';
import '../styles/exhibit.css';
import '../styles/ui03.css';

export const metadata: Metadata = {
  title: 'BYM İnşaat | Sonsuz Perspektif',
  description: 'BYM İnşaat için gerçek zamanlı 3D, kaydırma kontrollü sinematik web deneyimi prototipi.',
  robots: { index: false, follow: false },
  // The site art-directs its own dark (cosmic) and ivory (architecture) palettes; Dark Reader's
  // automatic inversion turned the ivory interface brown/black, so the site opts out of it.
  other: { 'darkreader-lock': 'true' },
};

export const viewport: Viewport = { colorScheme: 'only light', themeColor: '#E9E4DB' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
