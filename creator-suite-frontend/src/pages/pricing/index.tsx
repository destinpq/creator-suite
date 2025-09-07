import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Typography, Button } from 'antd';
import { CrownOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { history } from 'umi';

const { Title, Paragraph } = Typography;

const PricingPage: React.FC = () => {
  return (
    <PageContainer ghost title="Pricing">
      <Row gutter={[24, 24]} justify="center" style={{ padding: '24px 0' }}>
        <Col xs={22} md={10}>
          <Card hoverable>
            <Title level={3}><ThunderboltOutlined /> Starter</Title>
            <Paragraph>Get started with essential generation features.</Paragraph>
            <Title level={4}>$9 / mo</Title>
            <Button type="primary" onClick={() => history.push('/user/login')}>Choose Starter</Button>
          </Card>
        </Col>
        <Col xs={22} md={10}>
          <Card hoverable>
            <Title level={3}><CrownOutlined /> Pro</Title>
            <Paragraph>Advanced features and priority generation.</Paragraph>
            <Title level={4}>$29 / mo</Title>
            <Button type="primary" onClick={() => history.push('/user/login')}>Choose Pro</Button>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default PricingPage;


