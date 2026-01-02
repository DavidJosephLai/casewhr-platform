// API 資料類型定義
// Case Where 接得準股份有限公司 - API Types

// ============================================
// 通用類型
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ============================================
// 用戶認證相關
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  userType: 'client' | 'professional'; // 客戶或專業人士
  phone?: string;
  company?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'client' | 'professional';
  phone?: string;
  company?: string;
  avatar?: string;
  verified: boolean;
  createdAt: string;
}

// ============================================
// 聯絡表單
// ============================================

export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceType?: string;
  message: string;
}

export interface ContactResponse {
  id: string;
  status: 'pending' | 'processed' | 'replied';
  submittedAt: string;
}

// ============================================
// 專業人才
// ============================================

export interface Professional {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  category: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  hourlyRate?: number;
  verified: boolean;
  bio?: string;
  portfolio?: string[];
  availability: 'available' | 'busy' | 'unavailable';
}

export interface ProfessionalSearchRequest {
  category?: string;
  skills?: string[];
  minRating?: number;
  maxRate?: number;
  availability?: string;
  page?: number;
  pageSize?: number;
}

export interface ProfessionalSearchResponse {
  professionals: Professional[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// 服務分類
// ============================================

export interface ServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  professionalCount: number;
}

// ============================================
// 專案/案件
// ============================================

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  clientId: string;
  professionalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  deadline?: string;
  requiredSkills?: string[];
}

// ============================================
// 訂單/交易
// ============================================

export interface Order {
  id: string;
  projectId: string;
  clientId: string;
  professionalId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateOrderRequest {
  projectId: string;
  professionalId: string;
  amount: number;
  paymentMethod: string;
}

// ============================================
// 評價/評論
// ============================================

export interface Review {
  id: string;
  orderId: string;
  professionalId: string;
  clientId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  orderId: string;
  rating: number;
  comment: string;
}

// ============================================
// 分頁參數
// ============================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
