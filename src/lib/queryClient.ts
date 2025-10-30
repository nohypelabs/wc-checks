// src/lib/queryClient.ts - Centralized React Query configuration
import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error: any) => {
        logger.error('React Query error', error);
      },
    },
    mutations: {
      retry: 0,
      onError: (error: any) => {
        logger.error('React Query mutation error', error);
      },
    },
  },
});