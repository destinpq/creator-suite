// Re-export services for page-specific usage
export {
  getAdminFeedbacks,
  getAdminFeedbackStats,
  getAdminFeedbackDetail,
  deleteAdminFeedback,
  getUserFeedbackSummary,
} from '@/services/adminFeedback';

export type {
  AdminFeedbackResponse,
  AdminFeedbackDetail,
  AdminFeedbackStats,
  AdminFeedbackListParams,
  AdminFeedbackFilters,
  UserInfo,
  ServiceInfo,
  CreationTaskInfo,
} from '@/services/adminFeedback';
