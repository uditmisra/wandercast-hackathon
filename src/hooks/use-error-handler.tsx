import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  onError?: (error: Error) => void;
  logToConsole?: boolean;
}

interface ErrorState {
  error: Error | null;
  hasError: boolean;
}

/**
 * Custom hook for handling errors in async operations
 *
 * @example
 * ```tsx
 * const { handleError, clearError, error } = useErrorHandler();
 *
 * const fetchData = async () => {
 *   try {
 *     const data = await apiCall();
 *   } catch (err) {
 *     handleError(err);
 *   }
 * };
 * ```
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToast = true,
    toastTitle = 'Error',
    onError,
    logToConsole = true,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
  });

  const handleError = useCallback(
    (error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));

      // Update error state
      setErrorState({
        error: err,
        hasError: true,
      });

      // Log to console if enabled
      if (logToConsole) {
        console.error(`[${toastTitle}]:`, err);
      }

      // Show toast notification
      if (showToast) {
        toast.error(toastTitle, {
          description: err.message || 'An unexpected error occurred',
        });
      }

      // Call custom error handler
      onError?.(err);

      return err;
    },
    [showToast, toastTitle, onError, logToConsole]
  );

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
    });
  }, []);

  return {
    error: errorState.error,
    hasError: errorState.hasError,
    handleError,
    clearError,
  };
}

/**
 * Higher-order function that wraps an async function with error handling
 *
 * @example
 * ```tsx
 * const { handleError } = useErrorHandler();
 *
 * const safeFetch = withErrorHandler(async () => {
 *   return await fetch('/api/data');
 * }, handleError);
 *
 * await safeFetch();
 * ```
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  handleError: (error: unknown) => Error
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
      throw error;
    }
  }) as T;
}

/**
 * Hook for wrapping async operations with loading and error states
 *
 * @example
 * ```tsx
 * const { execute, loading, error } = useAsyncHandler(async () => {
 *   return await fetchData();
 * });
 *
 * <Button onClick={execute} disabled={loading}>
 *   {loading ? 'Loading...' : 'Fetch Data'}
 * </Button>
 * ```
 */
export function useAsyncHandler<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: ErrorHandlerOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const { handleError, error, clearError } = useErrorHandler(options);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      setLoading(true);
      clearError();

      try {
        const result = await asyncFn(...args);
        return result;
      } catch (err) {
        handleError(err);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, handleError, clearError]
  );

  return {
    execute: execute as T,
    loading,
    error,
    clearError,
  };
}
