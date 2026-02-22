import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NexPlan — Free AI-Powered IT Project Management Tool',
  description: 'NexPlan is a free AI-powered project management tool built for IT Project Managers, Network Engineers and IT teams. Kanban boards, AI knowledge base, project plans, network diagrams — all in one place.',
  keywords: [
    'IT project management',
    'IT project manager tool',
    'free project management software',
    'AI project management',
    'kanban board for IT teams',
    'network engineer tools',
    'SDWAN project management',
    'cloud migration project plan',
    'IT knowledge base',
    'office move checklist',
    'IT project plan template',
    'free kanban board',
    'NexPlan',
  ],
  authors: [{ name: 'NexPlan' }],
  creator: 'NexPlan',
  metadataBase: new URL('https://www.nexplan.io'),
  alternates: { canonical: 'https://www.nexplan.io' },
  openGraph: {
    title: 'NexPlan — Free AI-Powered IT Project Management',
    description: 'Free tool for IT PMs — Kanban boards, AI knowledge base, project plans and network diagrams. No credit card required.',
    url: 'https://www.nexplan.io',
    siteName: 'NexPlan',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexPlan — Free AI-Powered IT Project Management',
    description: 'Free tool for IT PMs — Kanban boards, AI knowledge base, project plans. No credit card required.',
    creator: '@nexplan',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
