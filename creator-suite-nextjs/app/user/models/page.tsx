'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiHeart, FiSettings, FiTrendingUp, FiClock, FiStar, FiBarChart, FiZap, FiTarget, FiEdit3 } from 'react-icons/fi';

interface UserModelPreference {
  modelId: string;
  modelName: string;
  provider: string;
  type: 'video' | 'image' | 'audio';
  isFavorite: boolean;
  isDefault: boolean;
  usageCount: number;
  lastUsed: string;
  averageRating: number;
  customSettings: {
    quality: string;
    speed: string;
    style?: string;
  };
}

interface UsageStats {
  totalGenerations: number;
  totalSpent: number;
  averageCost: number;
  mostUsedModel: string;
  thisMonthUsage: number;
  thisMonthSpent: number;
}

const mockUserPreferences: UserModelPreference[] = [
  {
    modelId: 'runway-ml',
    modelName: 'Runway ML',
    provider: 'Runway',
    type: 'video',
    isFavorite: true,
    isDefault: true,
    usageCount: 45,
    lastUsed: '2024-01-15T14:30:00Z',
    averageRating: 4.8,
    customSettings: {
      quality: 'High',
      speed: 'Fast',
      style: 'Cinematic'
    }
  },
  {
    modelId: 'imagen-4-ultra',
    modelName: 'Imagen 4 Ultra',
    provider: 'Google',
    type: 'image',
    isFavorite: true,
    isDefault: false,
    usageCount: 120,
    lastUsed: '2024-01-15T10:15:00Z',
    averageRating: 4.9,
    customSettings: {
      quality: 'Ultra High',
      speed: 'Standard'
    }
  },
  {
    modelId: 'dalle-3',
    modelName: 'DALL-E 3',
    provider: 'OpenAI',
    type: 'image',
    isFavorite: false,
    isDefault: false,
    usageCount: 67,
    lastUsed: '2024-01-14T16:45:00Z',
    averageRating: 4.6,
    customSettings: {
      quality: 'High',
      speed: 'Fast'
    }
  }
];

const mockUsageStats: UsageStats = {
  totalGenerations: 5432,
  totalSpent: 234.67,
  averageCost: 0.043,
  mostUsedModel: 'Imagen 4 Ultra',
  thisMonthUsage: 234,
  thisMonthSpent: 12.45
};

