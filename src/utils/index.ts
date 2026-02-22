/**
 * 工具函数库
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_HOTEL_IMAGE, DEFAULT_ROOM_IMAGE } from '../constants';
import { FavoriteHotel, Hotel, SearchHistoryItem } from '../types';

/**
 * 格式化价格
 */
export const formatPrice = (price: number): string => {
  return `¥${price}`;
};

/**
 * 格式化日期
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 获取相对时间
 */
export const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(dateStr);
  } else if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
};

/**
 * 获取评分显示
 */
export const getRatingDisplay = (rating: number): string => {
  return rating.toFixed(1);
};

/**
 * 获取酒店主图
 */
export const getHotelMainImage = (hotel: Hotel): string => {
  if (hotel.images && hotel.images.length > 0) {
    return hotel.images[0];
  }
  return DEFAULT_HOTEL_IMAGE;
};

/**
 * 获取房型主图
 */
export const getRoomMainImage = (images: string[] | undefined): string => {
  if (images && images.length > 0) {
    return images[0];
  }
  return DEFAULT_ROOM_IMAGE;
};

// ==================== 收藏相关 ====================

export const getFavorites = async (): Promise<FavoriteHotel[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return [];
  }
};

export const addFavorite = async (hotelId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const exists = favorites.some(f => f.hotelId === hotelId);
    if (!exists) {
      favorites.push({
        hotelId,
        addedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('添加收藏失败:', error);
  }
};

export const removeFavorite = async (hotelId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    console.log('当前收藏列表:', favorites);
    console.log('要移除的酒店ID:', hotelId);
    // 过滤掉要移除的酒店ID
    const filtered = favorites.filter(f => f.hotelId !== hotelId);
    console.log('过滤后的收藏列表:', filtered);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
    console.log('移除收藏成功');
  } catch (error) {
    console.error('移除收藏失败:', error);
  }
};

export const isFavorite = async (hotelId: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.some(f => f.hotelId === hotelId);
  } catch (error) {
    return false;
  }
};

// ==================== 搜索历史相关 ====================

export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
};

export const addSearchHistory = async (keyword: string): Promise<void> => {
  try {
    if (!keyword.trim()) return;
    
    let history = await getSearchHistory();
    history = history.filter(item => item.keyword !== keyword);
    history.unshift({
      id: Date.now().toString(),
      keyword,
      timestamp: Date.now(),
    });
    history = history.slice(0, 20);
    await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('添加搜索历史失败:', error);
  }
};

export const clearSearchHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    console.error('清除搜索历史失败:', error);
  }
};

export const removeSearchHistory = async (id: string): Promise<void> => {
  try {
    const history = await getSearchHistory();
    const filtered = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(filtered));
  } catch (error) {
    console.error('移除搜索历史失败:', error);
  }
};

// ==================== 其他工具 ====================

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastTime: number = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};
