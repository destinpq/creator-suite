import type { Effect, Reducer } from 'umi';
import { queryBilling } from '@/pages/home/service';
import type { BillingData } from '@/pages/home/service';

export interface BillingModelState {
  billingData?: BillingData;
  loading: boolean;
}

export interface BillingModelType {
  namespace: 'billing';
  state: BillingModelState;
  effects: {
    fetchBilling: Effect;
  };
  reducers: {
    saveBilling: Reducer<BillingModelState>;
    setLoading: Reducer<BillingModelState>;
  };
}

const BillingModel: BillingModelType = {
  namespace: 'billing',

  state: {
    billingData: undefined,
    loading: false,
  },

  effects: {
    *fetchBilling(_, { call, put }) {
      try {
        yield put({ type: 'setLoading', payload: true });
        const response = yield call(queryBilling);
        yield put({
          type: 'saveBilling',
          payload: response,
        });
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        yield put({ type: 'setLoading', payload: false });
      }
    },
  },

  reducers: {
    saveBilling(state, { payload }) {
      return {
        ...state,
        billingData: payload,
      };
    },
    setLoading(state, { payload }) {
      return {
        ...state,
        loading: payload,
      };
    },
  },
};

export default BillingModel;