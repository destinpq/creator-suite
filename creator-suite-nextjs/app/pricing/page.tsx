'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './pricing.module.css';

const pricingPlans = [
  {
    name: 'Starter',
    price: { monthly: 9, yearly: 99 },
    description: 'Perfect for individuals getting started with AI content creation',
    features: [
      '100 video generations/month',
      '50 image generations/month',
      '720p video resolution',
      'Basic support',
      'Standard models access',
      'Community forum access'
    ],
    popular: false,
    cta: 'Start Free Trial'
  },
  {
    name: 'Professional',
    price: { monthly: 29, yearly: 299 },
    description: 'Ideal for content creators and small teams',
    features: [
      '500 video generations/month',
      '200 image generations/month',
      '1080p video resolution',
      'Priority support',
      'All AI models access',
      'Advanced editing tools',
      'Team collaboration',
      'API access'
    ],
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: { monthly: 99, yearly: 999 },
    description: 'For large teams and production companies',
    features: [
      'Unlimited generations',
      '4K video resolution',
      'Dedicated support',
      'Custom model training',
      'Advanced analytics',
      'White-label options',
      'SLA guarantee',
      'On-premise deployment'
    ],
    popular: false,
    cta: 'Contact Sales'
  }
];

const faqs = [
  {
    question: 'Can I change my plan anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
  },
  {
    question: 'What happens to my unused generations?',
    answer: 'Unused generations roll over to the next month, up to a maximum of 2x your monthly limit.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, all plans include a 7-day free trial with full access to all features.'
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#fff', marginBottom: 16, fontSize: 'clamp(36px, 4vw, 48px)' }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '18px',
            marginBottom: 32
          }}>
            Choose the perfect plan for your creative needs
          </p>

          {/* Billing Toggle */}
          <div className={styles.billingToggle}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={billingCycle === 'monthly' ? styles.activeToggle : styles.inactiveToggle}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={billingCycle === 'yearly' ? styles.activeToggle : styles.inactiveToggle}
            >
              Yearly
              <span className={styles.saveBadge}>
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className={styles.pricingGrid}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 32
        }}>
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>
                  Most Popular
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h3 style={{ color: '#fff', marginBottom: 8, fontSize: 24 }}>
                  {plan.name}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
                  {plan.description}
                </p>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 48, fontWeight: 'bold', color: '#fff' }}>
                    ${billingCycle === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly / 12)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
                    /{billingCycle === 'monthly' ? 'month' : 'month'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div style={{ color: '#52c41a', fontSize: 14, marginBottom: 16 }}>
                    Billed ${plan.price.yearly} annually
                  </div>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={{
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <span style={{ color: '#52c41a', fontSize: 16 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/user/login" style={{ textDecoration: 'none' }}>
                <button className={plan.popular ? styles.ctaButton : styles.secondaryButton}>
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className={styles.faqSection}>
        <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: 48 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <h4 style={{ color: '#fff', marginBottom: 12 }}>
                {faq.question}
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Ready to Get Started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
            Join thousands of creators using our AI-powered platform to bring their ideas to life.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/user/login">
              <button className={styles.ctaButton}>
                Start Free Trial
              </button>
            </Link>
            <Link href="/features">
              <button className={styles.secondaryButton}>
                Learn More
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
