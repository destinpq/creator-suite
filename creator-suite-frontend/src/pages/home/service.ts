import { request } from 'umi';

// Add API methods for home page as needed
export async function queryModels() {
  // Placeholder for future API calls if needed
  return request('/api/v1/models', {
    method: 'GET',
  });
}

export interface BillingBreakdown {
  service_name: string;
  generations_count: number;
  cost_per_generation: number;
  total_cost: number;
}

export interface BillingData {
  user_id: number;
  total_cost: number;
  total_generations: number;
  billing_breakdown: BillingBreakdown[];
}

export async function queryBilling(): Promise<BillingData> {
  return request('/api/v1/users/billing', {
    method: 'GET',
  });
}