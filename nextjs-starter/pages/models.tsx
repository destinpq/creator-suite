import React from 'react';
import AIModelCard from '../components/AIModelCard';

export default function ModelsPage() {
  // Mock data for demonstration
  const mockModels = [
    {
      id: '1',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      description: 'Advanced language model with enhanced reasoning capabilities',
      rating: 4.8,
      reviewCount: 1250,
      pricing: {
        input: 0.01,
        output: 0.03
      },
      features: ['Advanced Reasoning', 'Code Generation', 'Multilingual', 'API Access'],
      category: 'Language Model',
      isPopular: true
    },
    {
      id: '2',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      description: 'Most capable model for complex tasks and analysis',
      rating: 4.7,
      reviewCount: 890,
      pricing: {
        input: 0.015,
        output: 0.075
      },
      features: ['Complex Analysis', 'Long Context', 'Safety Focused', 'Research'],
      category: 'Language Model',
      isPopular: false
    },
    {
      id: '3',
      name: 'DALL-E 3',
      provider: 'OpenAI',
      description: 'Advanced image generation with precise control',
      rating: 4.6,
      reviewCount: 2100,
      pricing: {
        perImage: 0.04
      },
      features: ['High Quality', 'Precise Control', 'Variations', 'Editing'],
      category: 'Image Generation',
      isPopular: true
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '32px', fontWeight: 'bold' }}>
          🤖 AI Models Gallery
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {mockModels.map(model => (
            <AIModelCard key={model.id} model={model} />
          ))}
        </div>

        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          <p>✨ Component successfully migrated from Vite to Next.js</p>
          <p>Features: TypeScript, Custom Styling, Responsive Design, React Icons</p>
        </div>
      </div>
    </div>
  );
}
