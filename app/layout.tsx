import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorldBuilder - Build Your Story Universe',
  description: 'Create and manage your world lore, characters, and story elements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

