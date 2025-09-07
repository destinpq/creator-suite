import { request } from '@umijs/max';

export interface VideoGenerationRequest {
  prompt: string;
  duration: number;
  resolution: string;
  model: string;
  seed_image?: string;
  seed_influence?: number;
}

export interface VideoGenerationResponse {
  success: boolean;
  output?: {
    video_url: string;
    duration: number;
    resolution: string;
    format: string;
    model: string;
  };
  error?: string;
  metadata?: any;
}

export interface VideoEditRequest {
  video_id: string;
  action: 'trim' | 'add_segment' | 'remove_segment' | 'replace_segment';
  segment_data?: {
    start_time?: number;
    end_time?: number;
    new_prompt?: string;
    position?: number;
  };
}

export const videoService = {
  /**
   * Generate a new video using Runway Gen-3 Alpha
   */
  async generateVideo(data: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return request('/api/v1/video/generate', {
      method: 'POST',
      data,
    });
  },

  /**
   * Get user's current credit balance
   */
  async getUserCredits(): Promise<number> {
    const response = await request('/api/v1/users/me');
    return response.credits || 0;
  },

  /**
   * Get list of user's videos
   */
  async getUserVideos(page: number = 1, limit: number = 20) {
    return request('/api/v1/videos/my-videos', {
      params: { page, limit },
    });
  },

  /**
   * Get video details by ID
   */
  async getVideoById(videoId: string) {
    return request(`/api/v1/videos/${videoId}`);
  },

  /**
   * Edit an existing video
   */
  async editVideo(data: VideoEditRequest) {
    return request('/api/v1/video/edit', {
      method: 'POST',
      data,
    });
  },

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string) {
    return request(`/api/v1/videos/${videoId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Download video
   */
  async downloadVideo(videoId: string) {
    return request(`/api/v1/videos/${videoId}/download`, {
      responseType: 'blob',
    });
  },

  /**
   * Get supported models and their info
   */
  async getSupportedModels() {
    return request('/api/v1/video/models');
  },

  /**
   * Get provider information
   */
  async getProviderInfo(provider: string) {
    return request(`/api/v1/video/providers/${provider}`);
  },

  /**
   * Get generation status
   */
  async getGenerationStatus(taskId: string) {
    return request(`/api/v1/video/status/${taskId}`);
  },

  /**
   * Cancel ongoing generation
   */
  async cancelGeneration(taskId: string) {
    return request(`/api/v1/video/cancel/${taskId}`, {
      method: 'POST',
    });
  },

  /**
   * Get video analytics
   */
  async getVideoAnalytics(videoId: string) {
    return request(`/api/v1/videos/${videoId}/analytics`);
  },

  /**
   * Share video
   */
  async shareVideo(videoId: string, platform: string) {
    return request(`/api/v1/videos/${videoId}/share`, {
      method: 'POST',
      data: { platform },
    });
  },

  /**
   * Get prompt suggestions
   */
  async getPromptSuggestions(category: string) {
    return request('/api/v1/video/prompt-suggestions', {
      params: { category },
    });
  },

  /**
   * Validate prompt
   */
  async validatePrompt(prompt: string) {
    return request('/api/v1/video/validate-prompt', {
      method: 'POST',
      data: { prompt },
    });
  },

  /**
   * Get cost estimate
   */
  async getCostEstimate(data: Partial<VideoGenerationRequest>) {
    return request('/api/v1/video/cost-estimate', {
      method: 'POST',
      data,
    });
  },

  /**
   * Save video to gallery
   */
  async saveToGallery(videoId: string, isPublic: boolean = false) {
    return request(`/api/v1/videos/${videoId}/gallery`, {
      method: 'POST',
      data: { is_public: isPublic },
    });
  },

  /**
   * Get public gallery videos
   */
  async getGalleryVideos(page: number = 1, limit: number = 20, category?: string) {
    return request('/api/v1/gallery/videos', {
      params: { page, limit, category },
    });
  },

  /**
   * Like/unlike a video
   */
  async toggleLike(videoId: string) {
    return request(`/api/v1/videos/${videoId}/like`, {
      method: 'POST',
    });
  },

  /**
   * Report a video
   */
  async reportVideo(videoId: string, reason: string) {
    return request(`/api/v1/videos/${videoId}/report`, {
      method: 'POST',
      data: { reason },
    });
  }
};
