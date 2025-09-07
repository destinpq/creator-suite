import type { Effect, Reducer } from 'umi';
import { queryBilling } from './service';
import type { BillingData } from './service';

export interface HomeModelState {
  billingData?: BillingData;
}

export interface HomeModelType {
  namespace: 'home';
  state: HomeModelState;
  effects: {
    fetchBilling: Effect;
  };
  reducers: {
    saveBilling: Reducer<HomeModelState>;
  };
}

const HomeModel: HomeModelType = {
  namespace: 'home',
  state: {
    billingData: undefined,
  },
  effects: {
    *fetchBilling(_, { call, put }): Generator<any, void, any> {
      try {
        const response: BillingData = yield call(queryBilling);
        yield put({
          type: 'saveBilling',
          payload: response,
        });
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
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
  },
};

export default HomeModel;