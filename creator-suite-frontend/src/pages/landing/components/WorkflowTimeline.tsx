import React from 'react';
import { Timeline, Card, Typography } from 'antd';
import { BulbOutlined, PictureOutlined, EditOutlined, BranchesOutlined, RocketOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

const WorkflowTimeline: React.FC = () => {
  return (
    <Card variant="borderless" style={{ background: 'transparent' }} styles={{ body: { padding: 0 } }}>
      <Timeline
        mode="left"
        items={[
          {
            dot: <BulbOutlined style={{ color: '#ffb142' }} />,
            children: (
              <>
                <strong style={{ color: 'white' }}>Brief and intent</strong>
                <Paragraph style={{ marginBottom: 0 }}>
                  Capture objective, audience, tone, and distribution channels. Define constraints and success metrics before generating.
                </Paragraph>
              </>
            ),
          },
          {
            dot: <PictureOutlined style={{ color: '#69b1ff' }} />,
            children: (
              <>
                <strong style={{ color: 'white' }}>References and look‑dev</strong>
                <Paragraph style={{ marginBottom: 0 }}>
                  Attach style frames and palettes. Use appearance guidance to maintain consistent identity across scenes and iterations.
                </Paragraph>
              </>
            ),
          },
          {
            dot: <EditOutlined style={{ color: '#b37feb' }} />,
            children: (
              <>
                <strong style={{ color: 'white' }}>Prompt crafting</strong>
                <Paragraph style={{ marginBottom: 0 }}>
                  Structure prompts with subject, environment, lens, motion, and negatives. Save reusable templates for recurring formats.
                </Paragraph>
              </>
            ),
          },
          {
            dot: <BranchesOutlined style={{ color: '#5cdbd3' }} />,
            children: (
              <>
                <strong style={{ color: 'white' }}>Branching and review</strong>
                <Paragraph style={{ marginBottom: 0 }}>
                  Compare takes side‑by‑side, collect time‑coded notes, and pin best shots. Re‑render only changed segments to move fast.
                </Paragraph>
              </>
            ),
          },
          {
            dot: <RocketOutlined style={{ color: '#ffd666' }} />,
            children: (
              <>
                <strong style={{ color: 'white' }}>Finishing and delivery</strong>
                <Paragraph style={{ marginBottom: 0 }}>
                  Upscale, apply camera LUTs, and export color‑managed masters for web, social, or broadcast. Archive with metadata for reuse.
                </Paragraph>
              </>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default WorkflowTimeline;


