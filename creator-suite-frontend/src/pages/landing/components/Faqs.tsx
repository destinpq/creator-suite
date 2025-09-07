import React from 'react';
import { Collapse, Typography } from 'antd';

const { Paragraph } = Typography;

const general = [
  {
    key: 'time',
    label: 'How long do generations take?',
    children: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          Most videos complete in 3–8 minutes depending on model and resolution. Quick drafts arrive in under a minute.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          Final upscales and longer cuts naturally take more time.
        </Paragraph>
      </>
    ),
  },
  {
    key: 'long',
    label: 'Can I make longer videos?',
    children: (
      <Paragraph style={{ marginBottom: 0 }}>
        Use Long Video Studio to chain multiple 8‑second scenes into a single cut and re‑render only the shots you tweak.
      </Paragraph>
    ),
  },
];

const technical = [
  {
    key: 'i2v',
    label: 'Do you support image‑to‑video?',
    children: (
      <Paragraph style={{ marginBottom: 0 }}>
        Upload a reference image to guide composition, character, or style and maintain consistency across shots.
      </Paragraph>
    ),
  },
  {
    key: 'license',
    label: 'What about licensing?',
    children: (
      <Paragraph style={{ marginBottom: 0 }}>
        You own your final outputs subject to our content policy and applicable law. Organization‑level billing and analytics included.
      </Paragraph>
    ),
  },
];

const Faqs: React.FC = () => {
  return (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr', color: 'white' }}>
      <div>
        <Typography.Title level={4} style={{ color: 'white' }}>General</Typography.Title>
        <Collapse
          items={general.map((it) => ({
            ...it,
            children: <div style={{ color: 'rgba(255,255,255,0.88)' }}>{it.children}</div>,
          }))}
          defaultActiveKey={['time']}
          ghost
        />
      </div>
      <div>
        <Typography.Title level={4} style={{ color: 'white' }}>Technical</Typography.Title>
        <Collapse
          items={technical.map((it) => ({
            ...it,
            children: <div style={{ color: 'rgba(255,255,255,0.88)' }}>{it.children}</div>,
          }))}
          ghost
        />
      </div>
    </div>
  );
};

export default Faqs;


