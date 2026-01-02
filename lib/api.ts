import { projectId, publicAnonKey } from '../utils/supabase/info';
import { fetchWithRetry, parseJsonResponse } from './apiErrorHandler';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;

// Custom error class to include HTTP status code
class ApiError extends Error {
  status: number;
  details?: string;
  type?: string;
  
  constructor(message: string, status: number, details?: string, type?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.type = type;
  }
}

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

/**
 * ✅ Helper function to create headers with dual-token strategy for dev mode
 * - In dev mode (token starts with 'dev-user-'): Uses publicAnonKey for auth, sends dev token in X-Dev-Token header
 * - In normal mode: Uses the access token directly
 */
export function createAuthHeaders(accessToken?: string): Record<string, string> {
  const isDevMode = accessToken?.startsWith('dev-user-');
  const authToken = isDevMode ? publicAnonKey : (accessToken || publicAnonKey);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
  
  // Add dev mode token in custom header
  if (isDevMode && accessToken) {
    headers['X-Dev-Token'] = accessToken;
  }
  
  return headers;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, token } = options;
  
  // Validate that we have the necessary configuration
  if (!projectId || !publicAnonKey) {
    console.error('Missing Supabase configuration:', { projectId, publicAnonKey: publicAnonKey ? 'set' : 'missing' });
    throw new Error('Supabase configuration is missing. Please check your setup.');
  }
  
  // ✅ Use the dual-token strategy helper
  const headers = createAuthHeaders(token);

  const config: RequestInit = {
    method,
    headers,
    mode: 'cors',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const fullUrl = `${API_BASE}${endpoint}`;
  console.log('🌐 API Call:', { method, url: fullUrl });

  try {
    // Use fetchWithRetry for better error handling and automatic retries
    const response = await fetchWithRetry(
      fullUrl, 
      config,
      2, // maxRetries
      45000 // 45 second timeout - increased for better stability
    );
    
    if (!response.ok) {
      let errorMessage = 'API request failed';
      let errorDetails = null;
      let errorType = null;
      try {
        const error = await parseJsonResponse<any>(response);
        errorMessage = error.error || errorMessage;
        errorDetails = error.details;
        errorType = error.type;
        
        // ✅ 對於「已提交提案」這種預期中的業務錯誤，使用較低級別的日誌
        const isExpectedBusinessError = (
          errorMessage.includes('already submitted a proposal') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate')
        );
        
        if (isExpectedBusinessError) {
          console.log('ℹ️ Business validation:', {
            status: response.status,
            message: errorMessage,
          });
        } else {
          // Log full server error for unexpected errors
          console.error('❌ Server error response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            details: errorDetails,
            type: errorType,
            fullResponse: error
          });
        }
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      const fullError = errorDetails 
        ? `${errorMessage} - ${errorDetails} ${errorType ? `(${errorType})` : ''}` 
        : errorMessage;
      throw new ApiError(fullError, response.status, errorDetails, errorType);
    }

    const data = await parseJsonResponse<any>(response);
    
    // ✅ Always ensure we return valid data structure
    // If the response doesn't have the expected shape, return empty defaults
    if (endpoint.includes('/projects') && !data.projects) {
      console.warn('⚠️  API response missing projects array, returning empty array');
      return { projects: [], ...data };
    }
    
    return data;
  } catch (error) {
    // ✅ 對於「已提交提案」這種預期中的業務錯誤，使用較低級別的日誌
    const isExpectedBusinessError = error instanceof Error && (
      error.message.includes('already submitted a proposal') ||
      error.message.includes('already exists') ||
      error.message.includes('duplicate')
    );
    
    if (isExpectedBusinessError) {
      console.log('ℹ️ Business validation error:', {
        endpoint,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } else {
      // Log detailed error information for unexpected errors
      console.error('❌ API call failed:', {
        endpoint,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        fullUrl,
      });
    }
    
    // ✅ For project endpoints, return empty array instead of throwing
    if (endpoint.includes('/projects')) {
      console.warn('⚠️  Returning empty projects array due to API error');
      return { projects: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    throw error;
  }
}

// Project API
export const projectApi = {
  create: (data: any, token: string) => 
    apiCall('/projects', { method: 'POST', body: data, token }),
  
  getAll: (filters?: { 
    status?: string; 
    category?: string; 
    required_skills?: string; 
    user_id?: string;
    sort_by?: string;
    budget_min?: string;
    budget_max?: string;
    search_query?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.required_skills) params.append('required_skills', filters.required_skills);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.budget_min) params.append('budget_min', filters.budget_min);
    if (filters?.budget_max) params.append('budget_max', filters.budget_max);
    if (filters?.search_query) params.append('search_query', filters.search_query);
    const query = params.toString();
    console.log('🌐 [projectApi.getAll] Building request:', {
      filters,
      queryParams: query,
      fullUrl: `/projects${query ? `?${query}` : ''}`
    });
    return apiCall(`/projects${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) => 
    apiCall(`/projects/${id}`),
  
  update: (id: string, data: any, token: string) => 
    apiCall(`/projects/${id}`, { method: 'PUT', body: data, token }),
  
  markProjectAsCompleted: (id: string, token: string) => 
    apiCall(`/projects/${id}`, { method: 'PUT', body: { status: 'completed' }, token }),
  
  delete: (id: string, token: string) => 
    apiCall(`/projects/${id}`, { method: 'DELETE', token }),
};

// Proposal API
export const proposalApi = {
  create: (data: any, token: string) => 
    apiCall('/proposals', { method: 'POST', body: data, token }),
  
  getByProject: (projectId: string, token: string) => 
    apiCall(`/proposals/project/${projectId}`, { token }),
  
  getByUser: (userId: string, token: string) => 
    apiCall(`/proposals/user/${userId}`, { token }),
  
  updateStatus: (id: string, status: string, token: string) => 
    apiCall(`/proposals/${id}`, { method: 'PUT', body: { status }, token }),
  
  // ✅ Update milestone_plan_status
  updateMilestonePlanStatus: (id: string, milestone_plan_status: string, token: string) => 
    apiCall(`/proposals/${id}`, { method: 'PUT', body: { milestone_plan_status }, token }),
};

// Review API
export const reviewApi = {
  create: (data: any, token: string) => 
    apiCall('/reviews', { method: 'POST', body: data, token }),
  
  getByUser: (userId: string) => 
    apiCall(`/reviews/user/${userId}`),
};

// Portfolio API
export const portfolioApi = {
  get: (userId: string) => 
    apiCall(`/portfolio/${userId}`),
  
  update: (userId: string, portfolio_items: any[], token: string) => 
    apiCall(`/portfolio/${userId}`, { method: 'PUT', body: { portfolio_items }, token }),
};