import { request } from 'umi';

export interface LoginParams {
  email: string;
  password: string;
}

export async function login(params: LoginParams) {
  // The API expects form-encoded data
  const formData = new URLSearchParams();
  formData.append('username', params.email?.trim().toLowerCase());
  formData.append('password', params.password);
  formData.append('email', params.email?.trim().toLowerCase());

  return request('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: formData.toString(),
  });
}

export async function getCurrentUser() {
  return request('/api/v1/users/current-user', {
    method: 'GET',
  });
}

export async function logout() {
  return request('/api/v1/auth/logout', {
    method: 'POST',
  });
}