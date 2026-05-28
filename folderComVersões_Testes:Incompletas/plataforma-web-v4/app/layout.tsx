import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aprenda+ | Formação Contínua',
  description: 'Plataforma de formação contínua para servidores públicos de Recife',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
