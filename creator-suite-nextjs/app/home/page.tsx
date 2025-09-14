import React from 'react';
import client from '@/lib/api';
import { ShowcaseItem } from '@/types';
import Link from 'next/link';
import { FiBook, FiPlay } from 'react-icons/fi';
import styles from './home.module.css';

export default async function Home() {
  let showcase: ShowcaseItem[] = [];
  let error: string | null = null;

  try {
    const res = await client.get('/v1/public/showcase');
    showcase = res.data || [];
  } catch (e) {
    error = 'Failed to load showcase';
    console.error('Failed to fetch showcase', (e as Error).message || e);
  }

  return (
    <div>
      <section className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>Creator Suite</h1>
        <p className={styles.welcomeText}>Build and manage AI-powered video and content workflows.</p>
      </section>

      <section className={styles.dashboard}>
        <h2 className={styles.dashboardTitle}>Your Dashboard</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>42</div>
            <div className={styles.statLabel}>Videos Created</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>128</div>
            <div className={styles.statLabel}>Images Generated</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>5</div>
            <div className={styles.statLabel}>Active Projects</div>
          </div>
        </div>
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.actionsTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link href="/video-generation" className={styles.actionButton}>
            Create Video
          </Link>
          <Link href="/image-generation" className={styles.actionButton}>
            Generate Image
          </Link>
          <Link href="/tutorial" className={styles.actionButton}>
            <FiPlay size={18} /> Start Tutorial
          </Link>
        </div>
      </section>
    </div>
  );
}
