import type { Effect, Reducer } from 'umi';
import {
  createFeedback,
  getUserFeedbacks,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  getCreationTaskFeedbacks,
  getCreationTaskFeedbackStats,
} from '@/services/feedback';
import type { FeedbackData, CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackStats } from '@/services/feedback';

export interface FeedbackModelState {
  feedbacks: FeedbackData[];
  currentFeedback: FeedbackData | null;
  taskFeedbacks: Record<string, FeedbackData[]>; // taskId -> feedbacks
  taskStats: Record<string, FeedbackStats>; // taskId -> stats
  userTaskFeedbacks: Record<string, FeedbackData | null>; // taskId -> user's feedback for that task
}

export interface FeedbackModelType {
  namespace: 'feedback';
  state: FeedbackModelState;
  effects: {
    createFeedback: Effect;
    fetchUserFeedbacks: Effect;
    fetchFeedback: Effect;
    updateFeedback: Effect;
    deleteFeedback: Effect;
    fetchTaskFeedbacks: Effect;
    fetchTaskStats: Effect;
    checkUserFeedbackForTask: Effect;
  };
  reducers: {
    saveFeedbacks: Reducer<FeedbackModelState>;
    saveCurrentFeedback: Reducer<FeedbackModelState>;
    saveTaskFeedbacks: Reducer<FeedbackModelState>;
    saveTaskStats: Reducer<FeedbackModelState>;
    saveUserTaskFeedback: Reducer<FeedbackModelState>;
    removeFeedback: Reducer<FeedbackModelState>;
    clearCurrentFeedback: Reducer<FeedbackModelState>;
  };
}

const FeedbackModel: FeedbackModelType = {
  namespace: 'feedback',

  state: {
    feedbacks: [],
    currentFeedback: null,
    taskFeedbacks: {},
    taskStats: {},
    userTaskFeedbacks: {},
  },

  effects: {
    *createFeedback({ payload }: { payload: CreateFeedbackRequest }, { call, put }) {
      try {
        const response: FeedbackData = yield call(createFeedback, payload);
        
        // Update user's feedback for this task
        yield put({
          type: 'saveUserTaskFeedback',
          payload: { taskId: payload.creation_task_id, feedback: response },
        });

        // Refresh user's feedbacks list
        yield put({ type: 'fetchUserFeedbacks' });

        return response;
      } catch (error) {
        console.error('Failed to create feedback:', error);
        throw error;
      }
    },

    *fetchUserFeedbacks({ payload = {} }, { call, put }) {
      try {
        const response: FeedbackData[] = yield call(getUserFeedbacks, payload);
        yield put({
          type: 'saveFeedbacks',
          payload: response,
        });

        // Also update userTaskFeedbacks mapping
        const taskFeedbackMap: Record<string, FeedbackData> = {};
        response.forEach((feedback) => {
          taskFeedbackMap[feedback.creation_task_id] = feedback;
        });

        for (const [taskId, feedback] of Object.entries(taskFeedbackMap)) {
          yield put({
            type: 'saveUserTaskFeedback',
            payload: { taskId, feedback },
          });
        }

        return response;
      } catch (error) {
        console.error('Failed to fetch user feedbacks:', error);
        throw error;
      }
    },

    *fetchFeedback({ payload: feedbackId }, { call, put }) {
      try {
        const response: FeedbackData = yield call(getFeedback, feedbackId);
        yield put({
          type: 'saveCurrentFeedback',
          payload: response,
        });
        return response;
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
        throw error;
      }
    },

    *updateFeedback({ payload }: { payload: { id: number; data: UpdateFeedbackRequest } }, { call, put, select }) {
      try {
        const response: FeedbackData = yield call(updateFeedback, payload.id, payload.data);
        
        // Update user's feedback for this task
        yield put({
          type: 'saveUserTaskFeedback',
          payload: { taskId: response.creation_task_id, feedback: response },
        });

        // Refresh user's feedbacks list
        yield put({ type: 'fetchUserFeedbacks' });

        return response;
      } catch (error) {
        console.error('Failed to update feedback:', error);
        throw error;
      }
    },

    *deleteFeedback({ payload: feedbackId }, { call, put, select }) {
      try {
        const { currentFeedback } = yield select((state: any) => state.feedback);
        const taskId = currentFeedback?.creation_task_id;

        yield call(deleteFeedback, feedbackId);
        
        yield put({
          type: 'removeFeedback',
          payload: feedbackId,
        });

        // Clear user's feedback for this task
        if (taskId) {
          yield put({
            type: 'saveUserTaskFeedback',
            payload: { taskId, feedback: null },
          });
        }

        return true;
      } catch (error) {
        console.error('Failed to delete feedback:', error);
        throw error;
      }
    },

    *fetchTaskFeedbacks({ payload: taskId }, { call, put }) {
      try {
        const response: FeedbackData[] = yield call(getCreationTaskFeedbacks, taskId);
        yield put({
          type: 'saveTaskFeedbacks',
          payload: { taskId, feedbacks: response },
        });
        return response;
      } catch (error) {
        console.error('Failed to fetch task feedbacks:', error);
        throw error;
      }
    },

    *fetchTaskStats({ payload: taskId }, { call, put }) {
      try {
        const response: FeedbackStats = yield call(getCreationTaskFeedbackStats, taskId);
        yield put({
          type: 'saveTaskStats',
          payload: { taskId, stats: response },
        });
        return response;
      } catch (error) {
        console.error('Failed to fetch task stats:', error);
        throw error;
      }
    },

    *checkUserFeedbackForTask({ payload: taskId }, { call, put, select }) {
      try {
        const { userTaskFeedbacks } = yield select((state: any) => state.feedback);
        
        // If we already have the feedback cached, return it
        if (userTaskFeedbacks[taskId] !== undefined) {
          return userTaskFeedbacks[taskId];
        }

        // Otherwise, fetch all user feedbacks to populate the cache
        yield put({ type: 'fetchUserFeedbacks' });
        
        const updatedState = yield select((state: any) => state.feedback);
        return updatedState.userTaskFeedbacks[taskId] || null;
      } catch (error) {
        console.error('Failed to check user feedback for task:', error);
        return null;
      }
    },
  },

  reducers: {
    saveFeedbacks(state, { payload }) {
      return {
        ...state,
        feedbacks: payload,
      };
    },

    saveCurrentFeedback(state, { payload }) {
      return {
        ...state,
        currentFeedback: payload,
      };
    },

    saveTaskFeedbacks(state, { payload }) {
      return {
        ...state,
        taskFeedbacks: {
          ...state.taskFeedbacks,
          [payload.taskId]: payload.feedbacks,
        },
      };
    },

    saveTaskStats(state, { payload }) {
      return {
        ...state,
        taskStats: {
          ...state.taskStats,
          [payload.taskId]: payload.stats,
        },
      };
    },

    saveUserTaskFeedback(state, { payload }) {
      return {
        ...state,
        userTaskFeedbacks: {
          ...state.userTaskFeedbacks,
          [payload.taskId]: payload.feedback,
        },
      };
    },

    removeFeedback(state, { payload: feedbackId }) {
      return {
        ...state,
        feedbacks: state.feedbacks.filter(f => f.id !== feedbackId),
        currentFeedback: state.currentFeedback?.id === feedbackId ? null : state.currentFeedback,
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

export default FeedbackModel;
