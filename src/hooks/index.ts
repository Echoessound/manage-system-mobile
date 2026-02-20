/**
 * 自定义 Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getHotelList,
  getHotelDetail,
  searchHotels,
  getHotelsByCity,
  login as apiLogin,
  register as apiRegister,
  sendVerificationCode as apiSendCode,
  logout as apiLogout,
  saveToken,
  saveUser,
} from '../api';
import {
  Hotel,
  HotelListParams,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types';
import { STORAGE_KEYS } from '../constants';

// ==================== 认证相关 Hooks ====================

/**
 * 登录 Hook
 */
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiLogin(data);
      if (response.code === 200 && response.data) {
        await saveToken(response.data.token);
        await saveUser(response.data.user);
        return response.data;
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '登录失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
};

/**
 * 注册 Hook
 */
export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const response = await apiSendCode(email);
      if (response.code === 200) {
        return true;
      } else {
        throw new Error(response.message || '发送验证码失败');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '发送验证码失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRegister(data);
      if (response.code === 200) {
        return response.data;
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '注册失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, sendCode, loading, error };
};

/**
 * 登出 Hook
 */
export const useLogout = () => {
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  return { logout, loading };
};

/**
 * 检查登录状态 Hook
 */
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        
        if (token && userJson) {
          setIsLoggedIn(true);
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isLoggedIn, user, loading };
};

// ==================== 酒店相关 Hooks ====================

/**
 * 酒店列表 Hook
 */
export const useHotelList = (initialParams?: HotelListParams) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState<HotelListParams>(initialParams || {});

  const fetchHotels = useCallback(async (reset: boolean = false) => {
    const currentPage = reset ? 1 : page;
    
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        ...params,
        page: currentPage,
        pageSize: 10,
      };
      
      const response = await getHotelList(queryParams);
      
      if (response.code === 200 && response.data) {
        const newHotels = reset 
          ? response.data.items 
          : [...hotels, ...response.data.items];
        
        setHotels(newHotels);
        setTotal(response.data.total);
        setHasMore(currentPage < response.data.totalPages);
        setPage(currentPage);
      } else {
        throw new Error(response.message || '获取酒店列表失败');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '获取酒店列表失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, params, hotels, loading]);

  const refresh = useCallback(() => {
    setPage(1);
    setHotels([]);
    fetchHotels(true);
  }, [fetchHotels]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchHotels(false);
    }
  }, [hasMore, loading, fetchHotels]);

  const updateParams = useCallback((newParams: Partial<HotelListParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
    setPage(1);
    setHotels([]);
  }, []);

  useEffect(() => {
    fetchHotels(true);
  }, []);

  return {
    hotels,
    loading,
    error,
    hasMore,
    total,
    refresh,
    loadMore,
    updateParams,
    params,
  };
};

/**
 * 搜索酒店 Hook
 */
export const useSearchHotels = () => {
  const [results, setResults] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (keyword: string, params?: HotelListParams) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchHotels(keyword, params);
      
      if (response.code === 200 && response.data) {
        setResults(response.data.items);
      } else {
        throw new Error(response.message || '搜索失败');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '搜索失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
};

/**
 * 酒店详情 Hook
 */
export const useHotelDetail = (hotelId: string) => {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!hotelId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getHotelDetail(hotelId);
      
      if (response.code === 200 && response.data) {
        setHotel(response.data);
      } else {
        throw new Error(response.message || '获取酒店详情失败');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '获取酒店详情失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { hotel, loading, error, refresh: fetchDetail };
};

// ==================== 收藏相关 Hooks ====================

/**
 * 收藏 Hook
 */
export const useFavorite = (hotelId: string) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkFavorite = useCallback(async () => {
    try {
      const favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (favorites) {
        const parsed = JSON.parse(favorites);
        setIsFavorite(parsed.some((f: any) => f.hotelId === hotelId));
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  }, [hotelId]);

  const toggleFavorite = useCallback(async () => {
    setLoading(true);
    try {
      const favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      let parsed: any[] = favorites ? JSON.parse(favorites) : [];
      
      const exists = parsed.some(f => f.hotelId === hotelId);
      
      if (exists) {
        parsed = parsed.filter(f => f.hotelId !== hotelId);
      } else {
        parsed.push({
          hotelId,
          addedAt: new Date().toISOString(),
        });
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(parsed));
      setIsFavorite(!exists);
    } catch (error) {
      console.error('切换收藏状态失败:', error);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  return { isFavorite, toggleFavorite, loading };
};

