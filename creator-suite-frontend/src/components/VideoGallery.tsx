import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Tag,
  Typography,
  Space,
  Tooltip,
  message,
  Input,
  Select,
  Pagination,
  Avatar,
  Dropdown,
  MenuProps,
  Progress,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { videoService } from '@/services/video';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

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

  const pageSize = 12;

  useEffect(() => {
    loadVideos();
  }, [currentPage, searchTerm, filterCategory, sortBy, showOnlyMyVideos]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = showOnlyMyVideos 
        ? await videoService.getUserVideos(currentPage, pageSize)
        : await videoService.getGalleryVideos(currentPage, pageSize, filterCategory);
      
      setVideos(response.videos || []);
      setTotal(response.total || 0);
    } catch (error) {
      message.error('Failed to load videos');
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
    try {
      await videoService.toggleLike(videoId);
      
      // Update local state
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
      
      message.success(videos.find(v => v.id === videoId)?.user_liked ? 'Unliked' : 'Liked');
    } catch (error) {
      message.error('Failed to like video');
    }
  };

  const handleDownload = async (video: Video) => {
    try {
      const blob = await videoService.downloadVideo(video.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Download started');
    } catch (error) {
      message.error('Failed to download video');
    }
  };

  const handleDelete = async (videoId: string) => {
    Modal.confirm({
      title: 'Delete Video',
      content: 'Are you sure you want to delete this video? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await videoService.deleteVideo(videoId);
          setVideos(videos.filter(video => video.id !== videoId));
          message.success('Video deleted');
        } catch (error) {
          message.error('Failed to delete video');
        }
      }
    });
  };

  const handleShare = (video: Video) => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    message.success('Video link copied to clipboard');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoActions = (video: Video): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Video',
      disabled: video.status !== 'completed',
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: 'Download',
      disabled: video.status !== 'completed',
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: 'Share',
    },
    ...(showOnlyMyVideos ? [{
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
    }] : [])
  ];

  const handleMenuClick = (video: Video, key: string) => {
    switch (key) {
      case 'edit':
        // Handle edit action
        break;
      case 'download':
        handleDownload(video);
        break;
      case 'share':
        handleShare(video);
        break;
      case 'delete':
        handleDelete(video.id);
        break;
    }
  };

  const renderVideoCard = (video: Video) => (
    <Card
      key={video.id}
      hoverable
      loading={loading}
      cover={
        <div 
          style={{ 
            position: 'relative', 
            height: 200, 
            background: `url(${video.thumbnail_url}) center/cover`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
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
              <Progress type="circle" percent={75} size={60} />
              <Text style={{ color: 'white', marginTop: 8 }}>Processing...</Text>
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
              <Text style={{ color: 'white' }}>Generation Failed</Text>
            </div>
          )}
          
          {video.status === 'completed' && (
            <>
              <PlayCircleOutlined 
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
                <Tag 
                  color="purple" 
                  style={{ 
                    position: 'absolute', 
                    top: 8, 
                    left: 8 
                  }}
                >
                  Seed Image
                </Tag>
              )}
            </>
          )}
        </div>
      }
      actions={[
        <Tooltip title={video.user_liked ? 'Unlike' : 'Like'} key="like">
          <Button
            type="text"
            icon={video.user_liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleLike(video.id);
            }}
          >
            {video.likes_count}
          </Button>
        </Tooltip>,
        <Tooltip title="Views" key="views">
          <Button type="text" icon={<EyeOutlined />}>
            {video.views_count}
          </Button>
        </Tooltip>,
        <Dropdown
          key="more"
          menu={{
            items: getVideoActions(video),
            onClick: ({ key }) => handleMenuClick(video, key)
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text ellipsis style={{ maxWidth: '70%' }}>
              {video.title || `${video.duration}s Video`}
            </Text>
            <Tag color="blue">{video.resolution}</Tag>
          </div>
        }
        description={
          <div>
            <Paragraph 
              ellipsis={{ rows: 2 }} 
              style={{ margin: 0, fontSize: 12, color: '#666' }}
            >
              {video.prompt}
            </Paragraph>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size="small">
                <Tag icon={<ClockCircleOutlined />} color="default">
                  {new Date(video.created_at).toLocaleDateString()}
                </Tag>
                <Tag color="green">{video.metadata?.cost} credits</Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {video.metadata?.provider}
              </Text>
            </div>
          </div>
        }
      />
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          {showOnlyMyVideos ? '🎬 My Videos' : '🌟 Video Gallery'}
        </Title>
        
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col md={8}>
            <Search
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={loadVideos}
              allowClear
            />
          </Col>
          <Col md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by category"
              value={filterCategory}
              onChange={setFilterCategory}
            >
              <Option value="all">All Categories</Option>
              <Option value="cinematic">Cinematic</Option>
              <Option value="nature">Nature</Option>
              <Option value="urban">Urban</Option>
              <Option value="abstract">Abstract</Option>
            </Select>
          </Col>
          <Col md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Sort by"
              value={sortBy}
              onChange={setSortBy}
            >
              <Option value="created_at">Latest</Option>
              <Option value="likes_count">Most Liked</Option>
              <Option value="views_count">Most Viewed</Option>
              <Option value="duration">Duration</Option>
            </Select>
          </Col>
          <Col md={4}>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={loadVideos}
              block
            >
              Search
            </Button>
          </Col>
        </Row>
      </div>

      {videos.length === 0 && !loading && (
        <Alert
          message="No videos found"
          description={showOnlyMyVideos 
            ? "You haven't created any videos yet. Start generating your first video!"
            : "No videos match your search criteria. Try adjusting your filters."
          }
          type="info"
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {videos.map(renderVideoCard)}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Pagination
          current={currentPage}
          total={total}
          pageSize={pageSize}
          onChange={setCurrentPage}
          showSizeChanger={false}
          showQuickJumper
          showTotal={(total, range) => 
            `${range[0]}-${range[1]} of ${total} videos`
          }
        />
      </div>

      {/* Video Preview Modal */}
      <Modal
        title={selectedVideo?.title || 'Video Preview'}
        open={showVideoModal}
        onCancel={() => {
          setShowVideoModal(false);
          setSelectedVideo(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowVideoModal(false)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedVideo && handleDownload(selectedVideo)}
            disabled={selectedVideo?.status !== 'completed'}
          >
            Download
          </Button>
        ]}
      >
        {selectedVideo && (
          <div>
            {selectedVideo.status === 'completed' && (
              <video
                controls
                style={{ width: '100%', marginBottom: 16 }}
                poster={selectedVideo.thumbnail_url}
              >
                <source src={selectedVideo.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Prompt: </Text>
                <Text>{selectedVideo.prompt}</Text>
              </div>
              <div>
                <Text strong>Duration: </Text>
                <Text>{formatDuration(selectedVideo.duration)}</Text>
              </div>
              <div>
                <Text strong>Resolution: </Text>
                <Text>{selectedVideo.resolution}</Text>
              </div>
              <div>
                <Text strong>Model: </Text>
                <Text>{selectedVideo.model}</Text>
              </div>
              <div>
                <Text strong>Cost: </Text>
                <Text>{selectedVideo.metadata?.cost} credits</Text>
              </div>
              <div>
                <Text strong>Created: </Text>
                <Text>{new Date(selectedVideo.created_at).toLocaleString()}</Text>
              </div>
              
              {selectedVideo.segments && selectedVideo.segments.length > 0 && (
                <div>
                  <Text strong>Segments:</Text>
                  <div style={{ marginTop: 8 }}>
                    {selectedVideo.segments.map((segment, index) => (
                      <Tag key={index} style={{ marginBottom: 4 }}>
                        {formatDuration(segment.start_time)}-{formatDuration(segment.end_time)}: {segment.prompt}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VideoGallery;
