'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiUpload, FiCreditCard, FiInfo, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

interface VideoGenerationStudioProps {
  onVideoGenerated?: (result: any) => void;
}

interface PromptTemplate {
  [category: string]: string[];
}

const promptTemplates: PromptTemplate = {
  cinematic: [
    "cinematic shot of a person walking through a futuristic city at golden hour, epic wide shot, dramatic lighting",
    "slow motion cinematic shot of water droplets falling on a leaf, hyperrealistic, 35mm film grain",
    "aerial cinematic view of a mountain landscape at sunrise, volumetric lighting, epic scale"
  ],
  action: [
    "dynamic action shot of a superhero flying through the city, motion blur, high energy",
    "fast-paced tracking shot following a runner through urban streets, handheld camera",
    "explosive action sequence with debris flying, slow motion, dramatic lighting"
  ],
  nature: [
    "serene nature scene of a waterfall in a forest, golden hour lighting, peaceful atmosphere",
    "macro shot of a butterfly on a flower, soft diffused light, hyperrealistic detail",
    "time-lapse of clouds moving across a mountain peak, cinematic wide shot"
  ]
};

const durationOptions = [
  { value: 8, label: '8 seconds (1 credit)' },
  { value: 16, label: '16 seconds (2 credits)' },
  { value: 24, label: '24 seconds (3 credits)' },
  { value: 32, label: '32 seconds (4 credits)' }
];

const resolutionOptions = [
  { value: '1280x768', label: '1280x768 (Landscape)' },
  { value: '768x1280', label: '768x1280 (Portrait)' },
  { value: '1024x1024', label: '1024x1024 (Square)' }
];

