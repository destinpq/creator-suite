import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Spin } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { Service, User } from '../service';

interface ServiceModalProps {
  visible: boolean;
  user: User | null;
  services: Service[];
  loading: boolean;
  updatingServices: boolean;
  onCancel: () => void;
  onSubmit: (userId: number, serviceIds: number[], currentServices: Service[]) => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  visible,
  user,
  services,
  loading,
  updatingServices,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  useEffect(() => {
    if (visible && user) {
      // Initialize with current user services
      console.log('User services:', user);
      const currentServiceIds = user.services?.map(service => service.id) || [];
      setSelectedServiceIds(currentServiceIds);
      form.setFieldsValue({
        services: currentServiceIds,
      });
    }
  }, [visible, user, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (user) {
        onSubmit(
          user.id, 
          values.services || [], 
          user.services || []
        );
      }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppstoreOutlined />
          <span>Edit Services for {user?.name || user?.username}</span>
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={updatingServices}
      okText="Save Changes"
      cancelText="Cancel"
      width={500}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="services"
            label="Assigned Services"
            rules={[{ required: false }]}
            help="Select the services this user should have access to"
          >
            <Select
              mode="multiple"
              placeholder="Select services"
              style={{ width: '100%' }}
              optionFilterProp="label"
              loading={loading}
              onChange={(values: number[]) => setSelectedServiceIds(values)}
            >
              {services.map(service => (
                <Select.Option key={service.id} value={service.id} label={service.name}>
                  {service.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default ServiceModal;