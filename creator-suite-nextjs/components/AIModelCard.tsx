'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiZap, FiStar, FiVideo, FiImage, FiType, FiVolume2, FiAward } from 'react-icons/fi';

interface AIModel {
  id: number;
  name: string;
  displayName: string;
  description: string;
  provider: string;
  type: 'image' | 'video' | 'text' | 'audio';
  costPerGeneration: number;
  features: string[];
  examples: string[];
  isPremium: boolean;
  isNew: boolean;
  rating: number;
  generationTime: string;
  coverImage?: string;
}

interface AIModelCardProps {
  model: AIModel;
  onSelect?: (model: AIModel) => void;
}

const AIModelCard: React.FC<AIModelCardProps> = ({ model, onSelect }) => {
  const router = useRouter();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FiImage style={{ color: '#1890ff' }} />;
      case 'video':
        return <FiVideo style={{ color: '#52c41a' }} />;
      case 'text':
        return <FiType style={{ color: '#fa8c16' }} />;
      case 'audio':
        return <FiVolume2 style={{ color: '#722ed1' }} />;
      default:
        return <FiZap />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'runway':
        return '#1890ff';
      case 'magic_hour':
        return '#52c41a';
      case 'openai':
        return '#000000';
      case 'anthropic':
        return '#fa8c16';
      case 'google':
        return '#d4380d';
      default:
        return '#666666';
    }
  };

  const handleGetStarted = () => {
    if (onSelect) {
      onSelect(model);
    } else {
      // Default navigation based on model type
      if (model.type === 'image') {
        router.push(`/image-generation?provider=${model.provider.toLowerCase()}&service=${model.id}`);
      } else if (model.type === 'video') {
        router.push(`/video-generation?provider=${model.provider.toLowerCase()}&service=${model.id}`);
      }
    }
  };

  return (
    <div
      style={{
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        border: model.isPremium ? '2px solid #ffd700' : '1px solid #f0f0f0',
        background: 'var(--bg)',
        color: 'var(--text)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
    >
      {/* Cover Image or Icon */}
      <div style={{ position: 'relative' }}>
        {model.coverImage ? (
          <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
            <img
              alt={model.displayName}
              src={model.coverImage}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
            />
          </div>
        ) : (
          <div style={{
            height: '160px',
            background: `linear-gradient(135deg, ${getProviderColor(model.provider)}20, ${getProviderColor(model.provider)}05)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: getProviderColor(model.provider),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'white'
              }}
            >
              {getTypeIcon(model.type)}
            </div>
          </div>
        )}

        {/* Tags */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '8px'
        }}>
          {model.isNew && (
            <span style={{
              background: '#1890ff',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              NEW
            </span>
          )}
          {model.isPremium && (
            <span style={{
              background: '#ffd700',
              color: '#000',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FiAward size={12} />
              PREMIUM
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Title and Provider */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              {model.displayName}
            </h3>
            <span style={{
              background: getProviderColor(model.provider),
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              {model.provider}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--muted)' }}>
            <span>{model.type.charAt(0).toUpperCase() + model.type.slice(1)} Generation</span>
            <span>•</span>
            <span>${model.costPerGeneration.toFixed(2)} per generation</span>
          </div>
        </div>

        {/* Description */}
        <p style={{
          margin: '0 0 16px 0',
          color: 'var(--muted)',
          fontSize: '14px',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {model.description}
        </p>

        {/* Features */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
            Key Features:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {model.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                style={{
                  background: 'var(--border)',
                  color: 'var(--muted)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
              >
                {feature}
              </span>
            ))}
            {model.features.length > 3 && (
              <span
                style={{
                  background: 'var(--border)',
                  color: 'var(--muted)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                title={model.features.slice(3).join(', ')}
              >
                +{model.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Rating and Time */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiStar style={{ color: '#faad14', fontSize: '14px' }} />
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
              {model.rating}/5
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            ~{model.generationTime}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGetStarted}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: model.isPremium
              ? 'linear-gradient(135deg, #ffd700, #ffb347)'
              : `linear-gradient(135deg, ${getProviderColor(model.provider)}, ${getProviderColor(model.provider)}dd)`,
            color: model.isPremium ? '#000' : '#fff',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {model.isPremium ? (
            <>
              <FiAward size={16} />
              Get Started
            </>
          ) : (
            <>
              <FiZap size={16} />
              Try Now
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIModelCard;
