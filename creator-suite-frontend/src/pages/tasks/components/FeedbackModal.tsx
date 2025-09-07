import React, { useState, useEffect } from 'react';
import { Modal, Rate, Input, Button, message, Space, Typography } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import type { FeedbackData } from '@/services/feedback';

const { TextArea } = Input;
const { Text } = Typography;

interface FeedbackModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (rating: number, feedbackText?: string) => Promise<void>;
  taskId: string;
  taskPrompt?: string;
  existingFeedback?: FeedbackData | null;
  loading?: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  taskId,
  taskPrompt,
  existingFeedback,
  loading = false,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes or existing feedback changes
  useEffect(() => {
    if (visible) {
      if (existingFeedback) {
        setRating(existingFeedback.rating);
        setFeedbackText(existingFeedback.feedback_text || '');
      } else {
        setRating(0);
        setFeedbackText('');
      }
    }
  }, [visible, existingFeedback]);

  const handleSubmit = async () => {
    if (rating === 0) {
      message.error('Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, feedbackText.trim() || undefined);
      message.success(existingFeedback ? 'Feedback updated successfully!' : 'Feedback submitted successfully!');
      onCancel();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      message.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(existingFeedback?.rating || 0);
    setFeedbackText(existingFeedback?.feedback_text || '');
    onCancel();
  };

  const ratingDescriptions = [
    '',
    'Poor - Not satisfied',
    'Fair - Below expectations', 
    'Good - Meets expectations',
    'Very Good - Above expectations',
    'Excellent - Exceeds expectations'
  ];

  return (
    <Modal
      title={
        <Space>
          <StarOutlined />
          {existingFeedback ? 'Update Feedback' : 'Rate This Generation'}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={rating === 0}
        >
          {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
        </Button>,
      ]}
      width={600}
      destroyOnClose
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Task Info */}
        <div>
          <Text strong>Task ID: </Text>
          <Text code>{taskId.slice(0, 8)}...</Text>
        </div>
        
        {taskPrompt && (
          <div>
            <Text strong>Prompt: </Text>
            <Text italic style={{ color: '#666' }}>
              "{taskPrompt.length > 100 ? `${taskPrompt.slice(0, 100)}...` : taskPrompt}"
            </Text>
          </div>
        )}

        {/* Rating Section */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            How would you rate this generation? *
          </Text>
          <Space direction="vertical" size="small">
            <Rate
              value={rating}
              onChange={setRating}
              style={{ fontSize: 24 }}
              character={<StarOutlined />}
            />
            {rating > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {ratingDescriptions[rating]}
              </Text>
            )}
          </Space>
        </div>

        {/* Feedback Text Section */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Additional Comments (Optional)
          </Text>
          <TextArea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Share your thoughts about this generation... What did you like? What could be improved?"
            rows={4}
            maxLength={2000}
            showCount
            style={{ resize: 'none' }}
          />
        </div>

        {/* Help Text */}
        <div style={{ backgroundColor: '#f6f8fa', padding: 12, borderRadius: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 Your feedback helps us improve our AI models and provide better generations in the future.
            {existingFeedback && ' You can update your feedback anytime.'}
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default FeedbackModal;
