import { request } from 'umi';

export interface FeedbackData {
  id?: number;
  user_id?: number;
  creation_task_id: string;
  rating: number;
  feedback_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFeedbackRequest {
  creation_task_id: string;
  rating: number;
  feedback_text?: string;
}

export interface UpdateFeedbackRequest {
  rating?: number;
  feedback_text?: string;
}

export interface FeedbackStats {
  total_feedbacks: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Create feedback for a creation task
 */
export async function createFeedback(data: CreateFeedbackRequest): Promise<FeedbackData> {
  return request('/api/v1/feedback/', {
    method: 'POST',
    data,
  });
}

/**
 * Get all feedbacks for the current user
 */
export async function getUserFeedbacks(params?: {
  skip?: number;
  limit?: number;
}): Promise<FeedbackData[]> {
  return request('/api/v1/feedback/', {
    method: 'GET',
    params,
  });
}

/**
 * Get a specific feedback by ID
 */
export async function getFeedback(feedbackId: number): Promise<FeedbackData> {
  return request(`/api/v1/feedback/${feedbackId}`, {
    method: 'GET',
  });
}

/**
 * Update an existing feedback
 */
export async function updateFeedback(
  feedbackId: number,
  data: UpdateFeedbackRequest,
): Promise<FeedbackData> {
  return request(`/api/v1/feedback/${feedbackId}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Delete a feedback
 */
export async function deleteFeedback(feedbackId: number): Promise<{ message: string }> {
  return request(`/api/v1/feedback/${feedbackId}`, {
    method: 'DELETE',
  });
}

/**
 * Get all feedbacks for a specific creation task
 */
export async function getCreationTaskFeedbacks(creationTaskId: string): Promise<FeedbackData[]> {
  return request(`/api/v1/feedback/creation-task/${creationTaskId}`, {
    method: 'GET',
  });
}

/**
 * Get feedback statistics for a creation task
 */
export async function getCreationTaskFeedbackStats(creationTaskId: string): Promise<FeedbackStats> {
  return request(`/api/v1/feedback/creation-task/${creationTaskId}/stats`, {
    method: 'GET',
  });
}
