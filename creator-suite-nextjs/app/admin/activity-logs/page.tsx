'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiUser, FiActivity, FiClock, FiGlobe, FiSmartphone } from 'react-icons/fi';

interface UserActivity {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export default function ActivityLogsPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadActivityLogs();
  }, []);

  const loadActivityLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      if (userFilter) params.append('username', userFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/v1/admin/management/activity-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return '🔐';
    if (action.includes('logout')) return '🚪';
    if (action.includes('create') || action.includes('generate')) return '🎨';
    if (action.includes('upload')) return '📤';
    if (action.includes('download')) return '📥';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('update') || action.includes('edit')) return '✏️';
    if (action.includes('view') || action.includes('read')) return '👁️';
    if (action.includes('credit') || action.includes('payment')) return '💰';
    return '📝';
  };

  const getActionColor = (action: string) => {
    if (action.includes('login') || action.includes('success')) return '#52c41a';
    if (action.includes('logout')) return '#1890ff';
    if (action.includes('failed') || action.includes('error')) return '#ff4d4f';
    if (action.includes('create') || action.includes('generate')) return '#722ed1';
    if (action.includes('delete')) return '#ff4d4f';
    return '#faad14';
  };

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) return 'Mobile';
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'Tablet';
    return 'Desktop';
  };

  const exportActivities = () => {
    const csvContent = [
      ['ID', 'User', 'Action', 'Resource', 'Details', 'IP Address', 'Device', 'Timestamp'],
      ...activities.map(activity => [
        activity.id,
        activity.username,
        activity.action,
        activity.resource || '',
        activity.details || '',
        activity.ip_address || '',
        getDeviceType(activity.user_agent),
        new Date(activity.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm ||
      activity.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.resource && activity.resource.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activity.details && activity.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = !actionFilter || activity.action === actionFilter;
    const matchesUser = !userFilter || activity.username === userFilter;

    return matchesSearch && matchesAction && matchesUser;
  });

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Loading user activity...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', marginBottom: 8 }}>User Activity Logs</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Monitor user actions, bot activities, and system interactions</p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiSearch size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: '#fff',
                minWidth: 200
              }}
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff'
            }}
          >
            <option value="">All Actions</option>
            <option value="user_login">User Login</option>
            <option value="user_logout">User Logout</option>
            <option value="creation_generated">Creation Generated</option>
            <option value="file_uploaded">File Uploaded</option>
            <option value="credit_purchased">Credit Purchased</option>
            <option value="profile_updated">Profile Updated</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff'
            }}
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff'
            }}
          />

          <button
            onClick={loadActivityLogs}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(90deg, #0099ff, #8000ff)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Apply Filters
          </button>

          <button
            onClick={exportActivities}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FiDownload size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{
              background: 'rgba(255,255,255,0.1)',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Resource</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Details</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Device</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Location</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity) => (
                <tr key={activity.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{getActionIcon(activity.action)}</span>
                      <div>
                        <div style={{
                          color: '#fff',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {activity.action.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiUser size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <span style={{ color: '#fff' }}>{activity.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {activity.resource || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      {activity.details || 'No details'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiSmartphone size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                        {getDeviceType(activity.user_agent)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiGlobe size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: 12 }}>
                        {activity.ip_address || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiClock size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredActivities.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)' }}>
            No user activities found matching the current filters.
          </div>
        )}
      </div>

      {/* Activity Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginTop: 24
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>{activities.length}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Total Activities</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>
            {activities.filter(a => a.action.includes('login')).length}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Login Events</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>
            {activities.filter(a => a.action.includes('create') || a.action.includes('generate')).length}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Creations</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>
            {new Set(activities.map(a => a.username)).size}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Active Users</div>
        </div>
      </div>
    </div>
  );
}
