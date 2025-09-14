'use client';

import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    retries?: number;
  } = {}
): UseApiReturn<T> {
  const { onSuccess, onError, retries = 0 } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastError: string = '';

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await apiFunction(...args);
        setState({
          data: result,
          loading: false,
          error: null,
        });
        onSuccess?.(result);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'An unexpected error occurred';

        if (attempt === retries) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: lastError,
          }));
          onError?.(lastError);
          return null;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return null;
  }, [apiFunction, onSuccess, onError, retries]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
