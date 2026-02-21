/**
 * API 服务层
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '../constants';
import {
  User,
  Hotel,
  HotelListParams,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  PaginatedData,
} from '../types';

// 创建 Axios 实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器 - 添加 Token
  client.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器 - 统一错误处理
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        // 服务器返回错误状态码
        const { status, data } = error.response;
        
        if (status === 401) {
          // 未授权，清除 token 并跳转到登录页
          AsyncStorage.multiRemove([
            STORAGE_KEYS.TOKEN,
            STORAGE_KEYS.USER,
          ]);
        }
        
        // 返回统一的错误格式
        return Promise.reject(new Error(data.message || '请求失败'));
      } else if (error.request) {
        // 请求已发出但没有收到响应
        return Promise.reject(new Error('网络连接失败，请检查网络'));
      } else {
        // 请求配置出错
        return Promise.reject(error);
      }
    }
  );

  return client;
};

const apiClient = createApiClient();

// ==================== 认证 API ====================

/**
 * 登录
 */
export const login = async (data: LoginRequest): Promise<ApiResponse<{ token: string; user: User }>> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

/**
 * 注册
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<{ userId: string }>> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

/**
 * 发送验证码
 */
export const sendVerificationCode = async (email: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.post('/auth/sendCode', { email });
  return response.data;
};

/**
 * 登出
 */
export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await apiClient.post('/user/logout');
  return response.data;
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  const response = await apiClient.get('/user/current');
  return response.data;
};

// ==================== 酒店 API ====================

/**
 * 获取酒店列表
 */
export const getHotelList = async (params: HotelListParams): Promise<ApiResponse<PaginatedData<Hotel>>> => {
  console.log('API call - getHotelList params:', params);
  const response = await apiClient.get('/hotel/list', { params });
  return response.data;
};

/**
 * 获取酒店详情
 */
export const getHotelDetail = async (hotelId: string): Promise<ApiResponse<Hotel>> => {
  const response = await apiClient.get(`/hotel/${hotelId}`);
  return response.data;
};

/**
 * 搜索酒店
 */
export const searchHotels = async (keyword: string, params?: HotelListParams): Promise<ApiResponse<PaginatedData<Hotel>>> => {
  const response = await apiClient.get('/hotel/search', {
    params: { keyword, ...params },
  });
  return response.data;
};

/**
 * 按城市获取酒店
 */
export const getHotelsByCity = async (city: string, params?: HotelListParams): Promise<ApiResponse<PaginatedData<Hotel>>> => {
  const response = await apiClient.get('/hotel/city', {
    params: { city, ...params },
  });
  return response.data;
};

/**
 * 获取热门酒店
 */
export const getPopularHotels = async (limit: number = 10): Promise<ApiResponse<Hotel[]>> => {
  const response = await apiClient.get('/hotel/list', {
    params: { limit, page: 1, pageSize: limit },
  });
  return response.data;
};

// ==================== 存储辅助函数 ====================

/**
 * 保存 Token
 */
export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

/**
 * 保存用户信息
 */
export const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * 清除认证信息
 */
export const clearAuth = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.USER,
  ]);
};

/**
 * 清除所有本地存储
 */
export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.clear();
};

export default apiClient;

