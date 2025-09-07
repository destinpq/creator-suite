import React from 'react';
import { Statistic, Card, Row, Col } from 'antd';

const stats = [
  { value: '4K+', label: 'renders per day' },
  { value: '98.7%', label: 'on-time completion' },
  { value: '65%', label: 'faster time-to-first-draft' },
  { value: '40%', label: 'cost reduction vs. traditional' },
];

const Stats: React.FC = () => {
  return (
    <Row gutter={[24, 24]} justify="center">
      {stats.map((s) => (
        <Col xs={12} md={6} key={s.label}>
          <Card className="landing-card" variant="borderless" styles={{ body: { textAlign: 'center' } }}>
            <Statistic value={s.value} valueStyle={{ color: '#ffb142', fontWeight: 700 }} />
            <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>{s.label}</div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Stats;


