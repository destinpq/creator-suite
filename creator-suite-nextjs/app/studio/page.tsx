import React from 'react';

export default function Studio() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Studio</h1>
      <p>Create and edit your AI-generated content here.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>New Project</h3>
          <p>Start a new video or image project.</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>Create</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>My Projects</h3>
          <p>View and manage your existing projects.</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>View</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <h3>Templates</h3>
          <p>Use pre-built templates to get started.</p>
          <button style={{ padding: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4 }}>Browse</button>
        </div>
      </div>
    </div>
  );
}
