import React from 'react';
import { Card, Row, Col, Typography, Tag } from 'antd';

const { Title, Paragraph } = Typography;

const integrations = [
  { name: 'Premiere Pro', desc: 'Export color‑managed masters and round‑trip with XML/EDL.' },
  { name: 'After Effects', desc: 'Send plates for typography, tracking, and finishing passes.' },
  { name: 'DaVinci Resolve', desc: 'Grade with high‑bit‑depth intermediates that hold up in HDR.' },
  { name: 'Notion', desc: 'Sync briefs and storyboard frames for review.' },
  { name: 'Slack', desc: 'Receive generation notifications and share secure links.' },
  { name: 'Webhooks', desc: 'Automate pipelines with callbacks for state changes.' },
];

const Integrations: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      {integrations.map((i) => (
        <Col xs={24} md={12} key={i.name}>
          <Card className="landing-card" variant="borderless">
            <Title level={4} style={{ color: 'white', marginTop: 0 }}>{i.name}</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.82)', marginBottom: 0 }}>{i.desc}</Paragraph>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Integrations;


