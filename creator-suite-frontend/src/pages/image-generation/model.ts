import type { Effect, Reducer } from 'umi';
import { generateImage } from './service';

export interface ImageGenerationModelState {
  currentService: number | null;
  lastGeneratedTask: any | null;
}

export interface ImageGenerationModelType {
  namespace: 'imageGeneration';
  state: ImageGenerationModelState;
  effects: {
    generateImage: Effect;
  };
  reducers: {
    setCurrentService: Reducer<ImageGenerationModelState>;
    setLastGeneratedTask: Reducer<ImageGenerationModelState>;
  };
}

const ImageGenerationModel: ImageGenerationModelType = {
  namespace: 'imageGeneration',

  state: {
    currentService: 4, // Default to Imagen 4 Ultra
    lastGeneratedTask: null,
  },

  effects: {
    *generateImage({ type, payload }, { call, put }) {
      try {
        const response: Promise<any> = yield call(generateImage, payload);
        
        yield put({
          type: 'setLastGeneratedTask',
          payload: response,
        });

        // Also update tasks model to add this to active polling
        yield put({
          type: 'tasks/addActivePollingTask',
          payload: (response as any).id,
        });

        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  reducers: {
    setCurrentService(state, { payload }) {
      return {
        ...state,
        currentService: payload,
      };
    },
    setLastGeneratedTask(state, { payload }) {
      return {
        ...state,
        lastGeneratedTask: payload,
      };
    },
  },
};

export default ImageGenerationModel;