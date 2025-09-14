import React from 'react';

export default function Profile() {
  return (
    <div style={{ padding: 24 }}>
      <h1>User Profile</h1>
      <p>Manage your account settings and preferences.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>Personal Information</h3>
          <p>Name: John Doe</p>
          <p>Email: john@example.com</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>Edit</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>Account Settings</h3>
          <p>Change password, notification preferences</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>Settings</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>Usage Statistics</h3>
          <p>Credits used: 50</p>
          <p>Projects created: 5</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>View Details</button>
        </div>
      </div>
    </div>
  );
}
