import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ralph-gpu - WebGPU Shader Library',
  description: 'A minimal, ergonomic WebGPU shader library for creative coding and real-time graphics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-gray-950 text-gray-100 font-sans antialiased">
        <Navigation />
        <main className="lg:pl-64">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
