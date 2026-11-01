import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'SupportPilot – AI Customer Support',
  description: 'AI-powered customer support response generator with live chat, smart classification, and team handoff.',
  keywords: ['customer support', 'AI', 'helpdesk', 'live chat', 'ticket management'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#09090b] text-white`}>
        {children}
      </body>
    </html>
  );
}

