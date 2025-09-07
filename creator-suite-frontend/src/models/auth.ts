import type { Effect, Reducer } from 'umi';
import { history } from 'umi';
import { message } from 'antd';
import { login, getCurrentUser, logout } from '@/services/auth';

export interface AuthModelState {
  currentUser: any;
  isAuthenticated: boolean;
}

export interface AuthModelType {
  namespace: 'auth';
  state: AuthModelState;
  effects: {
    login: Effect;
    fetchCurrentUser: Effect;
    logout: Effect;
  };
  reducers: {
    saveCurrentUser: Reducer<AuthModelState>;
    clearCurrentUser: Reducer<AuthModelState>;
  };
}

const AuthModel: AuthModelType = {
  namespace: 'auth',

  state: {
    currentUser: null,
    isAuthenticated: false,
  },

  effects: {
    *login({ payload, callback }, { call, put }) {
      try {
        const response = yield call(login, payload);
        
        // Fetch current user after successful login
        const userResponse = yield call(getCurrentUser);
        yield put({
          type: 'saveCurrentUser',
          payload: userResponse,
        });

        message.success('Login successful!');
        
        // Redirect to home page or callback
        if (callback) {
          callback();
        } else {
          history.push('/home');
        }
      } catch (error: any) {
        message.error(error.message || 'Login failed. Please check your credentials.');
      }
    },

    *fetchCurrentUser(_, { call, put }) {
      try {
        const response = yield call(getCurrentUser);
        yield put({
          type: 'saveCurrentUser',
          payload: response,
        });
      } catch (error) {
        // User is not authenticated
        yield put({
          type: 'clearCurrentUser',
        });
      }
    },

    *logout(_, { call, put }) {
      try {
        yield call(logout);
        yield put({
          type: 'clearCurrentUser',
        });
        message.success('Logout successful');
        history.push('/login');
      } catch (error) {
        message.error('Logout failed');
      }
    },
  },

  reducers: {
    saveCurrentUser(state, { payload }) {
      return {
        ...state,
        currentUser: payload,
        isAuthenticated: true,
      };
    },

    clearCurrentUser() {
      return {
        currentUser: null,
        isAuthenticated: false,
      };
    },
  },
};

export default AuthModel;