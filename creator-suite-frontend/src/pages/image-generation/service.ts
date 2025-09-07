import { request } from 'umi';

export async function generateImage(params: {
  prompt: string;
  aspect_ratio: string;
  output_format: string;
  safety_filter_level: string;
  service_id: number;
}) {
  return request('/api/v1/creations/', {
    method: 'POST',
    data: {
      task_type: 'image',
      provider: 'replicate',
      service_id: params.service_id,
      input_data: {
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio,
        output_format: params.output_format,
        safety_filter_level: params.safety_filter_level,
      },
    },
  });
}