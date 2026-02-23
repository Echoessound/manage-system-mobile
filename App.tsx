/**
 * 应用程序入口
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { AuthProvider } from './src/hooks';
import { getAllChinaCities } from './src/services/location';

const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 预加载城市数据到缓存
    const preloadCities = async () => {
      try {
        console.log('开始预加载城市数据...');
        await getAllChinaCities();
        console.log('城市数据预加载完成');
      } catch (error) {
        console.error('预加载城市数据失败:', error);
      } finally {
        setReady(true);
      }
    };
    preloadCities();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;

