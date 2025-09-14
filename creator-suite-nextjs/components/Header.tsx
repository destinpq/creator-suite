'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiLogIn, FiLogOut, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from './ThemeProvider';
import styles from '../app/layout.module.css';

export default function SiteHeader() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      setLogged(!!t);
      const e = localStorage.getItem('user_email');
      if (e) setEmail(e);

      // Check if user is admin (simplified - in real app, decode JWT)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setIsAdmin(user.is_admin || false);
      }
    } catch (e) {
      // ignore (SSR)
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user_email');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {}
    setLogged(false);
    // After logout, send users to the home dashboard rather than forcing the landing page.
    try {
      // prefer Next.js client navigation
      router.push('/home');
    } catch (e) {
      window.location.href = '/home';
    }
  };

  const accountMenu = (
    <div className="bg-white p-2 rounded-md shadow-lg border border-secondary-200" role="menu" aria-orientation="vertical">
      {!logged && <div><Link href="/user/login" className="block px-4 py-2 text-secondary-700 hover:bg-secondary-100">Sign in</Link></div>}
      {logged && (
        <>
          <div><Link href="/user/profile" className="block px-4 py-2 text-secondary-700 hover:bg-secondary-100">Profile</Link></div>
          <div><Link href="/user/models" className="block px-4 py-2 text-secondary-700 hover:bg-secondary-100">My Models</Link></div>
          <div><a onClick={handleLogout} className="block px-4 py-2 text-secondary-700 hover:bg-secondary-100 cursor-pointer">Logout</a></div>
        </>
      )}
    </div>
  );

  return (
    <header className={styles.header}>
      <div className={styles.container + ' ' + styles.nav}>
        <div className={styles.logo}><Link href="/home">Creator Suite</Link></div>

        <nav className={styles.navLinks + ' md:flex hidden'}>
          <Link href="/home" className={styles.navLink}>Home</Link>
          <Link href="/tutorial" className={styles.navLink}>Tutorial</Link>
          <Link href="/features" className={styles.navLink}>Features</Link>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/video-generation" className={styles.navLink}>Video</Link>
          <Link href="/long-video" className={styles.navLink}>Long Video</Link>
          <Link href="/image-generation" className={styles.navLink}>Image</Link>
          <Link href="/models" className={styles.navLink}>Models</Link>
          <Link href="/studio" className={styles.navLink}>Studio</Link>
          <Link href="/organisation" className={styles.navLink}>Organisation</Link>
          <Link href="/tasks" className={styles.navLink}>Tasks</Link>
          <Link href="/billing" className={styles.navLink}>Billing</Link>
          {isAdmin && <Link href="/admin" className={styles.navLink}>Admin</Link>}
        </nav>

        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className={styles.navLink} aria-label="Toggle theme">
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>

          <div className="relative">
            <button
              id="cs-account-toggle"
              aria-haspopup="true"
              aria-controls="cs-account-menu"
              aria-expanded="false"
              className={styles.navLink + ' cursor-pointer'}
              onClick={(e) => {
                const el = document.getElementById('cs-account-menu');
                if (!el) return;
                const hidden = el.classList.toggle('hidden');
                // update aria-expanded
                const btn = document.getElementById('cs-account-toggle');
                if (btn) btn.setAttribute('aria-expanded', (!hidden).toString());
                // focus first menu item when opening
                if (!hidden) {
                  const first = el.querySelector('a, button');
                  if (first) (first as HTMLElement).focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const el = document.getElementById('cs-account-menu');
                  if (!el) return;
                  el.classList.remove('hidden');
                  const btn = document.getElementById('cs-account-toggle');
                  if (btn) btn.setAttribute('aria-expanded', 'true');
                  const first = el.querySelector('a, button');
                  if (first) (first as HTMLElement).focus();
                }
                if (e.key === 'Escape') {
                  const el = document.getElementById('cs-account-menu');
                  if (!el) return;
                  el.classList.add('hidden');
                  const btn = document.getElementById('cs-account-toggle');
                  if (btn) btn.setAttribute('aria-expanded', 'false');
                  (document.getElementById('cs-account-toggle') as HTMLElement)?.focus();
                }
              }}
            >
              {logged ? (<><FiUser className="inline-block mr-2" size={18} /> <span className="hidden sm:inline">{email || 'Account'}</span></>) : (<><FiLogIn className="inline-block mr-2" size={18} /> <span className="hidden sm:inline">Sign in</span></>)}
            </button>
            <div id="cs-account-menu" className="hidden absolute right-0 mt-2 z-10" role="menu" aria-labelledby="cs-account-toggle">{accountMenu}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
