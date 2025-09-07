// Production configuration for Creator Suite Frontend

const config = {
  // API Configuration
  apiBaseUrl: 'https://video-api.destinpq.com',
  frontendUrl: 'https://video.destinpq.com',
  
  // Application Settings
  appName: 'Creator Suite',
  appVersion: '1.0.0',
  
  // Video Generation Settings
  maxVideoDuration: 1800, // 30 minutes
  minVideoDuration: 8,    // 8 seconds
  segmentLength: 8,       // 8-second segments
  creditPerSegment: 1,    // 1 credit per segment
  
  // Upload Settings
  maxFileSize: 5 * 1024 * 1024, // 5MB for seed images
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
  
  // Payment Settings
  currency: 'USD',
  minTopUpAmount: 10,  // Minimum 10 credits
  maxTopUpAmount: 1000, // Maximum 1000 credits
  
  // UI Settings
  theme: {
    primaryColor: '#1890ff',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#f5222d',
    borderRadius: '6px'
  },
  
  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Features
  features: {
    videoGeneration: true,
    videoEditing: true,
    seedImages: true,
    gallery: true,
    payments: true,
    analytics: true
  },
  
  // Bot Platform URLs
  bots: {
    discord: 'https://discord.gg/creator-suite',
    telegram: 'https://t.me/creator_suite_bot',
    whatsapp: 'https://wa.me/your_whatsapp_number',
    instagram: 'https://instagram.com/creator_suite'
  },
  
  // Social Links
  social: {
    website: 'https://video.destinpq.com',
    github: 'https://github.com/destinpq/creator-suite',
    twitter: 'https://twitter.com/destinpq',
    discord: 'https://discord.gg/creator-suite'
  },
  
  // Analytics (optional)
  analytics: {
    googleAnalytics: process.env.REACT_APP_GA_ID,
    mixpanel: process.env.REACT_APP_MIXPANEL_TOKEN
  },
  
  // Error Tracking (optional)
  sentry: {
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: 'production'
  },
  
  // Video Player Settings
  videoPlayer: {
    autoplay: false,
    controls: true,
    preload: 'metadata',
    volume: 0.8
  },
  
  // Cache Settings
  cache: {
    videoCacheDuration: 3600000, // 1 hour
    apiCacheDuration: 300000,    // 5 minutes
  }
};

export default config;
