import React from 'react';
import { List, Avatar, Typography, Tag, Space, Empty, Spin, Button, Popconfirm, Divider } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined, EditOutlined, DeleteOutlined, PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { User } from '../service';

const { Text, Title } = Typography;

interface UsersListProps {
  users: User[];
  loading?: boolean;
  organizationName?: string;
  isAdmin?: boolean;
  onCreateUser?: () => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (userId: number) => void;
  onEditServices?: (user: User) => void;
  deleteLoading?: boolean;
}

const UsersList: React.FC<UsersListProps> = ({
  users,
  loading = false,
  organizationName,
  isAdmin = false,
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onEditServices,
  deleteLoading = false,
}) => {
  const formatDate = (dateString: string) => {
    return dayjs(dateString).locale('en').format('MMM DD, YYYY HH:mm');
  };

  const getUserInitials = (user: User) => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">Loading users...</Text>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span>
            No users found {organizationName && `in ${organizationName}`}
          </span>
        }
      />
    );
  }

  const renderAdminActions = (user: User) => {
    if (!isAdmin) return [];

    return [
      <Button
        key="edit"
        type="text"
        size="small"
        icon={<EditOutlined />}
        onClick={() => onEditUser?.(user)}
        title="Edit User"
      >
        Edit
      </Button>,
      <Button
        key="services"
        type="text"
        size="small"
        icon={<AppstoreOutlined />}
        onClick={() => onEditServices?.(user)}
        title="Edit Services"
      >
        Edit Services
      </Button>,
      <Popconfirm
        key="delete"
        title="Delete User"
        description={`Are you sure you want to delete user "${user.name || user.username}"?`}
        onConfirm={() => onDeleteUser?.(user.id)}
        okText="Yes, Delete"
        cancelText="Cancel"
        okType="danger"
        disabled={deleteLoading}
      >
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          danger
          loading={deleteLoading}
          title="Delete User"
        >
          Delete
        </Button>
      </Popconfirm>,
    ];
  };

  return (
    <div>
      {organizationName && (
        <Space
          style={{
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Users in {organizationName} ({users.length})
          </Title>
          
          {isAdmin && onCreateUser && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onCreateUser}
            >
              Add User
            </Button>
          )}
        </Space>
      )}
      
      <List
        itemLayout="horizontal"
        dataSource={users}
        renderItem={(user) => (
          <List.Item
            actions={[
              <Tag
                color={user.is_active ? 'green' : 'red'}
                key="status"
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </Tag>,
              ...renderAdminActions(user),
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={48}
                  style={{
                    backgroundColor: user.is_active ? '#1890ff' : '#d9d9d9',
                    color: user.is_active ? 'white' : '#666',
                  }}
                  icon={<UserOutlined />}
                >
                  {getUserInitials(user)}
                </Avatar>
              }
              title={
                <Space direction="vertical" size={2}>
                  <Space>
                    <Text strong>
                      {user.name || user.username}
                    </Text>
                    {user.name && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        @{user.username}
                      </Text>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ID: {user.id}
                  </Text>
                </Space>
              }
              description={
                <Space direction="vertical" size={4}>
                  <Space>
                    <MailOutlined style={{ color: '#666' }} />
                    <Text copyable={{ text: user.email }}>
                      {user.email}
                    </Text>
                  </Space>
                  
                  <Space wrap>
                    <Space size={4}>
                      <CalendarOutlined style={{ color: '#666' }} />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Joined: {formatDate(user.created_at)}
                      </Text>
                    </Space>
                    
                    {user.updated_at && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        • Updated: {formatDate(user.updated_at)}
                      </Text>
                    )}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default UsersList;