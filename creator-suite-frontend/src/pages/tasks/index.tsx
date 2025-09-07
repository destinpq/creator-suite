import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, List, Tag, Space, Typography, Empty, Button, message, Tabs } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector, useSearchParams, history } from 'umi';
import TaskItem from './components/TaskItem';

const { Title } = Typography;
const { TabPane } = Tabs;

const TasksPage: React.FC = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightTaskId = searchParams.get('highlight');
  const initialTab = searchParams.get('tab') || 'videos';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { tasks, activePollingTasks } = useSelector((state: any) => state.tasks);
  const loading = useSelector((state: any) => state.loading.effects['tasks/fetchTasks']);

  console.log('Tasks page state:', { tasks, activePollingTasks, loading });

  useEffect(() => {
    // Fetch all tasks when component mounts
    dispatch({ type: 'tasks/fetchTasks' });
  }, [dispatch]);

  useEffect(() => {
    // Update active tab based on URL parameter
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    // Start polling for active tasks
    if (activePollingTasks.length > 0) {
      const timer = setInterval(() => {
        activePollingTasks.forEach((taskId: any) => {
          dispatch({ 
            type: 'tasks/pollTaskStatus', 
            payload: taskId 
          });
        });
      }, 1000); // Poll every second

      return () => clearInterval(timer);
    }
  }, [activePollingTasks, dispatch]);

  const handleRefresh = () => {
    dispatch({ type: 'tasks/fetchTasks' });
  };

  const handleRetry = (taskId: string) => {
    // Implement retry logic if needed
    message.info('Retry functionality coming soon');
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Update URL to reflect current tab
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', key);
    setSearchParams(newParams);
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: 'Pending' },
      processing: { color: 'processing', icon: <SyncOutlined spin />, text: 'Processing' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Filter tasks by type
  const videoTasks = tasks.filter((task: any) => task.task_type === 'video');
  const imageTasks = tasks.filter((task: any) => task.task_type === 'image');

  // Group long video tasks by group id found in prompt like [LV:groupId]
  const groupRegex = /\[LV:([^\]]+)\]/;
  const longVideoGroupsMap: Record<string, any[]> = {};
  videoTasks.forEach((task: any) => {
    const prompt: string | undefined = task?.input_data?.prompt;
    const match = typeof prompt === 'string' ? prompt.match(groupRegex) : null;
    if (match) {
      const groupId = match[1];
      if (!longVideoGroupsMap[groupId]) longVideoGroupsMap[groupId] = [];
      longVideoGroupsMap[groupId].push(task);
    }
  });
  const longVideoGroups = Object.entries(longVideoGroupsMap).map(([groupId, groupTasks]) => {
    const active = groupTasks.some((t: any) => ['pending', 'processing'].includes(t.status));
    const completed = groupTasks.every((t: any) => t.status === 'completed');
    return { groupId, tasks: groupTasks, active, completed };
  });
  const activeLongGroups = longVideoGroups.filter((g) => g.active);
  const completedLongGroups = longVideoGroups.filter((g) => !g.active);

  // Further split by status
  const activeVideoTasks = videoTasks.filter((task: any) => ['pending', 'processing'].includes(task.status));
  const completedVideoTasks = videoTasks.filter((task: any) => ['completed', 'failed'].includes(task.status));
  
  const activeImageTasks = imageTasks.filter((task: any) => ['pending', 'processing'].includes(task.status));
  const completedImageTasks = imageTasks.filter((task: any) => ['completed', 'failed'].includes(task.status));

  const renderTaskList = (activeTasks: any[], completedTasks: any[], emptyMessage: string, createButtonText: string, createPath: string) => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <Card title={<Title level={4}>Active Generations</Title>}>
          <List
            dataSource={activeTasks}
            renderItem={(task: any) => (
              <TaskItem 
                task={task} 
                isHighlighted={task.id === highlightTaskId}
                onRetry={handleRetry}
              />
            )}
          />
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 ? (
        <Card title={<Title level={4}>Completed Generations</Title>}>
          <List
            dataSource={completedTasks}
            renderItem={(task: any) => (
              <TaskItem 
                task={task} 
                isHighlighted={task.id === highlightTaskId}
                onRetry={handleRetry}
              />
            )}
          />
        </Card>
      ) : (
        activeTasks.length === 0 && (
          <Empty
            description={emptyMessage}
            style={{ marginTop: 48 }}
          >
            <Button type="primary" onClick={() => history.push(createPath)}>
              {createButtonText}
            </Button>
          </Empty>
        )
      )}
    </Space>
  );

  return (
    <PageContainer
      title="My Creations"
      subTitle="Track your AI-generated content"
      extra={[
        <Button 
          key="refresh" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      ]}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane 
          tab={
            <span>
              <VideoCameraOutlined />
              Videos ({videoTasks.length})
            </span>
          } 
          key="videos"
        >
          {renderTaskList(
            activeVideoTasks,
            completedVideoTasks,
            "No video generation tasks yet",
            "Create Your First Video",
            "/home"
          )}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <PictureOutlined />
              Images ({imageTasks.length})
            </span>
          } 
          key="images"
        >
          {renderTaskList(
            activeImageTasks,
            completedImageTasks,
            "No image generation tasks yet",
            "Create Your First Image",
            "/home"
          )}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <PlayCircleOutlined />
              Long Videos ({longVideoGroups.length})
            </span>
          } 
          key="long"
        >
          {longVideoGroups.length > 0 ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {activeLongGroups.length > 0 && (
                <Card title={<Title level={4}>Active Long Videos</Title>}>
                  <List
                    dataSource={activeLongGroups}
                    renderItem={(group: any) => (
                      <List.Item
                        actions={[
                          <Button type="link" onClick={() => history.push('/tasks?tab=videos')}>
                            View Segments
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={`Project ${group.groupId}`}
                          description={`${group.tasks.length} segments • ${group.tasks.filter((t: any) => t.status === 'completed').length} completed`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
              {completedLongGroups.length > 0 && (
                <Card title={<Title level={4}>Completed Long Videos</Title>}>
                  <List
                    dataSource={completedLongGroups}
                    renderItem={(group: any) => (
                      <List.Item
                        actions={[
                          <Button type="link" onClick={() => history.push('/tasks?tab=videos')}>
                            View Segments
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={`Project ${group.groupId}`}
                          description={`${group.tasks.length} segments • All completed`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </Space>
          ) : (
            <Empty
              description="No long video projects yet"
              style={{ marginTop: 48 }}
            >
              <Button type="primary" onClick={() => history.push('/long-video')}>
                Create Long Video
              </Button>
            </Empty>
          )}
        </TabPane>
      </Tabs>

      {/* Empty State for all tasks */}
      {tasks.length === 0 && !loading && (
        <Empty
          description="No creations yet"
          style={{ marginTop: 48 }}
        >
          <Button type="primary" onClick={() => history.push('/home')}>
            Start Creating
          </Button>
        </Empty>
      )}
    </PageContainer>
  );
};

export default TasksPage;