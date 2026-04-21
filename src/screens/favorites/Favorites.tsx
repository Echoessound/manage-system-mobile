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
      const response = await getFavoritesFromServer();
      if (response.code === 200 && response.data?.items) {
        const items = response.data.items;

        // 统一 ID 字段：hotel._id（Mongoose ObjectId）-> originHotelId
        const mappedHotels: HotelWithOriginId[] = items
          .filter((h: any) => h && (h._id || h.id))
          .map((h: any) => ({
            ...h,
            originHotelId: (h._id || h.id).toString(),
          }));

        const favs: FavoriteHotel[] = items
          .filter((h: any) => h && (h._id || h.id))
          .map((h: any) => ({
            hotelId: (h._id || h.id).toString(),
            addedAt: h.favoritedAt || h.createdAt || new Date().toISOString(),
          }));

        setFavorites(favs);
        setHotels(mappedHotels);
      } else {
        // 非 200 或无数据时清空
        setFavorites([]);
        setHotels([]);
      }
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
    // 同时清理本地存储和后端
    await Promise.all([
      removeFavorite(hotelId).catch(err => console.error('本地移除失败:', err)),
      removeFavoriteFromServer(hotelId).catch(err => console.error('后端取消收藏失败:', err)),
    ]);
    setHotels(prev => prev.filter(h => h.originHotelId !== hotelId));
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
          <Text style={styles.reviewCount}>({item.reviewCount ?? 0}条评价)</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(item.price ?? 0)}</Text>
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


