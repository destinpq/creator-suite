import React from 'react';
import { Typography, Card, Space, Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const data = [
  { key: 'quality', metric: 'Prompt adherence', destinpq: 'High (structured prompts + negatives)', typical: 'Medium' },
  { key: 'coherence', metric: 'Motion coherence', destinpq: 'Cinematic cadence presets', typical: 'Inconsistent' },
  { key: 'long', metric: 'Long‑video workflow', destinpq: 'Reorderable 8‑second segments', typical: 'Manual stitching' },
  { key: 'collab', metric: 'Collaboration', destinpq: 'Time‑coded comments & share links', typical: 'Limited' },
  { key: 'delivery', metric: 'Delivery formats', destinpq: 'Color‑managed exports, HDR‑ready', typical: 'Basic' },
];

const Comparison: React.FC = () => {
  return (
    <Card className="landing-card" variant="borderless">
      <Title level={3} style={{ color: 'white', marginTop: 0 }}>How we compare</Title>
      <Paragraph style={{ color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>
        Stronger outcomes on the metrics that matter for professional video delivery.
      </Paragraph>
      <Row gutter={[12, 12]}>
        {data.map((row) => (
          <Col xs={24} key={row.key}>
            <div className="landing-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ color: 'white', fontWeight: 600 }}>{row.metric}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span className="cmp-chip cmp-chip--good"><CheckOutlined /> {row.destinpq}</span>
                  <span className="cmp-chip cmp-chip--typical"><CloseOutlined /> {row.typical}</span>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
      <Space style={{ marginTop: 12, color: 'rgba(255,255,255,0.75)' }}>
        <span className="cmp-chip cmp-chip--good"><CheckOutlined /> DestinPQ advantage</span>
        <span className="cmp-chip cmp-chip--typical"><CloseOutlined /> Typical limitation</span>
      </Space>
    </Card>
  );
};

export default Comparison;


