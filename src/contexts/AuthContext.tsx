/**
 * Auth Context - 管理全局认证状态
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { STORAGE_KEYS } from '../constants';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  setAuthState: (isLoggedIn: boolean, user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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

  const setAuthState = (loggedIn: boolean, userData: User | null) => {
    setIsLoggedIn(loggedIn);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;




