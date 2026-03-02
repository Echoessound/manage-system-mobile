/**
 * 搜索屏幕
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSearchHotels } from '../../hooks';
import { MainTabScreenProps } from '../../navigation/types';
import { Hotel } from '../../types';
import { DEFAULT_HOTEL_IMAGE } from '../../constants';
import { formatPrice, getRatingDisplay, getSearchHistory, addSearchHistory, clearSearchHistory, getFullImageUrl } from '../../utils';
import { colors } from '../../constants';

type Props = MainTabScreenProps<'Search'>;

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const [keyword, setKeyword] = useState('');
  const { results, loading, search, clear } = useSearchHotels();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  React.useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    const history = await getSearchHistory();
    setSearchHistory(history.map(h => h.keyword));
  };

  const handleSearch = useCallback((text: string) => {
    setKeyword(text);
    if (text.trim()) {
      search(text);
      addSearchHistory(text);
    } else {
      clear();
    }
  }, [search, clear]);

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setSearchHistory([]);
  };

  const renderHotelItem = ({ item }: { item: Hotel }) => (
    <TouchableOpacity
      style={styles.hotelItem}
      onPress={() => navigation.navigate('HotelDetail', { hotelId: item._id || item.id, hotel: item })}
    >
      <Image
        source={{ uri: getFullImageUrl(item.images?.[0]) || DEFAULT_HOTEL_IMAGE }}
        style={styles.hotelImage}
        resizeMode="cover"
      />
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.hotelAddress} numberOfLines={1}>{item.address}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleSearch(item)}
    >
      <MaterialIcons name="history" size={20} color={colors.gray} />
      <Text style={styles.historyText}>{item}</Text>
    </TouchableOpacity>
  );

  const showHistory = !keyword && searchHistory.length > 0;
  const showResults = keyword.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索酒店名称或地址"
          value={keyword}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {keyword.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialIcons name="close" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {showHistory && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>搜索历史</Text>
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearText}>清除</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `${item}-${index}`}
          />
        </View>
      )}

      {showResults && !loading && (
        <FlatList
          data={results}
          renderItem={renderHotelItem}
          keyExtractor={(item) => item._id || item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>未找到相关酒店</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  hotelItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  hotelImage: {
    width: 100,
    height: 100,
  },
  hotelInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  hotelAddress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceContainer: {
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  historyContainer: {
    flex: 1,
    padding: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  clearText: {
    color: colors.primary,
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.gray,
  },
});

export default SearchScreen;


