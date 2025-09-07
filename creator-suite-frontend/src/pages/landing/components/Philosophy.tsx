import React from 'react';
import { Typography, Row, Col, Card } from 'antd';

const { Title, Paragraph } = Typography;

const Philosophy: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card className="landing-card" variant="borderless">
          <Title level={3} style={{ color: 'white', marginTop: 0 }}>Our philosophy</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.86)' }}>
            We believe great tools disappear in the hands of creators. DestinPQ pairs best‑in‑class generative
            models with practical authoring workflows so teams can move from ideas to publishable results without
            friction. Controls are designed to be expressive but predictable, letting you iterate quickly while
            maintaining continuity across shots.
          </Paragraph>
          <Paragraph style={{ color: 'rgba(255,255,255,0.86)' }}>
            The system favors clarity and consistency: structured prompts, appearance guidance, and reusable
            templates help new users become productive fast, while advanced options unlock precise control for
            expert operators.
          </Paragraph>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card className="landing-card" variant="borderless">
          <Title level={3} style={{ color: 'white', marginTop: 0 }}>Technology</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.86)' }}>
            Behind the scenes, autoscaled GPU clusters, caching layers, and adaptive schedulers keep queues short
            and costs predictable. Our pipeline maintains high‑bit‑depth intermediates so that grading and VFX hold
            up under scrutiny—even when you deliver in HDR.
          </Paragraph>
          <Paragraph style={{ color: 'rgba(255,255,255,0.86)' }}>
            We continuously evaluate prompt adherence, motion coherence, and artifact metrics across releases to
            ensure quality improves without breaking your creative workflows.
          </Paragraph>
        </Card>
      </Col>
    </Row>
  );
};

export default Philosophy;


