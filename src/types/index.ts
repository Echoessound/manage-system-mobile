/**
 * 酒店管理系统 - 数据类型定义
 * ==========================================
 */

// ==================== 用户相关类型 ====================

/** 用户角色类型 */
export type UserRole = 'user' | 'merchant' | 'admin';

/** 用户状态 */
export type UserStatus = 'active' | 'inactive';

/** 用户基础信息 */
export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

/** 用户注册请求 */
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  code: string;
  phone?: string;
}

/** 用户登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 用户登录响应 */
export interface LoginResponse {
  user: User;
  token: string;
}

// ==================== 酒店相关类型 ====================

/** 酒店审核状态 */
export type HotelStatus = 'pending' | 'approved' | 'rejected';

/** 酒店设施 */
export interface HotelAmenity {
  id: string;
  name: string;
  icon?: string;
}

/** 酒店基本信息 */
export interface Hotel {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviewCount: number;
  price: number;
  images: string[];
  amenities: string[];
  status: HotelStatus;
  merchantId?: string;
  createdAt: string;
  updatedAt?: string;
}

/** 酒店列表查询参数 */
export interface HotelListParams {
  city?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  status?: HotelStatus;
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/** 房型信息 */
export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  bedType?: string;
  area?: number;
  images: string[];
  amenities: string[];
  totalRooms: number;
  availableRooms: number;
  createdAt: string;
  updatedAt?: string;
}

/** 酒店详情 */
export interface HotelDetail extends Hotel {
  roomTypes: RoomType[];
}

// ==================== 分页相关类型 ====================

/** 分页数据 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== 收藏相关类型 ====================

/** 收藏的酒店 */
export interface FavoriteHotel {
  hotelId: string;
  addedAt: string;
}

// ==================== 搜索历史相关类型 ====================

/** 搜索历史项 */
export interface SearchHistoryItem {
  id: string;
  keyword: string;
  timestamp: number;
}

// ==================== API 响应类型 ====================

/** 通用 API 响应 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}



