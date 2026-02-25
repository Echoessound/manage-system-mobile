/**
 * 浏览历史屏幕
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getBrowsingHistoryFromServer, clearBrowsingHistoryFromServer } from '../../api';
import { formatPrice, getRatingDisplay } from '../../utils';
import { Hotel } from '../../types';
import { MainStackScreenProps } from '../../navigation/types';
import { colors, DEFAULT_HOTEL_IMAGE } from '../../constants';

type Props = MainStackScreenProps<'BrowsingHistory'>;

// 带原始hotelId的酒店数据
interface HotelWithOriginId extends Hotel {
  originHotelId: string;
  viewedAt?: string;
}

const BrowsingHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [hotels, setHotels] = useState<HotelWithOriginId[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBrowsingHistory = async () => {
    setLoading(true);
    try {
      const response = await getBrowsingHistoryFromServer();
      console.log('浏览历史响应:', response);
      
      if (response.code === 200 && response.data && response.data.items) {
        const historyItems = response.data.items
          .filter((item: any) => item && item.hotelId)
          .map((item: any) => ({
            ...item.hotelId,
            originHotelId: item.hotelId._id || item.hotelId,
            viewedAt: item.viewedAt,
          }));
        
        console.log('浏览历史数据:', historyItems.length);
        setHotels(historyItems);
      } else {
        console.log('没有浏览历史数据');
        setHotels([]);
      }
    } catch (error) {
      console.error('获取浏览历史失败:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBrowsingHistory();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBrowsingHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      '提示',
      '确定要清空所有浏览历史吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await clearBrowsingHistoryFromServer();
              setHotels([]);
              console.log('浏览历史已清空');
            } catch (error) {
              console.error('清空浏览历史失败:', error);
            }
          },
        },
      ]
    );
  };

  const handleHotelPress = (hotel: HotelWithOriginId) => {
    navigation.navigate('HotelDetail', { hotelId: hotel.originHotelId, hotel });
  };

  const formatViewedTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const renderHotelItem = ({ item }: { item: HotelWithOriginId }) => (
    <TouchableOpacity
      style={styles.hotelItem}
      onPress={() => handleHotelPress(item)}
    >
      <Image
        source={{ uri: item.images?.[0] || DEFAULT_HOTEL_IMAGE }}
        style={styles.hotelImage}
      />
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.hotelAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={14} color={colors.warning} />
          <Text style={styles.rating}>{getRatingDisplay(item.rating)}</Text>
          <Text style={styles.reviewCount}>({item.reviewCount}条评价)</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            <Text style={styles.priceUnit}>起</Text>
          </View>
          <Text style={styles.viewedTime}>{formatViewedTime(item.viewedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={64} color={colors.gray} />
      <Text style={styles.emptyText}>暂无浏览历史</Text>
      <Text style={styles.emptySubtext}>快去浏览感兴趣的酒店吧</Text>
    </View>
  );

  const renderHeader = () => {
    if (hotels.length === 0) return null;
    
    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>共浏览 {hotels.length} 家酒店</Text>
        <TouchableOpacity onPress={handleClearHistory}>
          <Text style={styles.clearText}>清空</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={hotels}
        renderItem={renderHotelItem}
        keyExtractor={(item) => item.originHotelId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 10,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  headerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clearText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  hotelItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hotelImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  hotelInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  hotelAddress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  priceUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  viewedTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default BrowsingHistoryScreen;

