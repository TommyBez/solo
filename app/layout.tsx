import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import type React from 'react'
import { Toaster } from 'sonner'
import './globals.css'

const fontSans = JetBrains_Mono({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Solo',
  description:
    'Solo is a tool for solo developers to track their time and projects',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={fontSans.variable} lang="en">
      <body className={'antialiased'}>
        {children}
        <Toaster position="bottom-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
