import React from 'react';
import { Card, Form, Row, Col, Select, DatePicker, Button, Space, Rate, InputNumber } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { AdminFeedbackFilters } from '../service';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FeedbackFiltersProps {
  filters: AdminFeedbackFilters;
  onFiltersChange: (filters: AdminFeedbackFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  loading?: boolean;
}

const FeedbackFilters: React.FC<FeedbackFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleValuesChange = (changedValues: any, allValues: any) => {
    const newFilters: AdminFeedbackFilters = {};

    // Handle date range
    if (allValues.dateRange) {
      newFilters.date_from = allValues.dateRange[0]?.toISOString();
      newFilters.date_to = allValues.dateRange[1]?.toISOString();
    }

    // Handle other filters
    Object.keys(allValues).forEach(key => {
      if (key !== 'dateRange' && allValues[key] !== undefined && allValues[key] !== '') {
        newFilters[key as keyof AdminFeedbackFilters] = allValues[key];
      }
    });

    onFiltersChange(newFilters);
  };

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  // Set initial form values based on filters
  const initialValues = {
    rating: filters.rating,
    task_type: filters.task_type,
    service_id: filters.service_id,
    user_id: filters.user_id,
    organization_id: filters.organization_id,
    has_text_feedback: filters.has_text_feedback,
    dateRange: filters.date_from && filters.date_to ? [
      dayjs(filters.date_from),
      dayjs(filters.date_to)
    ] : undefined,
  };

  return (
    <Card title="Filters" size="small" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item label="Rating" name="rating">
              <Select placeholder="Select rating" allowClear>
                <Option value={1}>⭐ 1 Star</Option>
                <Option value={2}>⭐ 2 Stars</Option>
                <Option value={3}>⭐ 3 Stars</Option>
                <Option value={4}>⭐ 4 Stars</Option>
                <Option value={5}>⭐ 5 Stars</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item label="Task Type" name="task_type">
              <Select placeholder="Select type" allowClear>
                <Option value="video">Video</Option>
                <Option value="image">Image</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item label="Service ID" name="service_id">
              <InputNumber
                placeholder="Service ID"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item label="User ID" name="user_id">
              <InputNumber
                placeholder="User ID"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item label="Organization ID" name="organization_id">
              <InputNumber
                placeholder="Org ID"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Date Range" name="dateRange">
              <RangePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder={['Start Date', 'End Date']}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item label="Has Text Feedback" name="has_text_feedback">
              <Select placeholder="Select" allowClear>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Form.Item label=" " style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={onSearch}
                  loading={loading}
                >
                  Search
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default FeedbackFilters;
