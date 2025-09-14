'use client';

import React, { useState, FormEvent } from 'react';
import client from '@/lib/api';
import { useRouter } from 'next/navigation';
import { LoginResponse } from '@/types';
import Link from 'next/link';
import { FiBook } from 'react-icons/fi';

export default function Login() {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const onFinish = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await client.post<LoginResponse>('/v1/auth/login-json', { email, password });
      if (res.data && res.data.access_token) {
        alert('Logged in');
        // store token and optional user email for UI
        try {
          localStorage.setItem('token', res.data.access_token);
          if (res.data.user && res.data.user.email) localStorage.setItem('user_email', res.data.user.email);
          // Set cookie for middleware
          document.cookie = `token=${res.data.access_token}; path=/; max-age=86400`; // 1 day
        } catch (e) {}
        router.push('/home');
      } else {
        setError('Login failed');
      }
    } catch (e: any) {
      const detail = e.response?.data?.detail || e.message;
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '24px auto' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'var(--bg)' }}>
        <h2>Sign in</h2>
        <form onSubmit={onFinish}>
          <div style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
            New to Creator Suite?
          </p>
          <Link href="/tutorial">
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'transparent',
              color: '#0099ff',
              border: '1px solid #0099ff',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'none'
            }}>
              <FiBook size={16} />
              Take Tutorial
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
