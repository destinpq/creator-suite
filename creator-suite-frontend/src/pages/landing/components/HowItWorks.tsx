import React from 'react';
import { Card, Steps, Typography } from 'antd';
import { ProfileOutlined, PictureOutlined, SlidersOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

const stepItems = [
  {
    title: 'Describe the scene',
    icon: <ProfileOutlined style={{ color: '#69b1ff' }} />,
    description:
      'Write a clear prompt with subject, style, camera moves, and mood. Include negatives to avoid artifacts.',
  },
  {
    title: 'Add references',
    icon: <PictureOutlined style={{ color: '#b37feb' }} />,
    description:
      'Attach an image to match composition, character, or brand. Keep identity consistent while guiding motion.',
  },
  {
    title: 'Set options',
    icon: <SlidersOutlined style={{ color: '#ffd666' }} />,
    description:
      'Choose duration, resolution, and refinement strength. Select cadence and aspect ratio for your channel.',
  },
  {
    title: 'Generate & iterate',
    icon: <PlayCircleOutlined style={{ color: '#5cdbd3' }} />,
    description:
      'Preview results, branch variations, then upscale and export with consistent color management.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <Card
      variant="borderless"
      style={{ background: 'transparent' }}
      styles={{ body: { padding: 0 } }}
    >
      <Steps
        className="landing-steps"
        direction="horizontal"
        responsive
        items={stepItems.map((s) => ({
          title: s.title,
          icon: s.icon,
          description: <Paragraph style={{ marginBottom: 0 }}>{s.description}</Paragraph>,
        }))}
      />
    </Card>
  );
};

export default HowItWorks;


