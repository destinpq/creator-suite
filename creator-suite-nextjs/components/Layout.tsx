import SiteHeader from './Header'
import SiteFooter from './Footer'
import styles from '../app/layout.module.css'

export default function Layout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen flex flex-col ${styles.body || ''}` + (className ? ` ${className}` : '')}>
      <SiteHeader />
      <main className={`flex-1 ${styles.main} ${styles.container}`}>{children}</main>
      <SiteFooter />
    </div>
  )
}
