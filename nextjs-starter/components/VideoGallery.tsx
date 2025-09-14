'use client';

import React, { useState } from 'react';
import { FiPlay, FiDownload, FiHeart, FiEye, FiMoreVertical, FiSearch, FiFilter, FiX, FiClock, FiTag } from 'react-icons/fi';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  prompt: string;
  model: string;
  resolution: string;
}

interface VideoGalleryProps {
  videos: Video[];
  onVideoSelect?: (video: Video) => void;
  onVideoDelete?: (videoId: string) => void;
  onVideoDownload?: (video: Video) => void;
}

const VideoGallery: React.FC<VideoGalleryProps> = ({
  videos,
  onVideoSelect,
  onVideoDelete,
  onVideoDownload
}) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const filteredVideos = videos
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.prompt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || video.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setShowModal(true);
    onVideoSelect?.(video);
  };

  const handleDownload = (video: Video) => {
    onVideoDownload?.(video);
  };

  const handleDelete = (videoId: string) => {
    onVideoDelete?.(videoId);
  };

  const galleryStyles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px'
    },
    header: {
      marginBottom: '32px',
      textAlign: 'center' as const
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#111827'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280'
    },
    filters: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap' as const,
      alignItems: 'center'
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      background: 'white'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '24px'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      border: '1px solid #e5e7eb'
    },
    thumbnail: {
      position: 'relative' as const,
      height: '180px',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    playButton: {
      fontSize: '48px',
      color: 'white',
      textShadow: '0 0 20px rgba(0,0,0,0.8)',
      zIndex: 2
    },
    duration: {
      position: 'absolute' as const,
      bottom: '8px',
      right: '8px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500'
    },
    status: {
      position: 'absolute' as const,
      top: '8px',
      left: '8px',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase' as const
    },
    statusCompleted: {
      background: '#10b981',
      color: 'white'
    },
    statusProcessing: {
      background: '#f59e0b',
      color: 'white'
    },
    statusFailed: {
      background: '#ef4444',
      color: 'white'
    },
    content: {
      padding: '16px'
    },
    videoTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#111827',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden'
    },
    prompt: {
      fontSize: '13px',
      color: '#6b7280',
      marginBottom: '12px',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden',
      lineHeight: '1.4'
    },
    meta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#6b7280'
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderTop: '1px solid #e5e7eb',
      background: '#f9fafb'
    },
    actionButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      color: '#6b7280',
      transition: 'all 0.2s ease'
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      background: 'white',
      borderRadius: '12px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #e5e7eb'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '4px',
      color: '#6b7280'
    },
    modalBody: {
      padding: '20px'
    },
    videoPreview: {
      width: '100%',
      borderRadius: '8px',
      marginBottom: '16px'
    },
    modalMeta: {
      display: 'grid',
      gap: '12px',
      fontSize: '14px'
    },
    modalLabel: {
      fontWeight: '600',
      color: '#374151'
    },
    modalValue: {
      color: '#6b7280'
    },
    empty: {
      textAlign: 'center' as const,
      padding: '48px',
      color: '#6b7280'
    }
  };

  return (
    <div style={galleryStyles.container}>
      <div style={galleryStyles.header}>
        <h1 style={galleryStyles.title}>🎥 Video Gallery</h1>
        <p style={galleryStyles.subtitle}>Browse and manage your generated videos</p>
      </div>

      {/* Filters */}
      <div style={galleryStyles.filters}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <FiSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...galleryStyles.searchInput, paddingLeft: '32px' }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={galleryStyles.select}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={galleryStyles.select}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div style={galleryStyles.empty}>
          <FiSearch size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>No videos found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={galleryStyles.grid}>
          {filteredVideos.map(video => (
            <div key={video.id} style={galleryStyles.card}>
              {/* Thumbnail */}
              <div
                style={{
                  ...galleryStyles.thumbnail,
                  backgroundImage: `url(${video.thumbnail})`
                }}
                onClick={() => handleVideoClick(video)}
              >
                {video.status === 'completed' && (
                  <FiPlay style={galleryStyles.playButton} />
                )}

                {/* Status Badge */}
                <div
                  style={{
                    ...galleryStyles.status,
                    ...(video.status === 'completed' ? galleryStyles.statusCompleted :
                        video.status === 'processing' ? galleryStyles.statusProcessing :
                        galleryStyles.statusFailed)
                  }}
                >
                  {video.status}
                </div>

                {/* Duration */}
                {video.status === 'completed' && (
                  <div style={galleryStyles.duration}>
                    {video.duration}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={galleryStyles.content}>
                <h3 style={galleryStyles.videoTitle}>{video.title}</h3>
                <p style={galleryStyles.prompt}>{video.prompt}</p>

                <div style={galleryStyles.meta}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiClock size={12} />
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiTag size={12} />
                    {video.resolution}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={galleryStyles.actions}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={galleryStyles.actionButton}>
                    <FiHeart size={14} />
                    0
                  </button>
                  <button style={galleryStyles.actionButton}>
                    <FiEye size={14} />
                    0
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={galleryStyles.actionButton}
                    onClick={() => handleDownload(video)}
                    disabled={video.status !== 'completed'}
                  >
                    <FiDownload size={14} />
                  </button>
                  <button style={galleryStyles.actionButton}>
                    <FiMoreVertical size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedVideo && (
        <div style={galleryStyles.modal} onClick={() => setShowModal(false)}>
          <div style={galleryStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={galleryStyles.modalHeader}>
              <h2 style={galleryStyles.modalTitle}>{selectedVideo.title}</h2>
              <button
                style={galleryStyles.closeButton}
                onClick={() => setShowModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div style={galleryStyles.modalBody}>
              {selectedVideo.status === 'completed' ? (
                <video
                  controls
                  style={galleryStyles.videoPreview}
                  poster={selectedVideo.thumbnail}
                >
                  <source src="#" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div style={{
                  height: '300px',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  color: '#6b7280'
                }}>
                  {selectedVideo.status === 'processing' ? 'Processing...' : 'Generation Failed'}
                </div>
              )}

              <div style={galleryStyles.modalMeta}>
                <div>
                  <span style={galleryStyles.modalLabel}>Prompt: </span>
                  <span style={galleryStyles.modalValue}>{selectedVideo.prompt}</span>
                </div>
                <div>
                  <span style={galleryStyles.modalLabel}>Duration: </span>
                  <span style={galleryStyles.modalValue}>{selectedVideo.duration}</span>
                </div>
                <div>
                  <span style={galleryStyles.modalLabel}>Resolution: </span>
                  <span style={galleryStyles.modalValue}>{selectedVideo.resolution}</span>
                </div>
                <div>
                  <span style={galleryStyles.modalLabel}>Model: </span>
                  <span style={galleryStyles.modalValue}>{selectedVideo.model}</span>
                </div>
                <div>
                  <span style={galleryStyles.modalLabel}>Created: </span>
                  <span style={galleryStyles.modalValue}>
                    {new Date(selectedVideo.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGallery;
