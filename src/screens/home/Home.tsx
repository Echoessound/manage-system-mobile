/**
 * 首页 - 酒店列表
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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useHotelList } from '../../hooks';
import { MainTabScreenProps } from '../../navigation/types';
import { Hotel } from '../../types';
import { DEFAULT_HOTEL_IMAGE } from '../../constants';
import { formatPrice, getRatingDisplay } from '../../utils';

type Props = MainTabScreenProps<'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { hotels, loading, hasMore, total, refresh, loadMore } = useHotelList();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderHotelItem = ({ item }: { item: Hotel }) => (
    <TouchableOpacity
      style={styles.hotelItem}
      onPress={() => navigation.navigate('HotelDetail', { hotelId: item.id, hotel: item })}
    >
      <Image
        source={{ uri: item.images?.[0] || DEFAULT_HOTEL_IMAGE }}
        style={styles.hotelImage}
        resizeMode="cover"
      />
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.hotelAddress} numberOfLines={1}>{item.address}</Text>
        <View style={styles.hotelMeta}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FF9800" />
            <Text style={styles.rating}>{getRatingDisplay(item.rating)}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount}条评价)</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.priceUnit}>起</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || hotels.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#1E90FF" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={hotels}
        renderItem={renderHotelItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Icon name="hotel" size={64} color="#ccc" />
              <Text style={styles.emptyText}>暂无酒店数据</Text>
            </View>
          )
        }
        contentContainerStyle={hotels.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  hotelItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  hotelImage: {
    width: 120,
    height: 120,
  },
  hotelInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  hotelAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  hotelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    color: '#1E90FF',
    fontWeight: 'bold',
  },
  priceUnit: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  footer: {
    padding: 10,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default HomeScreen;

