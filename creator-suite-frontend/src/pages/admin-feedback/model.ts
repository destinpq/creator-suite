import type { Effect, Reducer } from 'umi';
import {
  getAdminFeedbacks,
  getAdminFeedbackStats,
  getAdminFeedbackDetail,
  deleteAdminFeedback,
  getUserFeedbackSummary,
} from '@/services/adminFeedback';
import type {
  AdminFeedbackResponse,
  AdminFeedbackDetail,
  AdminFeedbackStats,
  AdminFeedbackListParams,
  AdminFeedbackFilters,
} from '@/services/adminFeedback';

export interface AdminFeedbackModelState {
  feedbacks: AdminFeedbackDetail[];
  currentFeedback: AdminFeedbackDetail | null;
  stats: AdminFeedbackStats | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  filters: AdminFeedbackFilters;
}

export interface AdminFeedbackModelType {
  namespace: 'adminFeedback';
  state: AdminFeedbackModelState;
  effects: {
    fetchFeedbacks: Effect;
    fetchStats: Effect;
    fetchFeedbackDetail: Effect;
    deleteFeedback: Effect;
    fetchUserSummary: Effect;
  };
  reducers: {
    saveFeedbacks: Reducer<AdminFeedbackModelState>;
    saveCurrentFeedback: Reducer<AdminFeedbackModelState>;
    saveStats: Reducer<AdminFeedbackModelState>;
    updateFilters: Reducer<AdminFeedbackModelState>;
    updatePagination: Reducer<AdminFeedbackModelState>;
    removeFeedback: Reducer<AdminFeedbackModelState>;
    clearCurrentFeedback: Reducer<AdminFeedbackModelState>;
  };
}

const AdminFeedbackModel: AdminFeedbackModelType = {
  namespace: 'adminFeedback',

  state: {
    feedbacks: [],
    currentFeedback: null,
    stats: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 50,
    totalPages: 1,
    filters: {},
  },

  effects: {
    *fetchFeedbacks({ payload = {} }: { payload?: AdminFeedbackListParams }, { call, put, select }) {
      try {
        const { filters, currentPage, pageSize } = yield select((state: any) => state.adminFeedback);
        
        const params: AdminFeedbackListParams = {
          ...filters,
          page: payload.page || currentPage,
          page_size: payload.page_size || pageSize,
          include_stats: payload.include_stats || false,
          ...payload,
        };

        const response: AdminFeedbackResponse = yield call(getAdminFeedbacks, params);
        
        yield put({
          type: 'saveFeedbacks',
          payload: response,
        });

        if (response.stats) {
          yield put({
            type: 'saveStats',
            payload: response.stats,
          });
        }

        return response;
      } catch (error) {
        console.error('Failed to fetch admin feedbacks:', error);
        throw error;
      }
    },

    *fetchStats({ payload = {} }: { payload?: AdminFeedbackFilters }, { call, put, select }) {
      try {
        const { filters } = yield select((state: any) => state.adminFeedback);
        const statsFilters = { ...filters, ...payload };

        const response: AdminFeedbackStats = yield call(getAdminFeedbackStats, statsFilters);
        
        yield put({
          type: 'saveStats',
          payload: response,
        });

        return response;
      } catch (error) {
        console.error('Failed to fetch admin feedback stats:', error);
        throw error;
      }
    },

    *fetchFeedbackDetail({ payload: feedbackId }, { call, put }) {
      try {
        const response: AdminFeedbackDetail = yield call(getAdminFeedbackDetail, feedbackId);
        
        yield put({
          type: 'saveCurrentFeedback',
          payload: response,
        });

        return response;
      } catch (error) {
        console.error('Failed to fetch feedback detail:', error);
        throw error;
      }
    },

    *deleteFeedback({ payload: feedbackId }, { call, put }) {
      try {
        yield call(deleteAdminFeedback, feedbackId);
        
        yield put({
          type: 'removeFeedback',
          payload: feedbackId,
        });

        // Refresh the list
        yield put({ type: 'fetchFeedbacks' });

        return true;
      } catch (error) {
        console.error('Failed to delete feedback:', error);
        throw error;
      }
    },

    *fetchUserSummary({ payload: userId }, { call }) {
      try {
        const response = yield call(getUserFeedbackSummary, userId);
        return response;
      } catch (error) {
        console.error('Failed to fetch user feedback summary:', error);
        throw error;
      }
    },
  },

  reducers: {
    saveFeedbacks(state, { payload }) {
      return {
        ...state,
        feedbacks: payload.feedbacks,
        totalCount: payload.total_count,
        currentPage: payload.page,
        pageSize: payload.page_size,
        totalPages: payload.total_pages,
      };
    },

    saveCurrentFeedback(state, { payload }) {
      return {
        ...state,
        currentFeedback: payload,
      };
    },

    saveStats(state, { payload }) {
      return {
        ...state,
        stats: payload,
      };
    },

    updateFilters(state, { payload }) {
      return {
        ...state,
        filters: { ...state.filters, ...payload },
        currentPage: 1, // Reset to first page when filters change
      };
    },

    updatePagination(state, { payload }) {
      return {
        ...state,
        currentPage: payload.page || state.currentPage,
        pageSize: payload.pageSize || state.pageSize,
      };
    },

    removeFeedback(state, { payload: feedbackId }) {
      return {
        ...state,
        feedbacks: state.feedbacks.filter(f => f.id !== feedbackId),
        totalCount: Math.max(0, state.totalCount - 1),
      };
    },

    clearCurrentFeedback(state) {
      return {
        ...state,
        currentFeedback: null,
      };
    },
  },
};

export default AdminFeedbackModel;
