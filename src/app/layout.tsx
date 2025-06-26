import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../app/contexts/AuthContext';
import { SidebarProvider } from '../app/contexts/SidebarContext';
import { LembreteProvider } from './contexts/lembreteContext';
import AlertaLembretes from './components/AlarmeDose/AlertaLembrete';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MedReminder - Seu lembrete de medicamentos',
  description: 'Aplicativo para gerenciamento e lembretes de medicamentos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F6F6F6]`}
      >
        <AuthProvider>
          <LembreteProvider>
            <AlertaLembretes />
            <SidebarProvider>{children}</SidebarProvider>
          </LembreteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
