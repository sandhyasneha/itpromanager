import type { Metadata } from 'next'
import Script from 'next/script'
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexPlan',
  },
  formatDetection: {
    telephone: false,
  },
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
    creator: '@NexplanIT',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA — iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NexPlan" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />

        {/* PWA — Android / General */}
        <meta name="theme-color" content="#00d4ff" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Splash screen */}
        <meta name="msapplication-TileColor" content="#0a0c10" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-54LZFW26KC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-54LZFW26KC');
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}
