/**
 * Expo 配置
 */

export default {
  expo: {
    name: '酒店管理系统',
    slug: 'hotel-management-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1E90FF',
    },
    assetBundlePatterns: [
      '**/*',
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hotel.manage',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1E90FF',
      },
      package: 'com.hotel.manage',
    },
    web: {
      favicon: './assets/favicon.png',
      lang: 'zh-CN',
    },
  },
};
