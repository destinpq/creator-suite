'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiUsers, FiActivity, FiCreditCard, FiSettings, FiSearch, FiFilter, FiEdit, FiTrash2, FiEye, FiPlus, FiMinus } from 'react-icons/fi';

interface User {
  id: number;
  email: string | null;
  username: string;
  name: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  credits: number;
  created_at: string;
  updated_at: string | null;
}

interface AdminStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_credits: number;
  recent_activity: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterAdmin, setFilterAdmin] = useState<boolean | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/management/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterActive !== null) params.append('is_active', filterActive.toString());
      if (filterAdmin !== null) params.append('is_admin', filterAdmin.toString());

      const response = await fetch(`/api/v1/admin/management/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: number, action: string, data?: any) => {
    try {
      let response;
      switch (action) {
        case 'deactivate':
          response = await fetch(`/api/v1/admin/management/users/${userId}`, {
            method: 'DELETE'
          });
          break;
        case 'modify_credits':
          response = await fetch(`/api/v1/admin/management/users/${userId}/credits`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
      }

      if (response?.ok) {
        loadUsers();
        loadStats();
        alert('Action completed successfully');
      } else {
        alert('Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive = filterActive === null || user.is_active === filterActive;
    const matchesAdmin = filterAdmin === null || user.is_admin === filterAdmin;

    return matchesSearch && matchesActive && matchesAdmin;
  });

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Manage users, monitor activity, and oversee system operations</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiUsers size={24} style={{ color: '#0099ff' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>{stats.total_users}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Total Users</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiActivity size={24} style={{ color: '#52c41a' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>{stats.active_users}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Active Users</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiSettings size={24} style={{ color: '#faad14' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>{stats.admin_users}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Admin Users</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiCreditCard size={24} style={{ color: '#8000ff' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>{stats.total_credits.toFixed(1)}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Total Credits</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 24
      }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>User Management</h2>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiSearch size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <input
                type="text"
                placeholder="Search users..."
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
              value={filterActive === null ? '' : filterActive.toString()}
              onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: '#fff'
              }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={filterAdmin === null ? '' : filterAdmin.toString()}
              onChange={(e) => setFilterAdmin(e.target.value === '' ? null : e.target.value === 'true')}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: '#fff'
              }}
            >
              <option value="">All Roles</option>
              <option value="true">Admin</option>
              <option value="false">User</option>
            </select>

            <button
              onClick={loadUsers}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Credits</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '12px', color: '#fff' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.username}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{user.email}</div>
                      {user.name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{user.name}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      background: user.is_active ? '#52c41a' : '#ff4d4f',
                      color: '#fff'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      background: user.is_admin ? '#faad14' : 'rgba(255,255,255,0.1)',
                      color: '#fff'
                    }}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#fff' }}>{user.credits.toFixed(1)}</td>
                  <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setSelectedUser(user)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 4,
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        <FiEye size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const amount = prompt('Enter credit amount (positive to add, negative to subtract):');
                          if (amount) {
                            const reason = prompt('Reason for credit modification:') || 'Admin adjustment';
                            handleUserAction(user.id, 'modify_credits', {
                              amount: parseFloat(amount),
                              reason
                            });
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 4,
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        <FiCreditCard size={14} />
                      </button>
                      {user.is_active && (
                        <button
                          onClick={() => {
                            if (confirm(`Deactivate user ${user.username}?`)) {
                              handleUserAction(user.id, 'deactivate');
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#ff4d4f',
                            border: 'none',
                            borderRadius: 4,
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)' }}>
            No users found matching the current filters.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
        marginTop: 32
      }}>
        <Link href="/admin/audit-logs">
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20,
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            <FiActivity size={24} style={{ color: '#0099ff', marginBottom: 12 }} />
            <h3 style={{ color: '#fff', marginBottom: 8 }}>Audit Logs</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              View detailed admin activity logs and system changes
            </p>
          </div>
        </Link>

        <Link href="/admin/activity-logs">
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20,
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            <FiUsers size={24} style={{ color: '#52c41a', marginBottom: 12 }} />
            <h3 style={{ color: '#fff', marginBottom: 8 }}>User Activity</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              Monitor user actions and bot activities across the platform
            </p>
          </div>
        </Link>

        <Link href="/admin/billing">
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20,
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            <FiCreditCard size={24} style={{ color: '#8000ff', marginBottom: 12 }} />
            <h3 style={{ color: '#fff', marginBottom: 8 }}>Billing Management</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              Manage subscriptions, payments, and billing operations
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
