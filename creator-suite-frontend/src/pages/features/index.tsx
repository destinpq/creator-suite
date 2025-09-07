import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Typography, Row, Col } from 'antd';
import Features from '../landing/components/Features';

const { Title, Paragraph } = Typography;

const sectionContainer = { maxWidth: 1680, margin: '0 auto', padding: '0 clamp(24px, 4vw, 64px)' } as const;

const FeaturesPage: React.FC = () => {
  return (
    <PageContainer ghost title={false} style={{ padding: 0 }}>
      <div style={{ minHeight: '100vh', background: '#0b0b0b' }}>
        <div style={{ ...sectionContainer, paddingTop: 64, paddingBottom: 64 }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Features</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginTop: 8 }}>
                Practical authoring tools paired with production‑ready models.
              </Paragraph>
              <div style={{ marginTop: 24 }}>
                <Features />
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </PageContainer>
  );
};

export default FeaturesPage;


