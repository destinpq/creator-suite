'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getModelsByType, AIModel } from '@/types';
import { generateImage } from '@/lib/api';

export default function ImageGenerationPage() {
  const searchParams = useSearchParams();
  const serviceId = parseInt(searchParams.get('service') || '9');
  const providerParam = searchParams.get('provider') || 'runway';

  const [form, setForm] = useState({
    prompt: '',
    aspectRatio: '16:9',
    outputFormat: 'jpg',
    safetyLevel: 'block_only_high',
    provider: providerParam,
    style: 'photorealistic',
  });

  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [activeTab, setActiveTab] = useState('form');

  const imageModels = getModelsByType('image');

  useEffect(() => {
    const model = imageModels.find(m => m.id === serviceId) || imageModels[0];
    setSelectedModel(model);
    setForm(prev => ({ ...prev, provider: model.provider.toLowerCase() }));
  }, [serviceId, imageModels]);

  const handleSubmit = async () => {
    if (!form.prompt.trim() || !selectedModel) return;

    setLoading(true);
    try {
      const params = {
        prompt: form.prompt,
        aspect_ratio: form.aspectRatio,
        output_format: form.outputFormat,
        safety_filter_level: form.safetyLevel,
        provider: form.provider,
        style: form.style,
        service_id: selectedModel.id,
      };

      const result = await generateImage(params);
      alert('Image generation task created successfully!');
      console.log('Task created:', result.data);
    } catch (error) {
      console.error('Task creation failed:', error);
      alert('Failed to create image generation task');
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (model: AIModel) => {
    setSelectedModel(model);
    setForm(prev => ({ ...prev, provider: model.provider.toLowerCase() }));
    setActiveTab('form');
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1>Image Generation</h1>
        <p>Create stunning images with AI-powered generation</p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Model Selection Sidebar */}
        <div style={{ flex: '0 0 300px' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
            <h3>Select AI Model</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {imageModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  style={{
                    padding: 12,
                    border: selectedModel?.id === model.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: selectedModel?.id === model.id ? 'var(--primary)' : 'var(--bg)',
                    color: selectedModel?.id === model.id ? '#fff' : 'var(--text)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{model.displayName}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{model.provider}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    ${model.costPerGeneration} • {model.generationTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {selectedModel && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 24, background: 'var(--bg)' }}>
              <div style={{ marginBottom: 24 }}>
                <h2>{selectedModel.displayName}</h2>
                <p>{selectedModel.description}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {selectedModel.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} style={{
                      padding: '4px 8px',
                      background: 'var(--primary)',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Prompt</label>
                  <textarea
                    value={form.prompt}
                    onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                    placeholder="Describe the image you want to create..."
                    style={{
                      width: '100%',
                      minHeight: 100,
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Aspect Ratio</label>
                    <select
                      value={form.aspectRatio}
                      onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--bg)',
                        color: 'var(--text)'
                      }}
                    >
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="4:3">4:3 (Standard)</option>
                      <option value="3:4">3:4 (Vertical)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Output Format</label>
                    <select
                      value={form.outputFormat}
                      onChange={(e) => setForm({ ...form, outputFormat: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--bg)',
                        color: 'var(--text)'
                      }}
                    >
                      <option value="jpg">JPG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Style</label>
                    <select
                      value={form.style}
                      onChange={(e) => setForm({ ...form, style: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--bg)',
                        color: 'var(--text)'
                      }}
                    >
                      <option value="photorealistic">Photorealistic</option>
                      <option value="artistic">Artistic</option>
                      <option value="cinematic">Cinematic</option>
                      <option value="anime">Anime</option>
                      <option value="cartoon">Cartoon</option>
                      <option value="abstract">Abstract</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Safety Level</label>
                    <select
                      value={form.safetyLevel}
                      onChange={(e) => setForm({ ...form, safetyLevel: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--bg)',
                        color: 'var(--text)'
                      }}
                    >
                      <option value="block_only_high">Block Only High Risk</option>
                      <option value="block_medium_and_above">Block Medium & High Risk</option>
                      <option value="block_low_and_above">Block Low & Above Risk</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.prompt.trim() || loading}
                    style={{
                      padding: '12px 24px',
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      fontSize: 16,
                      fontWeight: 600
                    }}
                  >
                    {loading ? 'Generating...' : 'Generate Image'}
                  </button>
                </div>

                {/* Example Prompts */}
                <div style={{ marginTop: 24 }}>
                  <h3>Example Prompts</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 12 }}>
                    {selectedModel.examples.map((example, idx) => (
                      <div
                        key={idx}
                        onClick={() => setForm({ ...form, prompt: example })}
                        style={{
                          padding: 12,
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          background: 'var(--bg)',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
