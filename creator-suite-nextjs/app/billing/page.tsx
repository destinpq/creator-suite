import React from 'react';

export default function Billing() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Billing</h1>
      <p>Manage your subscription and payment methods.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>Current Plan</h3>
          <p>Free Plan</p>
          <p>Usage: 100 credits remaining</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>Upgrade</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>Payment Methods</h3>
          <p>No payment methods added</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>Add Card</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>Billing History</h3>
          <p>No transactions yet</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>View History</button>
        </div>
      </div>
    </div>
  );
}
