'use client';

import React from 'react';
import { FiStar, FiZap, FiAward, FiImage, FiVideo, FiType, FiHeadphones, FiPlay } from 'react-icons/fi';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  rating: number;
  reviewCount: number;
  pricing: {
    input?: number;
    output?: number;
    perImage?: number;
  };
  features: string[];
  category: string;
  isPopular?: boolean;
}

interface AIModelCardProps {
  model: AIModel;
}

const AIModelCard: React.FC<AIModelCardProps> = ({ model }) => {
  const getTypeIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'image generation':
        return <FiImage style={{ color: '#3b82f6' }} />;
      case 'video generation':
        return <FiVideo style={{ color: '#10b981' }} />;
      case 'language model':
        return <FiType style={{ color: '#f59e0b' }} />;
      case 'audio':
        return <FiHeadphones style={{ color: '#8b5cf6' }} />;
      default:
        return <FiZap style={{ color: '#6b7280' }} />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return '#000000';
      case 'anthropic':
        return '#f59e0b';
      case 'google':
        return '#dc2626';
      case 'runway':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const cardStyles = {
    container: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: model.isPopular ? '2px solid #fbbf24' : '1px solid #e5e7eb',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const
    },
    cover: {
      height: '160px',
      background: `linear-gradient(135deg, ${getProviderColor(model.provider)}15, ${getProviderColor(model.provider)}05)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const
    },
    icon: {
      fontSize: '48px',
      color: getProviderColor(model.provider)
    },
    badge: {
      position: 'absolute' as const,
      top: '12px',
      right: '12px',
      background: model.isPopular ? '#fbbf24' : '#3b82f6',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase' as const
    },
    content: {
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      margin: 0,
      color: '#111827'
    },
    provider: {
      background: getProviderColor(model.provider),
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500'
    },
    description: {
      color: '#6b7280',
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '16px',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden'
    },
    features: {
      marginBottom: '16px'
    },
    featuresTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    featuresList: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '6px'
    },
    feature: {
      background: '#f3f4f6',
      color: '#374151',
      padding: '2px 8px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: '500'
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 'auto',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb'
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    ratingText: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151'
    },
    pricing: {
      fontSize: '13px',
      color: '#6b7280'
    },
    button: {
      width: '100%',
      background: model.isPopular
        ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
        : `linear-gradient(135deg, ${getProviderColor(model.provider)}, ${getProviderColor(model.provider)}dd)`,
      color: 'white',
      border: 'none',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      marginTop: '16px'
    }
  };

  const handleGetStarted = () => {
    console.log('Get started with model:', model.name);
    // Handle navigation or action
  };

  return (
    <div style={cardStyles.container} onClick={handleGetStarted}>
      {/* Cover */}
      <div style={cardStyles.cover}>
        {getTypeIcon(model.category)}
        {model.isPopular && (
          <div style={cardStyles.badge}>
            <FiAward size={10} style={{ marginRight: '4px' }} />
            Popular
          </div>
        )}
      </div>

      {/* Content */}
      <div style={cardStyles.content}>
        <div style={cardStyles.header}>
          <h3 style={cardStyles.title}>{model.name}</h3>
          <span style={cardStyles.provider}>{model.provider}</span>
        </div>

        <p style={cardStyles.description}>{model.description}</p>

        <div style={cardStyles.features}>
          <div style={cardStyles.featuresTitle}>Key Features:</div>
          <div style={cardStyles.featuresList}>
            {model.features.slice(0, 3).map((feature, index) => (
              <span key={index} style={cardStyles.feature}>
                {feature}
              </span>
            ))}
            {model.features.length > 3 && (
              <span style={cardStyles.feature}>
                +{model.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div style={cardStyles.footer}>
          <div style={cardStyles.rating}>
            <FiStar style={{ color: '#fbbf24', fontSize: '14px' }} />
            <span style={cardStyles.ratingText}>
              {model.rating} ({model.reviewCount})
            </span>
          </div>
          <div style={cardStyles.pricing}>
            {model.pricing.perImage && `$${model.pricing.perImage.toFixed(2)}/img`}
            {model.pricing.input && model.pricing.output &&
              `$${model.pricing.input.toFixed(3)}/1K in, $${model.pricing.output.toFixed(3)}/1K out`}
          </div>
        </div>

        <button style={cardStyles.button} onClick={(e) => { e.stopPropagation(); handleGetStarted(); }}>
          <FiPlay size={16} />
          {model.isPopular ? 'Get Started' : 'Try Now'}
        </button>
      </div>
    </div>
  );
};

export default AIModelCard;
