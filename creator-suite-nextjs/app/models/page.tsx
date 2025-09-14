'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiStar, FiHeart, FiSettings, FiInfo, FiCheck, FiZap, FiClock, FiTrendingUp } from 'react-icons/fi';

interface Model {
  id: string;
  name: string;
  provider: string;
  type: 'video' | 'image' | 'audio';
  description: string;
  features: string[];
  specs: {
    resolution?: string;
    duration?: string;
    quality: string;
    speed: string;
  };
  pricing: {
    perGeneration: number;
    monthlyLimit: number;
  };
  rating: number;
  isPopular: boolean;
  isNew: boolean;
  status: 'available' | 'beta' | 'coming_soon';
  usageCount: number;
  averageGenerationTime: number;
}

const models: Model[] = [
  {
    id: 'runway-ml',
    name: 'Runway ML',
    provider: 'Runway',
    type: 'video',
    description: 'Advanced video generation with cinematic quality and creative control',
    features: ['Text-to-video', 'Image-to-video', 'Style transfer', 'Motion control'],
    specs: {
      resolution: 'Up to 2048x2048',
      duration: 'Up to 10 seconds',
      quality: 'High',
      speed: '2-5 min'
    },
    pricing: {
      perGeneration: 0.25,
      monthlyLimit: 100
    },
    rating: 4.8,
    isPopular: true,
    isNew: false,
    status: 'available',
    usageCount: 125000,
    averageGenerationTime: 180
  },
  {
    id: 'veo3',
    name: 'Veo 3',
    provider: 'Google',
    type: 'video',
    description: 'Google\'s latest video generation model with exceptional detail and coherence',
    features: ['High fidelity', 'Long-form content', 'Multi-style support', 'API access'],
    specs: {
      resolution: 'Up to 1920x1080',
      duration: 'Up to 60 seconds',
      quality: 'Ultra High',
      speed: '3-8 min'
    },
    pricing: {
      perGeneration: 0.35,
      monthlyLimit: 50
    },
    rating: 4.9,
    isPopular: true,
    isNew: true,
    status: 'available',
    usageCount: 89000,
    averageGenerationTime: 240
  },
  {
    id: 'hailuo-ai',
    name: 'Hailuo AI',
    provider: 'Hailuo',
    type: 'video',
    description: 'Fast and efficient video generation with artistic style options',
    features: ['Quick generation', 'Artistic styles', 'Batch processing', 'Cost-effective'],
    specs: {
      resolution: 'Up to 1280x720',
      duration: 'Up to 5 seconds',
      quality: 'Medium',
      speed: '30-90 sec'
    },
    pricing: {
      perGeneration: 0.15,
      monthlyLimit: 200
    },
    rating: 4.5,
    isPopular: false,
    isNew: false,
    status: 'available',
    usageCount: 67000,
    averageGenerationTime: 75
  },
  {
    id: 'imagen-4-ultra',
    name: 'Imagen 4 Ultra',
    provider: 'Google',
    type: 'image',
    description: 'Google\'s most advanced image generation model with photorealistic quality',
    features: ['Photorealistic', 'High resolution', 'Style control', 'Negative prompts'],
    specs: {
      resolution: 'Up to 4096x4096',
      quality: 'Ultra High',
      speed: '10-30 sec'
    },
    pricing: {
      perGeneration: 0.08,
      monthlyLimit: 500
    },
    rating: 4.9,
    isPopular: true,
    isNew: false,
    status: 'available',
    usageCount: 245000,
    averageGenerationTime: 20
  },
  {
    id: 'dalle-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    type: 'image',
    description: 'OpenAI\'s advanced image generation with creative and diverse outputs',
    features: ['Creative diversity', 'Text understanding', 'Style variations', 'HD quality'],
    specs: {
      resolution: 'Up to 1024x1024',
      quality: 'High',
      speed: '15-45 sec'
    },
    pricing: {
      perGeneration: 0.06,
      monthlyLimit: 1000
    },
    rating: 4.7,
    isPopular: true,
    isNew: false,
    status: 'available',
    usageCount: 320000,
    averageGenerationTime: 25
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    provider: 'Midjourney',
    type: 'image',
    description: 'Artistic image generation with unique aesthetic and community-driven features',
    features: ['Artistic styles', 'Community features', 'Upscaling', 'Variations'],
    specs: {
      resolution: 'Up to 2048x2048',
      quality: 'High',
      speed: '20-60 sec'
    },
    pricing: {
      perGeneration: 0.04,
      monthlyLimit: 2000
    },
    rating: 4.6,
    isPopular: false,
    isNew: false,
    status: 'available',
    usageCount: 180000,
    averageGenerationTime: 35
  }
];

