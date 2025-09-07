import React, { useEffect, useRef, useState } from 'react';
import { Row, Col, Card, Progress, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const metrics = [
  { label: 'Time‑to‑first‑draft', value: 85 },
  { label: 'Prompt adherence', value: 92 },
  { label: 'Motion coherence', value: 88 },
  { label: 'Render reliability', value: 97 },
];

const Performance: React.FC = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <Row gutter={[24, 24]}>
        {metrics.map((m) => (
          <Col xs={24} md={12} lg={6} key={m.label}>
            <Card className="landing-card" variant="borderless" styles={{ body: { textAlign: 'center' } }}>
              <Title level={5} style={{ color: 'rgba(255,255,255,0.85)' }}>{m.label}</Title>
              <Progress type="dashboard" percent={visible ? m.value : 0} trailColor="rgba(255,255,255,0.15)"
                strokeColor={{ '0%': '#1677ff', '100%': '#69b1ff' }}
              />
              <Paragraph style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
                {m.label === 'Time‑to‑first‑draft' && '85% faster than typical'}
                {m.label === 'Prompt adherence' && '92% accuracy'}
                {m.label === 'Motion coherence' && 'Cinematic cadence'}
                {m.label === 'Render reliability' && 'On‑time completion'}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Performance;


