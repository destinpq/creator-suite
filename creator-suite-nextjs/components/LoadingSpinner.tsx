'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  color = '#0099ff',
  message = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: { width: 20, height: 20, borderWidth: 2 },
    medium: { width: 40, height: 40, borderWidth: 3 },
    large: { width: 60, height: 60, borderWidth: 4 }
  };

  const { width, height, borderWidth } = sizeMap[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '20px'
    }}>
      <div
        style={{
          width,
          height,
          border: `${borderWidth}px solid rgba(255,255,255,0.1)`,
          borderTop: `${borderWidth}px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '14px',
          margin: 0,
          textAlign: 'center'
        }}>
          {message}
        </p>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}
