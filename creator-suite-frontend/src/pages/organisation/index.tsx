/**
 * Organisation Management Page
 * 
 * Features:
 * - List all organisations with pagination support
 * - Create new organisations
 * - Edit existing organisations  
 * - Delete organisations with confirmation
 * - View users within each organisation (admin only)
 * - Create new users within organisations (admin only)
 * - Edit existing users (admin only)
 * - Delete users with confirmation (admin only)
 * - Responsive card-based layout
 * - Real-time loading states and error handling
 * - Role-based access control for admin features
 * 
 * Components:
 * - OrganisationList: Grid layout of organisation cards
 * - OrganisationCard: Individual organisation card with actions
 * - OrganisationForm: Create/edit modal form
 * - UsersList: User listing in drawer
 * 
 * API Integration:
 * - GET /api/v1/organizations/ - List organisations
 * - POST /api/v1/organizations/ - Create organisation
 * - PUT /api/v1/organizations/{id} - Update organisation
 * - DELETE /api/v1/organizations/{id} - Delete organisation
 * - GET /api/v1/admin/management/organizations/{id}/users - List organisation users (admin only)
 * - POST /api/v1/admin/management/users - Create user (admin only)
 * - PUT /api/v1/admin/management/users/{id} - Update user (admin only)
 * - DELETE /api/v1/admin/management/users/{id} - Delete user (admin only)
 */

import React, { useEffect, useState } from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button, Space, Typography, Drawer, Segmented, Badge } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector, useModel } from '@umijs/max';
import { Organization, OrganizationCreate, OrganizationUpdate, User, UserCreate, UserUpdate, Service } from './service';
import { OrganisationState } from './model';
import { 
  OrganisationList, 
  OrganisationForm, 
  UsersList,
  UserForm,
  ServiceModal
} from './components';

const { Title } = Typography;

interface RootState {
  organisation: OrganisationState;
  loading: any;
}

