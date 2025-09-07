import React from 'react';
import { Row, Col, Empty, Spin } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { Organization } from '../service';
import OrganisationCard from './OrganisationCard';

interface OrganisationListProps {
  organisations: Organization[];
  loading?: boolean;
  onView: (organisation: Organization) => void;
  onEdit: (organisation: Organization) => void;
  onDelete: (organisationId: number) => void;
}

const OrganisationList: React.FC<OrganisationListProps> = ({
  organisations,
  loading = false,
  onView,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#666' }}>
          Loading organisations...
        </div>
      </div>
    );
  }

  if (!organisations || organisations.length === 0) {
    return (
      <Empty
        image={<TeamOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
        description="No organisations found"
        style={{ padding: '60px 20px' }}
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {organisations.map((organisation) => (
        <Col
          key={organisation.id}
          xs={24}
          sm={12}
          md={12}
          lg={8}
          xl={8}
        >
          <OrganisationCard
            organisation={organisation}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Col>
      ))}
    </Row>
  );
};

export default OrganisationList;