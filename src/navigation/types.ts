/**
 * 导航类型定义
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { Hotel, User } from '../types';

// ==================== 堆栈导航参数 ====================

/** 认证堆栈 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** 主堆栈 */
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  HotelDetail: { hotelId: string; hotel?: Hotel };
  HotelList: { 
    city?: string; 
    keyword?: string;
    checkInDate?: string;
    checkOutDate?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    amenities?: string[];
  };
  Search: undefined;
  Filter: { 
    currentParams: {
      city?: string;
      minPrice?: number;
      maxPrice?: number;
      rating?: number;
      amenities?: string[];
    };
    onApply: (params: any) => void;
  };
};

/** 主标签页 */
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Profile: undefined;
};

// ==================== 屏幕 Props ====================

/** 认证屏幕 Props */
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

/** 主屏幕 Props */
export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;

/** 标签页 Props */
export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<MainStackParamList>
  >;

// ==================== 全局类型 ====================

/** 全局导航参数 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainStackParamList {}
  }
}


