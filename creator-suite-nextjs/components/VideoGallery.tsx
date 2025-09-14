'use client';

import React, { useState, useEffect } from 'react';
import {
  FiPlayCircle,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiShare2,
  FiHeart,
  FiEye,
  FiClock,
  FiMoreVertical,
  FiSearch,
  FiFilter
} from 'react-icons/fi';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
  resolution: string;
  prompt: string;
  model: string;
  created_at: string;
  status: 'completed' | 'processing' | 'failed';
  is_public: boolean;
  likes_count: number;
  views_count: number;
  user_liked: boolean;
  segments: Array<{
    start_time: number;
    end_time: number;
    prompt: string;
  }>;
  metadata: {
    cost: number;
    has_seed_image: boolean;
    provider: string;
  };
}

interface VideoGalleryProps {
  showOnlyMyVideos?: boolean;
  onVideoSelect?: (video: Video) => void;
}

const VideoGallery: React.FC<VideoGalleryProps> = ({
  showOnlyMyVideos = false,
  onVideoSelect
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const pageSize = 12;

  useEffect(() => {
    loadVideos();
  }, [currentPage, searchTerm, filterCategory, sortBy, showOnlyMyVideos]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since we don't have the video service integrated
      // In a real implementation, you'd call the video service here
      const mockVideos: Video[] = [
        {
          id: '1',
          title: 'Cinematic Mountain Scene',
          thumbnail_url: '/api/placeholder/300/200',
          video_url: '/api/placeholder/video',
          duration: 120,
          resolution: '1920x1080',
          prompt: 'Epic mountain landscape with dramatic lighting',
          model: 'Runway Gen-3',
          created_at: new Date().toISOString(),
          status: 'completed',
          is_public: true,
          likes_count: 25,
          views_count: 150,
          user_liked: false,
          segments: [],
          metadata: {
            cost: 15,
            has_seed_image: false,
            provider: 'runway'
          }
        },
        {
          id: '2',
          title: 'Urban Night Scene',
          thumbnail_url: '/api/placeholder/300/200',
          video_url: '/api/placeholder/video',
          duration: 60,
          resolution: '1280x720',
          prompt: 'Neon-lit city streets at night',
          model: 'Magic Hour',
          created_at: new Date().toISOString(),
          status: 'processing',
          is_public: false,
          likes_count: 12,
          views_count: 89,
          user_liked: true,
          segments: [],
          metadata: {
            cost: 8,
            has_seed_image: true,
            provider: 'magic_hour'
          }
        }
      ];

      setVideos(mockVideos);
      setTotal(mockVideos.length);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
    onVideoSelect?.(video);
  };

  const handleLike = async (videoId: string) => {
    // Mock like functionality
    setVideos(videos.map(video =>
      video.id === videoId
        ? {
            ...video,
            user_liked: !video.user_liked,
            likes_count: video.user_liked
              ? video.likes_count - 1
              : video.likes_count + 1
          }
        : video
    ));
  };

  const handleDownload = async (video: Video) => {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = video.video_url;
    link.download = `${video.title || 'video'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      setVideos(videos.filter(video => video.id !== videoId));
    }
  };

  const handleShare = (video: Video) => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Video link copied to clipboard');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoCard = (video: Video) => (
    <div
      key={video.id}
      style={{
        background: 'var(--bg)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Video Thumbnail */}
      <div
        style={{
          position: 'relative',
          height: 200,
          background: `url(${video.thumbnail_url}) center/cover`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => handleVideoClick(video)}
      >
        {video.status === 'processing' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <div style={{
              width: 60,
              height: 60,
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid #1890ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ marginTop: 8, fontSize: '14px' }}>Processing...</div>
          </div>
        )}

        {video.status === 'failed' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            Generation Failed
          </div>
        )}

        {video.status === 'completed' && (
          <>
            <FiPlayCircle
              style={{
                fontSize: 48,
                color: 'white',
                textShadow: '0 0 10px rgba(0,0,0,0.8)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 12
            }}>
              {formatDuration(video.duration)}
            </div>

            {video.metadata?.has_seed_image && (
              <span style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: '#722ed1',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                Seed Image
              </span>
            )}
          </>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: '16px' }}>
        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike(video.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: video.user_liked ? '#ff4d4f' : 'var(--muted)',
                fontSize: '14px'
              }}
            >
              <FiHeart fill={video.user_liked ? '#ff4d4f' : 'none'} size={16} />
              {video.likes_count}
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--muted)',
              fontSize: '14px'
            }}>
              <FiEye size={16} />
              {video.views_count}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(showDropdown === video.id ? null : video.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: '4px'
              }}
            >
              <FiMoreVertical size={16} />
            </button>

            {showDropdown === video.id && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '120px'
              }}>
                {video.status === 'completed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(video);
                      setShowDropdown(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiDownload size={14} />
                    Download
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(video);
                    setShowDropdown(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiShare2 size={14} />
                  Share
                </button>
                {showOnlyMyVideos && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(video.id);
                      setShowDropdown(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#ff4d4f',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiTrash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title and Resolution */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {video.title || `${video.duration}s Video`}
          </h3>
          <span style={{
            background: '#1890ff',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '8px',
            fontSize: '12px',
            marginLeft: '8px'
          }}>
            {video.resolution}
          </span>
        </div>

        {/* Description */}
        <p style={{
          margin: '0 0 12px 0',
          color: 'var(--muted)',
          fontSize: '14px',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {video.prompt}
        </p>

        {/* Metadata */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--muted)'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiClock size={12} />
              {new Date(video.created_at).toLocaleDateString()}
            </span>
            <span style={{
              background: '#52c41a',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '8px'
            }}>
              {video.metadata?.cost} credits
            </span>
          </div>
          <span>{video.metadata?.provider}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'var(--text)',
          marginBottom: '24px'
        }}>
          {showOnlyMyVideos ? '🎬 My Videos' : '🌟 Video Gallery'}
        </h1>

        {/* Search and Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              fontSize: '16px'
            }} />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px'
            }}
          >
            <option value="all">All Categories</option>
            <option value="cinematic">Cinematic</option>
            <option value="nature">Nature</option>
            <option value="urban">Urban</option>
            <option value="abstract">Abstract</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px'
            }}
          >
            <option value="created_at">Latest</option>
            <option value="likes_count">Most Liked</option>
            <option value="views_count">Most Viewed</option>
            <option value="duration">Duration</option>
          </select>

          <button
            onClick={loadVideos}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(90deg, #1890ff, #40a9ff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FiSearch size={16} />
            Search
          </button>
        </div>
      </div>

      {/* No videos message */}
      {videos.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--muted)'
        }}>
          <h3 style={{ color: 'var(--text)', marginBottom: '8px' }}>No videos found</h3>
          <p>
            {showOnlyMyVideos
              ? "You haven't created any videos yet. Start generating your first video!"
              : "No videos match your search criteria. Try adjusting your filters."
            }
          </p>
        </div>
      )}

      {/* Video Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {videos.map(renderVideoCard)}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: currentPage === 1 ? 'var(--border)' : 'var(--bg)',
              color: currentPage === 1 ? 'var(--muted)' : 'var(--text)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>

          <span style={{
            padding: '8px 12px',
            color: 'var(--text)'
          }}>
            Page {currentPage} of {Math.ceil(total / pageSize)}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(total / pageSize), currentPage + 1))}
            disabled={currentPage === Math.ceil(total / pageSize)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: currentPage === Math.ceil(total / pageSize) ? 'var(--border)' : 'var(--bg)',
              color: currentPage === Math.ceil(total / pageSize) ? 'var(--muted)' : 'var(--text)',
              cursor: currentPage === Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: 'var(--text)' }}>
                {selectedVideo.title || 'Video Preview'}
              </h2>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {selectedVideo.status === 'completed' && (
                <video
                  controls
                  style={{ width: '100%', marginBottom: 16, borderRadius: '8px' }}
                  poster={selectedVideo.thumbnail_url}
                >
                  <source src={selectedVideo.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <strong>Prompt:</strong> {selectedVideo.prompt}
                </div>
                <div>
                  <strong>Duration:</strong> {formatDuration(selectedVideo.duration)}
                </div>
                <div>
                  <strong>Resolution:</strong> {selectedVideo.resolution}
                </div>
                <div>
                  <strong>Model:</strong> {selectedVideo.model}
                </div>
                <div>
                  <strong>Cost:</strong> {selectedVideo.metadata?.cost} credits
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedVideo.created_at).toLocaleString()}
                </div>

                {selectedVideo.segments && selectedVideo.segments.length > 0 && (
                  <div>
                    <strong>Segments:</strong>
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedVideo.segments.map((segment, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'var(--border)',
                            color: 'var(--text)',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        >
                          {formatDuration(segment.start_time)}-{formatDuration(segment.end_time)}: {segment.prompt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(selectedVideo);
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                disabled={selectedVideo.status !== 'completed'}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: selectedVideo.status === 'completed' ? '#1890ff' : 'var(--border)',
                  color: selectedVideo.status === 'completed' ? 'white' : 'var(--muted)',
                  cursor: selectedVideo.status === 'completed' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiDownload size={14} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VideoGallery;
