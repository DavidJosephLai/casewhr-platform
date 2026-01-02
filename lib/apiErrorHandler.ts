/**
 * API Error Handler
 * Handles common API errors including Cloudflare 500 errors, timeouts, and network issues
 */

export interface ApiErrorDetails {
  message: string;
  statusCode?: number;
  isRetryable: boolean;
  originalError?: any;
}

/**
 * Checks if an error is a Cloudflare HTML error response
 */
export function isCloudflareError(error: any): boolean {
  if (typeof error === 'string' && error.includes('<!DOCTYPE html>')) {
    return true;
  }
  if (error?.message && typeof error.message === 'string' && error.message.includes('<!DOCTYPE html>')) {
    return true;
  }
  return false;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }
  
  // Fetch errors
  if (error.message && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch')
  )) {
    return true;
  }
  
  // Cloudflare 500 errors
  if (isCloudflareError(error)) {
    return true;
  }
  
  // 5xx server errors
  if (error.statusCode && error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }
  
  return false;
}

/**
 * Parse error details from various error formats
 */
export function parseErrorDetails(error: any): ApiErrorDetails {
  // Cloudflare HTML error
  if (isCloudflareError(error)) {
    return {
      message: 'Supabase服務暫時無法連接，請稍後再試 / Supabase service temporarily unavailable',
      statusCode: 500,
      isRetryable: true,
      originalError: error
    };
  }
  
  // Timeout error
  if (error.name === 'AbortError') {
    return {
      message: '請求超時，請檢查網絡連接 / Request timeout, please check your network',
      isRetryable: true,
      originalError: error
    };
  }
  
  // Network error
  if (error.message && error.message.includes('fetch')) {
    return {
      message: '網絡錯誤，請檢查連接 / Network error, please check your connection',
      isRetryable: true,
      originalError: error
    };
  }
  
  // HTTP error with status
  if (error.statusCode) {
    return {
      message: error.message || `HTTP錯誤 ${error.statusCode} / HTTP Error ${error.statusCode}`,
      statusCode: error.statusCode,
      isRetryable: error.statusCode >= 500,
      originalError: error
    };
  }
  
  // Generic error
  return {
    message: error.message || '未知錯誤 / Unknown error',
    isRetryable: false,
    originalError: error
  };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 2,
  timeout: number = 45000 // Increased default timeout to 45 seconds for better stability
): Promise<Response> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      
      // 🔧 FIX: Merge user-provided signal with timeout signal
      const userSignal = options.signal;
      if (userSignal?.aborted) {
        throw new DOMException('The user aborted a request.', 'AbortError');
      }
      
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
      
      // Clean up timeout if user signal aborts
      const abortHandler = () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
      userSignal?.addEventListener('abort', abortHandler);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        userSignal?.removeEventListener('abort', abortHandler);
        
        // If response is ok, return it
        if (response.ok) {
          return response;
        }
        
        // If it's a 5xx error and we have retries left, continue
        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`[fetchWithRetry] ${response.status} error, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await sleep(1500 * (attempt + 1)); // Slightly longer exponential backoff
          continue;
        }
        
        // Otherwise return the error response
        return response;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        userSignal?.removeEventListener('abort', abortHandler);
        throw fetchError;
      }
      
    } catch (error: any) {
      lastError = error;
      const errorDetails = parseErrorDetails(error);
      
      // 🔧 FIX: Better handling of abort errors
      if (error.name === 'AbortError') {
        // Check if it's a timeout or user cancellation
        if (error.message && error.message.includes('user aborted')) {
          // User cancellation - don't retry
          console.warn(`[fetchWithRetry] Request cancelled by user`);
          throw error;
        }
        // Timeout - retry if possible
        if (attempt < maxRetries) {
          console.warn(`[fetchWithRetry] Timeout on attempt ${attempt + 1}/${maxRetries + 1}, retrying...`);
          await sleep(1500 * (attempt + 1));
          continue;
        } else {
          console.error(`[fetchWithRetry] Final timeout after ${maxRetries + 1} attempts`);
        }
      } else {
        // Other errors - log appropriately
        if (attempt === maxRetries) {
          console.error(`[fetchWithRetry] Final error after ${maxRetries + 1} attempts:`, errorDetails.message);
        } else if (attempt === 0) {
          console.warn(`[fetchWithRetry] Attempt ${attempt + 1} failed, will retry:`, errorDetails.message);
        }
      }
      
      // If retryable and we have retries left, continue
      if (errorDetails.isRetryable && attempt < maxRetries) {
        await sleep(1500 * (attempt + 1)); // Exponential backoff
        continue;
      }
      
      // Otherwise throw
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Parse response safely, handling HTML error pages
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  
  // Check if response is HTML (Cloudflare error page)
  if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
    throw new Error(`Server returned HTML error page (Status: ${response.status})`);
  }
  
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('[parseJsonResponse] Failed to parse JSON:', text.substring(0, 200));
    throw new Error('Invalid JSON response from server');
  }
}
