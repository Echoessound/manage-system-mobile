/**
 * 酒店列表页面
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { MainStackScreenProps } from '../../navigation/types';
import { Hotel } from '../../types';
import { DEFAULT_HOTEL_IMAGE } from '../../constants';
import { formatPrice, getRatingDisplay } from '../../utils';

type Props = MainStackScreenProps<'HotelList'>;

const HotelListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { city = '北京', keyword = '' } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  
  console.log('HotelList params:', { city, keyword });
  
  const { hotels, loading, hasMore, total, refresh, loadMore, updateParams } = useHotelList();
  
  console.log('HotelList rendering - total:', total, 'hotels:', hotels.length);

  // 根据参数加载酒店
  useEffect(() => {
    console.log('Updating params:', { city, keyword });
    updateParams({ city, keyword: keyword || undefined });
  }, [city, keyword]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderHotelItem = ({ item }: { item: Hotel }) => (
    <TouchableOpacity
      style={styles.hotelItem}
      onPress={() => navigation.navigate('HotelDetail', { hotelId: item._id || item.id, hotel: item })}
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
            <MaterialIcons name="star" size={16} color="#FF9800" />
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
    <View style={styles.container} key={total}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialIcons name="location-on" size={20} color="#1E90FF" />
          <Text style={styles.headerCity}>{city}</Text>
          {keyword ? (
            <Text style={styles.headerKeyword}> · 关键词: {keyword}</Text>
          ) : null}
        </View>
        <Text style={styles.headerTotal}>共 {total} 家酒店</Text>
      </View>

      {/* 酒店列表 */}
      <FlatList
        data={hotels}
        renderItem={renderHotelItem}
        keyExtractor={(item) => item._id || item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="hotel" size={64} color="#ccc" />
              <Text style={styles.emptyText}>暂无{city}酒店数据</Text>
              <Text style={styles.emptySubText}>试试搜索其他条件</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  headerKeyword: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  headerTotal: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  hotelItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 10,
    marginTop: 5,
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
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#ccc',
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default HotelListScreen;

