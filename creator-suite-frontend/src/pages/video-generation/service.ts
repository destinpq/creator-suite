import { request } from 'umi';

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
}

export async function vetPrompt(params: VetPromptParams) {
  return request('/api/v1/creations/vet', {
    method: 'POST',
    data: params,
  });
}

export async function createVideoTask(params: CreateVideoTaskParams) {
  // Build input_data based on service_id
  let input_data;
  
  if (params.service_id === 3) {
    // Veo-3 specific parameters
    input_data = {
      prompt: params.prompt,
      image: params.image || null,
      resolution: params.resolution || '720p',
      negative_prompt: params.negative_prompt || null,
    };
  } else {
    // Original models parameters
    input_data = {
      prompt: params.prompt,
      prompt_optimizer: params.prompt_optimizer || false,
    };
  }

  return request('/api/v1/creations/', {
    method: 'POST',
    data: {
      task_type: 'video',
      provider: 'replicate',
      service_id: params.service_id,
      input_data,
    },
  });
}