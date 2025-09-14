import type { Metadata, Viewport } from 'next'
import './globals.css'
import styles from './layout.module.css'
import Layout from '../components/Layout'
import { ThemeProvider } from '../components/ThemeProvider'
import ErrorBoundary from '../components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Creator Suite',
  description: 'Build and manage AI-powered video and content workflows.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={styles.body}>
        <ThemeProvider>
          <ErrorBoundary>
            <Layout className={styles.layout}>
              {children}
            </Layout>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
