'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook for monitoring web vitals and performance metrics
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState({
    fcp: null as number | null, // First Contentful Paint
    lcp: null as number | null, // Largest Contentful Paint
    fid: null as number | null, // First Input Delay
    cls: null as number | null, // Cumulative Layout Shift
    ttfb: null as number | null, // Time to First Byte
  });

  useEffect(() => {
    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      import('web-vitals').then(({ getFCP, getLCP, getFID, getCLS }) => {
        getFCP((metric: any) => {
          setMetrics(prev => ({ ...prev, fcp: metric.value }));
          console.log('FCP:', metric.value);
        });

        getLCP((metric: any) => {
          setMetrics(prev => ({ ...prev, lcp: metric.value }));
          console.log('LCP:', metric.value);
        });

        getFID((metric: any) => {
          setMetrics(prev => ({ ...prev, fid: metric.value }));
          console.log('FID:', metric.value);
        });

        getCLS((metric: any) => {
          setMetrics(prev => ({ ...prev, cls: metric.value }));
          console.log('CLS:', metric.value);
        });
      });
    }

    // Navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          ttfb: navigation.responseStart - navigation.requestStart
        }));
      }
    }
  }, []);

  return metrics;
}

/**
 * Hook for monitoring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    setRenderCount(prev => prev + 1);

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      setLastRenderTime(renderTime);

      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  return { renderCount, lastRenderTime };
}

/**
 * Hook for debouncing expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  }, [callback, delay, debounceTimer]);

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback as T;
}

/**
 * Hook for throttling expensive operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [throttleTimer, setThrottleTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastExecTime, setLastExecTime] = useState(0);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      callback(...args);
      setLastExecTime(currentTime);
    } else {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }

      const newTimer = setTimeout(() => {
        callback(...args);
        setLastExecTime(Date.now());
      }, delay - (currentTime - lastExecTime));

      setThrottleTimer(newTimer);
    }
  }, [callback, delay, throttleTimer, lastExecTime]);

  useEffect(() => {
    return () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [throttleTimer]);

  return throttledCallback as T;
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}
