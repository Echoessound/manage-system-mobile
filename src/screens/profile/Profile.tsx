/**
 * 个人中心屏幕
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useLogout } from '../../hooks';
import { MainTabScreenProps } from '../../navigation/types';
import { colors } from '../../constants';

type Props = MainTabScreenProps<'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, isLoggedIn } = useAuth();
  const { logout } = useLogout();
  const [showConfirm, setShowConfirm] = useState(false);

  // 点击退出登录按钮
  const handleLogoutPress = () => {
    setShowConfirm(true);
  };

  // 确认退出
  const handleConfirmLogout = async () => {
    setShowConfirm(false);
    try {
      await logout();
    } catch (error) {
      console.error('[Profile] 退出失败:', error);
    }
  };

  // 取消退出
  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 头部 */}
        <View style={styles.header}>
          <MaterialIcons name="account-circle" size={80} color="#fff" />
          {isLoggedIn && user ? (
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user.username}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={() => navigation.getParent()?.navigate('Login')}
            >
              <Text style={styles.loginBtnText}>登录/注册</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 菜单 */}
        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('Favorites')}
          >
            <MaterialIcons name="favorite" size={24} color={colors.primary} />
            <Text style={styles.menuText}>我的收藏</Text>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('BrowsingHistory')}
          >
            <MaterialIcons name="history" size={24} color={colors.primary} />
            <Text style={styles.menuText}>浏览历史</Text>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="info-outline" size={24} color={colors.primary} />
            <Text style={styles.menuText}>关于我们</Text>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* 退出登录按钮 - 只在登录状态下显示 */}
        {isLoggedIn && (
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutBtnText}>退出登录</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>酒店管理系统 v1.0.0</Text>
      </ScrollView>

      {/* 确认退出弹窗 */}
      {showConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>提示</Text>
            <Text style={styles.confirmText}>确定要退出登录吗？</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={handleCancelLogout}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmBtn}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.confirmBtnText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  userInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  loginBtn: {
    marginTop: 15,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  menu: {
    backgroundColor: '#fff',
    marginTop: 15,
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3b30',
    marginHorizontal: 15,
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  logoutBtnText: {
    marginLeft: 8,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
    color: '#999',
    fontSize: 12,
  },
  // 确认弹窗样式
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  confirmText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#666',
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
  },
  confirmBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProfileScreen;
