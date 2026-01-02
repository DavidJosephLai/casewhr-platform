/**
 * 📡 数据查询 Hook
 * 提供类似 React Query 的数据获取、缓存和同步功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface QueryOptions<T> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// 全局缓存
const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  subscribers: Set<() => void>;
}>();

/**
 * 数据查询 Hook
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useQuery(
 *   'projects',
 *   async () => {
 *     const response = await fetch('/api/projects');
 *     return response.json();
 *   },
 *   {
 *     staleTime: 5 * 60 * 1000, // 5 分钟
 *     refetchOnWindowFocus: true,
 *   }
 * );
 * ```
 */
export function useQuery<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchOnMount = true,
    refetchInterval,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5 分钟
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const queryKey = Array.isArray(key) ? key.join('-') : key;
  
  const [data, setData] = useState<T | undefined>(() => {
    const cached = queryCache.get(queryKey);
    return cached?.data;
  });
  
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!queryCache.has(queryKey));
  const [isFetching, setIsFetching] = useState(false);

  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // 检查缓存
    const cached = queryCache.get(queryKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < staleTime) {
      console.log(`📡 [Query] Using cached data for: ${queryKey}`);
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    console.log(`📡 [Query] Fetching data for: ${queryKey}`);
    setIsFetching(true);

    try {
      const result = await queryFn();
      
      if (!mountedRef.current) return;

      // 更新缓存
      const cacheEntry = queryCache.get(queryKey) || {
        data: result,
        timestamp: now,
        subscribers: new Set(),
      };
      
      cacheEntry.data = result;
      cacheEntry.timestamp = now;
      queryCache.set(queryKey, cacheEntry);

      // 通知订阅者
      cacheEntry.subscribers.forEach(cb => cb());

      setData(result);
      setError(null);
      setIsLoading(false);
      retryCountRef.current = 0;
      
      onSuccess?.(result);
      
      console.log(`✅ [Query] Data fetched successfully: ${queryKey}`);
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err as Error;
      console.error(`❌ [Query] Error fetching data for ${queryKey}:`, error);

      // 重试逻辑
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        console.log(`🔄 [Query] Retrying (${retryCountRef.current}/${retry})...`);
        
        setTimeout(() => {
          fetchData();
        }, retryDelay * retryCountRef.current);
        return;
      }

      setError(error);
      setIsLoading(false);
      onError?.(error);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
      }
    }
  }, [enabled, queryKey, queryFn, staleTime, retry, retryDelay, onSuccess, onError]);

  // 手动重新获取
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  // 使缓存失效
  const invalidate = useCallback(() => {
    queryCache.delete(queryKey);
    refetch();
  }, [queryKey, refetch]);

  // 初始加载
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [enabled, refetchOnMount, fetchData]);

  // 定期重新获取
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refetchInterval, fetchData]);

  // 窗口聚焦时重新获取
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return;

    const handleFocus = () => {
      console.log('🔄 [Query] Window focused, refetching...');
      fetchData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, refetchOnWindowFocus, fetchData]);

  // 订阅缓存更新
  useEffect(() => {
    const cacheEntry = queryCache.get(queryKey);
    if (!cacheEntry) return;

    const updateData = () => {
      setData(cacheEntry.data);
    };

    cacheEntry.subscribers.add(updateData);

    return () => {
      cacheEntry.subscribers.delete(updateData);
    };
  }, [queryKey]);

  // 清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 缓存清理（在组件卸载后）
  useEffect(() => {
    return () => {
      setTimeout(() => {
        const cacheEntry = queryCache.get(queryKey);
        if (cacheEntry && cacheEntry.subscribers.size === 0) {
          const now = Date.now();
          if (now - cacheEntry.timestamp > cacheTime) {
            console.log(`🗑️ [Query] Cleaning up cache for: ${queryKey}`);
            queryCache.delete(queryKey);
          }
        }
      }, cacheTime);
    };
  }, [queryKey, cacheTime]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    isError: !!error,
    isSuccess: !!data && !error,
    refetch,
    invalidate,
  };
}

/**
 * 数据修改 Hook
 * 用于 POST、PUT、DELETE 等操作
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading } = useMutation(
 *   async (projectData) => {
 *     const response = await fetch('/api/projects', {
 *       method: 'POST',
 *       body: JSON.stringify(projectData),
 *     });
 *     return response.json();
 *   },
 *   {
 *     onSuccess: () => {
 *       // 使相关查询失效
 *       invalidateQuery('projects');
 *     },
 *   }
 * );
 * ```
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  } = {}
) {
  const [data, setData] = useState<TData>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      options.onSuccess?.(result, variables);
      options.onSettled?.(result, null, variables);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error, variables);
      options.onSettled?.(undefined, error, variables);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    data,
    error,
    isLoading,
    isError: !!error,
    isSuccess: !!data && !error,
    reset: () => {
      setData(undefined);
      setError(null);
    },
  };
}

/**
 * 使查询缓存失效
 */
export function invalidateQuery(key: string | string[]) {
  const queryKey = Array.isArray(key) ? key.join('-') : key;
  queryCache.delete(queryKey);
  console.log(`🔄 [Query] Cache invalidated for: ${queryKey}`);
}

/**
 * 清除所有查询缓存
 */
export function clearQueryCache() {
  queryCache.clear();
  console.log('🗑️ [Query] All cache cleared');
}

/**
 * 获取查询缓存数据
 */
export function getQueryData<T>(key: string | string[]): T | undefined {
  const queryKey = Array.isArray(key) ? key.join('-') : key;
  return queryCache.get(queryKey)?.data;
}

/**
 * 设置查询缓存数据
 */
export function setQueryData<T>(key: string | string[], data: T) {
  const queryKey = Array.isArray(key) ? key.join('-') : key;
  const now = Date.now();
  
  const cacheEntry = queryCache.get(queryKey) || {
    data,
    timestamp: now,
    subscribers: new Set(),
  };
  
  cacheEntry.data = data;
  cacheEntry.timestamp = now;
  queryCache.set(queryKey, cacheEntry);
  
  // 通知订阅者
  cacheEntry.subscribers.forEach(cb => cb());
}

export default useQuery;
