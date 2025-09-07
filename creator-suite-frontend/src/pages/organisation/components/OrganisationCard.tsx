import React from 'react';
import { Card, Button, Popconfirm, Typography, Space, Tag } from 'antd';
import { DeleteOutlined, UserOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Organization } from '../service';

const { Title, Text } = Typography;

interface OrganisationCardProps {
  organisation: Organization;
  onView: (organisation: Organization) => void;
  onEdit: (organisation: Organization) => void;
  onDelete: (organisationId: number) => void;
  loading?: boolean;
}

const OrganisationCard: React.FC<OrganisationCardProps> = ({
  organisation,
  onView,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const handleDelete = () => {
    onDelete(organisation.id);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).locale('en').format('MMM DD, YYYY');
  };

  return (
    <Card
      hoverable
      loading={loading}
      actions={[
        <Button
          key="view"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onView(organisation)}
          title="View Users"
        >
          View Users
        </Button>,
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(organisation)}
          title="Edit Organisation"
        >
          Edit
        </Button>,
        <Popconfirm
          key="delete"
          title="Delete Organisation"
          description="Are you sure you want to delete this organisation? This action cannot be undone."
          onConfirm={handleDelete}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            title="Delete Organisation"
          >
            Delete
          </Button>
        </Popconfirm>,
      ]}
    >
      <Card.Meta
        avatar={
          <div
            style={{
              width: 40,
              height: 40,
              backgroundColor: '#1890ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {organisation.name.charAt(0).toUpperCase()}
          </div>
        }
        title={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>
              {organisation.name}
            </Title>
            <Tag color="blue" icon={<UserOutlined />}>
              ID: {organisation.id}
            </Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {organisation.description && (
              <Text type="secondary">{organisation.description}</Text>
            )}
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Created: {formatDate(organisation.created_at)}
              </Text>
              {organisation.updated_at && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Updated: {formatDate(organisation.updated_at)}
                </Text>
              )}
            </Space>
          </Space>
        }
      />
    </Card>
  );
};

export default OrganisationCard;