const VideoGenerationStudio: React.FC<VideoGenerationStudioProps> = ({ onVideoGenerated }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [userCredits, setUserCredits] = useState(50); // Mock credits
  const [costEstimate, setCostEstimate] = useState(2);
  const [seedImage, setSeedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    prompt: '',
    duration: 16,
    resolution: '1280x768',
    seed_influence: 0.8
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [messages, setMessages] = useState<{type: 'success' | 'error' | 'warning', text: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock services - replace with real API calls
  const videoService = {
    generateVideo: async (data: any) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true, videoUrl: 'mock-video-url', error: null };
    }
  };

  const paymentService = {
    createTopUpPayment: async (amount: number) => {
      return 'mock-payment-url';
    }
  };

  useEffect(() => {
    // Load user credits on mount
    loadUserCredits();
  }, []);

  const loadUserCredits = async () => {
    // Mock API call
    setUserCredits(50);
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessages(prev => [...prev, { type, text }]);
    setTimeout(() => {
      setMessages(prev => prev.slice(1));
    }, 5000);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Please enter a prompt';
    }

    if (!formData.duration) {
      newErrors.duration = 'Please select duration';
    }

    if (!formData.resolution) {
      newErrors.resolution = 'Please select resolution';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Update cost estimate when duration changes
    if (field === 'duration') {
      const segments = Math.ceil(value / 8);
      setCostEstimate(segments);
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSeedImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showMessage('error', 'File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select a valid image file');
        return;
      }

      setSeedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeSeedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSeedImage(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      return;
    }

    if (costEstimate > userCredits) {
      showMessage('error', `Insufficient credits. You need ${costEstimate} credits but have ${userCredits}.`);
      return;
    }

    setLoading(true);
    setGenerationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 1, 95));
      }, 1000);

      const generateData: any = {
        prompt: formData.prompt,
        duration: formData.duration,
        resolution: formData.resolution,
        model: 'gen3a_turbo'
      };

      // Add seed image if provided
      if (seedImage && previewUrl) {
        generateData.seed_image = previewUrl;
        generateData.seed_influence = formData.seed_influence;
      }

      const result = await videoService.generateVideo(generateData);

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (result.success) {
        showMessage('success', 'Video generated successfully!');
        onVideoGenerated?.(result);
        await loadUserCredits(); // Refresh credits
        setFormData({
          prompt: '',
          duration: 16,
          resolution: '1280x768',
          seed_influence: 0.8
        });
        removeSeedImage();
      } else {
        showMessage('error', `Generation failed: ${result.error}`);
      }
    } catch (error: any) {
      showMessage('error', `Generation error: ${error.message}`);
    } finally {
      setLoading(false);
      setGenerationProgress(0);
    }
  };

  const insertTemplate = (template: string) => {
    handleInputChange('prompt', template);
  };

  const topUpCredits = async () => {
    try {
      const paymentUrl = await paymentService.createTopUpPayment(100);
      window.open(paymentUrl, '_blank');
    } catch (error) {
      showMessage('error', 'Failed to initiate payment');
    }
  };

  const tabStyles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      padding: '24px',
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    credits: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    creditTag: {
      background: '#dbeafe',
      color: '#1e40af',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    topUpBtn: {
      background: '#2563eb',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: '500'
    },
    tabs: {
      display: 'flex',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '24px'
    },
    tab: {
      padding: '12px 24px',
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      fontWeight: '500',
      color: '#6b7280',
      transition: 'all 0.2s'
    },
    activeTab: {
      color: '#2563eb',
      borderBottomColor: '#2563eb'
    },
    tabContent: {
      padding: '24px'
    },
    form: {
      display: 'grid',
      gap: '16px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      transition: 'border-color 0.2s'
    },
    textarea: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '100px',
      resize: 'vertical' as const,
      fontFamily: 'inherit'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      background: 'white'
    },
    error: {
      color: '#dc2626',
      fontSize: '12px'
    },
    button: {
      background: '#2563eb',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed'
    },
    progress: {
      width: '100%',
      height: '8px',
      background: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '8px'
    },
    progressBar: {
      height: '100%',
      background: 'linear-gradient(90deg, #2563eb 0%, #10b981 100%)',
      transition: 'width 0.3s ease'
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '6px',
      border: '1px solid',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px'
    },
    alertWarning: {
      background: '#fef3c7',
      borderColor: '#f59e0b',
      color: '#92400e'
    },
    alertInfo: {
      background: '#eff6ff',
      borderColor: '#3b82f6',
      color: '#1e40af'
    },
    message: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 1000,
      padding: '12px 16px',
      borderRadius: '6px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    messageSuccess: {
      background: '#10b981'
    },
    messageError: {
      background: '#ef4444'
    },
    messageWarning: {
      background: '#f59e0b'
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: '24px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'border-color 0.2s'
    },
    uploadAreaHover: {
      borderColor: '#2563eb'
    },
    preview: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '8px',
      objectFit: 'contain' as const
    },
    slider: {
      width: '100%',
      height: '6px',
      background: '#e5e7eb',
      borderRadius: '3px',
      outline: 'none',
      cursor: 'pointer'
    },
    templateBtn: {
      width: '100%',
      padding: '12px',
      border: '1px dashed #d1d5db',
      background: 'white',
      borderRadius: '6px',
      cursor: 'pointer',
      textAlign: 'left' as const,
      fontSize: '14px',
      transition: 'border-color 0.2s'
    },
    guide: {
      display: 'grid',
      gap: '24px'
    },
    guideSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px'
    },
    guideTitle: {
      fontSize: '18px',
      fontWeight: '600',
      margin: 0
    },
    tags: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px'
    },
    tag: {
      background: '#f3f4f6',
      color: '#374151',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    }
  };

  return (
    <div style={tabStyles.container}>
      {/* Messages */}
      {messages.map((msg, index) => (
        <div
          key={index}
          style={{
            ...tabStyles.message,
            ...(msg.type === 'success' ? tabStyles.messageSuccess :
                msg.type === 'error' ? tabStyles.messageError : tabStyles.messageWarning)
          }}
        >
          {msg.type === 'success' && <FiCheck />}
          {msg.type === 'error' && <FiX />}
          {msg.type === 'warning' && <FiAlertTriangle />}
          {msg.text}
        </div>
      ))}

      <div style={tabStyles.card}>
        {/* Header */}
        <div style={tabStyles.header}>
          <h1 style={tabStyles.title}>
            🎬 Runway Gen-3 Alpha Studio
          </h1>
          <div style={tabStyles.credits}>
            <span style={tabStyles.creditTag}>
              <FiCreditCard size={14} />
              {userCredits} Credits
            </span>
            <button
              style={tabStyles.topUpBtn}
              onClick={topUpCredits}
            >
              <FiCreditCard size={14} />
              Top Up Credits
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={tabStyles.tabs}>
          {['basic', 'seed', 'templates', 'guide'].map((tab) => (
            <div
              key={tab}
              style={{
                ...tabStyles.tab,
                ...(activeTab === tab ? tabStyles.activeTab : {})
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'basic' && 'Basic Generation'}
              {tab === 'seed' && 'Seed Image'}
              {tab === 'templates' && 'Prompt Templates'}
              {tab === 'guide' && 'Prompt Guide'}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div style={tabStyles.tabContent}>
          {activeTab === 'basic' && (
            <div style={tabStyles.form}>
              <div style={tabStyles.formRow}>
                <div style={tabStyles.formGroup}>
                  <label style={tabStyles.label}>
                    Prompt
                    <FiInfo size={14} title="Describe what you want to see in your video" />
                  </label>
                  <textarea
                    style={tabStyles.textarea}
                    value={formData.prompt}
                    onChange={(e) => handleInputChange('prompt', e.target.value)}
                    placeholder="cinematic shot of a person walking through a futuristic city at golden hour, epic wide shot, dramatic lighting..."
                    maxLength={500}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>
                    {formData.prompt.length}/500
                  </div>
                  {errors.prompt && <span style={tabStyles.error}>{errors.prompt}</span>}
                </div>
              </div>

              <div style={tabStyles.formRow}>
                <div style={tabStyles.formGroup}>
                  <label style={tabStyles.label}>Duration</label>
                  <select
                    style={tabStyles.select}
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                  >
                    {durationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.duration && <span style={tabStyles.error}>{errors.duration}</span>}
                </div>

                <div style={tabStyles.formGroup}>
                  <label style={tabStyles.label}>Resolution</label>
                  <select
                    style={tabStyles.select}
                    value={formData.resolution}
                    onChange={(e) => handleInputChange('resolution', e.target.value)}
                  >
                    {resolutionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.resolution && <span style={tabStyles.error}>{errors.resolution}</span>}
                </div>
              </div>

              {costEstimate > userCredits && (
                <div style={{ ...tabStyles.alert, ...tabStyles.alertWarning }}>
                  <FiAlertTriangle />
                  <div>
                    <strong>Insufficient Credits</strong>
                    <div>This video costs {costEstimate} credits, but you only have {userCredits}. Please top up your credits.</div>
                  </div>
                  <button
                    style={{ ...tabStyles.topUpBtn, marginLeft: 'auto' }}
                    onClick={topUpCredits}
                  >
                    Top Up
                  </button>
                </div>
              )}

              <div style={{ fontWeight: 'bold', color: '#374151' }}>
                Cost Estimate: {costEstimate} credits
              </div>

              <button
                style={{
                  ...tabStyles.button,
                  ...(costEstimate > userCredits || loading ? tabStyles.buttonDisabled : {})
                }}
                onClick={handleGenerate}
                disabled={costEstimate > userCredits || loading}
              >
                <FiPlay size={18} />
                {loading ? 'Generating Video...' : 'Generate Video'}
              </button>

              {loading && (
                <div>
                  <div style={tabStyles.progress}>
                    <div
                      style={{
                        ...tabStyles.progressBar,
                        width: `${generationProgress}%`
                      }}
                    />
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    Generating your video... This may take a few minutes.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seed' && (
            <div style={tabStyles.formRow}>
              <div style={tabStyles.formGroup}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                  Upload Seed Image
                </h3>
                <div
                  style={tabStyles.uploadArea}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#6b7280' }} />
                  <div>Select Image</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSeedImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '16px 0 0 0' }}>
                  Upload an image to use as a starting point for your video.
                  The AI will animate based on this image.
                </p>

                {previewUrl && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                      Seed Influence
                    </h4>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.seed_influence}
                      onChange={(e) => handleInputChange('seed_influence', parseFloat(e.target.value))}
                      style={tabStyles.slider}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      <span>Loose</span>
                      <span>Balanced</span>
                      <span>Close</span>
                    </div>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div style={tabStyles.formGroup}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Preview
                  </h3>
                  <img
                    src={previewUrl}
                    alt="Seed preview"
                    style={tabStyles.preview}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div style={tabStyles.formRow}>
              {Object.entries(promptTemplates).map(([category, templates]) => (
                <div key={category} style={tabStyles.formGroup}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {templates.map((template, index) => (
                      <button
                        key={index}
                        style={tabStyles.templateBtn}
                        onClick={() => insertTemplate(template)}
                        title={template}
                      >
                        {template.length > 60 ? `${template.substring(0, 60)}...` : template}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'guide' && (
            <div style={tabStyles.guide}>
              <h2 style={tabStyles.guideTitle}>🎯 Runway Gen-3 Alpha Prompt Guide</h2>

              <div style={tabStyles.guideSection}>
                <h3 style={tabStyles.guideTitle}>🎬 Shot Types</h3>
                <div style={tabStyles.tags}>
                  {['cinematic shot', 'epic wide shot', 'close-up portrait', 'aerial view', 'macro shot'].map(tag => (
                    <span key={tag} style={tabStyles.tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={tabStyles.guideSection}>
                <h3 style={tabStyles.guideTitle}>🌅 Lighting</h3>
                <div style={tabStyles.tags}>
                  {['golden hour', 'blue hour', 'dramatic lighting', 'soft diffused light', 'neon lighting'].map(tag => (
                    <span key={tag} style={tabStyles.tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={tabStyles.guideSection}>
                <h3 style={tabStyles.guideTitle}>⚡ Camera Movement</h3>
                <div style={tabStyles.tags}>
                  {['slow zoom in', 'smooth pan left', 'tracking shot', 'handheld camera', 'static shot'].map(tag => (
                    <span key={tag} style={tabStyles.tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={tabStyles.guideSection}>
                <h3 style={tabStyles.guideTitle}>🎨 Visual Styles</h3>
                <div style={tabStyles.tags}>
                  {['hyperrealistic', '35mm film grain', 'high contrast', 'pastel colors', 'volumetric lighting'].map(tag => (
                    <span key={tag} style={tabStyles.tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div style={{ ...tabStyles.alert, ...tabStyles.alertInfo }}>
                <FiInfo size={16} />
                <div>
                  <strong>Pro Tip</strong>
                  <div>Combine 2-3 keywords for best results. Example: 'cinematic shot + golden hour + slow zoom in + hyperrealistic'</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationStudio;
