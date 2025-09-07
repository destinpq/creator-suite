import React, { useState, useEffect } from 'react';
import { List, Tag, Space, Typography, Button, Progress, Modal, Spin, Image } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  EyeOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'umi';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import FeedbackModal from './FeedbackModal';
import type { FeedbackData } from '@/services/feedback';
import type { RootState } from '@/models';

dayjs.extend(duration);

const { Text, Paragraph } = Typography;

interface TaskItemProps {
  task: any;
  isHighlighted?: boolean;
  onRetry: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, isHighlighted, onRetry }) => {
  const dispatch = useDispatch();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const isImageTask = task.task_type === 'image';

  // Get user's feedback for this task from Redux store
  const userFeedback = useSelector((state: RootState) => 
    state.feedback?.userTaskFeedbacks?.[task.id] || null
  );
  const feedbackLoading = useSelector((state: RootState) => 
    state.loading.effects['feedback/createFeedback'] || 
    state.loading.effects['feedback/updateFeedback'] ||
    state.loading.effects['feedback/checkUserFeedbackForTask']
  );

  // Check for existing feedback when component mounts
  useEffect(() => {
    if (task.status === 'completed') {
      dispatch({
        type: 'feedback/checkUserFeedbackForTask',
        payload: task.id,
      });
    }
  }, [dispatch, task.id, task.status]);

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: 'Pending' },
      processing: { color: 'processing', icon: <SyncOutlined spin />, text: 'Processing' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getServiceName = (serviceId: number) => {
    const serviceNames: { [key: number]: string } = {
      1: 'Video-Gen-High',
      2: 'Video-Gen-Max',
      3: 'Video-Gen-ULTRA',
      4: 'Imagen-4-ULTRA'
    };
    return serviceNames[serviceId] || 'Unknown Service';
  };

  const getElapsedTime = () => {
    if (!task.created_at) return '';
    const start = dayjs(task.created_at);
    const end = (task.status === 'completed' || task.status === 'failed') ? dayjs(task.updated_at) : dayjs();
    const durationMs = end.diff(start);
    const durationObj = dayjs.duration(durationMs);
    
    if (durationObj.asMinutes() < 1) {
      return `${Math.floor(durationObj.asSeconds())}s`;
    }
    return `${Math.floor(durationObj.asMinutes())}m ${Math.floor(durationObj.asSeconds() % 60)}s`;
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `https://video-api.destinpq.com/api/v1/media/download/${task.id}`;
    link.download = isImageTask ? `image-${task.id}.${task.input_data?.output_format || 'jpg'}` : `video-${task.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFeedbackSubmit = async (rating: number, feedbackText?: string) => {
    try {
      if (userFeedback) {
        // Update existing feedback
        await dispatch({
          type: 'feedback/updateFeedback',
          payload: {
            id: userFeedback.id,
            data: { rating, feedback_text: feedbackText },
          },
        });
      } else {
        // Create new feedback
        await dispatch({
          type: 'feedback/createFeedback',
          payload: {
            creation_task_id: task.id,
            rating,
            feedback_text: feedbackText,
          },
        });
      }
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleFeedbackClick = () => {
    setFeedbackModalVisible(true);
  };

  const getMediaUrl = () => {
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

  const getThumbnailUrl = () => {
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

  const renderProgress = () => {
    if (task.status === 'processing') {
      const elapsedSeconds = dayjs().diff(dayjs(task.created_at), 'seconds');
      const estimatedSeconds = isImageTask ? 60 : (task.service_id === 1 ? 210 : 270); // 1 min for images, 3.5 or 4.5 minutes for videos
      const progress = Math.min((elapsedSeconds / estimatedSeconds) * 100, 95);

      return (
        <div style={{ marginTop: 12 }}>
          <Progress 
            percent={Math.floor(progress)} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Elapsed: {getElapsedTime()} (typically {isImageTask ? '30-60 seconds' : (task.service_id === 1 ? '3-4 minutes' : '4-5 minutes')})
          </Text>
        </div>
      );
    }
    return null;
  };

  const actions = [];
  
  if (task.status === 'completed') {
    actions.push(
      <Button
        key="preview"
        icon={isImageTask ? <EyeOutlined /> : <PlayCircleOutlined />}
        onClick={handlePreview}
        size="small"
      >
        Preview
      </Button>,
      <Button
        key="download"
        icon={<DownloadOutlined />}
        onClick={handleDownload}
        size="small"
        type="primary"
      >
        Download
      </Button>,
      <Button
        key="feedback"
        icon={userFeedback ? <StarFilled /> : <StarOutlined />}
        onClick={handleFeedbackClick}
        size="small"
        loading={feedbackLoading}
        style={{
          color: userFeedback ? '#faad14' : undefined,
          borderColor: userFeedback ? '#faad14' : undefined,
        }}
      >
        {userFeedback ? `${userFeedback.rating}★` : 'Rate'}
      </Button>
    );
  } else if (task.status === 'failed') {
    actions.push(
      <Button
        key="retry"
        icon={<RetweetOutlined />}
        onClick={() => onRetry(task.id)}
        size="small"
        danger
      >
        Retry
      </Button>
    );
  }

  // Show thumbnail for completed tasks
  const renderThumbnail = () => {
    if (task.status === 'completed' && task.local_thumbnail_url) {
      return (
        <div style={{ marginRight: 16 }}>
          <Image
            width={120}
            height={isImageTask ? 80 : 68}
            src={getThumbnailUrl()}
            preview={false}
            style={{ 
              borderRadius: 4, 
              objectFit: 'cover',
              cursor: 'pointer'
            }}
            onClick={handlePreview}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKARECIAAAQBAQaASECMEiAQwQYAEAEIYIEAEERAiAAAEBAEiQISQQAAgAQAQhAhCAKCBAAhgggAYAEAEIQYQgQhAEBAgghAFhEAAgQhggoBAAAQEASJCBCEAIAAwQYAIIiBAECAABAgAARBACAAAggCBCAIEEACKAAAQZAQBAAgACFCAIIAAQMRAgEBAAIgAQhAECAAIBAgABBAEEAAoIIAQQCBABEFAIIAAQABAAECAQIBAgECAAIEAgQABAIEAAQCBAIEAgQCBAIEAQYAAAQCBAIEAAQABAIEAgQGBAAIEAgQABAAEAAQABAIEAgQCBAIEAgQABAIEAgQCBAIEAgQABAIEAgQCAgg="
          />
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <List.Item
        key={task.id}
        actions={actions}
        style={{
          backgroundColor: isHighlighted ? '#e6f7ff' : 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '8px',
          border: isHighlighted ? '1px solid #1890ff' : '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'flex-start'
        }}
      >
        {renderThumbnail()}
        <List.Item.Meta
          title={
            <Space>
              {isImageTask ? <PictureOutlined /> : <VideoCameraOutlined />}
              <Text strong>Task #{task.id.slice(0, 8)}</Text>
              {getStatusTag(task.status)}
              <Tag color="blue">{getServiceName(task.service_id)}</Tag>
            </Space>
          }
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph 
                ellipsis={{ rows: 2, expandable: true }} 
                style={{ marginBottom: 8 }}
              >
                {task.input_data?.prompt || 'No prompt available'}
              </Paragraph>
              
              {isImageTask && task.input_data && (
                <Space>
                  <Tag>{task.input_data.aspect_ratio || '16:9'}</Tag>
                  <Tag>{task.input_data.output_format?.toUpperCase() || 'JPG'}</Tag>
                </Space>
              )}
              
              <Space size="large">
                <Text type="secondary">
                  Created: {dayjs(task.created_at).locale('en').format('MMM DD, HH:mm:ss')}
                </Text>
                {task.processing_time_seconds && (
                  <Text type="secondary">
                    Generation: {task.processing_time_seconds}s
                  </Text>
                )}
              </Space>

              {renderProgress()}

              {task.status === 'failed' && task.error_message && (
                <Text type="danger" style={{ fontSize: 12 }}>
                  Error: {task.error_message}
                </Text>
              )}
            </Space>
          }
        />
      </List.Item>

      <Modal
        title={isImageTask ? "Image Preview" : "Video Preview"}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={isImageTask ? 900 : 800}
        centered
      >
        {task.status === 'completed' ? (
          isImageTask ? (
            <Image
              style={{ width: '100%' }}
              src={getMediaUrl()}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKARECIAAAQBAQaASECMEiAQwQYAEAEIYIEAEERAiAAAEBAEiQISQQAAgAQAQhAhCAKCBAAhgggAYAEAEIQYQgQhAEBAgghAFhEAAgQhggoBAAAQEASJCBCEAIAAwQYAIIiBAECAABAgAARBACAAAggCBCAIEEACKAAAQZAQBAAgACFCAIIAAQMRAgEBAAIgAQhAECAAIBAgABBAEEAAoIIAQQCBABEFAIIAAQABAAECAQIBAgECAAIEAgQABAIEAAQCBAIEAgQCBAIEAQYAAAQCBAIEAAQABAIEAgQGBAAIEAgQABAAEAAQABAIEAgQCBAIEAgQABAIEAgQCBAIEAgQABAIEAgQCAgg="
            />
          ) : (
            <video
              controls
              muted
              style={{ width: '100%' }}
              src={getMediaUrl()}
            >
              Your browser does not support the video tag.
            </video>
          )
        ) : (
          <Spin />
        )}
      </Modal>

      <FeedbackModal
        visible={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        onSubmit={handleFeedbackSubmit}
        taskId={task.id}
        taskPrompt={task.input_data?.prompt}
        existingFeedback={userFeedback}
        loading={feedbackLoading}
      />
    </>
  );
};

export default TaskItem;