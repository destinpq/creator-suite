'use client';

import React from 'react';
import styles from './features.module.css';

const features = [
  {
    icon: '⚡',
    title: 'Fast Previews',
    description: 'Low-latency drafts so you can iterate quickly without breaking creative flow. Compare takes side-by-side and branch variations in seconds.'
  },
  {
    icon: '🎬',
    title: 'Cinematic Controls',
    description: 'Fine-tune motion cadence, shot scale, lens look, and lighting. Get consistent camera behavior without over-constraining creativity.'
  },
  {
    icon: '🎯',
    title: 'Prompt Adherence',
    description: 'Structured prompts, negatives, and appearance guidance keep outputs faithful to your intent while reducing artifacts.'
  },
  {
    icon: '📹',
    title: 'Long-Video Storyboard',
    description: 'Chain reorderable segments into coherent cuts. Lock approved shots and re-render only what you change.'
  },
  {
    icon: '☁️',
    title: 'Scalable Infrastructure',
    description: 'Autoscaled backends and GPU scheduling keep queues moving at peak demand with predictable costs.'
  },
  {
    icon: '👥',
    title: 'Collaboration',
    description: 'Share secure links, gather time-coded comments, and export color-managed masters for delivery across web, social, and broadcast.'
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SOC 2 compliance, and private deployments for sensitive content and enterprise workflows.'
  },
  {
    icon: '🎨',
    title: 'Creative Freedom',
    description: 'Access to multiple AI models, custom styles, and advanced parameters for unlimited creative possibilities.'
  },
  {
    icon: '📊',
    title: 'Analytics & Insights',
    description: 'Track performance, usage patterns, and ROI with comprehensive analytics and reporting tools.'
  }
];

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#fff', marginBottom: 16, fontSize: 'clamp(36px, 4vw, 48px)' }}>
            Powerful Features for Creative Professionals
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '18px',
            marginBottom: 0
          }}>
            Practical authoring tools paired with production-ready AI models
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className={styles.featuresGrid}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 32
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={styles.featureCard}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {feature.icon}
              </div>
              <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 24 }}>
                {feature.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Video Generation Features */}
      <div className={styles.videoFeatures}>
        <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: 48 }}>
          Video Generation Capabilities
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24
        }}>
          <div style={{
            padding: 24,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#0099ff', marginBottom: 12 }}>🎥 Multiple Formats</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Support for various aspect ratios, resolutions, and durations to fit any platform or use case.
            </p>
          </div>
          <div style={{
            padding: 24,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#8000ff', marginBottom: 12 }}>🎭 Style Control</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Choose from cinematic, documentary, commercial, and custom styles with precise control.
            </p>
          </div>
          <div style={{
            padding: 24,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#52c41a', marginBottom: 12 }}>🔄 Image to Video</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Transform static images into dynamic videos with smooth animations and camera movements.
            </p>
          </div>
        </div>
      </div>

      {/* Image Generation Features */}
      <div className={styles.imageFeatures}>
        <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: 48 }}>
          Image Generation Capabilities
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24
        }}>
          <div style={{
            padding: 24,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#ff6b35', marginBottom: 12 }}>🎨 Multiple Styles</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Photorealistic, artistic, cartoon, anime, and abstract styles with endless creative possibilities.
            </p>
          </div>
          <div style={{
            padding: 24,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#f72585', marginBottom: 12 }}>📐 Custom Dimensions</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Generate images in any size or aspect ratio, from square thumbnails to panoramic landscapes.
            </p>
          </div>
          <div style={{
            padding: 24,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ color: '#4cc9f0', marginBottom: 12 }}>🔍 High Resolution</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>
              Create stunning high-resolution images perfect for print, marketing, and professional use.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Experience the Power</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32 }}>
            Start creating with our comprehensive suite of AI-powered tools today.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/user/login">
              <button className={styles.ctaButton}>
                Start Creating
              </button>
            </a>
            <a href="/models">
              <button className={styles.secondaryButton}>
                Explore Models
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
