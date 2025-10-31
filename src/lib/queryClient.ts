// src/lib/queryClient.ts - NO CACHING, pure web app
import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

// 🔥 REMOVED ALL CACHING - This file is DEPRECATED
// Use QueryClient from App.tsx instead (with NO caching config)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Always refetch
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: false, // Fail fast
      staleTime: 0, // NO cache
      gcTime: 0, // NO memory
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