/**
 * 个人中心屏幕
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, useLogout } from '../../hooks';
import { clearStorage } from '../../api';
import { MainTabScreenProps } from '../../navigation/types';
import { colors } from '../../constants';

type Props = MainTabScreenProps<'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, isLoggedIn } = useAuth();
  const { logout, loading } = useLogout();

  const handleLogout = () => {
    Alert.alert(
      '提示',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await logout();
              await clearStorage();
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            } catch (error) {
              Alert.alert('错误', '退出登录失败');
            }
          },
        },
      ]
    );
  };

  const MenuItem = ({ 
    icon, 
    title, 
    onPress,
    showArrow = true 
  }: { 
    icon: string; 
    title: string; 
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon name={icon} size={24} color={colors.primary} />
      <Text style={styles.menuTitle}>{title}</Text>
      {showArrow && <Icon name="chevron-right" size={24} color={colors.gray} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Icon name="account-circle" size={80} color={colors.primary} />
        </View>
        {isLoggedIn && user ? (
          <>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => {}}
          >
            <Text style={styles.loginButtonText}>登录/注册</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.menuSection}>我的订单</Text>
        <MenuItem icon="receipt" title="全部订单" />
        <MenuItem icon="hotel" title="酒店订单" />

        <Text style={styles.menuSection}>我的收藏</Text>
        <MenuItem 
          icon="favorite" 
          title="我的收藏" 
          onPress={() => navigation.navigate('Favorites')} 
        />

        <Text style={styles.menuSection}>其他</Text>
        <MenuItem icon="help-outline" title="帮助中心" />
        <MenuItem icon="settings" title="设置" />
        <MenuItem icon="info-outline" title="关于我们" />
      </View>

      {isLoggedIn && (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Text style={styles.logoutText}>
            {loading ? '退出中...' : '退出登录'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>酒店管理系统 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  loginButton: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingHorizontal: 15,
  },
  menuSection: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.background,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 15,
  },
  logoutButton: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: colors.error,
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.gray,
  },
});

export default ProfileScreen;

