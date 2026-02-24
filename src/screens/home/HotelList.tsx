/**
 * 酒店列表页面
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useHotelList } from '../../hooks';
import { MainStackScreenProps } from '../../navigation/types';
import { Hotel } from '../../types';
import { DEFAULT_HOTEL_IMAGE } from '../../constants';
import { formatPrice, getRatingDisplay } from '../../utils';
import { getAllChinaCities, CityInfo } from '../../services/location';

type Props = MainStackScreenProps<'HotelList'>;

// 筛选条件选项
const RATING_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '5星', value: 5 },
  { label: '4星', value: 4 },
  { label: '3星', value: 3 },
];

const AMENITIES_OPTIONS = [
  'WiFi', '游泳池', '健身房', '餐厅', '停车场', 'SPA', 
  '江景', '早餐', '接机服务', '24小时前台', '空调', '电视'
];

const HotelListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { city = '北京', keyword = '', checkInDate, checkOutDate, minPrice, maxPrice, rating, amenities } = route.params || {};
  
  // 核心筛选状态
  const [searchKeyword, setSearchKeyword] = useState(keyword || '');
  const [showFilters, setShowFilters] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedCity, setSelectedCity] = useState(city);
  const [cityList, setCityList] = useState<CityInfo[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  
  // 详细筛选状态
  const [filterMinPrice, setFilterMinPrice] = useState<number | undefined>(minPrice);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | undefined>(maxPrice);
  const [filterRating, setFilterRating] = useState<number>(rating || 0);
  const [filterAmenities, setFilterAmenities] = useState<string[]>(amenities || []);
  
  const [refreshing, setRefreshing] = useState(false);
  
  console.log('HotelList params:', { city, keyword, checkInDate, checkOutDate, minPrice, maxPrice, rating, amenities });
  
  const { hotels, loading, hasMore, total, refresh, loadMore, updateParams } = useHotelList();
  
  console.log('HotelList rendering - total:', total, 'hotels:', hotels.length);

  // 计算间夜数
  const nightCount = useMemo(() => {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 1;
    }
    return 1;
  }, [checkInDate, checkOutDate]);

  // 格式化日期显示
  const formatDateDisplay = (date?: string) => {
    if (!date) return '请选择';
    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 根据参数加载酒店
  useEffect(() => {
    console.log('Updating params:', { city, keyword, filterMinPrice, filterMaxPrice, filterRating, filterAmenities });
    updateParams({ 
      city, 
      keyword: searchKeyword || undefined,
      minPrice: filterMinPrice,
      maxPrice: filterMaxPrice,
      rating: filterRating || undefined,
      amenities: filterAmenities.length > 0 ? filterAmenities : undefined,
    });
  }, [city, searchKeyword, filterMinPrice, filterMaxPrice, filterRating, filterAmenities]);

  // 搜索关键词变化时更新
  useEffect(() => {
    setSearchKeyword(keyword || '');
  }, [keyword]);

  // 加载城市列表
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = await getAllChinaCities();
        if (cities.length > 0) {
          setCityList(cities);
        }
      } catch (error) {
        console.error('加载城市列表失败:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  // 过滤有有效拼音首字母的城市，并按拼音首字母排序
  const sortedCityList = useMemo(() => [...cityList]
    .filter(city => {
      const pinyin = city.pinyin || city.name;
      return /^[A-Za-z]/.test(pinyin);
    })
    .sort((a, b) => 
      (a.pinyin || a.name).localeCompare(b.pinyin || b.name, 'en-US')
    ), [cityList]);

  // 按拼音首字母分组的城市列表
  const groupedCities = useMemo(() => sortedCityList.reduce((groups, city) => {
    const pinyin = city.pinyin || city.name;
    const firstLetter = pinyin.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(city);
    return groups;
  }, {} as Record<string, typeof cityList>), [sortedCityList]);

  const citySections = Object.keys(groupedCities).sort();

  // 应用筛选
  const applyFilters = useCallback(() => {
    updateParams({
      city,
      keyword: searchKeyword || undefined,
      minPrice: filterMinPrice,
      maxPrice: filterMaxPrice,
      rating: filterRating || undefined,
      amenities: filterAmenities.length > 0 ? filterAmenities : undefined,
    });
    setShowFilters(false);
  }, [city, searchKeyword, filterMinPrice, filterMaxPrice, filterRating, filterAmenities]);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setFilterMinPrice(undefined);
    setFilterMaxPrice(undefined);
    setFilterRating(0);
    setFilterAmenities([]);
    setSearchKeyword('');
  }, []);

  // 切换设施选中
  const toggleAmenity = (amenity: string) => {
    setFilterAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

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

  // 核心筛选头部
  const renderCoreFilterHeader = () => (
    <View style={styles.coreFilterContainer}>
      {/* 城市/日期行 */}
      <View style={styles.coreFilterRow}>
        {/* 城市选择 */}
        <TouchableOpacity 
          style={styles.coreFilterItem}
          onPress={() => setShowCityPicker(true)}
        >
          <MaterialIcons name="location-on" size={18} color="#1E90FF" />
          <Text style={styles.coreFilterText} numberOfLines={1}>{selectedCity}</Text>
          <MaterialIcons name="arrow-drop-down" size={18} color="#666" />
        </TouchableOpacity>

        {/* 入住日期 */}
        <TouchableOpacity style={styles.coreFilterItem}>
          <Text style={styles.coreFilterLabel}>入住</Text>
          <Text style={styles.coreFilterText}>{formatDateDisplay(checkInDate)}</Text>
        </TouchableOpacity>

        {/* 离店日期 */}
        <TouchableOpacity style={styles.coreFilterItem}>
          <Text style={styles.coreFilterLabel}>离店</Text>
          <Text style={styles.coreFilterText}>{formatDateDisplay(checkOutDate)}</Text>
        </TouchableOpacity>

        {/* 间夜数 */}
        <View style={styles.nightCountBadge}>
          <Text style={styles.nightCountText}>{nightCount}晚</Text>
        </View>
      </View>

      {/* 搜索行 */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索酒店名/关键词"
            placeholderTextColor="#999"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={() => updateParams({ city, keyword: searchKeyword || undefined })}
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <MaterialIcons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* 筛选按钮 */}
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="filter-list" size={22} color="#1E90FF" />
          {(filterMinPrice || filterMaxPrice || filterRating > 0 || filterAmenities.length > 0) && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // 筛选弹窗
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>筛选</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalContent}>
            {/* 价格区间 */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>价格区间 (元)</Text>
              <View style={styles.priceRangeContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="最低"
                  keyboardType="numeric"
                  value={filterMinPrice?.toString() || ''}
                  onChangeText={(text) => setFilterMinPrice(text ? parseInt(text) : undefined)}
                />
                <Text style={styles.priceRangeSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="最高"
                  keyboardType="numeric"
                  value={filterMaxPrice?.toString() || ''}
                  onChangeText={(text) => setFilterMaxPrice(text ? parseInt(text) : undefined)}
                />
              </View>
            </View>

            {/* 星级筛选 */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>酒店星级</Text>
              <View style={styles.ratingOptionsContainer}>
                {RATING_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.ratingOption,
                      filterRating === option.value && styles.ratingOptionActive
                    ]}
                    onPress={() => setFilterRating(option.value)}
                  >
                    <Text style={[
                      styles.ratingOptionText,
                      filterRating === option.value && styles.ratingOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 设施筛选 */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>酒店设施</Text>
              <View style={styles.amenitiesContainer}>
                {AMENITIES_OPTIONS.map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.amenityChip,
                      filterAmenities.includes(amenity) && styles.amenityChipActive
                    ]}
                    onPress={() => toggleAmenity(amenity)}
                  >
                    <Text style={[
                      styles.amenityChipText,
                      filterAmenities.includes(amenity) && styles.amenityChipTextActive
                    ]}>
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterModalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>重置</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>应用筛选</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // 城市选择弹窗
  const POPULAR_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉', '西安', '南京', '苏州', '天津', '厦门', '长沙', '郑州', '青岛'];

  const renderCityPickerModal = () => (
    <Modal
      visible={showCityPicker}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCityPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cityPickerModal}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>选择城市</Text>
            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.cityListContainer}>
            {/* 热门城市 */}
            <Text style={styles.citySectionTitle}>热门城市</Text>
            <View style={styles.cityGrid}>
              {POPULAR_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityChip, selectedCity === c && styles.cityChipActive]}
                  onPress={() => {
                    setSelectedCity(c);
                    updateParams({ city: c, keyword: searchKeyword || undefined, minPrice: filterMinPrice, maxPrice: filterMaxPrice, rating: filterRating || undefined, amenities: filterAmenities.length > 0 ? filterAmenities : undefined });
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[styles.cityChipText, selectedCity === c && styles.cityChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 全国城市按拼音排序 */}
            <Text style={[styles.citySectionTitle, { marginTop: 20 }]}>全国城市</Text>
            {loadingCities ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1E90FF" />
                <Text style={styles.loadingText}>加载城市中...</Text>
              </View>
            ) : (
              citySections.map((letter) => (
                <View key={letter} style={styles.citySection}>
                  <Text style={styles.citySectionLetter}>{letter}</Text>
                  <View style={styles.citySectionContent}>
                    {groupedCities[letter].map((city) => (
                      <TouchableOpacity
                        key={city.name}
                        style={[styles.cityChip, selectedCity === city.name && styles.cityChipActive]}
                        onPress={() => {
                          setSelectedCity(city.name);
                          updateParams({ city: city.name, keyword: searchKeyword || undefined, minPrice: filterMinPrice, maxPrice: filterMaxPrice, rating: filterRating || undefined, amenities: filterAmenities.length > 0 ? filterAmenities : undefined });
                          setShowCityPicker(false);
                        }}
                      >
                        <Text style={[styles.cityChipText, selectedCity === city.name && styles.cityChipTextActive]}>
                          {city.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* 核心筛选头部 */}
      {renderCoreFilterHeader()}

      {/* 结果统计 */}
      <View style={styles.resultHeader}>
        {(filterMinPrice || filterMaxPrice || filterRating > 0 || filterAmenities.length > 0) && (
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.clearFilterText}>重置筛选</Text>
          </TouchableOpacity>
        )}
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

      {/* 筛选弹窗 */}
      {renderFilterModal()}

      {/* 城市选择弹窗 */}
      {renderCityPickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // 核心筛选头部样式
  coreFilterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coreFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coreFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginRight: 8,
  },
  coreFilterLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  coreFilterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    maxWidth: 60,
  },
  nightCountBadge: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  nightCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    width: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4d4f',
  },
  // 结果统计样式
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#1E90FF',
  },
  // 筛选弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterModalContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  priceRangeSeparator: {
    marginHorizontal: 12,
    color: '#999',
  },
  ratingOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  ratingOptionActive: {
    backgroundColor: '#1E90FF',
  },
  ratingOptionText: {
    fontSize: 14,
    color: '#666',
  },
  ratingOptionTextActive: {
    color: '#fff',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  amenityChipActive: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1E90FF',
  },
  amenityChipText: {
    fontSize: 13,
    color: '#666',
  },
  amenityChipTextActive: {
    color: '#1E90FF',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
  },
  applyButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E90FF',
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // 酒店列表样式
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
  // 城市选择弹窗样式
  cityPickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  cityListContainer: {
    padding: 16,
    maxHeight: 400,
  },
  citySectionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  cityChipActive: {
    backgroundColor: '#1E90FF',
  },
  cityChipText: {
    fontSize: 14,
    color: '#333',
  },
  cityChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // 城市分组样式
  citySection: {
    marginBottom: 12,
  },
  citySectionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 8,
    marginTop: 8,
  },
  citySectionContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // 加载状态样式
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#999',
  },
});

export default HotelListScreen;
