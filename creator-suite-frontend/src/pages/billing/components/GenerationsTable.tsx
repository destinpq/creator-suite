import React, { useState } from 'react';
import { Table, Tag, Card, Input, Select, Space, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { GenerationUsageItem } from '../service';
import { getModelDisplayName } from '../utils';
import dayjs from 'dayjs';

const { Search } = Input;

interface GenerationsTableProps {
  generations: GenerationUsageItem[];
  loading?: boolean;
}

const GenerationsTable: React.FC<GenerationsTableProps> = ({ generations, loading = false }) => {
  const [filteredData, setFilteredData] = useState<GenerationUsageItem[]>(generations);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [modelFilter, setModelFilter] = useState<string | undefined>(undefined);

  // Update filtered data when generations prop changes
  React.useEffect(() => {
    applyFilters();
  }, [generations, searchText, typeFilter, modelFilter]);

  const applyFilters = () => {
    let filtered = [...generations];

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.user_name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.user_email.toLowerCase().includes(searchText.toLowerCase()) ||
          item.generation_id.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter((item) => item.generation_type === typeFilter);
    }

    // Apply model filter (compare with display name)
    if (modelFilter) {
      filtered = filtered.filter((item) => getModelDisplayName(item.model_used) === modelFilter);
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter(undefined);
    setModelFilter(undefined);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      video: 'blue',
      image: 'green',
      audio: 'orange',
      text: 'purple',
      '3d_model': 'red',
    };
    return colors[type] || 'default';
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  // Get unique values for filters
  const uniqueTypes = [...new Set(generations.map((item) => item.generation_type))];
  const uniqueModels = [...new Set(generations.map((item) => getModelDisplayName(item.model_used)))];

  const columns: ColumnsType<GenerationUsageItem> = [
    {
      title: 'Generation ID',
      dataIndex: 'generation_id',
      key: 'generation_id',
      width: 120,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {id.substring(0, 8)}...
        </span>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.user_email}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'generation_type',
      key: 'generation_type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model_used',
      key: 'model_used',
      width: 180,
      render: (model: string) => (
        <Tag color="processing">{getModelDisplayName(model)}</Tag>
      ),
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>DestinPQ</span>
      ),
      width: 100,
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost: number) => (
        <span style={{ fontWeight: 500, color: '#3f8600' }}>
          {formatCurrency(cost)}
        </span>
      ),
      sorter: (a, b) => a.cost - b.cost,
    },
    {
      title: 'Processing Time',
      dataIndex: 'processing_time_seconds',
      key: 'processing_time_seconds',
      width: 120,
      render: (seconds?: number) => formatDuration(seconds),
      sorter: (a, b) => (a.processing_time_seconds || 0) - (b.processing_time_seconds || 0),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => dayjs(date).locale('en').format('MMM DD, YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <Card 
      title={`Generations (${filteredData.length} of ${generations.length})`}
      extra={
        <Space>
          <Search
            placeholder="Search by user or ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="Filter by type"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 120 }}
            allowClear
          >
            {uniqueTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {type.toUpperCase()}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by model"
            value={modelFilter}
            onChange={setModelFilter}
            style={{ width: 180 }}
            allowClear
          >
            {uniqueModels.map((model) => (
              <Select.Option key={model} value={model}>
                {model}
              </Select.Option>
            ))}
          </Select>
          <Button
            icon={<ClearOutlined />}
            onClick={clearFilters}
            disabled={!searchText && !typeFilter && !modelFilter}
          >
            Clear Filters
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="generation_id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} generations`,
        }}
        scroll={{ x: 1200 }}
        size="small"
      />
    </Card>
  );
};

export default GenerationsTable;
