import { message } from 'antd';
import { 
  getOrganizationBill,
  getOrganisations,
  OrganizationBill,
  Organization
} from './service';

export interface BillingState {
  organizations: Organization[];
  selectedOrganizationId: number | null;
  billingData: OrganizationBill | null;
  loadingOrganizations: boolean;
  loadingBilling: boolean;
  dateRange: [string, string] | null; // [startDate, endDate] in YYYY-MM-DD format
}

const model = {
  namespace: 'organizationBilling',
  state: {
    organizations: [],
    selectedOrganizationId: null,
    billingData: null,
    loadingOrganizations: false,
    loadingBilling: false,
    dateRange: null,
  } as BillingState,
  
  effects: {
    *fetchOrganizations(_: any, { call, put }: any): any {
      try {
        yield put({ type: 'setLoadingOrganizations', payload: true });
        const response: Organization[] = yield call(getOrganisations, 0, 1000); // Get all organizations
        yield put({
          type: 'setOrganizations',
          payload: response,
        });
      } catch (error) {
        message.error('Failed to fetch organizations');
      } finally {
        yield put({ type: 'setLoadingOrganizations', payload: false });
      }
    },

    *fetchBillingData({ payload }: any, { call, put }: any): any {
      try {
        const { organizationId, startDate, endDate } = payload;
        yield put({ type: 'setLoadingBilling', payload: true });
        
        const response: OrganizationBill = yield call(
          getOrganizationBill,
          organizationId,
          startDate,
          endDate
        );
        
        yield put({
          type: 'setBillingData',
          payload: response,
        });
        
        yield put({
          type: 'setDateRange',
          payload: [startDate, endDate],
        });
        
      } catch (error: any) {
        message.error(error?.message || 'Failed to fetch billing data');
        yield put({
          type: 'setBillingData',
          payload: null,
        });
      } finally {
        yield put({ type: 'setLoadingBilling', payload: false });
      }
    },

    *clearBillingData(_: any, { put }: any): any {
      yield put({
        type: 'setBillingData',
        payload: null,
      });
      yield put({
        type: 'setDateRange',
        payload: null,
      });
    },
  },

  reducers: {
    setOrganizations(state: BillingState, action: any) {
      return {
        ...state,
        organizations: action.payload,
      };
    },

    setSelectedOrganizationId(state: BillingState, action: any) {
      return {
        ...state,
        selectedOrganizationId: action.payload,
      };
    },

    setBillingData(state: BillingState, action: any) {
      return {
        ...state,
        billingData: action.payload,
      };
    },

    setLoadingOrganizations(state: BillingState, action: any) {
      return {
        ...state,
        loadingOrganizations: action.payload,
      };
    },

    setLoadingBilling(state: BillingState, action: any) {
      return {
        ...state,
        loadingBilling: action.payload,
      };
    },

    setDateRange(state: BillingState, action: any) {
      return {
        ...state,
        dateRange: action.payload,
      };
    },

    resetState(state: BillingState) {
      return {
        ...state,
        selectedOrganizationId: null,
        billingData: null,
        dateRange: null,
      };
    },
  },
};

export default model;
