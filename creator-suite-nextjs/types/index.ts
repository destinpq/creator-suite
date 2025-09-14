export interface ShowcaseItem {
  title?: string;
  src?: string;
  thumbnail?: string;
  kind: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  is_active?: boolean;
  credits: number;
  created_at: string;
  last_login?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface AIModel {
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

export const AI_MODELS: AIModel[] = [
  // Runway ML Models
  {
    id: 10,
    name: 'runway/gen-3-alpha-image',
    displayName: 'Runway Gen-3 Alpha',
    description: 'Latest flagship text-to-image model with high-fidelity generation, character consistency, and fine-grained control for professional-quality images.',
    provider: 'Runway',
    type: 'image',
    costPerGeneration: 0.15,
    features: [
      'High-fidelity generation',
      'Character consistency',
      'Fine-grained control',
      'Cinematic styles',
      'Advanced safety filtering',
      'Multiple aspect ratios',
      'Custom styles'
    ],
    examples: [
      'A cinematic portrait of a cyberpunk warrior with neon lights reflecting off metallic armor',
      'A serene mountain landscape at golden hour with dramatic lighting and mist',
      'A futuristic cityscape with flying vehicles and holographic advertisements'
    ],
    isPremium: true,
    isNew: true,
    rating: 4.9,
    generationTime: '10-20 seconds',
    coverImage: '/images/models/runway-gen3-alpha.jpg'
  },
  {
    id: 15,
    name: 'runway/gen-3-alpha-video',
    displayName: 'Runway Gen-3 Alpha Video',
    description: 'Advanced text-to-video and image-to-video generation with cinematic quality, temporal control, and character consistency.',
    provider: 'Runway',
    type: 'video',
    costPerGeneration: 0.25,
    features: [
      'Cinematic quality',
      'Temporal control',
      'Character consistency',
      'Image-to-video',
      'Fine-grained motion',
      'Multiple durations',
      'Advanced styling'
    ],
    examples: [
      'A majestic eagle soaring through golden hour clouds with cinematic camera movements',
      'A bustling city street transforming from day to night with smooth transitions',
      'A dancer moving gracefully in a studio with dynamic lighting and camera angles'
    ],
    isPremium: true,
    isNew: true,
    rating: 4.8,
    generationTime: '2-4 minutes',
    coverImage: '/images/models/runway-gen3-video.jpg'
  },

  // Magic Hour AI Models
  {
    id: 11,
    name: 'magic_hour/image',
    displayName: 'Magic Hour AI',
    description: 'Multi-modal image generation with face swap, headshot creation, and advanced styling capabilities for professional results.',
    provider: 'Magic Hour',
    type: 'image',
    costPerGeneration: 0.12,
    features: [
      'Face swap',
      'Headshot generation',
      'Multi-modal input',
      'Professional quality',
      'Advanced styling',
      'Background manipulation',
      'Batch processing'
    ],
    examples: [
      'Professional headshot with perfect lighting and background',
      'Artistic portrait with dramatic lighting and color grading',
      'Product photography with clean composition and commercial quality'
    ],
    isPremium: false,
    isNew: true,
    rating: 4.7,
    generationTime: '15-30 seconds',
    coverImage: '/images/models/magic-hour-image.jpg'
  },
  {
    id: 17,
    name: 'magic_hour/video',
    displayName: 'Magic Hour AI Video',
    description: 'Advanced video generation with text-to-video, image-to-video, talking avatars, and face swap capabilities.',
    provider: 'Magic Hour',
    type: 'video',
    costPerGeneration: 0.20,
    features: [
      'Talking avatars',
      'Face swap',
      'Image-to-video',
      'Text-to-video',
      'Professional quality',
      'Smooth transitions',
      'Multi-modal input'
    ],
    examples: [
      'Talking avatar presenting a product with natural gestures',
      'Image-to-video animation of a static photo coming to life',
      'Professional video ad with smooth transitions and cinematic effects'
    ],
    isPremium: false,
    isNew: true,
    rating: 4.6,
    generationTime: '1-3 minutes',
    coverImage: '/images/models/magic-hour-video.jpg'
  },

  // Other Models (based on existing services)
  {
    id: 1,
    name: 'minimax/video-01',
    displayName: 'Minimax Video-01',
    description: 'High-quality video generation with cinematic storytelling and smooth motion transitions.',
    provider: 'Minimax',
    type: 'video',
    costPerGeneration: 0.18,
    features: [
      'Cinematic quality',
      'Smooth transitions',
      'High resolution',
      'Prompt optimization',
      'Fast generation'
    ],
    examples: [
      'A young Japanese woman walking through neon-lit streets of Shibuya at night',
      'A serene mountain landscape with flowing water and gentle breeze',
      'A futuristic cityscape with advanced technology and vibrant colors'
    ],
    isPremium: false,
    isNew: false,
    rating: 4.5,
    generationTime: '3-5 minutes'
  },
  {
    id: 2,
    name: 'minimax/video-01-hd',
    displayName: 'Minimax Video-01 HD',
    description: 'Premium HD video generation with enhanced quality and professional-grade output.',
    provider: 'Minimax',
    type: 'video',
    costPerGeneration: 0.22,
    features: [
      'HD resolution',
      'Professional quality',
      'Enhanced details',
      'Cinematic effects',
      'Advanced optimization'
    ],
    examples: [
      'High-definition cinematic scenes with professional lighting',
      'Detailed character animations with realistic movements',
      'Commercial-quality video content for marketing'
    ],
    isPremium: true,
    isNew: false,
    rating: 4.6,
    generationTime: '4-6 minutes'
  },
  {
    id: 3,
    name: 'video-gen-ultra',
    displayName: 'Video-Gen ULTRA',
    description: 'State-of-the-art video generation with ultra-high quality and advanced AI capabilities.',
    provider: 'VideoGen',
    type: 'video',
    costPerGeneration: 0.30,
    features: [
      'Ultra-high quality',
      'Advanced AI',
      'Professional output',
      'Custom parameters',
      'Batch processing'
    ],
    examples: [
      'Ultra-realistic scenes with photorealistic quality',
      'Complex animations with multiple characters',
      'Professional video production with cinematic effects'
    ],
    isPremium: true,
    isNew: false,
    rating: 4.7,
    generationTime: '5-8 minutes'
  },

  // Image Generation Models
  {
    id: 9,
    name: 'google/imagen-4-ultra',
    displayName: 'Google Imagen 4 Ultra',
    description: 'Google\'s most advanced image generation model with exceptional quality and creative capabilities.',
    provider: 'Google',
    type: 'image',
    costPerGeneration: 0.20,
    features: [
      'Exceptional quality',
      'Creative generation',
      'Advanced understanding',
      'Multiple styles',
      'High resolution',
      'Safety filtering'
    ],
    examples: [
      'Photorealistic portraits with perfect lighting',
      'Creative illustrations with artistic flair',
      'Detailed landscapes with atmospheric effects'
    ],
    isPremium: true,
    isNew: false,
    rating: 4.8,
    generationTime: '20-40 seconds'
  },
  {
    id: 4,
    name: 'hailuo/hailuo-02',
    displayName: 'Hailuo AI 02',
    description: 'Advanced image generation with focus on quality, creativity, and user-friendly features.',
    provider: 'Hailuo',
    type: 'image',
    costPerGeneration: 0.10,
    features: [
      'High quality output',
      'Creative generation',
      'User-friendly',
      'Fast processing',
      'Multiple formats'
    ],
    examples: [
      'Creative artwork with unique artistic styles',
      'Detailed illustrations with fine craftsmanship',
      'Imaginative scenes with creative composition'
    ],
    isPremium: false,
    isNew: false,
    rating: 4.4,
    generationTime: '15-25 seconds'
  }
];

export const getModelsByType = (type: 'image' | 'video' | 'text' | 'audio'): AIModel[] => {
  return AI_MODELS.filter(model => model.type === type);
};

export const getModelById = (id: number): AIModel | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return AI_MODELS.filter(model =>
    model.provider.toLowerCase() === provider.toLowerCase()
  );
};

export const getPremiumModels = (): AIModel[] => {
  return AI_MODELS.filter(model => model.isPremium);
};

export const getNewModels = (): AIModel[] => {
  return AI_MODELS.filter(model => model.isNew);
};

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource?: string;
  details?: any;
  ip_address?: string;
  success: boolean;
  created_at: string;
}

export interface CreditTransaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: string;
  description?: string;
  created_at: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_credits: number;
  total_revenue: number;
  api_calls_today: number;
  failed_logins_today: number;
}
