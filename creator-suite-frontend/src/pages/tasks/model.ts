import type { Effect, Reducer } from 'umi';
import { fetchTasks, fetchTaskStatus } from './service';

export interface Task {
  id: string;
  task_type: 'video' | 'image';
  provider: string;
  service_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  user_id: number;
  input_data: {
    prompt: string;
    prompt_optimizer?: boolean;
    aspect_ratio?: string;
    output_format?: string;
    safety_filter_level?: string;
  };
  output_assets?: any;
  local_video_url?: string;
  local_image_url?: string;
  local_thumbnail_url?: string;
  error_message?: string;
  processing_time_seconds?: number;
  created_at: string;
  updated_at: string;
  service?: {
    id: number;
    name: string;
    description: string;
    cost_per_generation: number;
  };
}

export interface TasksModelState {
  tasks: Task[];
  activePollingTasks: string[]; // Task IDs that are being polled
  pollingAttempts: Record<string, number>; // Track polling attempts per task
}

export interface TasksModelType {
  namespace: 'tasks';
  state: TasksModelState;
  effects: {
    fetchTasks: Effect;
    pollTaskStatus: Effect;
  };
  reducers: {
    saveTasks: Reducer<TasksModelState>;
    updateTask: Reducer<TasksModelState>;
    addPollingTask: Reducer<TasksModelState>;
    removePollingTask: Reducer<TasksModelState>;
    incrementPollingAttempt: Reducer<TasksModelState>;
    addActivePollingTask: Reducer<TasksModelState>;
  };
}

const MAX_POLLING_ATTEMPTS = 360; // 6 minutes max

const TasksModel: TasksModelType = {
  namespace: 'tasks',

  state: {
    tasks: [],
    activePollingTasks: [],
    pollingAttempts: {},
  },

  effects: {
    *fetchTasks(_, { call, put }) {
      try {
        const response: Task[] = yield call(fetchTasks);
        console.log('Fetched tasks response:', response);
        yield put({
          type: 'saveTasks',
          payload: response,
        });

        // Start polling for active tasks
        const activeTasks = response.filter((task: Task) => 
          ['pending', 'processing'].includes(task.status)
        );
        console.log('Active tasks found:', activeTasks);

        for (const task of activeTasks) {
          yield put({
            type: 'addPollingTask',
            payload: task.id,
          });
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    },

    *pollTaskStatus({ payload: taskId }, { call, put, select }) {
      try {
        const { pollingAttempts } = yield select((state: any) => state.tasks);
        const attempts = pollingAttempts[taskId] || 0;

        if (attempts >= MAX_POLLING_ATTEMPTS) {
          // Stop polling after max attempts
          yield put({
            type: 'removePollingTask',
            payload: taskId,
          });
          return;
        }

        const response: Task = yield call(fetchTaskStatus, taskId);
        console.log(`Polled task ${taskId}:`, response);
        
        yield put({
          type: 'updateTask',
          payload: response,
        });

        yield put({
          type: 'incrementPollingAttempt',
          payload: taskId,
        });

        // Stop polling if task is completed or failed
        if (['completed', 'failed'].includes(response.status)) {
          yield put({
            type: 'removePollingTask',
            payload: taskId,
          });
        }
      } catch (error) {
        console.error(`Failed to poll task ${taskId}:`, error);
        // Continue polling even on error
      }
    },
  },

  reducers: {
    saveTasks(state, { payload }) {
      return {
        ...state,
        tasks: payload,
      };
    },

    updateTask(state, { payload }) {
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === payload.id ? payload : task
        ),
      };
    },

    addPollingTask(state, { payload }) {
      if (!state.activePollingTasks.includes(payload)) {
        return {
          ...state,
          activePollingTasks: [...state.activePollingTasks, payload],
        };
      }
      return state;
    },

    removePollingTask(state, { payload }) {
      return {
        ...state,
        activePollingTasks: state.activePollingTasks.filter(id => id !== payload),
        pollingAttempts: {
          ...state.pollingAttempts,
          [payload]: 0, // Reset attempts
        },
      };
    },

    incrementPollingAttempt(state, { payload }) {
      return {
        ...state,
        pollingAttempts: {
          ...state.pollingAttempts,
          [payload]: (state.pollingAttempts[payload] || 0) + 1,
        },
      };
    },

    addActivePollingTask(state, { payload }) {
      if (!state.activePollingTasks.includes(payload)) {
        return {
          ...state,
          activePollingTasks: [...state.activePollingTasks, payload],
        };
      }
      return state;
    },
  },
};

export default TasksModel;