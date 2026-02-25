/**
 * 导航根组件
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const RootNavigator = () => {
  const { isLoggedIn, loading } = useAuth();
  const [authKey, setAuthKey] = useState(0);

  // 当 isLoggedIn 改变时，强制刷新组件
  useEffect(() => {
    console.log('RootNavigator: isLoggedIn changed to', isLoggedIn);
    setAuthKey(prev => prev + 1);
  }, [isLoggedIn]);

  if (loading) {
    return null;
  }

  console.log('RootNavigator: rendering, isLoggedIn =', isLoggedIn);

  return (
    <NavigationContainer key={authKey}>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;





