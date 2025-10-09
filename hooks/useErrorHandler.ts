import { useState, useCallback } from 'react';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorType: 'network' | 'auth' | 'subscription' | 'general' | 'component';
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorType: 'general'
  });

  const handleError = useCallback((error: Error, type: ErrorState['errorType'] = 'general') => {
    console.error('Error caught by useErrorHandler:', error);
    setErrorState({
      hasError: true,
      error,
      errorType: type
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorType: 'general'
    });
  }, []);

  const handleNetworkError = useCallback((error: Error) => {
    handleError(error, 'network');
  }, [handleError]);

  const handleAuthError = useCallback((error: Error) => {
    handleError(error, 'auth');
  }, [handleError]);

  const handleSubscriptionError = useCallback((error: Error) => {
    handleError(error, 'subscription');
  }, [handleError]);

  const handleComponentError = useCallback((error: Error) => {
    handleError(error, 'component');
  }, [handleError]);

  return {
    errorState,
    handleError,
    clearError,
    handleNetworkError,
    handleAuthError,
    handleSubscriptionError,
    handleComponentError,
  };
};
