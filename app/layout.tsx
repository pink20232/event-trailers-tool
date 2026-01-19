import type { Metadata } from 'next'
import './globals.css'
import './button-black-override.css'

export const metadata: Metadata = {
  title: 'Event Card Preview Tool',
  description: 'Preview and edit event card videos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: '100vh', backgroundColor: '#ffffff' }}>
        {children}
      </body>
    </html>
  )
}

