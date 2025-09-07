import React from 'react';
import { Card, Row, Col, Typography, Tag } from 'antd';

const { Title, Paragraph } = Typography;

const cases = [
  {
    tag: 'Brand launch',
    title: 'Global footwear campaign',
    body: 'Produced 24 social‑ready cuts in two days by storyboarding 8‑second segments and iterating quickly on lighting and cadence. Saved 60% vs. traditional production.',
  },
  {
    tag: 'Explainer',
    title: 'Fintech product intro',
    body: 'Turned a technical script into a crisp 45‑second explainer with consistent iconography and motion language. Stakeholder approvals accelerated by versioned frames.',
  },
  {
    tag: 'Concept pitch',
    title: 'Animated series look‑dev',
    body: 'Explored three visual directions with reference‑guided characters. Achieved alignment across creative, production, and brand in a single afternoon.',
  },
];

const CaseStudies: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      {cases.map((c) => (
        <Col xs={24} md={8} key={c.title}>
          <Card className="landing-card" variant="borderless">
            <Tag color="gold">{c.tag}</Tag>
            <Title level={4} style={{ color: 'white', marginTop: 8 }}>{c.title}</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.82)', marginBottom: 0 }}>{c.body}</Paragraph>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default CaseStudies;


