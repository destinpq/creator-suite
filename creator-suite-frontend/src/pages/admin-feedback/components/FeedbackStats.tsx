import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Space, Typography } from 'antd';
import { StarOutlined, MessageOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { AdminFeedbackStats } from '../service';

const { Title, Text } = Typography;

interface FeedbackStatsProps {
  stats: AdminFeedbackStats | null;
  loading?: boolean;
}

const FeedbackStats: React.FC<FeedbackStatsProps> = ({ stats, loading = false }) => {
  if (!stats) {
    return (
      <Card title="Feedback Statistics" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">No statistics available</Text>
        </div>
      </Card>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#52c41a';
    if (rating >= 3.5) return '#faad14';
    if (rating >= 2.5) return '#fa8c16';
    return '#f5222d';
  };

  const getRatingDescription = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Fair';
    return 'Poor';
  };

  return (
    <Card title="Feedback Statistics" loading={loading}>
      <Row gutter={[16, 16]}>
        {/* Overall Stats */}
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Feedbacks"
              value={stats.total_feedbacks}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Average Rating"
              value={stats.average_rating}
              precision={2}
              prefix={<StarOutlined />}
              suffix="/ 5"
              valueStyle={{ color: getRatingColor(stats.average_rating) }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getRatingDescription(stats.average_rating)}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Recent Feedbacks"
              value={stats.recent_feedbacks_count}
              prefix={<ClockCircleOutlined />}
              suffix="(7 days)"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Satisfaction Rate"
              value={stats.total_feedbacks > 0 ? 
                ((stats.rating_distribution[4] + stats.rating_distribution[5]) / stats.total_feedbacks * 100) : 0
              }
              precision={1}
              prefix={<TrophyOutlined />}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              4+ star ratings
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Rating Distribution */}
        <Col xs={24} md={12}>
          <Card size="small" title="Rating Distribution">
            <Space direction="vertical" style={{ width: '100%' }}>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.rating_distribution[rating] || 0;
                const percentage = stats.total_feedbacks > 0 ? (count / stats.total_feedbacks) * 100 : 0;
                
                return (
                  <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ minWidth: 60 }}>
                      {rating} ⭐
                    </Text>
                    <Progress
                      percent={percentage}
                      size="small"
                      showInfo={false}
                      strokeColor={getRatingColor(rating)}
                      style={{ flex: 1 }}
                    />
                    <Text style={{ minWidth: 40, textAlign: 'right' }}>
                      {count}
                    </Text>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        {/* Task Type Distribution */}
        <Col xs={24} md={12}>
          <Card size="small" title="Feedbacks by Task Type">
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(stats.feedbacks_by_task_type).map(([taskType, count]) => {
                const percentage = stats.total_feedbacks > 0 ? (count / stats.total_feedbacks) * 100 : 0;
                
                return (
                  <div key={taskType} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={taskType === 'video' ? 'blue' : 'green'} style={{ minWidth: 60 }}>
                      {taskType.charAt(0).toUpperCase() + taskType.slice(1)}
                    </Tag>
                    <Progress
                      percent={percentage}
                      size="small"
                      showInfo={false}
                      strokeColor={taskType === 'video' ? '#1890ff' : '#52c41a'}
                      style={{ flex: 1 }}
                    />
                    <Text style={{ minWidth: 40, textAlign: 'right' }}>
                      {count}
                    </Text>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Service Distribution */}
      {Object.keys(stats.feedbacks_by_service).length > 0 && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card size="small" title="Feedbacks by Service">
              <Row gutter={[8, 8]}>
                {Object.entries(stats.feedbacks_by_service).map(([serviceName, count]) => (
                  <Col key={serviceName} xs={24} sm={12} md={8} lg={6}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title={serviceName}
                        value={count}
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default FeedbackStats;
