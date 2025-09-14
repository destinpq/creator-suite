import React from 'react';
import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Turn Ideas Into Cinematic Reality
          </h1>
          <p className={styles.heroSubtitle}>
            Creator Suite helps creators and teams generate film-quality AI videos and images in minutes with full creative control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/user/login">
              <a className={styles.ctaButton}>Start Creating</a>
            </Link>
            <Link href="/tutorial">
              <a className="px-8 py-4 bg-transparent text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors">Take Tutorial</a>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Why Creator Suite</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎬</div>
            <h3 className={styles.featureTitle}>Cinematic Quality</h3>
            <p className={styles.featureDesc}>
              Generate high-fidelity videos with realistic motion, lighting, and professional-grade output.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3 className={styles.featureTitle}>Fast Generation</h3>
            <p className={styles.featureDesc}>
              Create videos and images in minutes, not hours. Iterate quickly with instant previews.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>�</div>
            <h3 className={styles.featureTitle}>Creative Control</h3>
            <p className={styles.featureDesc}>
              Full control over prompts, styles, duration, resolution, and aspect ratios.
            </p>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className={styles.showcase}>
        <div className={styles.showcaseContainer}>
          <h2 className={styles.showcaseTitle}>See What Creators Are Making</h2>
          <p className={styles.showcaseSubtitle}>
            Explore stunning videos and images created by our community of creators
          </p>
          <div className={styles.showcaseGrid}>
            <div className={styles.showcaseItem}>
              <div className={styles.showcaseVideo}>
                <video className={styles.videoPlayer} controls muted>
                  <source src="/showcase/video1.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className={styles.showcaseOverlay}>
                  <div className={styles.showcaseInfo}>
                    <h4 className={styles.showcaseItemTitle}>Urban Exploration</h4>
                    <p className={styles.showcaseItemDesc}>A cinematic journey through neon-lit city streets</p>
                    <span className={styles.showcaseCreator}>by Alex Chen</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.showcaseItem}>
              <div className={styles.showcaseVideo}>
                <video className={styles.videoPlayer} controls muted>
                  <source src="/showcase/video2.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className={styles.showcaseOverlay}>
                  <div className={styles.showcaseInfo}>
                    <h4 className={styles.showcaseItemTitle}>Fantasy World</h4>
                    <p className={styles.showcaseItemDesc}>Magical creatures in an enchanted forest</p>
                    <span className={styles.showcaseCreator}>by Maya Rodriguez</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.showcaseItem}>
              <div className={styles.showcaseVideo}>
                <video className={styles.videoPlayer} controls muted>
                  <source src="/showcase/video3.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className={styles.showcaseOverlay}>
                  <div className={styles.showcaseInfo}>
                    <h4 className={styles.showcaseItemTitle}>Sci-Fi Adventure</h4>
                    <p className={styles.showcaseItemDesc}>Futuristic cityscape with flying vehicles</p>
                    <span className={styles.showcaseCreator}>by Jordan Kim</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.showcaseItem}>
              <div className={styles.showcaseVideo}>
                <video className={styles.videoPlayer} controls muted>
                  <source src="/showcase/video4.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className={styles.showcaseOverlay}>
                  <div className={styles.showcaseInfo}>
                    <h4 className={styles.showcaseItemTitle}>Nature Documentary</h4>
                    <p className={styles.showcaseItemDesc}>Wildlife in their natural habitat</p>
                    <span className={styles.showcaseCreator}>by Sarah Thompson</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.showcaseCta}>
            <Link href="/user/login">
              <a className={styles.showcaseButton}>Join the Community</a>
            </Link>
            <p className={styles.showcaseCtaText}>
              Ready to create your own masterpiece? Sign up and start generating today.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
