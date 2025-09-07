import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import { Organization, OrganizationCreate, OrganizationUpdate } from '../service';

const { TextArea } = Input;

interface OrganisationFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: OrganizationCreate | OrganizationUpdate) => void;
  organisation?: Organization | null;
  loading?: boolean;
  mode: 'create' | 'edit';
}

const OrganisationForm: React.FC<OrganisationFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  organisation,
  loading = false,
  mode,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && mode === 'edit' && organisation) {
      form.setFieldsValue({
        name: organisation.name,
        description: organisation.description || '',
      });
    } else if (visible && mode === 'create') {
      form.resetFields();
    }
  }, [visible, mode, organisation, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const title = mode === 'create' ? 'Create New Organisation' : 'Edit Organisation';
  const submitText = mode === 'create' ? 'Create' : 'Update';

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {submitText}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="organisationForm"
        preserve={false}
      >
        <Form.Item
          name="name"
          label="Organisation Name"
          rules={[
            {
              required: true,
              message: 'Please enter organisation name',
            },
            {
              min: 2,
              message: 'Organisation name must be at least 2 characters',
            },
            {
              max: 100,
              message: 'Organisation name cannot exceed 100 characters',
            },
          ]}
        >
          <Input
            placeholder="Enter organisation name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            {
              max: 500,
              message: 'Description cannot exceed 500 characters',
            },
          ]}
        >
          <TextArea
            placeholder="Enter organisation description (optional)"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        {mode === 'edit' && organisation && (
          <Space direction="vertical" style={{ width: '100%', marginTop: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <div>Organisation ID: {organisation.id}</div>
                <div>Created: {new Date(organisation.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                {organisation.updated_at && (
                  <div>Last Updated: {new Date(organisation.updated_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric', 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                )}
              </div>
            </div>
          </Space>
        )}
      </Form>
    </Modal>
  );
};

export default OrganisationForm;