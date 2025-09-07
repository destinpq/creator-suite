import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, message, Button, Space, Tabs, Spin } from 'antd';
import { ReloadOutlined, BarChartOutlined, TableOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'umi';
import { FeedbackFilters, FeedbackStats, FeedbackTable } from './components';
import type { AdminFeedbackFilters, AdminFeedbackDetail } from './service';
import type { RootState } from '@/models';

const { TabPane } = Tabs;

const AdminFeedbackPage: React.FC = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('table');
  const [refreshing, setRefreshing] = useState(false);

  const {
    feedbacks,
    stats,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    filters,
  } = useSelector((state: RootState) => state.adminFeedback);

  const loading = useSelector((state: RootState) => 
    state.loading.effects['adminFeedback/fetchFeedbacks'] ||
    state.loading.effects['adminFeedback/fetchStats']
  );

  const deleteLoading = useSelector((state: RootState) => 
    state.loading.effects['adminFeedback/deleteFeedback']
  );

  // Fetch initial data
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch({ 
          type: 'adminFeedback/fetchFeedbacks', 
          payload: { include_stats: activeTab === 'stats' } 
        }),
        activeTab === 'stats' && dispatch({ type: 'adminFeedback/fetchStats' })
      ]);
    } catch (error) {
      message.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFiltersChange = (newFilters: AdminFeedbackFilters) => {
    dispatch({
      type: 'adminFeedback/updateFilters',
      payload: newFilters,
    });
  };

  const handleSearch = async () => {
    try {
      await dispatch({ 
        type: 'adminFeedback/fetchFeedbacks',
        payload: { 
          page: 1,
          include_stats: activeTab === 'stats'
        }
      });
      
      if (activeTab === 'stats') {
        await dispatch({ type: 'adminFeedback/fetchStats' });
      }
    } catch (error) {
      message.error('Search failed');
    }
  };

  const handleClearFilters = async () => {
    dispatch({
      type: 'adminFeedback/updateFilters',
      payload: {},
    });
    
    try {
      await dispatch({ 
        type: 'adminFeedback/fetchFeedbacks',
        payload: { 
          page: 1,
          include_stats: activeTab === 'stats'
        }
      });
      
      if (activeTab === 'stats') {
        await dispatch({ type: 'adminFeedback/fetchStats' });
      }
    } catch (error) {
      message.error('Failed to clear filters');
    }
  };

  const handlePaginationChange = async (page: number, newPageSize: number) => {
    dispatch({
      type: 'adminFeedback/updatePagination',
      payload: { page, pageSize: newPageSize },
    });

    try {
      await dispatch({
        type: 'adminFeedback/fetchFeedbacks',
        payload: { page, page_size: newPageSize },
      });
    } catch (error) {
      message.error('Failed to load page');
    }
  };

  const handleDelete = async (feedbackId: number) => {
    try {
      await dispatch({
        type: 'adminFeedback/deleteFeedback',
        payload: feedbackId,
      });
      message.success('Feedback deleted successfully');
    } catch (error) {
      message.error('Failed to delete feedback');
    }
  };

  const handleViewDetail = (feedback: AdminFeedbackDetail) => {
    dispatch({
      type: 'adminFeedback/saveCurrentFeedback',
      payload: feedback,
    });
  };

  const handleTabChange = async (key: string) => {
    setActiveTab(key);
    
    if (key === 'stats' && !stats) {
      try {
        await dispatch({ type: 'adminFeedback/fetchStats' });
      } catch (error) {
        message.error('Failed to load statistics');
      }
    }
  };

  const pagination = {
    current: currentPage,
    pageSize: pageSize,
    total: totalCount,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} of ${total} feedbacks`,
  };

  return (
    <PageContainer
      title="Feedback Management"
      subTitle="View and manage all user feedbacks"
      extra={[
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Filters */}
        <FeedbackFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          loading={loading}
        />

        {/* Main Content */}
        <Card>
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane
              tab={
                <span>
                  <TableOutlined />
                  Feedback List ({totalCount})
                </span>
              }
              key="table"
            >
              <FeedbackTable
                feedbacks={feedbacks}
                loading={loading || deleteLoading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                onDelete={handleDelete}
                onViewDetail={handleViewDetail}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <BarChartOutlined />
                  Statistics
                </span>
              }
              key="stats"
            >
              <FeedbackStats
                stats={stats}
                loading={loading}
              />
            </TabPane>
          </Tabs>
        </Card>
      </Space>
    </PageContainer>
  );
};

export default AdminFeedbackPage;
