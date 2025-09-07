import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, Select, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { User, UserCreate, UserUpdate, Organization } from '../service';

const { Option } = Select;

interface UserFormProps {
  visible: boolean;
  mode: 'create' | 'edit';
  user?: User | null;
  organizations: Organization[];
  selectedOrganizationId?: number;
  onCancel: () => void;
  onSubmit: (values: UserCreate | UserUpdate) => void;
  loading?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  visible,
  mode,
  user,
  organizations,
  selectedOrganizationId,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && user) {
        // Pre-fill form with user data for editing
        form.setFieldsValue({
          email: user.email,
          username: user.username,
          name: user.name || '',
          is_active: user.is_active ?? true,
          organization_id: user.organization_id || selectedOrganizationId,
          password: '', // Password field empty for editing
        });
      } else if (mode === 'create') {
        // Reset form for creating new user
        form.resetFields();
        // Pre-select organization if provided
        if (selectedOrganizationId) {
          form.setFieldsValue({
            organization_id: selectedOrganizationId,
            is_active: true,
          });
        }
      }
    }
  }, [visible, mode, user, selectedOrganizationId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // For edit mode, only include password if it's provided
      if (mode === 'edit' && !values.password) {
        delete values.password;
      }
      
      onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          {mode === 'create' ? 'Create New User' : 'Edit User'}
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      okText={mode === 'create' ? 'Create User' : 'Update User'}
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        style={{ marginTop: '24px' }}
      >
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter email address"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, message: 'Username is required' },
            { min: 3, message: 'Username must be at least 3 characters' },
            { max: 50, message: 'Username must be less than 50 characters' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter username"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="Full Name"
          rules={[
            { max: 100, message: 'Full name must be less than 100 characters' },
          ]}
        >
          <Input
            prefix={<IdcardOutlined />}
            placeholder="Enter full name (optional)"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={mode === 'create' ? 'Password' : 'New Password (leave empty to keep current)'}
          rules={
            mode === 'create'
              ? [
                  { required: true, message: 'Password is required' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]
              : [
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]
          }
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={mode === 'create' ? 'Enter password' : 'Enter new password (optional)'}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="organization_id"
          label="Organization"
          rules={[{ required: true, message: 'Organization is required' }]}
        >
          <Select
            placeholder="Select organization"
            size="large"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {organizations.map((org) => (
              <Option key={org.id} value={org.id}>
                {org.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="is_active"
          label="Account Status"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            defaultChecked
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserForm;