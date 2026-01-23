/**
 * 🛡️ Global Fetch Interceptor
 * Prevents "Cannot read properties of null (reading 'status')

" errors
 * by wrapping all fetch calls with proper error handling
 */

let isInstalled = false;

export function setupGlobalFetchInterceptor() {
  // Prevent multiple installations
  if (isInstalled) {
    console.log('🛡️ [Global Fetch Interceptor] Already installed, skipping...');
    return;
  }
  
  // Save the original fetch
  const originalFetch = window.fetch;

  // Override the global fetch function
  window.fetch = async function(...args): Promise<Response> {
    try {
      console.log('🌐 [Global Fetch Interceptor] Request:', args[0]);
      
      const response = await originalFetch.apply(this, args);
      
      // Always return a valid Response object
      if (response === null || response === undefined) {
        console.error('❌ [Global Fetch Interceptor] Response is null/undefined for:', args[0]);
        
        // Return a fake Response object to prevent null errors
        // Use 503 (Service Unavailable) instead of 0
        return new Response(
          JSON.stringify({ 
            error: 'Network request returned null',
            url: args[0]
          }), 
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'application/json' }),
          }
        );
      }
      
      console.log('✅ [Global Fetch Interceptor] Response:', response.status, args[0]);
      return response;
      
    } catch (error: any) {
      console.error('❌ [Global Fetch Interceptor] Caught error:', error, 'for:', args[0]);
      
      // Return a fake Response object instead of throwing
      // Use 503 (Service Unavailable) instead of 0
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Network request failed',
          details: 'The server is unreachable or the request timed out',
          url: args[0]
        }), 
        {
          status: 503,
          statusText: error.name || 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        }
      );
    }
  };

  isInstalled = true;
  console.log('🛡️ [Global Fetch Interceptor] Installed successfully');
}

// 🚀 Auto-install when this module is imported
if (typeof window !== 'undefined') {
  setupGlobalFetchInterceptor();
}