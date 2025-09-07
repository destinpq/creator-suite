import React from 'react';
import { Card, Typography, List, Row, Col } from 'antd';

const { Title, Paragraph } = Typography;

const Support: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card className="landing-card" variant="borderless">
          <Title level={3} style={{ color: 'white', marginTop: 0 }}>Support</Title>
          <List
            size="small"
            dataSource={[
              'Email and Slack support for teams',
              'Onboarding workshops for creative departments',
              'Prompt and workflow audits for large campaigns',
            ]}
            renderItem={(i) => (
              <List.Item>
                <Paragraph style={{ marginBottom: 0, color: 'rgba(255,255,255,0.88)' }}>{i}</Paragraph>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card className="landing-card" variant="borderless">
          <Title level={3} style={{ color: 'white', marginTop: 0 }}>Documentation</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.86)' }}>
            Comprehensive guides cover prompting best practices, reference‑guided workflows, and color‑managed delivery.
            Enterprise customers receive architectural runbooks and procurement‑ready security documentation.
          </Paragraph>
        </Card>
      </Col>
    </Row>
  );
};

export default Support;