const OrganisationIndex: React.FC = () => {
  const dispatch = useDispatch();
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  
  const { 
    organisations, 
    selectedOrganisation, 
    organisationUsers,
    services,
    loadingServices,
    updatingUserServices,
  } = useSelector((state: RootState) => state.organisation);

  // Use dva loading model
  const loading = useSelector((state: RootState) => state.loading.effects['organisation/fetchOrganisations']);
  const userLoading = useSelector((state: RootState) => state.loading.effects['organisation/fetchOrganisationUsers']);
  const deleteLoading = useSelector((state: RootState) => state.loading.effects['organisation/deleteOrganisation']);
  const createLoading = useSelector((state: RootState) => state.loading.effects['organisation/createOrganisation']);
  const updateLoading = useSelector((state: RootState) => state.loading.effects['organisation/updateOrganisation']);
  
  // Admin user management loading states
  const createUserLoading = useSelector((state: RootState) => state.loading.effects['organisation/createUser']);
  const updateUserLoading = useSelector((state: RootState) => state.loading.effects['organisation/updateUser']);
  const deleteUserLoading = useSelector((state: RootState) => state.loading.effects['organisation/deleteUser']);

  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingOrganisation, setEditingOrganisation] = useState<Organization | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'organisations' | 'users'>('organisations');
  
  // User form management state
  const [userFormVisible, setUserFormVisible] = useState(false);
  const [userFormMode, setUserFormMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Service modal management state
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Check if current user is admin
  const isAdmin = currentUser?.is_admin || false;

  useEffect(() => {
    // Fetch organisations on component mount
    dispatch({
      type: 'organisation/fetchOrganisations',
    });
  }, [dispatch]);

  const handleCreateClick = () => {
    setFormMode('create');
    setEditingOrganisation(null);
    setFormVisible(true);
  };

  const handleEditOrganisation = (organisation: Organization) => {
    setFormMode('edit');
    setEditingOrganisation(organisation);
    setFormVisible(true);
  };

  const handleViewOrganisation = (organisation: Organization) => {
    dispatch({
      type: 'organisation/setSelectedOrganisation',
      payload: organisation,
    });
    
    // Fetch users for this organisation
    dispatch({
      type: 'organisation/fetchOrganisationUsers',
      payload: { organizationId: organisation.id },
    });
    
    setViewMode('users');
    setDrawerVisible(true);
  };

  const handleDeleteOrganisation = (organisationId: number) => {
    dispatch({
      type: 'organisation/deleteOrganisation',
      payload: { id: organisationId },
    });
  };

  const handleFormSubmit = (values: OrganizationCreate | OrganizationUpdate) => {
    if (formMode === 'create') {
      dispatch({
        type: 'organisation/createOrganisation',
        payload: values,
      });
    } else if (formMode === 'edit' && editingOrganisation) {
      dispatch({
        type: 'organisation/updateOrganisation',
        payload: { id: editingOrganisation.id, data: values },
      });
    }
    setFormVisible(false);
    setEditingOrganisation(null);
  };

  const handleRefresh = () => {
    dispatch({
      type: 'organisation/fetchOrganisations',
    });
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    dispatch({
      type: 'organisation/clearSelectedOrganisation',
    });
  };

  // ===== ADMIN USER MANAGEMENT HANDLERS =====

  const handleCreateUser = () => {
    setUserFormMode('create');
    setEditingUser(null);
    setUserFormVisible(true);
  };

  const handleEditUser = (user: User) => {
    setUserFormMode('edit');
    setEditingUser(user);
    setUserFormVisible(true);
  };

  const handleDeleteUser = (userId: number) => {
    dispatch({
      type: 'organisation/deleteUser',
      payload: { id: userId },
    });
  };

  const handleUserFormSubmit = (values: UserCreate | UserUpdate) => {
    if (userFormMode === 'create') {
      dispatch({
        type: 'organisation/createUser',
        payload: values,
      });
    } else if (userFormMode === 'edit' && editingUser) {
      dispatch({
        type: 'organisation/updateUser',
        payload: { id: editingUser.id, data: values },
      });
    }
    setUserFormVisible(false);
    setEditingUser(null);
  };

  const handleUserFormCancel = () => {
    setUserFormVisible(false);
    setEditingUser(null);
  };
  
  // ===== SERVICE MANAGEMENT HANDLERS =====
  
  const handleEditServices = (user: User) => {
    setSelectedUser(user);
    
    // Fetch available services if not already loaded
    if (services.length === 0) {
      dispatch({
        type: 'organisation/fetchServices',
      });
    }
    
    setServiceModalVisible(true);
  };
  
  const handleServiceModalCancel = () => {
    setServiceModalVisible(false);
    setSelectedUser(null);
  };
  
  const handleUpdateUserServices = (userId: number, serviceIds: number[], currentServices: Service[]) => {
    dispatch({
      type: 'organisation/updateUserServices',
      payload: { 
        userId, 
        serviceIds, 
        currentServices,
        organizationId: selectedOrganisation?.id 
      },
    });
    setServiceModalVisible(false);
    setSelectedUser(null);
  };

  const renderPageHeader = () => (
    <Space
      style={{
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}
    >
      <Space direction="vertical" size={4}>
        <Title level={2} style={{ margin: 0 }}>
          <TeamOutlined /> Organisations
        </Title>
        <Typography.Text type="secondary">
          Manage organisations and view their users
        </Typography.Text>
      </Space>
      
      <Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
        >
          Create Organisation
        </Button>
      </Space>
    </Space>
  );

  const renderDrawerContent = () => {
    if (viewMode === 'users' && selectedOrganisation) {
      return (
        <UsersList
          users={organisationUsers}
          loading={userLoading}
          organizationName={selectedOrganisation.name}
          isAdmin={isAdmin}
          onCreateUser={handleCreateUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onEditServices={handleEditServices}
          deleteLoading={deleteUserLoading}
        />
      );
    }
    return null;
  };

  return (
    <PageContainer ghost>
      <ProCard>
        {renderPageHeader()}
        
        <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              Total Organisations: {organisations.length}
            </Typography.Text>
        </div>

        <OrganisationList
          organisations={organisations}
          loading={loading}
          onView={handleViewOrganisation}
          onEdit={handleEditOrganisation}
          onDelete={handleDeleteOrganisation}
        />

        <OrganisationForm
          visible={formVisible}
          mode={formMode}
          organisation={editingOrganisation}
          onCancel={() => {
            setFormVisible(false);
            setEditingOrganisation(null);
          }}
          onSubmit={handleFormSubmit}
          loading={formMode === 'create' ? createLoading : updateLoading}
        />

        <Drawer
          title={
            <Space>
              <UserOutlined />
              <span>
                {selectedOrganisation?.name} - Users ({organisationUsers.length})
              </span>
            </Space>
          }
          placement="right"
          onClose={handleCloseDrawer}
          open={drawerVisible}
          width={900}
          styles={{
            body: { padding: '24px' }
          }}
        >
          {renderDrawerContent()}
        </Drawer>

        {/* Admin-only User Form */}
        {isAdmin && (
          <UserForm
            visible={userFormVisible}
            mode={userFormMode}
            user={editingUser}
            organizations={organisations}
            selectedOrganizationId={selectedOrganisation?.id}
            onCancel={handleUserFormCancel}
            onSubmit={handleUserFormSubmit}
            loading={userFormMode === 'create' ? createUserLoading : updateUserLoading}
          />
        )}
        
        {/* Admin-only Service Modal */}
        {isAdmin && (
          <ServiceModal
            visible={serviceModalVisible}
            user={selectedUser}
            services={services}
            loading={loadingServices}
            updatingServices={updatingUserServices}
            onCancel={handleServiceModalCancel}
            onSubmit={handleUpdateUserServices}
          />
        )}
      </ProCard>
    </PageContainer>
  );
};

export default OrganisationIndex;