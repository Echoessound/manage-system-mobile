/**
 * 收藏屏幕
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getFavorites, removeFavorite, getHotelMainImage, getFullImageUrl } from '../../utils';
import { formatPrice, getRatingDisplay } from '../../utils';
import { FavoriteHotel, Hotel } from '../../types';
import { MainTabScreenProps } from '../../navigation/types';
import { colors, DEFAULT_HOTEL_IMAGE } from '../../constants';
import { getHotelDetail, getFavoritesFromServer, removeFavoriteFromServer } from '../../api';

type Props = MainTabScreenProps<'Favorites'>;

// 带原始hotelId的酒店数据
interface HotelWithOriginId extends Hotel {
  originHotelId: string;
}

const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const [favorites, setFavorites] = useState<FavoriteHotel[]>([]);
  const [hotels, setHotels] = useState<HotelWithOriginId[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // 只从服务器获取收藏列表
      let favs: FavoriteHotel[] = [];
      let hotelsFromServer: any[] = [];
      
      try {
        const response = await getFavoritesFromServer();
        
        if (response.code === 200 && response.data && response.data.items) {
          // 收藏列表接口已经返回了酒店详情，直接使用
          hotelsFromServer = response.data.items
            .filter((hotel: any) => hotel && hotel._id)
            .map((hotel: any) => ({
              ...hotel,
              originHotelId: hotel._id,
            }));
          
          favs = hotelsFromServer.map(h => ({
            hotelId: h._id,
            addedAt: h.favoritedAt || h.createdAt || new Date().toISOString(),
          }));
        }
      } catch (error) {
        console.error('从服务器获取收藏失败:', error);
      }
      
      // 如果服务器返回了酒店详情，直接使用
      if (hotelsFromServer.length > 0) {
        setFavorites(favs);
        setHotels(hotelsFromServer as HotelWithOriginId[]);
        setLoading(false);
        return;
      }
      
      // 服务器没有返回数据，显示空状态
      setFavorites([]);
      setHotels([]);
    } catch (error) {
      console.error('加载收藏失败:', error);
      setFavorites([]);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (hotelId: string) => {
    try {
      // 先调用后端 API 移除收藏
      try {
        await removeFavoriteFromServer(hotelId);
      } catch (error) {
        console.error('后端取消收藏失败:', error);
      }
      // 同时移除本地存储
      await removeFavorite(hotelId);
      // 从列表中移除该酒店
      setHotels(prev => prev.filter(h => h.originHotelId !== hotelId));
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  const handleHotelPress = (hotel: HotelWithOriginId) => {
    navigation.navigate('HotelDetail', { hotelId: hotel.originHotelId, hotel });
  };

  const renderHotelItem = ({ item }: { item: HotelWithOriginId }) => (
    <TouchableOpacity
      style={styles.hotelItem}
      onPress={() => handleHotelPress(item)}
    >
      <Image
        source={{ uri: getFullImageUrl(item.images?.[0]) || DEFAULT_HOTEL_IMAGE }}
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
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.priceUnit}>起</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleRemoveFavorite(item.originHotelId)}
      >
        <MaterialIcons name="favorite" size={24} color={colors.secondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="favorite-border" size={64} color={colors.gray} />
      <Text style={styles.emptyText}>暂无收藏</Text>
      <Text style={styles.emptySubtext}>快去发现喜欢的酒店吧</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={hotels}
        renderItem={renderHotelItem}
        keyExtractor={(item) => item.originHotelId}
        contentContainerStyle={styles.listContent}
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
  favoriteButton: {
    justifyContent: 'center',
    paddingLeft: 10,
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

export default FavoritesScreen;


