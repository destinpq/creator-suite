import { request } from '@umijs/max';

// Organization API types based on OpenAPI schema
export interface Organization {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrganizationCreate {
  name: string;
  description?: string;
}

export interface OrganizationUpdate {
  name: string;
  description?: string;
}

export interface Service {
  id: number;
  name: string;
}

export interface UserService {
  id: number;
  user_id: number;
  service_id: number;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  is_active?: boolean;
  organization_id?: number;
  created_at: string;
  updated_at?: string;
  services?: Service[];
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  name?: string;
  is_active?: boolean;
  organization_id?: number;
}

export interface UserUpdate {
  email: string;
  username: string;
  name?: string;
  is_active?: boolean;
  organization_id?: number;
  password?: string;
}

// Get list of organizations
export const getOrganisations = (skip: number = 0, limit: number = 100) => {
  return request<Organization[]>('/api/v1/organizations/', {
    method: 'GET',
    params: { skip, limit },
  });
};

// Get single organization by ID
export const getOrganisation = (organizationId: number) => {
  return request<Organization>(`/api/v1/organizations/${organizationId}`, {
    method: 'GET',
  });
};

// Create new organization
export const createOrganisation = (data: OrganizationCreate) => {
  return request<Organization>('/api/v1/organizations/', {
    method: 'POST',
    data,
  });
};

// Update organization
export const updateOrganisation = (organizationId: number, data: OrganizationUpdate) => {
  return request<Organization>(`/api/v1/organizations/${organizationId}`, {
    method: 'PUT',
    data,
  });
};

// Delete organization (returns 204 No Content)
export const deleteOrganisation = (organizationId: number) => {
  return request(`/api/v1/organizations/${organizationId}`, {
    method: 'DELETE',
  });
};

// Get users in an organization (admin only)
export const getOrganisationUsers = (organizationId: number) => {
  return request<User[]>(`/api/v1/admin/management/organizations/${organizationId}/users`, {
    method: 'GET',
  });
};

// ===== ADMIN-ONLY USER MANAGEMENT ENDPOINTS =====

// Create new user (admin only)
export const createUser = (data: UserCreate) => {
  return request<User>('/api/v1/admin/management/users', {
    method: 'POST',
    data,
  });
};

// Update user (admin only)
export const updateUser = (userId: number, data: UserUpdate) => {
  return request<User>(`/api/v1/admin/management/users/${userId}`, {
    method: 'PUT',
    data,
  });
};

// Delete user (admin only)
export const deleteUser = (userId: number) => {
  return request<User>(`/api/v1/admin/management/users/${userId}`, {
    method: 'DELETE',
  });
};

// ===== SERVICE MANAGEMENT ENDPOINTS =====

// Get all available services
export const getServices = () => {
  return request<Service[]>('/api/v1/services/', {
    method: 'GET',
  });
};

// Attach a service to a user
export const attachUserService = (userId: number, serviceId: number) => {
  return request<UserService>('/api/v1/user-services/', {
    method: 'POST',
    data: {
      user_id: userId,
      service_id: serviceId
    },
  });
};

// Delete a user-service assignment
export const deleteUserService = (userServiceId: number) => {
  return request(`/api/v1/user-services/${userServiceId}`, {
    method: 'DELETE',
  });
};

// Get all user-service assignments for a specific user
export const getUserServices = (userId: number) => {
  return request<UserService[]>('/api/v1/user-services/', {
    method: 'GET',
    params: { user_id: userId },
  });
};