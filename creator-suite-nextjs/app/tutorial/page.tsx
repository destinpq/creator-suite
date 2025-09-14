'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlay, FiChevronRight, FiChevronLeft, FiCheck, FiVideo, FiImage, FiSettings, FiUsers, FiCreditCard, FiBook, FiArrowRight } from 'react-icons/fi';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    text: string;
    href: string;
  };
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Creator Suite',
    description: 'Your AI-powered platform for creating cinematic videos and images',
    icon: <FiBook size={32} />,
    content: (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <h2 style={{ color: '#ffb142', fontSize: '28px', marginBottom: '16px' }}>
          🎬 Welcome to Creator Suite
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', lineHeight: '1.6', marginBottom: '24px' }}>
          Transform your ideas into cinematic reality with our AI-powered platform.
          Create professional videos and images in minutes with full creative control.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '32px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <FiVideo style={{ color: '#0099ff', fontSize: '24px', marginBottom: '8px' }} />
            <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Video Generation</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
              Create cinematic videos with AI models from top providers
            </p>
          </div>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <FiImage style={{ color: '#52c41a', fontSize: '24px', marginBottom: '8px' }} />
            <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Image Generation</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
              Generate stunning images with advanced AI models
            </p>
          </div>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <FiSettings style={{ color: '#8000ff', fontSize: '24px', marginBottom: '8px' }} />
            <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Studio Tools</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
              Professional editing and workflow management
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'navigation',
    title: 'Navigation & Getting Started',
    description: 'Learn how to navigate the platform and get started',
    icon: <FiChevronRight size={32} />,
    content: (
      <div>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>🧭 Platform Navigation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#0099ff', margin: '0 0 12px 0' }}>📊 Dashboard</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Your central hub for managing projects, viewing recent creations, and accessing quick actions.
            </p>
            <Link href="/home" style={{ color: '#0099ff', textDecoration: 'none', fontWeight: '500' }}>
              Go to Dashboard →
            </Link>
          </div>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#52c41a', margin: '0 0 12px 0' }}>🎬 Video Generation</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Create videos with AI models. Choose from various providers and customize your content.
            </p>
            <Link href="/video-generation" style={{ color: '#52c41a', textDecoration: 'none', fontWeight: '500' }}>
              Start Creating Videos →
            </Link>
          </div>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#faad14', margin: '0 0 12px 0' }}>🖼️ Image Generation</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Generate high-quality images using advanced AI models with precise control.
            </p>
            <Link href="/image-generation" style={{ color: '#faad14', textDecoration: 'none', fontWeight: '500' }}>
              Create Images →
            </Link>
          </div>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#8000ff', margin: '0 0 12px 0' }}>🤖 AI Models</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Browse and select from our collection of AI models for different creative tasks.
            </p>
            <Link href="/models" style={{ color: '#8000ff', textDecoration: 'none', fontWeight: '500' }}>
              Explore Models →
            </Link>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'first-project',
    title: 'Creating Your First Project',
    description: 'Step-by-step guide to create your first AI-generated content',
    icon: <FiPlay size={32} />,
    content: (
      <div>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>🚀 Your First Project</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #0099ff, #8000ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              1
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Choose Your Content Type</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
                Decide whether you want to create a video or image. Each has different AI models and options available.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link href="/video-generation">
                  <button style={{
                    padding: '8px 16px',
                    background: 'rgba(0,153,255,0.2)',
                    border: '1px solid #0099ff',
                    borderRadius: '6px',
                    color: '#0099ff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    Video Generation
                  </button>
                </Link>
                <Link href="/image-generation">
                  <button style={{
                    padding: '8px 16px',
                    background: 'rgba(250,173,20,0.2)',
                    border: '1px solid #faad14',
                    borderRadius: '6px',
                    color: '#faad14',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    Image Generation
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #52c41a, #0099ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              2
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Select an AI Model</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
                Browse our collection of AI models. Each model has different strengths, pricing, and capabilities.
              </p>
              <Link href="/models">
                <button style={{
                  padding: '8px 16px',
                  background: 'rgba(128,0,255,0.2)',
                  border: '1px solid #8000ff',
                  borderRadius: '6px',
                  color: '#8000ff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Browse Models
                </button>
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #faad14, #52c41a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              3
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Craft Your Prompt</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
                Write a clear, detailed description of what you want to create. Be specific about style, mood, and composition.
              </p>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
                  💡 <strong>Pro Tip:</strong> Use descriptive language like "cinematic shot", "golden hour lighting", "dramatic composition" for better results.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #ef4444, #faad14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              4
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>Generate & Refine</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
                Click generate and wait for your AI creation. Review the results and iterate if needed.
              </p>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
                  ⚡ <strong>Note:</strong> Generation times vary by model and complexity, typically 30 seconds to 5 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features & Tips',
    description: 'Unlock the full potential of Creator Suite',
    icon: <FiSettings size={32} />,
    content: (
      <div>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>⚡ Advanced Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#0099ff', margin: '0 0 12px 0' }}>🎭 Prompt Engineering</h4>
            <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px', margin: 0 }}>
              <li>Use specific camera angles (wide shot, close-up)</li>
              <li>Include lighting descriptions (golden hour, dramatic)</li>
              <li>Specify art styles (cinematic, documentary)</li>
              <li>Add motion keywords (slow zoom, tracking shot)</li>
            </ul>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#52c41a', margin: '0 0 12px 0' }}>🔧 Model Selection</h4>
            <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px', margin: 0 }}>
              <li>Runway ML: Best for cinematic videos</li>
              <li>Veo 3: Highest quality, longer generation</li>
              <li>Hailuo AI: Fast and cost-effective</li>
              <li>DALL-E 3: Excellent for images</li>
            </ul>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#faad14', margin: '0 0 12px 0' }}>💰 Cost Optimization</h4>
            <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px', margin: 0 }}>
              <li>Start with shorter videos (5-10 seconds)</li>
              <li>Use lower resolutions for drafts</li>
              <li>Choose cost-effective models for testing</li>
              <li>Batch similar prompts together</li>
            </ul>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#8000ff', margin: '0 0 12px 0' }}>📈 Workflow Tips</h4>
            <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px', margin: 0 }}>
              <li>Save favorite prompts for reuse</li>
              <li>Use seed images for consistent characters</li>
              <li>Experiment with different aspect ratios</li>
              <li>Combine multiple generations for stories</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'account-management',
    title: 'Account & Billing',
    description: 'Manage your account, billing, and usage',
    icon: <FiUsers size={32} />,
    content: (
      <div>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>👤 Account Management</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#0099ff', margin: '0 0 12px 0' }}>💳 Billing & Credits</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Monitor your usage and manage billing. Different AI models have different credit costs.
            </p>
            <Link href="/billing" style={{ color: '#0099ff', textDecoration: 'none', fontWeight: '500' }}>
              View Billing →
            </Link>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#52c41a', margin: '0 0 12px 0' }}>📊 Usage Analytics</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Track your generation history, costs, and performance metrics across all projects.
            </p>
            <Link href="/user/profile" style={{ color: '#52c41a', textDecoration: 'none', fontWeight: '500' }}>
              View Analytics →
            </Link>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#faad14', margin: '0 0 12px 0' }}>🎯 API Access</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Integrate Creator Suite into your workflow with our REST API and SDKs.
            </p>
            <Link href="/user/profile" style={{ color: '#faad14', textDecoration: 'none', fontWeight: '500' }}>
              API Settings →
            </Link>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#8000ff', margin: '0 0 12px 0' }}>🔐 Security</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Your data and creations are secure. Learn about our privacy and security measures.
            </p>
            <Link href="/features" style={{ color: '#8000ff', textDecoration: 'none', fontWeight: '500' }}>
              Security Info →
            </Link>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'getting-help',
    title: 'Getting Help & Support',
    description: 'Resources and support options available to you',
    icon: <FiCreditCard size={32} />,
    content: (
      <div>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>🆘 Getting Help</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#0099ff', margin: '0 0 12px 0' }}>📚 Documentation</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Comprehensive guides, tutorials, and API documentation for all features.
            </p>
            <a href="#" style={{ color: '#0099ff', textDecoration: 'none', fontWeight: '500' }}>
              View Docs →
            </a>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#52c41a', margin: '0 0 12px 0' }}>💬 Community</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Join our community forum to share tips, get feedback, and learn from other creators.
            </p>
            <a href="#" style={{ color: '#52c41a', textDecoration: 'none', fontWeight: '500' }}>
              Join Community →
            </a>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#faad14', margin: '0 0 12px 0' }}>🎯 Best Practices</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Learn from successful creators with our collection of case studies and best practices.
            </p>
            <Link href="/features" style={{ color: '#faad14', textDecoration: 'none', fontWeight: '500' }}>
              View Examples →
            </Link>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#8000ff', margin: '0 0 12px 0' }}>📞 Support</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
              Need help? Our support team is here to assist you with any questions or issues.
            </p>
            <a href="mailto:support@creatorsuite.com" style={{ color: '#8000ff', textDecoration: 'none', fontWeight: '500' }}>
              Contact Support →
            </a>
          </div>
        </div>

        <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ color: '#ffb142', margin: '0 0 16px 0' }}>🎉 You're All Set!</h4>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 20px 0' }}>
            You've completed the Creator Suite tutorial. You're now ready to start creating amazing AI-generated content.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/video-generation">
              <button style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Start Creating
              </button>
            </Link>
            <Link href="/models">
              <button style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}>
                Explore Models
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
];

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: '#ffb142', margin: '0 0 4px 0', fontSize: '28px' }}>
                📚 Getting Started Tutorial
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                Learn how to navigate and use Creator Suite effectively
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                {currentStep + 1} of {tutorialSteps.length}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}% Complete
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            marginTop: '20px',
            height: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0099ff, #8000ff)',
              width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Step Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {tutorialSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              style={{
                padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '20px',
                background: currentStep === index
                  ? 'linear-gradient(90deg, #0099ff, #8000ff)'
                  : completedSteps.includes(index)
                    ? 'rgba(0,153,255,0.2)'
                    : 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {completedSteps.includes(index) && <FiCheck size={14} />}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {step.icon}
                {step.title}
              </span>
            </button>
          ))}
        </div>

        {/* Current Step Content */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              color: currentStep === 0 ? '#ffb142' :
                     currentStep === 1 ? '#0099ff' :
                     currentStep === 2 ? '#52c41a' :
                     currentStep === 3 ? '#faad14' :
                     currentStep === 4 ? '#8000ff' : '#ef4444'
            }}>
              {currentTutorialStep.icon}
            </div>
            <div>
              <h2 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '24px' }}>
                {currentTutorialStep.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '16px' }}>
                {currentTutorialStep.description}
              </p>
            </div>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.9)' }}>
            {currentTutorialStep.content}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              padding: '12px 24px',
              background: currentStep === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: currentStep === 0 ? 'rgba(255,255,255,0.4)' : '#fff',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <FiChevronLeft size={18} />
            Previous
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentTutorialStep.action && (
              <Link href={currentTutorialStep.action.href}>
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {currentTutorialStep.action.text}
                  <FiArrowRight size={18} />
                </button>
              </Link>
            )}

            {currentStep < tutorialSteps.length - 1 ? (
              <button
                onClick={nextStep}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Next
                <FiChevronRight size={18} />
              </button>
            ) : (
              <Link href="/home">
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #52c41a, #0099ff)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  Get Started
                  <FiPlay size={18} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
