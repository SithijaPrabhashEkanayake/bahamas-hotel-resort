import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Header } from '@/components/navigation/Header';

export const metadata: Metadata = {
  title: 'The Grand Bahamian Resort & Reserve | Luxury PMS',
  description: 'Enterprise luxury hotel & resort property management system compliant with Bahamas VAT and statutory regulations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-[#F8FAF8] text-[#1A2E35]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
