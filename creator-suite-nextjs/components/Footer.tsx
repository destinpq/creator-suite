import React from 'react';
import Link from 'next/link';
import { FiGithub, FiTwitter, FiLinkedin, FiYoutube, FiMail } from 'react-icons/fi';
import styles from '../app/layout.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div>

          {/* Company Info */}
          <div>
            <h3 className="text-white mb-4 text-lg font-semibold">Creator Suite</h3>
            <p className="text-primary-100 leading-relaxed mb-4">
              Build cinematic content with AI-powered tools for creators, marketers, and production teams.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://github.com/DestinPQ"
                target="_blank"
                rel="noreferrer"
                className="text-primary-200 hover:text-white transition-colors text-xl"
              >
                <FiGithub />
              </a>
              <a
                href="https://twitter.com/DestinPQ"
                target="_blank"
                rel="noreferrer"
                className="text-primary-200 hover:text-white transition-colors text-xl"
              >
                <FiTwitter />
              </a>
              <a
                href="https://www.linkedin.com/company/destinpq"
                target="_blank"
                rel="noreferrer"
                className="text-primary-200 hover:text-white transition-colors text-xl"
              >
                <FiLinkedin />
              </a>
              <a
                href="https://www.youtube.com/@DestinPQ"
                target="_blank"
                rel="noreferrer"
                className="text-primary-200 hover:text-white transition-colors text-xl"
              >
                <FiYoutube />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white mb-4 text-base font-medium">Product</h4>
            <div className="flex flex-col space-y-2">
              <Link href="/features" className="text-primary-200 hover:text-white transition-colors no-underline">
                Features
              </Link>
              <Link href="/pricing" className="text-primary-200 hover:text-white transition-colors no-underline">
                Pricing
              </Link>
              <Link href="/models" className="text-primary-200 hover:text-white transition-colors no-underline">
                AI Models
              </Link>
              <Link href="/video-generation" className="text-primary-200 hover:text-white transition-colors no-underline">
                Video Generation
              </Link>
              <Link href="/image-generation" className="text-primary-200 hover:text-white transition-colors no-underline">
                Image Generation
              </Link>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white mb-4 text-base font-medium">Company</h4>
            <div className="flex flex-col space-y-2">
              <Link href="/about" className="text-primary-200 hover:text-white transition-colors no-underline">
                About
              </Link>
              <Link href="/blog" className="text-primary-200 hover:text-white transition-colors no-underline">
                Blog
              </Link>
              <Link href="/careers" className="text-primary-200 hover:text-white transition-colors no-underline">
                Careers
              </Link>
              <Link href="/contact" className="text-primary-200 hover:text-white transition-colors no-underline">
                Contact
              </Link>
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white mb-4 text-base font-medium">Support</h4>
            <div className="flex flex-col space-y-2">
              <Link href="/tutorial" className="text-primary-200 hover:text-white transition-colors no-underline">
                Tutorial
              </Link>
              <Link href="/help" className="text-primary-200 hover:text-white transition-colors no-underline">
                Help Center
              </Link>
              <Link href="/docs" className="text-primary-200 hover:text-white transition-colors no-underline">
                Documentation
              </Link>
              <Link href="/privacy" className="text-primary-200 hover:text-white transition-colors no-underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-primary-200 hover:text-white transition-colors no-underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div style={{ gridColumn: '1/-1' }}>
          <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-4">
            <h4 className="text-white text-lg font-medium m-0">Stay Updated</h4>
            <p className="text-primary-100 m-0">Get the latest updates on new features and AI advancements</p>
            <div className={styles.subscribeForm}>
              <input type="email" placeholder="Enter your email" className={styles.subscribeInput} />
              <button className={styles.subscribeButton}><FiMail size={14} /><span style={{ marginLeft: 8 }}>Subscribe</span></button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ gridColumn: '1/-1', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ color: '#9aa6b8', fontSize: '0.9rem' }}>© {new Date().getFullYear()} DestinPQ — Build cinematic content with AI</div>
          <div style={{ color: '#9aa6b8', fontSize: '0.9rem' }}>Made with ❤️ for creators</div>
        </div>
      </div>
    </footer>
  );
}
