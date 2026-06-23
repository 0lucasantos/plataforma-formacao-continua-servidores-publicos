import type { Metadata } from 'next'
import './globals.css'
import DevTimeBar from '@/components/DevTimeBar'
import '@/lib/fetchInterceptor'
import { DM_Sans } from 'next/font/google'

export const metadata: Metadata = {
  title: 'Aprenda+',
  description: 'Sua plataforma de gamificação corporativa',
}

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={dmSans.className}>
      <body>{children}</body>
    </html>
  )
}