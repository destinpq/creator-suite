import React from 'react';
import { Card, Row, Col, Typography, Space, Tag } from 'antd';
import { SafetyCertificateOutlined, LockOutlined, FileProtectOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const items = [
  {
    icon: <SafetyCertificateOutlined style={{ color: '#95de64', fontSize: 20 }} />,
    title: 'Data privacy',
    body: 'Project assets remain within your tenancy. Access is scoped via org roles with single‑sign‑on support.'
  },
  {
    icon: <LockOutlined style={{ color: '#5cdbd3', fontSize: 20 }} />,
    title: 'Transport security',
    body: 'TLS everywhere and signed URLs for asset delivery. Optional IP allow‑lists for studio and enterprise networks.'
  },
  {
    icon: <FileProtectOutlined style={{ color: '#ffd666', fontSize: 20 }} />,
    title: 'Compliance',
    body: 'Audit trails for generations and exports. Organization‑level billing and usage analytics for procurement.'
  },
];

const Security: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      {items.map((s) => (
        <Col xs={24} md={8} key={s.title}>
          <Card className="landing-card" variant="borderless">
            <Space align="start" size="middle">
              {s.icon}
              <div>
                <Title level={4} style={{ color: 'white', marginTop: 0 }}>{s.title}</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.82)', marginBottom: 0 }}>{s.body}</Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Security;


