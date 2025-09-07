import { request } from '@umijs/max';

// Billing API types
export interface GenerationUsageItem {
  generation_id: string;
  user_name: string;
  user_email: string;
  generation_type: 'video' | 'image' | 'audio' | 'text' | '3d_model';
  model_used: string;
  provider: string;
  cost: number;
  created_at: string;
  processing_time_seconds?: number;
}

export interface OrganizationBill {
  organization_id: number;
  organization_name: string;
  billing_period_start: string;
  billing_period_end: string;
  total_generations: number;
  total_cost: number;
  usage_by_type: Record<string, number>;
  usage_by_model: Record<string, number>;
  generations: GenerationUsageItem[];
}

// Get organization billing report
export const getOrganizationBill = (
  organizationId: number,
  startDate: string, // YYYY-MM-DD format
  endDate: string    // YYYY-MM-DD format
) => {
  return request<OrganizationBill>(`/api/v1/organizations/${organizationId}/bill`, {
    method: 'GET',
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });
};

// Re-export organization service for dropdown
export { getOrganisations, Organization } from '../organisation/service';
