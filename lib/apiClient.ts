import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * API 客戶端 - 統一處理 API 調用和錯誤
 */
class ApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;
  }

  /**
   * 通用請求方法
   */
  async request<T>(
    endpoint: string,
    options: FetchOptions = {},
    accessToken?: string | null
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 添加認證 header
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      console.log(`📡 [ApiClient] ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const status = response.status;
      
      // 處理 401 錯誤 - Session 過期
      if (status === 401) {
        console.error('❌ [ApiClient] 401 Unauthorized - Session expired');
        
        // 觸發全局事件，讓 App 處理登出
        window.dispatchEvent(new CustomEvent('session-expired'));
        
        return {
          data: null,
          error: 'Session expired. Please sign in again.',
          status: 401,
        };
      }

      // 處理其他錯誤狀態碼
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${status}`;
        
        console.error(`❌ [ApiClient] Error ${status}:`, errorMessage);
        
        return {
          data: null,
          error: errorMessage,
          status,
        };
      }

      // 成功響應
      const data = await response.json();
      console.log(`✅ [ApiClient] Success ${status}`);
      
      return {
        data: data as T,
        error: null,
        status,
      };

    } catch (error) {
      console.error('❌ [ApiClient] Network error:', error);
      
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * GET 請求
   */
  async get<T>(endpoint: string, accessToken?: string | null) {
    return this.request<T>(endpoint, { method: 'GET' }, accessToken);
  }

  /**
   * POST 請求
   */
  async post<T>(endpoint: string, body?: any, accessToken?: string | null) {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      accessToken
    );
  }

  /**
   * PUT 請求
   */
  async put<T>(endpoint: string, body?: any, accessToken?: string | null) {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      accessToken
    );
  }

  /**
   * DELETE 請求
   */
  async delete<T>(endpoint: string, accessToken?: string | null) {
    return this.request<T>(endpoint, { method: 'DELETE' }, accessToken);
  }
}

// 導出單例
export const apiClient = new ApiClient();
