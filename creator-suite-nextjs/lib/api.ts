import axios from 'axios';
import { LoginResponse } from '../types';

export const createClient = (token?: string) => {
  const instance = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  if (typeof window !== 'undefined') {
    instance.interceptors.request.use((cfg) => {
      try {
        const t = localStorage.getItem('token');
        if (t) cfg.headers['Authorization'] = `Bearer ${t}`;
      } catch (e) {}
      return cfg;
    });
  }

  return instance;
};

const client = createClient();

export default client;

export interface VetPromptParams {
  prompt: string;
  n_alternatives?: number;
}

export interface VetPromptResponse {
  allowed: boolean;
  violations: string[];
  safe_alternatives: {
    prompt: string;
    notes: string;
  }[];
}

export interface CreateVideoTaskParams {
  service_id: number;
  prompt: string;
  prompt_optimizer?: boolean;
  image?: string | null;
  resolution?: '720p' | '1080p';
  negative_prompt?: string | null;
  duration?: number;
  aspect_ratio?: string;
  style?: string;
}

export interface LongVideoConfig {
  total_duration: number;
  segments: VideoSegment[];
  allow_scene_editing: boolean;
}

export interface VideoSegment {
  segment_id: string;
  start_time: number;
  end_time: number;
  prompt: string;
  seed_image_url?: string;
}

export interface CreateLongVideoTaskParams {
  service_id: number;
  prompt: string;
  long_video_config: LongVideoConfig;
  resolution?: '720p' | '1080p';
  negative_prompt?: string | null;
}

export async function vetPrompt(params: VetPromptParams) {
  return client.post('/v1/creations/vet', params);
}

export async function createVideoTask(params: CreateVideoTaskParams) {
  const provider = params.service_id === 12 ? 'runway' : params.service_id === 13 ? 'magic_hour' : 'replicate';
  const serviceName = params.service_id === 15 ? 'runway/gen-3-alpha-video' : params.service_id === 17 ? 'magic_hour/video' : 'replicate/video';

  return client.post('/v1/creations/', {
    task_type: 'video',
    provider: provider,
    service_id: params.service_id,
    input_data: {
      prompt: params.prompt,
      prompt_optimizer: params.prompt_optimizer,
      image: params.image,
      resolution: params.resolution,
      negative_prompt: params.negative_prompt,
      duration: params.duration,
      aspect_ratio: params.aspect_ratio,
      style: params.style,
      input_image_url: params.image,
    },
  });
}

export async function createLongVideoTask(params: CreateLongVideoTaskParams) {
  const input_data = {
    prompt: params.prompt,
    resolution: params.resolution || '720p',
    negative_prompt: params.negative_prompt || null,
  };

  return client.post('/v1/creations/', {
    task_type: 'video',
    provider: 'replicate',
    service_id: params.service_id,
    input_data,
    long_video_config: params.long_video_config,
  });
}

export async function pauseLongVideoTask(taskId: string, segmentIndex: number = 0) {
  return client.post(`/v1/creations/${taskId}/pause`, { segment_index: segmentIndex });
}

export async function resumeLongVideoTask(taskId: string, newPrompt?: string) {
  return client.post(`/v1/creations/${taskId}/resume`, newPrompt ? { new_prompt: newPrompt } : {});
}

export async function generateImage(params: {
  prompt: string;
  aspect_ratio: string;
  output_format: string;
  safety_filter_level?: string;
  provider: string;
  style: string;
  service_id: number;
}) {
  const serviceName = params.provider === 'runway' ? 'runway/gen-3-alpha-image' : 'magic_hour/image';
  return client.post('/v1/creations/', {
    task_type: 'image',
    provider: params.provider,
    service_id: params.service_id,
    input_data: {
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio,
      output_format: params.output_format,
      safety_filter_level: params.safety_filter_level || 'block_only_high',
      style: params.style,
    },
    raw: true,
  });
}

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  is_active?: boolean;
  credits: number;
  created_at: string;
  last_login?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource?: string;
  details?: any;
  ip_address?: string;
  success: boolean;
  created_at: string;
}

export interface CreditTransaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: string;
  description?: string;
  created_at: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_credits: number;
  total_revenue: number;
  api_calls_today: number;
  failed_logins_today: number;
}

export async function getAdminStats() {
  return client.get('/v1/admin/stats');
}

export async function getUsers(params?: { skip?: number; limit?: number }) {
  return client.get('/v1/users/', { params });
}

export async function getAuditLogs(params?: { limit?: number }) {
  return client.get('/v1/enhanced-auth/activity', { params });
}

export async function getCreditTransactions(params?: { limit?: number }) {
  return client.get('/v1/credits/admin/transactions', { params });
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  return client.put(`/v1/users/${userId}`, { is_active: isActive });
}

export async function resetUserPassword(userId: number) {
  return client.post(`/v1/users/${userId}/reset-password`);
}

export async function grantUserCredits(userId: number, amount: number, description: string) {
  return client.post('/v1/credits/bonus', { user_id: userId, amount, description });
}
