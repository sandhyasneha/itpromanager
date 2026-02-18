import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ITProManager — AI-Powered IT Project Management',
  description: 'Free AI-powered project management tool for IT Project Managers, Network Engineers, Sponsors and Stakeholders.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
