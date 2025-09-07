import React from 'react';
import { Card, Row, Col, Statistic, Tag, Descriptions } from 'antd';
import { DollarOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import type { OrganizationBill } from '../service';
import { getModelDisplayName } from '../utils';
import dayjs from 'dayjs';

interface BillingSummaryProps {
  billingData: OrganizationBill;
}

const BillingSummary: React.FC<BillingSummaryProps> = ({ billingData }) => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      video: 'blue',
      image: 'green',
      audio: 'orange',
      text: 'purple',
      '3d_model': 'red',
    };
    return colors[type] || 'default';
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Cost"
              value={billingData.total_cost}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Generations"
              value={billingData.total_generations}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Billing Period"
              value={`${dayjs(billingData.billing_period_start).locale('en').format('MMM DD')} - ${dayjs(billingData.billing_period_end).locale('en').format('MMM DD, YYYY')}`}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Usage by Type" size="small">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(billingData.usage_by_type).map(([type, count]) => (
                <Tag key={type} color={getTypeColor(type)} style={{ margin: '2px 0' }}>
                  {type}: {count}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Usage by Model" size="small">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(billingData.usage_by_model).map(([model, count]) => (
                <Tag key={model} color="processing" style={{ margin: '2px 0' }}>
                  {getModelDisplayName(model)}: {count}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Organization Details" size="small" style={{ marginTop: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Organization">
            {billingData.organization_name}
          </Descriptions.Item>
          <Descriptions.Item label="Period">
            {dayjs(billingData.billing_period_start).locale('en').format('MMM DD, YYYY')} to{' '}
            {dayjs(billingData.billing_period_end).locale('en').format('MMM DD, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Average Cost per Generation">
            {formatCurrency(billingData.total_cost / billingData.total_generations || 0)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default BillingSummary;
