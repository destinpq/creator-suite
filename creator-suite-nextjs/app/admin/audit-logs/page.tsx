'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiClock, FiUser, FiActivity } from 'react-icons/fi';

interface AuditLog {
  id: number;
  admin_id: number;
  admin_username: string;
  action: string;
  resource: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      if (adminFilter) params.append('admin_username', adminFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/v1/admin/management/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) return '➕';
    if (action.includes('update') || action.includes('edit')) return '✏️';
    if (action.includes('delete') || action.includes('remove')) return '🗑️';
    if (action.includes('login')) return '🔐';
    if (action.includes('logout')) return '🚪';
    if (action.includes('view') || action.includes('read')) return '👁️';
    return '📝';
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('remove') || action.includes('failed')) return '#ff4d4f';
    if (action.includes('create') || action.includes('add')) return '#52c41a';
    if (action.includes('update') || action.includes('edit')) return '#faad14';
    return '#1890ff';
  };

  const exportLogs = () => {
    const csvContent = [
      ['ID', 'Admin', 'Action', 'Resource', 'Details', 'IP Address', 'Timestamp'],
      ...logs.map(log => [
        log.id,
        log.admin_username,
        log.action,
        log.resource || '',
        log.details || '',
        log.ip_address || '',
        new Date(log.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.admin_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resource && log.resource.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesAdmin = !adminFilter || log.admin_username === adminFilter;

    return matchesSearch && matchesAction && matchesAdmin;
  });

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', marginBottom: 8 }}>Audit Logs</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Complete record of all administrative actions and system changes</p>
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
              placeholder="Search logs..."
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
            <option value="user_created">User Created</option>
            <option value="user_updated">User Updated</option>
            <option value="user_deleted">User Deleted</option>
            <option value="admin_login">Admin Login</option>
            <option value="credit_modified">Credit Modified</option>
            <option value="billing_stats_viewed">Billing Viewed</option>
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
            onClick={loadAuditLogs}
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
            onClick={exportLogs}
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

      {/* Logs Table */}
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
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Admin</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Resource</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Details</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>IP Address</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{getActionIcon(log.action)}</span>
                      <div>
                        <div style={{
                          color: '#fff',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {log.action.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiUser size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <span style={{ color: '#fff' }}>{log.admin_username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {log.resource || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      {log.details || 'No details'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: 12 }}>
                      {log.ip_address || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiClock size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)' }}>
            No audit logs found matching the current filters.
          </div>
        )}
      </div>

      {/* Summary Stats */}
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
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>{logs.length}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Total Logs</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>
            {logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Today</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>
            {new Set(logs.map(l => l.admin_username)).size}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Active Admins</div>
        </div>
      </div>
    </div>
  );
}
