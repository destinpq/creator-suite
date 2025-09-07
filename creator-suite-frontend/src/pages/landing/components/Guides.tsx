import React from 'react';
import { Typography, List, Card, Collapse, Space, Button, message } from 'antd';
import { EditOutlined, PictureOutlined, VideoCameraOutlined, CopyOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

const Guides: React.FC = () => {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => message.success('Copied prompt example'));
  };

  return (
    <Card className="landing-card" variant="borderless">
      <Collapse
        ghost
        items={[
          {
            key: 'prompts',
            label: <Space><EditOutlined /> Prompting basics</Space>,
            children: (
              <>
                <List
                  size="small"
                  dataSource={[
                    'State subject, environment, lens look, and time of day.',
                    'Use negatives for objects, styles, and artifacts to avoid.',
                    'Describe motion: dolly, pan, speed, cadence.',
                  ]}
                  renderItem={(item) => <List.Item><Paragraph style={{ marginBottom: 0 }}>{item}</Paragraph></List.Item>}
                />
                <Space style={{ marginTop: 12 }}>
                  <Button icon={<CopyOutlined />} onClick={() => copy('A cinematic product shot of a smartwatch on a marble surface, golden hour lighting, shallow depth of field, 50mm lens, gentle camera dolly-in. NEGATIVE: low-res, blurry, text, watermark')}>
                    Copy prompt example
                  </Button>
                </Space>
              </>
            ),
          },
          {
            key: 'ref',
            label: <Space><PictureOutlined /> Reference guidance</Space>,
            children: (
              <List
                size="small"
                dataSource={[
                  'Upload stills to lock composition and palette.',
                  'Use consistent character references across scenes.',
                  'Blend looks for exploration, tighten for final output.',
                ]}
                renderItem={(item) => <List.Item><Paragraph style={{ marginBottom: 0 }}>{item}</Paragraph></List.Item>}
              />
            ),
          },
          {
            key: 'long',
            label: <Space><VideoCameraOutlined /> Long‑video tips</Space>,
            children: (
              <List
                size="small"
                dataSource={[
                  'Storyboard as 8‑second beats; name each beat clearly.',
                  'Re‑render only tweaked beats after review to save time.',
                  'Keep cadence and lens consistent to preserve continuity.',
                ]}
                renderItem={(item) => <List.Item><Paragraph style={{ marginBottom: 0 }}>{item}</Paragraph></List.Item>}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};

export default Guides;


