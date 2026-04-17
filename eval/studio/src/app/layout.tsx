import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eval Studio',
  description: 'Eval dataset viewer & editor for chart-visualization-skills',
  icons: {
    icon: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-CN'>
      <body className="bg-app text-fg text-[13px] leading-[1.5] h-screen overflow-hidden antialiased">
        {children}
        {/* G2 & G6 via CDN for chart preview */}
        <Script
          src='https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js'
          strategy='beforeInteractive'
        />
        <Script
          src='https://unpkg.com/@antv/g6@5.1.0/dist/g6.min.js'
          strategy='beforeInteractive'
        />
      </body>
    </html>
  );
}
