// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NextAuthSessionProvider from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpendScope - See your spending before it happens',
  description: 'AI-powered financial predictions and budget tracking',
  icons: {
    icon: '/logo-icon.svg',
    shortcut: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen transition-colors duration-300`}>
        <NextAuthSessionProvider>
          <ThemeProvider defaultTheme="system" defaultColorScheme="blue">
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}