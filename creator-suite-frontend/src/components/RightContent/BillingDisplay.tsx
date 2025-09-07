import React, { useEffect } from 'react';
import { Badge, Popover, Card, Typography, Space, Divider, Tag } from 'antd';
import { DollarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'umi';
import type { RootState } from '@/models';

const { Text, Title } = Typography;

export const BillingDisplay: React.FC = () => {
  const dispatch = useDispatch();
  const billingData = useSelector((state: RootState) => state.billing?.billingData);
  
  useEffect(() => {
    dispatch({
      type: 'billing/fetchBilling',
    });
  }, [dispatch]);

  if (!billingData) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          fontSize: '14px',
          color: 'inherit',
        }}
      >
        <DollarOutlined style={{ marginRight: 4 }} />
        <Text>--</Text>
      </div>
    );
  }

  const content = (
    <Card style={{ width: 300, border: 'none' }} bodyStyle={{ padding: '16px' }}>
      <div>
        <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
          Usage Billing
        </Title>
        
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Total Cost:</Text>
            <Text strong style={{ fontSize: '16px' }}>
              ${billingData.total_cost.toFixed(2)}
            </Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Total Generations:</Text>
            <Badge count={billingData.total_generations} color="#1890ff" />
          </div>
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
          Service Breakdown
        </Title>
        
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {billingData.billing_breakdown.map((service, index) => (
            <Card 
              key={index} 
              size="small" 
              style={{ backgroundColor: '#fafafa' }}
              bodyStyle={{ padding: '8px 12px' }}
            >
              <div style={{ marginBottom: 4 }}>
                <Text strong>{service.service_name == "minimax/video-01" ? "Video-Gen-Max" : service.service_name == "minimax/hailuo-02" ? "Video-Gen-High" : service.service_name == "google/imagen-4-ultra" ? "Imagen-4-ULTRA" : "Video-Gen-ULTRA"}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>
                  <ThunderboltOutlined style={{ marginRight: 4 }} />
                  {service.generations_count} generations
                </span>
                <span>${service.cost_per_generation.toFixed(2)} each</span>
              </div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <Tag color="green">${service.total_cost.toFixed(2)}</Tag>
              </div>
            </Card>
          ))}
        </Space>
      </div>
    </Card>
  );

  return (
    <Popover 
      content={content} 
      title={null}
      trigger="hover"
      placement="bottomRight"
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          fontSize: '14px',
          color: 'inherit',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <DollarOutlined style={{ marginRight: 4 }} />
        <Text strong>${billingData.total_cost.toFixed(2)}</Text>
      </div>
    </Popover>
  );
};