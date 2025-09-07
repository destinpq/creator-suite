import React, { useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Rate,
  Typography,
  Modal,
  Popconfirm,
  Tooltip,
  Image,
  Card,
  Descriptions,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AdminFeedbackDetail } from '../service';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface FeedbackTableProps {
  feedbacks: AdminFeedbackDetail[];
  loading?: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger: boolean;
    showQuickJumper: boolean;
    showTotal: (total: number, range: [number, number]) => string;
  };
  onPaginationChange: (page: number, pageSize: number) => void;
  onDelete: (feedbackId: number) => void;
  onViewDetail: (feedback: AdminFeedbackDetail) => void;
}

const FeedbackTable: React.FC<FeedbackTableProps> = ({
  feedbacks,
  loading = false,
  pagination,
  onPaginationChange,
  onDelete,
  onViewDetail,
}) => {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackDetail | null>(null);

  const handleViewDetail = (feedback: AdminFeedbackDetail) => {
    setSelectedFeedback(feedback);
    setDetailModalVisible(true);
    onViewDetail(feedback);
  };

  const getMediaUrl = (task: any) => {
    const isImageTask = task.task_type === 'image';
    
    if (isImageTask) {
      if (task.local_image_url) {
        if (task.local_image_url.startsWith('/storage')) {
          return `https://video-api.destinpq.com${task.local_image_url}`;
        }
        if (task.local_image_url.startsWith('http')) {
          return task.local_image_url;
        }
        return `https://video-api.destinpq.com${task.local_image_url}`;
      }
      return `https://video-api.destinpq.com/api/v1/media/images/${task.id}`;
    } else {
      if (task.local_video_url) {
        if (task.local_video_url.startsWith('/storage')) {
          return `https://video-api.destinpq.com${task.local_video_url}`;
        }
        if (task.local_video_url.startsWith('http')) {
          return task.local_video_url;
        }
        return `https://video-api.destinpq.com${task.local_video_url}`;
      }
      return `https://video-api.destinpq.com/api/v1/media/videos/${task.id}`;
    }
  };

  const getThumbnailUrl = (task: any) => {
    if (task.local_thumbnail_url) {
      if (task.local_thumbnail_url.startsWith('/storage')) {
        return `https://video-api.destinpq.com${task.local_thumbnail_url}`;
      }
      if (task.local_thumbnail_url.startsWith('http')) {
        return task.local_thumbnail_url;
      }
      return `https://video-api.destinpq.com${task.local_thumbnail_url}`;
    }
    return `https://video-api.destinpq.com/api/v1/media/thumbnails/${task.id}`;
  };

  const handleDelete = (feedbackId: number) => {
    onDelete(feedbackId);
  };

  const getTaskTypeIcon = (taskType: string) => {
    return taskType === 'video' ? <VideoCameraOutlined /> : <PictureOutlined />;
  };

  const getTaskTypeColor = (taskType: string) => {
    return taskType === 'video' ? 'blue' : 'green';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'success',
      failed: 'error',
      processing: 'processing',
      pending: 'default',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#52c41a';
    if (rating >= 3) return '#faad14';
    if (rating >= 2) return '#fa8c16';
    return '#f5222d';
  };

  const columns: ColumnsType<AdminFeedbackDetail> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Preview',
      key: 'preview',
      width: 80,
      render: (_, record) => {
        if (record.creation_task.status !== 'completed') {
          return (
            <div style={{ 
              width: 60, 
              height: 40, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #d9d9d9'
            }}>
              <Text type="secondary" style={{ fontSize: 10 }}>
                {record.creation_task.status}
              </Text>
            </div>
          );
        }

        return (
          <div style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(record)}>
            {record.creation_task.task_type === 'image' ? (
              <Image
                src={getMediaUrl(record.creation_task)}
                alt="Generated content"
                width={60}
                height={40}
                style={{ 
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
                preview={false}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKARECIAAAQBAQaASECMEiAQwQYAEAEIYIEAEERAiAAAEBAEiQISQQAAgAQAQhAhCAKCBAAhgggAYAEAEIQYQgQhAEBAgghAFhEAAgQhggoBAAAQEASJCBCEAIAAwQYAIIiBAECAABAgAARBACAAAggCBCAIEEACKAAAQZAQBAAgACFCAIIAAQMRAgEBAAIgAQhAECAAIBAgABBAEEAAoIIAQQCBABEFAIIAAQABAAECAQIBAgECAAIEAgQABAIEAAQCBAIEAgQCBAIEAQYAAAQCBAIEAAQABAIEAgQGBAAIEAgQABAAEAAQABAIEAgQCBAIEAgQABAIEAgQCBAIEAgQABAIEAgQCAgg="
              />
            ) : (
              <div style={{ position: 'relative' }}>
                <Image
                  src={getThumbnailUrl(record.creation_task)}
                  alt="Video thumbnail"
                  width={60}
                  height={40}
                  style={{ 
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                  preview={false}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKARECIAAAQBAQaASECMEiAQwQYAEAEIYIEAEERAiAAAEBAEiQISQQAAgAQAQhAhCAKCBAAhgggAYAEAEIQYQgQhAEBAgghAFhEAAgQhggoBAAAQEASJCBCEAIAAwQYAIIiBAECAABAgAARBACAAAggCBCAIEEACKAAAQZAQBAAgACFCAIIAAQMRAgEBAAIgAQhAECAAIBAgABBAEEAAoIIAQQCBABEFAIIAAQABAAECAQIBAgECAAIEAgQABAIEAAQCBAIEAgQCBAIEAQYAAAQCBAIEAAQABAIEAgQGBAAIEAgQABAAEAAQABAIEAgQCBAIEAgQABAIEAgQCBAIEAgQABAIEAgQCAgg="
                />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: 16,
                  textShadow: '0 0 4px rgba(0,0,0,0.8)'
                }}>
                  ▶
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => (
        <Space>
          <Rate disabled value={rating} style={{ fontSize: 14 }} />
          <Text style={{ color: getRatingColor(rating), fontWeight: 'bold' }}>
            {rating}
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <UserOutlined />
            <Text strong>{record.user.username}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user.email}
          </Text>
          {record.user.name && (
            <Text style={{ fontSize: 12 }}>{record.user.name}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Task',
      key: 'task',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            {getTaskTypeIcon(record.creation_task.task_type)}
            <Tag color={getTaskTypeColor(record.creation_task.task_type)}>
              {record.creation_task.task_type.toUpperCase()}
            </Tag>
            <Tag color={getStatusColor(record.creation_task.status)}>
              {record.creation_task.status}
            </Tag>
          </Space>
          <Text code style={{ fontSize: 11 }}>
            {record.creation_task.id.slice(0, 8)}...
          </Text>
          {record.creation_task.service && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.creation_task.service.name}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Prompt',
      key: 'prompt',
      width: 300,
      render: (_, record) => (
        <Paragraph
          ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
          style={{ marginBottom: 0, fontSize: 12 }}
        >
          {record.creation_task.input_data?.prompt || 'No prompt available'}
        </Paragraph>
      ),
    },
    {
      title: 'Feedback Text',
      dataIndex: 'feedback_text',
      key: 'feedback_text',
      width: 250,
      render: (text: string) => (
        text ? (
          <Paragraph
            ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
            style={{ marginBottom: 0, fontSize: 12 }}
          >
            {text}
          </Paragraph>
        ) : (
          <Text type="secondary" italic>No text feedback</Text>
        )
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <Text style={{ fontSize: 12 }}>
            {dayjs(date).locale('en').format('MMM DD, YYYY')}
          </Text>
        </Tooltip>
      ),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete Feedback"
            description="Are you sure you want to delete this feedback?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={feedbacks}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          onChange: onPaginationChange,
          onShowSizeChange: onPaginationChange,
        }}
        scroll={{ x: 1500 }}
        size="small"
      />

      {/* Detail Modal */}
      <Modal
        title="Feedback Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedFeedback && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Feedback Info */}
            <Card title="Feedback Information" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Feedback ID">
                  {selectedFeedback.id}
                </Descriptions.Item>
                <Descriptions.Item label="Rating">
                  <Space>
                    <Rate disabled value={selectedFeedback.rating} style={{ fontSize: 16 }} />
                    <Text style={{ color: getRatingColor(selectedFeedback.rating), fontWeight: 'bold' }}>
                      {selectedFeedback.rating}/5
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  {dayjs(selectedFeedback.created_at).locale('en').format('MMM DD, YYYY HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="Updated">
                  {selectedFeedback.updated_at 
                    ? dayjs(selectedFeedback.updated_at).locale('en').format('MMM DD, YYYY HH:mm:ss')
                    : 'Never'
                  }
                </Descriptions.Item>
              </Descriptions>
              
              {selectedFeedback.feedback_text && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Feedback Text:</Text>
                  <div style={{ 
                    marginTop: 8, 
                    padding: 12, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 6,
                    border: '1px solid #d9d9d9'
                  }}>
                    <Text>{selectedFeedback.feedback_text}</Text>
                  </div>
                </div>
              )}
            </Card>

            {/* Media Preview */}
            {selectedFeedback.creation_task.status === 'completed' && (
              <Card title="Generated Content Preview" size="small">
                <div style={{ textAlign: 'center' }}>
                  {selectedFeedback.creation_task.task_type === 'image' ? (
                    <div>
                      <Image
                        src={getMediaUrl(selectedFeedback.creation_task)}
                        alt="Generated Image"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '400px',
                          borderRadius: 8,
                          border: '1px solid #d9d9d9'
                        }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKARECIAAAQBAQaASECMEiAQwQYAEAEIYIEAEERAiAAAEBAEiQISQQAAgAQAQhAhCAKCBAAhgggAYAEAEIQYQgQhAEBAgghAFhEAAgQhggoBAAAQEASJCBCEAIAAwQYAIIiBAECAABAgAARBACAAAggCBCAIEEACKAAAQZAQBAAgACFCAIIAAQMRAgEBAAIgAQhAECAAIBAgABBAEEAAoIIAQQCBABEFAIIAAQABAAECAQIBAgECAAIEAgQABAIEAAQCBAIEAgQCBAIEAQYAAAQCBAIEAAQABAIEAgQGBAAIEAgQABAAEAAQABAIEAgQCBAIEAgQABAIEAgQCBAIEAgQABAIEAgQCAgg="
                      />
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Generated Image • {selectedFeedback.creation_task.service?.name}
                        </Text>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `https://video-api.destinpq.com/api/v1/media/download/${selectedFeedback.creation_task.id}`;
                            link.download = `image-${selectedFeedback.creation_task.id}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <video
                        controls
                        muted
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '400px',
                          borderRadius: 8,
                          border: '1px solid #d9d9d9'
                        }}
                        src={getMediaUrl(selectedFeedback.creation_task)}
                        poster={getThumbnailUrl(selectedFeedback.creation_task)}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Generated Video • {selectedFeedback.creation_task.service?.name}
                        </Text>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `https://video-api.destinpq.com/api/v1/media/download/${selectedFeedback.creation_task.id}`;
                            link.download = `video-${selectedFeedback.creation_task.id}.mp4`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* User Info */}
            <Card title="User Information" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="User ID">
                  {selectedFeedback.user.id}
                </Descriptions.Item>
                <Descriptions.Item label="Username">
                  {selectedFeedback.user.username}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedFeedback.user.email}
                </Descriptions.Item>
                <Descriptions.Item label="Name">
                  {selectedFeedback.user.name || 'Not provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Organization ID">
                  {selectedFeedback.user.organization_id || 'None'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Task Info */}
            <Card title="Creation Task Information" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Task ID">
                  <Text code>{selectedFeedback.creation_task.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color={getTaskTypeColor(selectedFeedback.creation_task.task_type)}>
                    {selectedFeedback.creation_task.task_type.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedFeedback.creation_task.status)}>
                    {selectedFeedback.creation_task.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Provider">
                  {selectedFeedback.creation_task.provider}
                </Descriptions.Item>
                <Descriptions.Item label="Service">
                  {selectedFeedback.creation_task.service?.name || 'Unknown'}
                </Descriptions.Item>
                <Descriptions.Item label="Processing Time">
                  {selectedFeedback.creation_task.processing_time_seconds 
                    ? `${selectedFeedback.creation_task.processing_time_seconds}s`
                    : 'N/A'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  {dayjs(selectedFeedback.creation_task.created_at).locale('en').format('MMM DD, YYYY HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
              
              <div style={{ marginTop: 16 }}>
                <Text strong>Prompt:</Text>
                <div style={{ 
                  marginTop: 8, 
                  padding: 12, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 6,
                  border: '1px solid #d9d9d9'
                }}>
                  <Text>{selectedFeedback.creation_task.input_data?.prompt || 'No prompt available'}</Text>
                </div>
              </div>

              {selectedFeedback.creation_task.error_message && (
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ color: '#f5222d' }}>Error Message:</Text>
                  <div style={{ 
                    marginTop: 8, 
                    padding: 12, 
                    backgroundColor: '#fff2f0', 
                    borderRadius: 6,
                    border: '1px solid #ffccc7'
                  }}>
                    <Text style={{ color: '#f5222d' }}>
                      {selectedFeedback.creation_task.error_message}
                    </Text>
                  </div>
                </div>
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default FeedbackTable;