export default function UserModelsPage() {
  const [preferences, setPreferences] = useState<UserModelPreference[]>(mockUserPreferences);
  const [usageStats] = useState<UsageStats>(mockUsageStats);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'favorites' | 'all' | 'analytics'>('favorites');

  const toggleFavorite = (modelId: string) => {
    setPreferences(preferences.map(pref =>
      pref.modelId === modelId
        ? { ...pref, isFavorite: !pref.isFavorite }
        : pref
    ));
  };

  const setAsDefault = (modelId: string) => {
    setPreferences(preferences.map(pref => ({
      ...pref,
      isDefault: pref.modelId === modelId
    })));
  };

  const updateCustomSettings = (modelId: string, settings: Partial<UserModelPreference['customSettings']>) => {
    setPreferences(preferences.map(pref =>
      pref.modelId === modelId
        ? { ...pref, customSettings: { ...pref.customSettings, ...settings } }
        : pref
    ));
  };

  const filteredPreferences = preferences.filter(pref => {
    if (activeTab === 'favorites') return pref.isFavorite;
    if (activeTab === 'all') return true;
    return false;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const ModelCard = ({ preference }: { preference: UserModelPreference }) => {
    const isEditing = editingModel === preference.modelId;

    return (
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        border: preference.isDefault ? '2px solid #0099ff' : '1px solid rgba(255,255,255,0.1)',
        padding: 24,
        position: 'relative'
      }}>
        {preference.isDefault && (
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
            Default
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{preference.modelName}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 14 }}>
              {preference.provider} • {preference.type.charAt(0).toUpperCase() + preference.type.slice(1)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiStar style={{ color: '#faad14', fill: '#faad14' }} size={16} />
              <span style={{ color: '#fff', fontSize: 14 }}>{preference.averageRating}</span>
            </div>
            <button
              onClick={() => toggleFavorite(preference.modelId)}
              style={{
                background: 'none',
                border: 'none',
                color: preference.isFavorite ? '#ff4d4f' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <FiHeart size={20} fill={preference.isFavorite ? '#ff4d4f' : 'none'} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Usage Count</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>{preference.usageCount}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Last Used</div>
            <div style={{ color: '#fff', fontSize: 14 }}>{formatDate(preference.lastUsed)}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 }}>Custom Settings</div>
          {isEditing ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <select
                value={preference.customSettings.quality}
                onChange={(e) => updateCustomSettings(preference.modelId, { quality: e.target.value })}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Ultra High">Ultra High</option>
              </select>
              <select
                value={preference.customSettings.speed}
                onChange={(e) => updateCustomSettings(preference.modelId, { speed: e.target.value })}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14
                }}
              >
                <option value="Fast">Fast</option>
                <option value="Standard">Standard</option>
                <option value="Slow">Slow</option>
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{
                background: 'rgba(0,153,255,0.2)',
                color: '#0099ff',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 12
              }}>
                {preference.customSettings.quality}
              </span>
              <span style={{
                background: 'rgba(128,0,255,0.2)',
                color: '#8000ff',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 12
              }}>
                {preference.customSettings.speed}
              </span>
              {preference.customSettings.style && (
                <span style={{
                  background: 'rgba(250,173,20,0.2)',
                  color: '#faad14',
                  padding: '4px 8px',
                  borderRadius: 12,
                  fontSize: 12
                }}>
                  {preference.customSettings.style}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!preference.isDefault && (
            <button
              onClick={() => setAsDefault(preference.modelId)}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'rgba(0,153,255,0.2)',
                color: '#0099ff',
                border: '1px solid rgba(0,153,255,0.3)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Set as Default
            </button>
          )}
          <button
            onClick={() => setEditingModel(isEditing ? null : preference.modelId)}
            style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            <FiEdit3 size={16} />
          </button>
          <Link href={preference.type === 'video' ? '/video-generation' : '/image-generation'}>
            <button style={{
              padding: '10px 16px',
              background: 'linear-gradient(90deg, #0099ff, #8000ff)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14
            }}>
              Use Model
            </button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>My Models</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
            Manage your AI model preferences, settings, and usage analytics
          </p>
        </div>

        {/* Usage Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiBarChart style={{ color: '#0099ff', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{usageStats.totalGenerations.toLocaleString()}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Total Generations</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiTarget style={{ color: '#52c41a', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>${usageStats.totalSpent.toFixed(2)}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Total Spent</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiZap style={{ color: '#faad14', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{usageStats.thisMonthUsage}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>This Month</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiTrendingUp style={{ color: '#ff4d4f', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{usageStats.mostUsedModel}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Most Used</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          padding: 4,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          width: 'fit-content'
        }}>
          {[
            { key: 'favorites', label: 'Favorites', count: preferences.filter(p => p.isFavorite).length },
            { key: 'all', label: 'All Models', count: preferences.length },
            { key: 'analytics', label: 'Analytics', count: null }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab.key ? 'linear-gradient(90deg, #0099ff, #8000ff)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 12
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'analytics' ? (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 32
          }}>
            <h2 style={{ color: '#fff', marginBottom: 24 }}>Usage Analytics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div>
                <h3 style={{ color: '#fff', marginBottom: 16 }}>Monthly Usage Trend</h3>
                <div style={{
                  height: 200,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  Chart Placeholder - Usage over time
                </div>
              </div>

              <div>
                <h3 style={{ color: '#fff', marginBottom: 16 }}>Model Performance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {preferences.slice(0, 3).map(pref => (
                    <div key={pref.modelId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 12,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 8
                    }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: 14 }}>{pref.modelName}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{pref.usageCount} uses</div>
                      </div>
                      <div style={{ color: '#52c41a', fontSize: 18, fontWeight: 'bold' }}>
                        {pref.averageRating}★
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: '#fff', marginBottom: 16 }}>Cost Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>${usageStats.averageCost.toFixed(3)}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Average Cost per Generation</div>
                </div>
                <div style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>${usageStats.thisMonthSpent.toFixed(2)}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Spent This Month</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 24
          }}>
            {filteredPreferences.map(preference => (
              <ModelCard key={preference.modelId} preference={preference} />
            ))}
          </div>
        )}

        {filteredPreferences.length === 0 && activeTab !== 'analytics' && (
          <div style={{
            textAlign: 'center',
            padding: 60,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              {activeTab === 'favorites' ? 'No favorite models yet' : 'No models found'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              {activeTab === 'favorites'
                ? 'Start using models and mark them as favorites to see them here'
                : 'Explore available models to get started'
              }
            </p>
            <Link href="/models">
              <button style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16
              }}>
                Browse Models
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
