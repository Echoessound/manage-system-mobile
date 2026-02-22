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
import { getFavorites, removeFavorite, getHotelMainImage } from '../../utils';
import { formatPrice, getRatingDisplay } from '../../utils';
import { FavoriteHotel, Hotel } from '../../types';
import { MainTabScreenProps } from '../../navigation/types';
import { colors, DEFAULT_HOTEL_IMAGE } from '../../constants';
import { getHotelDetail } from '../../api';

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
      const favs = await getFavorites();
      console.log('获取到的收藏列表:', favs);
      setFavorites(favs);
      
      // 加载每个酒店的详情，保留原始的hotelId
      const hotelPromises = favs.map(async (fav) => {
        try {
          console.log('正在获取酒店详情, hotelId:', fav.hotelId);
          const response = await getHotelDetail(fav.hotelId);
          console.log('酒店详情响应:', response);
          if (response.code === 200 && response.data) {
            // 将原始hotelId附加到酒店对象上
            return { ...response.data, originHotelId: fav.hotelId };
          }
          return null;
        } catch (err) {
          console.error('获取酒店详情失败:', err);
          return null;
        }
      });
      
      const hotelResults = await Promise.all(hotelPromises);
      console.log('所有酒店数据:', hotelResults);
      setHotels(hotelResults.filter((h): h is HotelWithOriginId => h !== null));
    } catch (error) {
      console.error('加载收藏失败:', error);
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
    console.log('取消收藏, hotelId:', hotelId);
    try {
      await removeFavorite(hotelId);
      // 从列表中移除该酒店
      setHotels(prev => prev.filter(h => h.originHotelId !== hotelId));
      console.log('取消收藏成功');
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


