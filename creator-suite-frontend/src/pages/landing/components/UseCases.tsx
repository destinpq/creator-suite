import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { RocketOutlined, PlayCircleOutlined, AppstoreOutlined, PictureOutlined, VideoCameraOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

type UseCase = {
  title: string;
  body: string;
  icon: React.ReactNode;
  preview?: { type: 'image' | 'video'; src: string };
};

const items: UseCase[] = [
  {
    title: 'Product launch reels',
    body: 'Create cinematic launch clips with macro detail, dramatic lighting, and typography overlays tuned to your brand.',
    icon: <RocketOutlined style={{ color: '#69b1ff' }} />,
    preview: { type: 'video', src: '/service-examples/veo-3.mp4' },
  },
  {
    title: 'Explainer shorts',
    body: 'Turn scripts into 20–60s explainers with clear compositions, iconography passes, and crisp motion cadence.',
    icon: <AppstoreOutlined style={{ color: '#ffd666' }} />,
    preview: { type: 'video', src: '/service-examples/minimax-video-1.mp4' },
  },
  {
    title: 'Concept teasers',
    body: 'Pitch early ideas with style explorations, look‑dev frames, and rapid variations for stakeholder alignment.',
    icon: <ThunderboltOutlined style={{ color: '#b37feb' }} />,
    preview: { type: 'image', src: '/service-examples/tmpikc6119g.jpg' },
  },
  {
    title: 'Brand b‑roll',
    body: 'Generate on‑brand background footage for sites, booths, and social headers without location logistics.',
    icon: <VideoCameraOutlined style={{ color: '#5cdbd3' }} />,
    preview: { type: 'video', src: '/service-examples/minimaxhailu-2.mp4' },
  },
  {
    title: 'Campaign storytelling',
    body: 'Storyboard multi‑scene narratives and keep continuity across characters, palettes, and pacing.',
    icon: <PlayCircleOutlined style={{ color: '#85a5ff' }} />,
    preview: { type: 'image', src: '/service-examples/tmpikc6119g.jpg' },
  },
  {
    title: 'Logo idents',
    body: 'Design animated logo reveals with tasteful effects, lens flares, and physically‑based lighting.',
    icon: <PictureOutlined style={{ color: '#ffa39e' }} />,
    preview: { type: 'image', src: '/service-examples/tmpikc6119g.jpg' },
  },
];

const UseCases: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      {items.map((c) => (
        <Col xs={24} sm={12} lg={8} key={c.title}>
          <Card className="landing-card" variant="borderless" styles={{ body: { height: '100%', overflow: 'hidden' } }} hoverable>
            {c.preview && (
              <div style={{ position: 'relative', height: 140, margin: '-20px -20px 12px -20px', overflow: 'hidden' }}>
                {c.preview.type === 'image' ? (
                  <img src={c.preview.src} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" decoding="async" />
                ) : (
                  <video src={c.preview.src} autoPlay muted loop playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.35))' }} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 20 }}>{c.icon}</div>
              <Title level={4} style={{ color: 'white', margin: 0 }}>{c.title}</Title>
            </div>
            <Paragraph style={{ color: 'rgba(255,255,255,0.82)' }}>{c.body}</Paragraph>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default UseCases;


