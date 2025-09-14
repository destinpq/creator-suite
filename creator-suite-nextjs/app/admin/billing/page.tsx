'use client';

import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiDollarSign, FiTrendingUp, FiUsers, FiPackage, FiCalendar, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

interface BillingStats {
  total_revenue: number;
  monthly_revenue: number;
  active_subscriptions: number;
  total_subscriptions: number;
  average_revenue_per_user: number;
  churn_rate: number;
}

interface Subscription {
  id: number;
  user_id: number;
  username: string;
  plan_name: string;
  status: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  description: string;
}

export default function BillingManagement() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      // Load billing statistics
      const statsResponse = await fetch('/api/v1/admin/billing/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load subscriptions
      const subscriptionsResponse = await fetch('/api/v1/admin/billing/subscriptions');
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData);
      }

      // Load payments
      const paymentsResponse = await fetch('/api/v1/admin/billing/payments');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (subscriptionId: number, action: string, data?: any) => {
    try {
      let response;
      switch (action) {
        case 'cancel':
          response = await fetch(`/api/v1/admin/billing/subscriptions/${subscriptionId}/cancel`, {
            method: 'POST'
          });
          break;
        case 'reactivate':
          response = await fetch(`/api/v1/admin/billing/subscriptions/${subscriptionId}/reactivate`, {
            method: 'POST'
          });
          break;
        case 'update':
          response = await fetch(`/api/v1/admin/billing/subscriptions/${subscriptionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
      }

      if (response?.ok) {
        loadBillingData();
        alert('Action completed successfully');
      } else {
        alert('Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#52c41a';
      case 'cancelled': return '#ff4d4f';
      case 'past_due': return '#faad14';
      case 'pending': return '#1890ff';
      default: return '#666';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#52c41a';
      case 'failed': return '#ff4d4f';
      case 'pending': return '#faad14';
      case 'refunded': return '#1890ff';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Loading billing data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', marginBottom: 8 }}>Billing Management</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Monitor revenue, manage subscriptions, and oversee payment operations</p>
      </div>

      {/* Billing Stats */}
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
              <FiDollarSign size={24} style={{ color: '#52c41a' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>${stats.total_revenue.toFixed(2)}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Total Revenue</div>
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
              <FiTrendingUp size={24} style={{ color: '#0099ff' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>${stats.monthly_revenue.toFixed(2)}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Monthly Revenue</div>
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
              <FiUsers size={24} style={{ color: '#faad14' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>{stats.active_subscriptions}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Active Subscriptions</div>
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
              <FiPackage size={24} style={{ color: '#8000ff' }} />
              <div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>${stats.average_revenue_per_user.toFixed(2)}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Avg Revenue/User</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { key: 'overview', label: 'Overview', icon: FiTrendingUp },
            { key: 'subscriptions', label: 'Subscriptions', icon: FiPackage, count: subscriptions.length },
            { key: 'payments', label: 'Payments', icon: FiCreditCard, count: payments.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '16px 24px',
                background: activeTab === tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: activeTab === tab.key ? '600' : '400'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 12
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ color: '#fff', marginBottom: 24 }}>Revenue Overview</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 24
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: 20
                }}>
                  <h3 style={{ color: '#fff', marginBottom: 16 }}>Revenue Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Subscriptions</span>
                      <span style={{ color: '#fff' }}>${(stats?.total_revenue || 0) * 0.8}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>One-time Payments</span>
                      <span style={{ color: '#fff' }}>${(stats?.total_revenue || 0) * 0.2}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: 20
                }}>
                  <h3 style={{ color: '#fff', marginBottom: 16 }}>Subscription Metrics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Active Rate</span>
                      <span style={{ color: '#52c41a' }}>
                        {stats ? ((stats.active_subscriptions / stats.total_subscriptions) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Churn Rate</span>
                      <span style={{ color: stats?.churn_rate && stats.churn_rate > 5 ? '#ff4d4f' : '#52c41a' }}>
                        {stats?.churn_rate.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ color: '#fff' }}>Subscriptions</h2>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <FiPlus size={16} />
                  New Subscription
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Plan</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Next Billing</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{subscription.username}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>ID: {subscription.user_id}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{subscription.plan_name}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{subscription.billing_cycle}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          ${subscription.amount} {subscription.currency}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            background: getStatusColor(subscription.status),
                            color: '#fff'
                          }}>
                            {subscription.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                          {new Date(subscription.next_billing_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setSelectedSubscription(subscription)}
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
                              <FiEdit size={14} />
                            </button>
                            {subscription.status === 'active' ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Cancel subscription for ${subscription.username}?`)) {
                                    handleSubscriptionAction(subscription.id, 'cancel');
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
                            ) : (
                              <button
                                onClick={() => handleSubscriptionAction(subscription.id, 'reactivate')}
                                style={{
                                  padding: '6px 12px',
                                  background: '#52c41a',
                                  border: 'none',
                                  borderRadius: 4,
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 style={{ color: '#fff', marginBottom: 24 }}>Payment History</h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Method</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Transaction ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#fff' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{payment.username}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>ID: {payment.user_id}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          ${payment.amount} {payment.currency}
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>
                          {payment.payment_method}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            background: getPaymentStatusColor(payment.status),
                            color: '#fff'
                          }}>
                            {payment.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                          {payment.transaction_id}
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
