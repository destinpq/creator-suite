import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/home" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Go back to Home</Link>
    </div>
  );
}
