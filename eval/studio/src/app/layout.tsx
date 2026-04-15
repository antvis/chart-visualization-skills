import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eval Studio',
  description: 'Eval dataset viewer & editor for chart-visualization-skills',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        {/* G2 & G6 via CDN for chart preview */}
        <Script src="https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js" strategy="beforeInteractive" />
        <Script src="https://unpkg.com/@antv/g6@5.0.42/dist/g6.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