export default function ModelsPage() {
  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'image' | 'audio'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price' | 'speed'>('popular');

  useEffect(() => {
    // Load user favorites from localStorage
    const savedFavorites = localStorage.getItem('model_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (modelId: string) => {
    const newFavorites = favorites.includes(modelId)
      ? favorites.filter(id => id !== modelId)
      : [...favorites, modelId];
    setFavorites(newFavorites);
    localStorage.setItem('model_favorites', JSON.stringify(newFavorites));
  };

  const filteredModels = models
    .filter(model => selectedType === 'all' || model.type === selectedType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.pricing.perGeneration - b.pricing.perGeneration;
        case 'speed':
          return a.averageGenerationTime - b.averageGenerationTime;
        case 'popular':
        default:
          return b.usageCount - a.usageCount;
      }
    });

  const ModelCard = ({ model }: { model: Model }) => {
    const isFavorite = favorites.includes(model.id);

    return (
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        border: model.isPopular ? '2px solid #0099ff' : '1px solid rgba(255,255,255,0.1)',
        padding: 24,
        position: 'relative',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }} onClick={() => setSelectedModel(model)}>
        {model.isPopular && (
          <div style={{
            position: 'absolute',
            top: -10,
            right: 20,
            background: 'linear-gradient(90deg, #0099ff, #8000ff)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600
          }}>
            Popular
          </div>
        )}

        {model.isNew && (
          <div style={{
            position: 'absolute',
            top: -10,
            left: 20,
            background: '#52c41a',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600
          }}>
            New
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{model.name}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 14 }}>{model.provider}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiStar style={{ color: '#faad14', fill: '#faad14' }} size={16} />
              <span style={{ color: '#fff', fontSize: 14 }}>{model.rating}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(model.id); }}
              style={{
                background: 'none',
                border: 'none',
                color: isFavorite ? '#ff4d4f' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <FiHeart size={20} fill={isFavorite ? '#ff4d4f' : 'none'} />
            </button>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16, fontSize: 14 }}>
          {model.description}
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {model.features.slice(0, 3).map((feature, idx) => (
              <span key={idx} style={{
                background: 'rgba(0,153,255,0.2)',
                color: '#0099ff',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 12
              }}>
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Quality</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{model.specs.quality}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Speed</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{model.specs.speed}</div>
          </div>
          {model.specs.resolution && (
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Resolution</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{model.specs.resolution}</div>
            </div>
          )}
          {model.specs.duration && (
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Duration</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{model.specs.duration}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Cost per generation</div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>${model.pricing.perGeneration}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Monthly limit</div>
            <div style={{ color: '#fff', fontSize: 14 }}>{model.pricing.monthlyLimit}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1,
            padding: '10px 16px',
            background: 'linear-gradient(90deg, #0099ff, #8000ff)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}>
            Use Model
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedModel(model); }}
            style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            <FiInfo size={16} />
          </button>
        </div>
      </div>
    );
  };

  const ModelDetailModal = ({ model, onClose }: { model: Model | null; onClose: () => void }) => {
    if (!model) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }} onClick={onClose}>
        <div style={{
          background: '#0b0b0b',
          borderRadius: 16,
          padding: 32,
          maxWidth: 800,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid rgba(255,255,255,0.1)'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{model.name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>by {model.provider}</p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.6 }}>
              {model.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
            <div>
              <h4 style={{ color: '#fff', marginBottom: 12 }}>Features</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {model.features.map((feature, idx) => (
                  <li key={idx} style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiCheck style={{ color: '#52c41a' }} size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#fff', marginBottom: 12 }}>Specifications</h4>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Quality:</span>
                  <span style={{ color: '#fff' }}>{model.specs.quality}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Speed:</span>
                  <span style={{ color: '#fff' }}>{model.specs.speed}</span>
                </div>
                {model.specs.resolution && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Resolution:</span>
                    <span style={{ color: '#fff' }}>{model.specs.resolution}</span>
                  </div>
                )}
                {model.specs.duration && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Duration:</span>
                    <span style={{ color: '#fff' }}>{model.specs.duration}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ color: '#fff', marginBottom: 12 }}>Usage Stats</h4>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiTrendingUp style={{ color: '#0099ff' }} size={16} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Used by {model.usageCount.toLocaleString()} creators</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiClock style={{ color: '#faad14' }} size={16} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Avg. {Math.round(model.averageGenerationTime / 60)} min generation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiStar style={{ color: '#faad14', fill: '#faad14' }} size={16} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{model.rating} rating</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href={model.type === 'video' ? '/video-generation' : '/image-generation'} style={{ flex: 1 }}>
              <button style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600
              }}>
                Use This Model
              </button>
            </Link>
            <button
              onClick={() => toggleFavorite(model.id)}
              style={{
                padding: '14px 24px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FiHeart size={16} fill={favorites.includes(model.id) ? '#ff4d4f' : 'none'} />
              {favorites.includes(model.id) ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>AI Models</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
            Discover and select from our comprehensive collection of AI models for content creation
          </p>
        </div>

        {/* Filters and Controls */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          padding: 20,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'video', 'image', 'audio'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  padding: '8px 16px',
                  background: selectedType === type ? 'linear-gradient(90deg, #0099ff, #8000ff)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: selectedType === type ? 600 : 400
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14
              }}
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Lowest Price</option>
              <option value="speed">Fastest</option>
            </select>
          </div>
        </div>

        {/* Models Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 24
        }}>
          {filteredModels.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 60,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>No models found</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Try adjusting your filters to see more models
            </p>
          </div>
        )}

        {/* Model Detail Modal */}
        <ModelDetailModal
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      </div>
    </div>
  );
}
