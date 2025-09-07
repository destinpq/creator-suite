import React, { useEffect, useState, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Typography, Space, Badge, Empty } from 'antd';
import { ThunderboltOutlined, HighlightOutlined, CrownOutlined, LockOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { history, useDispatch, useModel } from 'umi';

const { Title, Paragraph } = Typography;

interface ServiceModel {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  videoSrc: string;
  features: string[];
  color: string;
  borderColor: string;
  isPremium: boolean;
}

// Add pulse animation CSS
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.5; }
    100% { transform: scale(1); opacity: 0.3; }
  }
`;

const HomePage: React.FC = () => {
  const dispatch = useDispatch();
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const [filteredModels, setFilteredModels] = useState<ServiceModel[]>([]);
  
  // Define models with useMemo to prevent recreation on each render
  const models = useMemo<ServiceModel[]>(() => [
    {
      id: 5,
      name: 'Long Video Studio',
      title: 'Chain 8s Scenes into Long Videos',
      description: 'Plan storyboards and generate multi-scene long videos by chaining 8-second segments.',
      icon: <VideoCameraOutlined style={{ fontSize: 28, color: 'white' }} />,
      videoSrc: '/service-examples/veo-3.mp4',
      features: [
        'Storyboard multiple 8s scenes',
        'Reorder and edit segments',
        'One-click generate all'
      ],
      color: '#e6f7ff',
      borderColor: '#722ed1',
      isPremium: false
    },
    {
      id: 4,
      name: 'Imagen-4-ULTRA',
      title: 'Google Imagen 4 Ultra',
      description: 'State-of-the-art text-to-image generation with photorealistic quality. Create stunning images from text prompts.',
      icon: <PictureOutlined style={{ fontSize: 28, color: 'white' }} />,
      videoSrc: '/service-examples/imagen-placeholder.html',
      features: [
        'Photorealistic image quality',
        'Multiple aspect ratios',
        'Advanced safety filters',
        'Fast generation (30-60s)'
      ],
      color: '#fff0f6',
      borderColor: '#eb2f96',
      isPremium: true
    },
    {
      id: 3,
      name: 'Video-Gen-ULTRA',
      title: 'Premium AI Video Generation',
      description: 'State-of-the-art video generation with cinematic quality. Image-to-video, advanced controls, and ultra-realistic results.',
      icon: <CrownOutlined style={{ fontSize: 28, color: 'white' }} />,
      videoSrc: '/service-examples/veo-3.mp4',
      features: [
        'Cinematic quality output',
        'Image-to-video generation',
        'Advanced scene controls',
        '1080p resolution support'
      ],
      color: '#fffbe6',
      borderColor: '#faad14',
      isPremium: true
    },
    {
      id: 1,
      name: 'Video-Gen-High',
      title: 'Fast Video Generation',
      description: 'Quickly generate videos with simple prompts. Perfect for rapid prototyping and quick content creation.',
      icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      videoSrc: '/service-examples/minimaxhailu-2.mp4',
      features: [
        'Faster generation speed',
        'Simple prompt input',
        'Ideal for quick results'
      ],
      color: '#e6f7ff',
      borderColor: '#1890ff',
      isPremium: false
    },
    {
      id: 2,
      name: 'Video-Gen-Max', 
      title: 'High-Quality Video Generation',
      description: 'Create high-quality videos with advanced prompt optimization. Best for professional content.',
      icon: <HighlightOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      videoSrc: '/service-examples/minimax-video-1.mp4',
      features: [
        'Superior video quality',
        'Prompt optimization',
        'Complex scene handling'
      ],
      color: '#f6ffed',
      borderColor: '#52c41a',
      isPremium: false
    }
  ], []); // Empty dependency array since models don't depend on any component state

  // Separate useEffect for billing data to prevent excessive API calls
  useEffect(() => {
    // Fetch billing data when home page loads
    dispatch({ type: 'home/fetchBilling' });
  }, [dispatch]);
  
  // Separate useEffect for filtering models based on user permissions
  useEffect(() => {
    // Filter models based on user's service permissions
    if (currentUser) {
      const userServiceIds = currentUser.services?.map(service => service.id) || [];
      
      // If user is admin, show all services
      if (currentUser.is_admin) {
        setFilteredModels(models);
      } else if (userServiceIds.length > 0) {
        // Filter models based on user's service permissions, always include Long Video Studio (id 5)
        const filtered = models.filter(model => model.id === 5 || userServiceIds.includes(model.id));
        setFilteredModels(filtered);
      } else {
        // No services assigned; still show Long Video Studio (id 5)
        setFilteredModels(models.filter(m => m.id === 5));
      }
    } else {
      setFilteredModels([]);
    }
  }, [currentUser, models]);

  const handleModelClick = (serviceId: number) => {
    // Navigate to image-generation for Imagen service, video-generation for others
    if (serviceId === 5) {
      history.push(`/long-video`);
    } else if (serviceId === 4) {
      history.push(`/image-generation?service=${serviceId}`);
    } else {
      history.push(`/video-generation?service=${serviceId}`);
    }
  };

  return (
    <>
      <style>{pulseAnimation}</style>
      <PageContainer
      ghost
      title="AI Content Generation"
      subTitle="Choose a model to start creating amazing content"
    >
      <div style={{ padding: '24px 0' }}>
        {filteredModels.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {currentUser ? 
                  "You don't have access to any services. Please contact your administrator." : 
                  "Please log in to access services."}
              </span>
            }
          />
        ) : (
          <Row gutter={[24, 24]} justify="center">
            {filteredModels.map((model) => (
              <Col xs={24} sm={24} md={12} lg={10} key={model.id}>
                <Badge.Ribbon 
                  text={<span><CrownOutlined style={{ marginRight: 4 }} /> ULTRA</span>} 
                  color="#ffd700"
                  style={{ 
                    display: model.isPremium ? 'block' : 'none',
                    top: '12px',
                    left: '12px',
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  <Card
                    hoverable
                    onClick={() => handleModelClick(model.id)}
                    style={{ 
                      height: '100%',
                      borderColor: model.borderColor,
                      borderWidth: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      padding: 0,
                      position: 'relative',
                      ...(model.isPremium && {
                        boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4)',
                        background: 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)',
                        border: '2px solid #ffd700'
                      })
                    }}
                    className="model-card"
                    bodyStyle={{ padding: 0, height: '100%' }}
                    onMouseEnter={(e) => {
                      if (model.id === 4) {
                        const icon = e.currentTarget.querySelector('.ant-icon-picture') as HTMLElement;
                        if (icon) {
                          icon.style.transform = 'scale(1.2) rotate(5deg)';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (model.id === 4) {
                        const icon = e.currentTarget.querySelector('.ant-icon-picture') as HTMLElement;
                        if (icon) {
                          icon.style.transform = 'scale(1) rotate(0deg)';
                        }
                      }
                    }}
                  >
                  <div style={{ position: 'relative', height: '550px', width: '100%' }}>
                    {/* Video or Image Background */}
                    {model.id === 4 ? (
                      // Special handling for image generation service
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundImage: `url('/service-examples/tmpikc6119g.jpg')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          zIndex: 1
                        }}
                      />
                    ) : (
                      <video
                        src={model.videoSrc}
                        autoPlay
                        loop
                        muted
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          zIndex: 1
                        }}
                        onError={(e) => {
                          // Fallback to solid background if video fails to load
                          e.currentTarget.style.display = 'none';
                          const container = e.currentTarget.parentElement as HTMLElement;
                          if (container) {
                            container.style.backgroundColor = model.color;
                          }
                        }}
                      />
                    )}
                    
                    {/* Gradient Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60%',
                        background: `linear-gradient(to top, ${model.borderColor}ee 0%, ${model.borderColor}b3 30%, ${model.borderColor}73 60%, transparent 100%)`,
                        zIndex: 2
                      }}
                    />
                    
                    {/* Content Container */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '32px',
                        zIndex: 3,
                        color: 'white'
                      }}
                    >
                      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {model.isPremium && (
                          <CrownOutlined style={{ fontSize: 32, color: '#ffd700', marginRight: 8, filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))' }} />
                        )}
                        <Title level={1} style={{ 
                          marginBottom: 0, 
                          color: 'white',
                          textShadow: model.isPremium ? '0 0 10px rgba(255, 215, 0, 0.6)' : 'none'
                        }}>
                          {model.name}
                        </Title>
                      </div>
                      
                      <Title level={5} style={{ 
                        marginBottom: 16, 
                        color: model.isPremium ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.95)',
                        fontWeight: model.isPremium ? 600 : 400
                      }}>
                        {model.title}
                      </Title>
                      
                      <Paragraph style={{ marginBottom: 20, color: 'rgba(255,255,255,0.92)', fontSize: '15px', lineHeight: '1.6' }}>
                        {model.description}
                      </Paragraph>
                    </div>
                  </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        )}
      </div>
      </PageContainer>
    </>
  );
};

export default HomePage;