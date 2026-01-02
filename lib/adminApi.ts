/**
 * Admin API Client with dual-token strategy support
 * Handles all admin-related API calls with proper authentication
 */

import { projectId } from '../utils/supabase/info';
import { createAuthHeaders } from './api';
import { fetchWithRetry, parseJsonResponse } from './apiErrorHandler';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5`;

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  accessToken?: string;
  timeout?: number;
  retries?: number;
}

/**
 * Generic admin API call handler
 */
async function adminApiCall<T = any>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    accessToken,
    timeout = 45000,
    retries = 2
  } = options;

  const headers = createAuthHeaders(accessToken);

  const config: RequestInit = {
    method,
    headers,
    mode: 'cors',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const fullUrl = `${API_BASE}${endpoint}`;
  console.log(`🔑 [AdminAPI] ${method} ${endpoint}`, {
    hasToken: !!accessToken,
    isDevMode: accessToken?.startsWith('dev-user-')
  });

  try {
    const response = await fetchWithRetry(fullUrl, config, retries, timeout);

    if (!response.ok) {
      let errorMessage = 'Admin API request failed';
      try {
        const error = await parseJsonResponse<any>(response);
        errorMessage = error.error || error.message || errorMessage;
        console.error('❌ [AdminAPI] Error:', {
          endpoint,
          status: response.status,
          error: errorMessage
        });
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await parseJsonResponse<T>(response);
  } catch (error) {
    console.error('❌ [AdminAPI] Request failed:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Admin API endpoints
 */
export const adminApi = {
  // Stats
  getStats: (accessToken?: string) =>
    adminApiCall('/admin/stats', { accessToken }),

  // Users
  getUsers: (accessToken?: string) =>
    adminApiCall('/admin/users', { accessToken }),

  getUserDetails: (userId: string, accessToken?: string) =>
    adminApiCall(`/admin/users/${userId}`, { accessToken }),

  updateUserStatus: (userId: string, status: string, accessToken?: string) =>
    adminApiCall(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: { status },
      accessToken
    }),

  banUser: (userId: string, accessToken?: string) =>
    adminApiCall(`/admin/users/${userId}/ban`, {
      method: 'POST',
      accessToken
    }),

  createUser: (userData: any, accessToken?: string) =>
    adminApiCall('/admin/users', {
      method: 'POST',
      body: userData,
      accessToken
    }),

  deleteUser: (userId: string, accessToken?: string) =>
    adminApiCall(`/admin/users/${userId}`, {
      method: 'DELETE',
      accessToken
    }),

  addTestBalance: (userId: string, amount: number, accessToken?: string) =>
    adminApiCall('/admin/add-test-balance', {
      method: 'POST',
      body: { userId, amount },
      accessToken
    }),

  resetWallet: (userIdentifier: string, accessToken?: string) =>
    adminApiCall('/admin/reset-wallet', {
      method: 'POST',
      body: { userIdentifier },
      accessToken
    }),

  // Projects
  getProjects: (filters: any, accessToken?: string) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const query = params.toString();
    return adminApiCall(`/admin/projects${query ? `?${query}` : ''}`, { accessToken });
  },

  getProjectStats: (accessToken?: string) =>
    adminApiCall('/admin/projects/stats', { accessToken }),

  deleteProject: (projectId: string, accessToken?: string) =>
    adminApiCall(`/admin/projects/${projectId}`, {
      method: 'DELETE',
      accessToken
    }),

  updateProjectStatus: (projectId: string, status: string, accessToken?: string) =>
    adminApiCall(`/admin/projects/${projectId}/status`, {
      method: 'PUT',
      body: { status },
      accessToken
    }),

  rebuildProjectIndex: (accessToken?: string) =>
    adminApiCall('/admin/rebuild-project-index', {
      method: 'POST',
      accessToken
    }),

  // Transactions
  getTransactions: (filters: any, accessToken?: string) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const query = params.toString();
    return adminApiCall(`/admin/transactions${query ? `?${query}` : ''}`, { accessToken });
  },

  getTransactionStats: (accessToken?: string) =>
    adminApiCall('/admin/transactions/stats', { accessToken }),

  // Withdrawals
  getWithdrawals: (accessToken?: string) =>
    adminApiCall('/admin/withdrawals', { accessToken }),

  getAllWithdrawals: (accessToken?: string) =>
    adminApiCall('/admin/withdrawals/all', { accessToken }),

  approveWithdrawal: (withdrawalId: string, accessToken?: string) =>
    adminApiCall(`/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      accessToken
    }),

  rejectWithdrawal: (withdrawalId: string, reason: string, accessToken?: string) =>
    adminApiCall(`/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: { reason },
      accessToken
    }),

  // Memberships
  getMemberships: (filters: any, accessToken?: string) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const query = params.toString();
    return adminApiCall(`/admin/memberships${query ? `?${query}` : ''}`, { accessToken });
  },

  getMembershipStats: (accessToken?: string) =>
    adminApiCall('/admin/memberships/stats', { accessToken }),

  updateMembership: (userId: string, plan: string, accessToken?: string) =>
    adminApiCall(`/admin/memberships/${userId}`, {
      method: 'PUT',
      body: { plan },
      accessToken
    }),

  cancelMembership: (userId: string, accessToken?: string) =>
    adminApiCall(`/admin/memberships/${userId}`, {
      method: 'DELETE',
      accessToken
    }),

  // Bank Accounts
  getBankAccounts: (filters: any, accessToken?: string) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const query = params.toString();
    return adminApiCall(`/admin/bank-accounts${query ? `?${query}` : ''}`, { accessToken });
  },

  getBankAccountStats: (accessToken?: string) =>
    adminApiCall('/admin/bank-accounts/stats', { accessToken }),

  verifyBankAccount: (accountId: string, accessToken?: string) =>
    adminApiCall(`/admin/bank-accounts/${accountId}/verify`, {
      method: 'PUT',
      accessToken
    }),

  flagBankAccount: (accountId: string, accessToken?: string) =>
    adminApiCall(`/admin/bank-accounts/${accountId}/flag`, {
      method: 'PUT',
      accessToken
    }),

  deleteBankAccount: (accountId: string, accessToken?: string) =>
    adminApiCall(`/admin/bank-accounts/${accountId}`, {
      method: 'DELETE',
      accessToken
    }),
};

export default adminApi;
