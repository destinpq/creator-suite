import React from 'react';
import { Card, Select, DatePicker, Button, Row, Col, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Organization } from '../service';

const { RangePicker } = DatePicker;

interface BillingFiltersProps {
  organizations: Organization[];
  selectedOrganizationId: number | null;
  dateRange: [Dayjs, Dayjs] | null;
  loadingOrganizations: boolean;
  loadingBilling: boolean;
  onOrganizationChange: (organizationId: number | null) => void;
  onDateRangeChange: RangePickerProps['onChange'];
  onSearch: () => void;
  onClear: () => void;
}

const BillingFilters: React.FC<BillingFiltersProps> = ({
  organizations,
  selectedOrganizationId,
  dateRange,
  loadingOrganizations,
  loadingBilling,
  onOrganizationChange,
  onDateRangeChange,
  onSearch,
  onClear,
}) => {
  const canSearch = selectedOrganizationId && dateRange && dateRange[0] && dateRange[1];

  return (
    <Card title="Billing Filters" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Organization
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select organization"
              value={selectedOrganizationId}
              onChange={onOrganizationChange}
              loading={loadingOrganizations}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {organizations.map((org) => (
                <Select.Option key={org.id} value={org.id}>
                  {org.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Billing Period
            </label>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={onDateRangeChange}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
            />
          </div>
        </Col>
        
        <Col xs={24} sm={24} md={8}>
          <div style={{ paddingTop: 32 }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={onSearch}
                loading={loadingBilling}
                disabled={!canSearch}
              >
                Generate Report
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={onClear}
                disabled={loadingBilling}
              >
                Clear
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default BillingFilters;
