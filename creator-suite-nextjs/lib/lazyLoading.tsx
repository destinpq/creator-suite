'use client';

import React, { Suspense, ComponentType } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for lazy-loaded components with loading fallback
 */
export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner message="Loading..." />}>
      {children}
    </Suspense>
  );
}

/**
 * Higher-order component for lazy loading
 */
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFunc);

  return function LazyWrapperComponent(props: P) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

/**
 * Preload a lazy component
 */
export function preloadLazyComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>
) {
  // Preload the component in the background
  importFunc();
}
