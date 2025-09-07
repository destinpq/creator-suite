import { request } from 'umi';

export interface AdminFeedbackFilters {
  rating?: number;
  task_type?: string;
  service_id?: number;
  user_id?: number;
  organization_id?: number;
  date_from?: string;
  date_to?: string;
  has_text_feedback?: boolean;
}

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  name?: string;
  organization_id?: number;
}

export interface ServiceInfo {
  id: number;
  name: string;
  description: string;
  cost_per_generation: number;
}

export interface CreationTaskInfo {
  id: string;
  task_type: string;
  provider: string;
  status: string;
  input_data: any;
  output_assets?: any;
  local_video_url?: string;
  local_image_url?: string;
  local_thumbnail_url?: string;
  error_message?: string;
  processing_time_seconds?: number;
  created_at: string;
  updated_at?: string;
  service?: ServiceInfo;
}

export interface AdminFeedbackDetail {
  id: number;
  rating: number;
  feedback_text?: string;
  created_at: string;
  updated_at?: string;
  user: UserInfo;
  creation_task: CreationTaskInfo;
}

export interface AdminFeedbackStats {
  total_feedbacks: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  feedbacks_by_task_type: Record<string, number>;
  feedbacks_by_service: Record<string, number>;
  recent_feedbacks_count: number;
}

export interface AdminFeedbackResponse {
  feedbacks: AdminFeedbackDetail[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  stats?: AdminFeedbackStats;
}

export interface AdminFeedbackListParams extends AdminFeedbackFilters {
  page?: number;
  page_size?: number;
  include_stats?: boolean;
}

/**
 * Get all feedbacks for admin view
 */
export async function getAdminFeedbacks(params?: AdminFeedbackListParams): Promise<AdminFeedbackResponse> {
  return request('/api/v1/admin/feedback/', {
    method: 'GET',
    params,
  });
}

/**
 * Get feedback statistics for admin dashboard
 */
export async function getAdminFeedbackStats(filters?: AdminFeedbackFilters): Promise<AdminFeedbackStats> {
  return request('/api/v1/admin/feedback/stats', {
    method: 'GET',
    params: filters,
  });
}

/**
 * Get detailed information about a specific feedback
 */
export async function getAdminFeedbackDetail(feedbackId: number): Promise<AdminFeedbackDetail> {
  return request(`/api/v1/admin/feedback/${feedbackId}`, {
    method: 'GET',
  });
}

/**
 * Delete a feedback (admin only)
 */
export async function deleteAdminFeedback(feedbackId: number): Promise<{ message: string }> {
  return request(`/api/v1/admin/feedback/${feedbackId}`, {
    method: 'DELETE',
  });
}

/**
 * Get feedback summary for a specific user
 */
export async function getUserFeedbackSummary(userId: number): Promise<{
  total_feedbacks: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
}> {
  return request(`/api/v1/admin/feedback/user/${userId}/summary`, {
    method: 'GET',
  });
}
