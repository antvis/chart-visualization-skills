import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AntV Copilot',
  description: 'AntV Chart Code Generator with RAG and Tool Call',
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
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
          rel='stylesheet'
        />
        {/* G2 and G6 libraries loaded via CDN for runtime execution */}
        <script src='https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js' async />
        <script src='https://unpkg.com/@antv/g6@5.0.42/dist/g6.min.js' async />
      </head>
      <body>{children}</body>
    </html>
  );
}
