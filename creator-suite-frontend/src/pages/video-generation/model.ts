import type { Effect, Reducer } from 'umi';
import { message } from 'antd';
import { createVideoTask, vetPrompt } from './service';

export interface VideoGenerationModelState {
  currentTask: any;
}

export interface VideoGenerationModelType {
  namespace: 'videoGeneration';
  state: VideoGenerationModelState;
  effects: {
    createVideoTask: Effect;
    vetPrompt: Effect;
  };
  reducers: {
    saveCurrentTask: Reducer<VideoGenerationModelState>;
  };
}

const VideoGenerationModel: VideoGenerationModelType = {
  namespace: 'videoGeneration',

  state: {
    currentTask: null,
  },

  effects: {
    *vetPrompt({ payload, callback, errorCallback }, { call, put }) {
      try {
        const response = yield call(vetPrompt, payload);
        if (callback) {
          callback(response);
        }
        return response;
      } catch (error: any) {
        console.error('Error vetting prompt:', error);
        message.error(error.message || 'Failed to vet prompt');
        if (errorCallback) {
          errorCallback(error);
        }
      }
    },
    
    *createVideoTask({ payload, callback }, { call, put }) {
      try {
        const response = yield call(createVideoTask, payload);
        console.log('Created video task response:', response);
        yield put({
          type: 'saveCurrentTask',
          payload: response,
        });
        message.success('Video generation started!');
        if (callback && response.id) {
          console.log('Calling callback with task ID:', response.id);
          callback(response.id);
        }
      } catch (error: any) {
        console.error('Error creating video task:', error);
        message.error(error.message || 'Failed to create video task');
      }
    },
  },

  reducers: {
    saveCurrentTask(state, { payload }) {
      return {
        ...state,
        currentTask: payload,
      };
    },
  },
};

export default VideoGenerationModel;