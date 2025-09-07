import React from 'react';
import { Card, Row, Col, Typography, Space } from 'antd';
import { ThunderboltOutlined, CameraOutlined, ControlOutlined, DeploymentUnitOutlined, CloudServerOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    icon: <ThunderboltOutlined style={{ fontSize: 22, color: '#69b1ff' }} />,
    title: 'Fast previews',
    body: 'Low‑latency drafts so you can iterate quickly without breaking creative flow. Compare takes side‑by‑side and branch variations in seconds.'
  },
  {
    icon: <CameraOutlined style={{ fontSize: 22, color: '#ffd666' }} />,
    title: 'Cinematic controls',
    body: 'Fine‑tune motion cadence, shot scale, lens look, and lighting. Get consistent camera behavior without over‑constraining creativity.'
  },
  {
    icon: <ControlOutlined style={{ fontSize: 22, color: '#b37feb' }} />,
    title: 'Prompt adherence',
    body: 'Structured prompts, negatives, and appearance guidance keep outputs faithful to your intent while reducing artifacts.'
  },
  {
    icon: <DeploymentUnitOutlined style={{ fontSize: 22, color: '#5cdbd3' }} />,
    title: 'Long‑video storyboard',
    body: 'Chain reorderable 8‑second segments into coherent cuts. Lock approved shots and re‑render only what you change.'
  },
  {
    icon: <CloudServerOutlined style={{ fontSize: 22, color: '#85a5ff' }} />,
    title: 'Scalable infra',
    body: 'Autoscaled backends and GPU scheduling keep queues moving at peak demand with predictable costs.'
  },
  {
    icon: <TeamOutlined style={{ fontSize: 22, color: '#ffa39e' }} />,
    title: 'Collaboration',
    body: 'Share secure links, gather time‑coded comments, and export color‑managed masters for delivery across web, social, and broadcast.'
  },
];

const Features: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      {features.map((f) => (
        <Col xs={24} md={12} lg={8} key={f.title}>
          <Card className="landing-card" variant="borderless">
            <Space size="middle" align="start">
              {f.icon}
              <div>
                <Title level={4} style={{ color: 'white', marginTop: 0 }}>{f.title}</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.82)', marginBottom: 0 }}>{f.body}</Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Features;


