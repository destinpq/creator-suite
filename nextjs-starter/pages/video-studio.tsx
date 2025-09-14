import React from 'react';
import VideoGenerationStudio from '../components/VideoGenerationStudio';

export default function VideoStudioPage() {
  const handleVideoGenerated = (result: any) => {
    console.log('Video generated:', result);
    // Handle the generated video result
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <VideoGenerationStudio onVideoGenerated={handleVideoGenerated} />
    </div>
  );
}
