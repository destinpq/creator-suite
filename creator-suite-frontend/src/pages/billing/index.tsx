import React, { useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useModel, useSelector, useDispatch } from '@umijs/max';
import { Alert, Spin, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { RootState } from '@/models';
import { BillingFilters, BillingSummary, GenerationsTable, PDFExport } from './components';

const BillingPage: React.FC = () => {
  const dispatch = useDispatch();
  const { initialState } = useModel('@@initialState');
  
  const {
    organizations,
    selectedOrganizationId,
    billingData,
    loadingOrganizations,
    loadingBilling,
    dateRange,
  } = useSelector((state: RootState) => state.organizationBilling);

  // Check if user is admin
  const isAdmin = initialState?.currentUser?.is_admin;

  useEffect(() => {
    if (isAdmin) {
      // Fetch organizations on component mount
      dispatch({
        type: 'organizationBilling/fetchOrganizations',
      });
    }
  }, [dispatch, isAdmin]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch({
        type: 'organizationBilling/resetState',
      });
    };
  }, [dispatch]);

  const handleOrganizationChange = (organizationId: number | null) => {
    dispatch({
      type: 'organizationBilling/setSelectedOrganizationId',
      payload: organizationId,
    });
    
    // Clear billing data when organization changes
    if (billingData) {
      dispatch({
        type: 'organizationBilling/clearBillingData',
      });
    }
  };

  const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
    // Clear billing data when date range changes
    if (billingData) {
      dispatch({
        type: 'organizationBilling/clearBillingData',
      });
    }
  };

  const handleSearch = () => {
    if (!selectedOrganizationId || !dateRange || !dateRange[0] || !dateRange[1]) {
      return;
    }

    const startDate = dateRange[0]
    const endDate = dateRange[1];

    dispatch({
      type: 'organizationBilling/fetchBillingData',
      payload: {
        organizationId: selectedOrganizationId,
        startDate,
        endDate,
      },
    });
  };

  const handleClear = () => {
    dispatch({
      type: 'organizationBilling/setSelectedOrganizationId',
      payload: null,
    });
    dispatch({
      type: 'organizationBilling/clearBillingData',
    });
  };

  // Convert dateRange from string format to Dayjs for the component
  const dayjsDateRange: [Dayjs, Dayjs] | null = dateRange
    ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
    : null;

  // Handle date range change and convert back to string format
  const onDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      dispatch({
        type: 'organizationBilling/setDateRange',
        payload: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')],
      });
    } else {
      dispatch({
        type: 'organizationBilling/setDateRange',
        payload: null,
      });
    }
    handleDateRangeChange(dates as [Dayjs, Dayjs] | null);
  };

  if (!isAdmin) {
    return (
      <PageContainer>
        <Alert
          message="Access Denied"
          description="You don't have permission to access the billing page. Admin access is required."
          type="error"
          showIcon
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Organization Billing"
      subTitle="Generate detailed billing reports for organizations"
    >
      <BillingFilters
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        dateRange={dayjsDateRange}
        loadingOrganizations={loadingOrganizations}
        loadingBilling={loadingBilling}
        onOrganizationChange={handleOrganizationChange}
        onDateRangeChange={onDateRangeChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {loadingBilling && (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Generating billing report...</div>
        </div>
      )}

      {billingData && !loadingBilling && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div></div>
            <PDFExport billingData={billingData} loading={loadingBilling} />
          </div>
          <BillingSummary billingData={billingData} />
          <GenerationsTable 
            generations={billingData.generations} 
            loading={loadingBilling}
          />
        </>
      )}

      {!billingData && !loadingBilling && selectedOrganizationId && dateRange && (
        <Empty
          description="No billing data found for the selected criteria"
          style={{ padding: '50px 0' }}
        />
      )}

      {!selectedOrganizationId && !loadingBilling && (
        <Empty
          description="Select an organization and date range to generate a billing report"
          style={{ padding: '50px 0' }}
        />
      )}
    </PageContainer>
  );
};

export default BillingPage;
