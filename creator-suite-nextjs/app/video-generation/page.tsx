'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getModelsByType, AIModel } from '@/types';
import { createVideoTask, vetPrompt, VetPromptParams, CreateVideoTaskParams } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useApi } from '@/lib/useApi';
import { validatePrompt, validateNumber } from '@/lib/validation';
import styles from './video-generation.module.css';

export default function VideoGenerationPage() {
  const searchParams = useSearchParams();
  const serviceId = parseInt(searchParams.get('service') || '1');
  const providerParam = searchParams.get('provider') || 'runway';

  const [form, setForm] = useState({
    prompt: '',
    negativePrompt: '',
    duration: 5,
    aspectRatio: '16:9',
    resolution: '720p' as '720p' | '1080p',
    style: 'cinematic',
    promptOptimizer: false,
    shareToShowcase: false,
    image: null as string | null,
  });

  const [vetResult, setVetResult] = useState<any>(null);
  const [provider, setProvider] = useState(providerParam);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const videoModels = getModelsByType('video');

  // API hooks with error handling
  const {
    loading: vetLoading,
    error: vetError,
    execute: executeVetPrompt
  } = useApi(
    vetPrompt,
    {
      onSuccess: (result) => setVetResult(result.data),
      onError: (error) => console.error('Vet prompt failed:', error),
      retries: 1
    }
  );

  const {
    loading: createLoading,
    error: createError,
    execute: executeCreateVideo
  } = useApi(
    createVideoTask,
    {
      onSuccess: (result) => {
        setGeneratedVideo(result.data.video_url || null);
        alert('Video generation task created successfully!');
        console.log('Task created:', result.data);
      },
      onError: (error) => {
        console.error('Task creation failed:', error);
        alert(`Failed to create video generation task: ${error}`);
      },
      retries: 1
    }
  );

  useEffect(() => {
    const model = videoModels.find(m => m.id === serviceId) || videoModels[0];
    setSelectedModel(model);
    setProvider(model.provider.toLowerCase());
  }, [serviceId, videoModels]);

  const handleVetPrompt = async () => {
    if (!form.prompt.trim()) return;
    await executeVetPrompt({ prompt: form.prompt });
  };

  const handleSubmit = async () => {
    if (!form.prompt.trim() || !selectedModel) return;

    // Validate prompt
    const promptValidation = validatePrompt(form.prompt);
    if (!promptValidation.isValid) {
      alert(`Invalid prompt: ${promptValidation.errors.join(', ')}`);
      return;
    }

    // Validate duration
    const durationValidation = validateNumber(form.duration, {
      min: 5,
      max: 30,
      fieldName: 'Duration'
    });
    if (!durationValidation.isValid) {
      alert(`Invalid duration: ${durationValidation.errors.join(', ')}`);
      return;
    }

    await executeCreateVideo({
      service_id: selectedModel.id,
      prompt: promptValidation.sanitizedValue,
      prompt_optimizer: form.promptOptimizer,
      image: form.image,
      resolution: form.resolution,
      negative_prompt: form.negativePrompt ? validatePrompt(form.negativePrompt).sanitizedValue : null,
      duration: durationValidation.sanitizedValue,
      aspect_ratio: form.aspectRatio,
      style: form.style,
      share_to_showcase: form.shareToShowcase,
    });
  };

  const handleModelSelect = (model: AIModel) => {
    setSelectedModel(model);
    setProvider(model.provider.toLowerCase());
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>AI Video Generation</h1>
        <p className={styles.headerSubtitle}>
          Transform your ideas into cinematic videos with cutting-edge AI technology
        </p>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Preview Section */}
        <section className={styles.previewSection}>
          <h2 className={styles.previewTitle}>Video Preview</h2>
          <div className={`${styles.previewArea} ${generatedVideo ? styles.hasVideo : ''}`}>
            {generatedVideo ? (
              <video
                className={styles.videoPlayer}
                controls
                src={generatedVideo}
                poster="/video-placeholder.jpg"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className={styles.previewPlaceholder}>
                <div className={styles.previewPlaceholderIcon}>🎬</div>
                <div className={styles.previewPlaceholderText}>Your video will appear here</div>
                <div className={styles.previewPlaceholderSubtext}>
                  Generate a video to see the preview
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Controls Section */}
        <section className={styles.controlsSection}>
          <h2 className={styles.controlsTitle}>Create Your Video</h2>

          {/* Model Selector */}
          <div className={styles.modelSelector}>
            <h3 className={styles.modelSelectorTitle}>Choose AI Model</h3>
            <div className={styles.modelGrid}>
              {videoModels.map((model) => (
                <div
                  key={model.id}
                  className={`${styles.modelCard} ${selectedModel?.id === model.id ? styles.selected : ''}`}
                  onClick={() => handleModelSelect(model)}
                >
                  <div className={styles.modelName}>{model.displayName}</div>
                  <div className={styles.modelProvider}>{model.provider}</div>
                  <div className={styles.modelMeta}>
                    <span className={styles.modelCost}>${model.costPerGeneration}</span>
                    <span className={styles.modelTime}>{model.generationTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          {selectedModel && (
            <>
              {/* Prompt */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Video Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  placeholder="Describe the video you want to create in detail..."
                />
              </div>

              {/* Negative Prompt */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Negative Prompt (Optional)</label>
                <textarea
                  className={styles.formTextarea}
                  value={form.negativePrompt}
                  onChange={(e) => setForm({ ...form, negativePrompt: e.target.value })}
                  placeholder="What to avoid in the video..."
                />
              </div>

              {/* Form Grid */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Duration</label>
                  <select
                    className={styles.formSelect}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  >
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Aspect Ratio</label>
                  <select
                    className={styles.formSelect}
                    value={form.aspectRatio}
                    onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:3">4:3 Standard</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resolution</label>
                  <select
                    className={styles.formSelect}
                    value={form.resolution}
                    onChange={(e) => setForm({ ...form, resolution: e.target.value as '720p' | '1080p' })}
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Style</label>
                  <select
                    className={styles.formSelect}
                    value={form.style}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
                  >
                    <option value="cinematic">Cinematic</option>
                    <option value="realistic">Realistic</option>
                    <option value="animated">Animated</option>
                    <option value="artistic">Artistic</option>
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="promptOptimizer"
                  className={styles.checkboxInput}
                  checked={form.promptOptimizer}
                  onChange={(e) => setForm({ ...form, promptOptimizer: e.target.checked })}
                />
                <label htmlFor="promptOptimizer" className={styles.checkboxLabel}>
                  Enable AI prompt optimization
                </label>
              </div>

              {/* Share Option */}
              <div className={styles.shareOption}>
                <h4 className={styles.shareOptionTitle}>Share Your Creation</h4>
                <p className={styles.shareOptionDesc}>
                  Showcase your video on our community gallery to inspire other creators
                </p>
                <div className={styles.shareCheckbox}>
                  <input
                    type="checkbox"
                    id="shareToShowcase"
                    checked={form.shareToShowcase}
                    onChange={(e) => setForm({ ...form, shareToShowcase: e.target.checked })}
                  />
                  <label htmlFor="shareToShowcase">
                    Share this video to the community showcase
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button
                  className={styles.secondaryButton}
                  onClick={handleVetPrompt}
                  disabled={!form.prompt.trim() || vetLoading}
                >
                  {vetLoading && <span className={styles.loadingSpinner}></span>}
                  {vetLoading ? 'Checking...' : 'Check Prompt'}
                </button>

                <button
                  className={styles.primaryButton}
                  onClick={handleSubmit}
                  disabled={!form.prompt.trim() || createLoading}
                >
                  {createLoading && <span className={styles.loadingSpinner}></span>}
                  {createLoading ? 'Generating...' : 'Generate Video'}
                </button>
              </div>

              {/* Messages */}
              {vetError && (
                <div className={styles.errorMessage}>
                  <strong>Vet Prompt Error:</strong> {vetError}
                </div>
              )}

              {createError && (
                <div className={styles.errorMessage}>
                  <strong>Generation Error:</strong> {createError}
                </div>
              )}

              {vetResult && (
                <div className={`${styles.vetResult} ${vetResult.allowed ? styles.allowed : styles.denied}`}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {vetResult.allowed ? '✅ Prompt Approved' : '❌ Prompt Rejected'}
                  </div>
                  {vetResult.violations && vetResult.violations.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600 }}>Violations:</div>
                      <ul>
                        {vetResult.violations.map((v: string, idx: number) => (
                          <li key={idx}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {vetResult.safe_alternatives && vetResult.safe_alternatives.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600 }}>Safe Alternatives:</div>
                      {vetResult.safe_alternatives.map((alt: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 8 }}>
                          <div>{alt.prompt}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{alt.notes}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
