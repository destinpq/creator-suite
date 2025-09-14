import React from 'react';
import VideoGallery from '../components/VideoGallery';

export default function VideosPage() {
  // Mock data for demonstration
  const mockVideos = [
    {
      id: '1',
      title: 'Futuristic City Walk',
      thumbnail: 'https://via.placeholder.com/320x180/4f46e5/ffffff?text=Futuristic+City',
      duration: '16s',
      createdAt: '2024-01-15',
      status: 'completed' as const,
      prompt: 'cinematic shot of a person walking through a futuristic city at golden hour',
      model: 'Runway Gen-3 Alpha',
      resolution: '1280x768'
    },
    {
      id: '2',
      title: 'Water Droplets Macro',
      thumbnail: 'https://via.placeholder.com/320x180/059669/ffffff?text=Water+Droplets',
      duration: '8s',
      createdAt: '2024-01-14',
      status: 'completed' as const,
      prompt: 'slow motion cinematic shot of water droplets falling on a leaf',
      model: 'Runway Gen-3 Alpha',
      resolution: '1024x1024'
    },
    {
      id: '3',
      title: 'Mountain Landscape',
      thumbnail: 'https://via.placeholder.com/320x180/dc2626/ffffff?text=Mountain+View',
      duration: '24s',
      createdAt: '2024-01-13',
      status: 'processing' as const,
      prompt: 'aerial cinematic view of a mountain landscape at sunrise',
      model: 'Runway Gen-3 Alpha',
      resolution: '1280x768'
    },
    {
      id: '4',
      title: 'Superhero Action',
      thumbnail: 'https://via.placeholder.com/320x180/7c3aed/ffffff?text=Superhero',
      duration: '16s',
      createdAt: '2024-01-12',
      status: 'completed' as const,
      prompt: 'dynamic action shot of a superhero flying through the city',
      model: 'Runway Gen-3 Alpha',
      resolution: '1280x768'
    },
    {
      id: '5',
      title: 'Nature Waterfall',
      thumbnail: 'https://via.placeholder.com/320x180/16a34a/ffffff?text=Waterfall',
      duration: '12s',
      createdAt: '2024-01-11',
      status: 'failed' as const,
      prompt: 'serene nature scene of a waterfall in a forest',
      model: 'Runway Gen-3 Alpha',
      resolution: '768x1280'
    },
    {
      id: '6',
      title: 'Urban Runner',
      thumbnail: 'https://via.placeholder.com/320x180/ea580c/ffffff?text=Runner',
      duration: '20s',
      createdAt: '2024-01-10',
      status: 'completed' as const,
      prompt: 'fast-paced tracking shot following a runner through urban streets',
      model: 'Runway Gen-3 Alpha',
      resolution: '1280x768'
    }
  ];

  const handleVideoSelect = (video: any) => {
    console.log('Selected video:', video);
  };

  const handleVideoDelete = (videoId: string) => {
    console.log('Delete video:', videoId);
  };

  const handleVideoDownload = (video: any) => {
    console.log('Download video:', video);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '32px', fontWeight: 'bold' }}>
          🎥 Video Gallery
        </h1>

        <VideoGallery
          videos={mockVideos}
          onVideoSelect={handleVideoSelect}
          onVideoDelete={handleVideoDelete}
          onVideoDownload={handleVideoDownload}
        />

        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '32px' }}>
          <p>✨ Component successfully migrated from Vite to Next.js</p>
          <p>Features: Search, Filtering, Modal Previews, Batch Operations, Responsive Design</p>
        </div>
      </div>
    </div>
  );
}
