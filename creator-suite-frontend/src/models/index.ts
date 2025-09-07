import type { HomeModelState } from '@/pages/home/model';
import type { VideoGenerationModelState } from '@/pages/video-generation/model';
import type { TasksModelState } from '@/pages/tasks/model';
import type { AuthModelState } from './auth';
import type { BillingModelState } from './billing';
import type { BillingState } from '@/pages/billing/model';
import type { FeedbackModelState } from './feedback';
import type { AdminFeedbackModelState } from '@/pages/admin-feedback/model';
import type { ConnectState } from 'umi';

export interface RootState extends ConnectState {
  home: HomeModelState;
  videoGeneration: VideoGenerationModelState;
  tasks: TasksModelState;
  auth: AuthModelState;
  billing: BillingModelState;
  organizationBilling: BillingState;
  feedback: FeedbackModelState;
  adminFeedback: AdminFeedbackModelState;
}