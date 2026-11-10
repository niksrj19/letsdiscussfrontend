import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarketLens — Share Market Research',
  description: 'Ask grounded questions across your share market research sources.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
