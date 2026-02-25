/**
 * 首页 - 搜索界面
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../../navigation/types';
import { searchAddress, geocodeAddress, reverseGeocode, Location as LocationType } from '../../services/location';
import { getHotelList } from '../../api';
import { Hotel } from '../../types';
import CityPicker from '../../components/CityPicker';

type Props = MainTabScreenProps<'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 180;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = Dimensions.get('window');
  const [selectedCity, setSelectedCity] = useState('北京');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  
  // 日期选择状态
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);

  // 格式化日期显示
  const dateDisplayText = useMemo(() => {
    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    inDate.setHours(0, 0, 0, 0);
    outDate.setHours(0, 0, 0, 0);
    return `${inDate.getMonth() + 1}/${inDate.getDate()} - ${outDate.getMonth() + 1}/${outDate.getDate()}`;
  }, [checkInDate, checkOutDate]);

  // 筛选条件状态
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterParams, setFilterParams] = useState({
    minPrice: 0,
    maxPrice: 2000,
    rating: 0,
    amenities: [] as string[],
  });
  
  // 价格滑动条状态
  const [sliderWidth, setSliderWidth] = useState(300);
  const minStartX = useRef(0);
  const minStartPrice = useRef(0);
  const maxStartX = useRef(0);
  const maxStartPrice = useRef(0);
  
  const MIN_PRICE = 0;
  const MAX_PRICE = 5000;
  
  // 最小值滑块 PanResponder
  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        minStartX.current = evt.nativeEvent.pageX;
        minStartPrice.current = filterParams.minPrice;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidth <= 0) return;
        const deltaX = evt.nativeEvent.pageX - minStartX.current;
        const pricePerPixel = MAX_PRICE / sliderWidth;
        const newPrice = Math.round(minStartPrice.current + deltaX * pricePerPixel);
        const clampedPrice = Math.max(MIN_PRICE, Math.min(newPrice, filterParams.maxPrice - 100));
        setFilterParams(prev => ({ ...prev, minPrice: clampedPrice }));
      },
      onPanResponderRelease: () => {},
    })
  ).current;
  
  // 最大值滑块 PanResponder
  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        maxStartX.current = evt.nativeEvent.pageX;
        maxStartPrice.current = filterParams.maxPrice;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidth <= 0) return;
        const deltaX = evt.nativeEvent.pageX - maxStartX.current;
        const pricePerPixel = MAX_PRICE / sliderWidth;
        const newPrice = Math.round(maxStartPrice.current + deltaX * pricePerPixel);
        const clampedPrice = Math.max(filterParams.minPrice + 100, Math.min(newPrice, MAX_PRICE));
        setFilterParams(prev => ({ ...prev, maxPrice: clampedPrice }));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Banner 轮播图状态
  
  // Banner 轮播图状态
  const [bannerHotels, setBannerHotels] = useState<Hotel[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  // 获取热门酒店数据用于Banner轮播
  useEffect(() => {
    const fetchBannerHotels = async () => {
      try {
        const response = await getHotelList({
          page: 1,
          pageSize: 5,
          publishStatus: 'published',
        });
        if (response.data && response.data.items) {
          setBannerHotels(response.data.items);
        }
      } catch (error) {
        console.error('获取热门酒店失败:', error);
      }
    };
    fetchBannerHotels();
  }, []);

  // Banner 自动轮播
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bannerHotels.length > 0 && autoPlay) {
      interval = setInterval(() => {
        setBannerIndex((prev) => {
          const nextIndex = (prev + 1) % bannerHotels.length;
          bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          return nextIndex;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [bannerHotels.length, autoPlay]);

  // 切换到上一张
  const scrollToPrev = () => {
    if (bannerHotels.length === 0) return;
    const prevIndex = bannerIndex === 0 ? bannerHotels.length - 1 : bannerIndex - 1;
    bannerRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    setBannerIndex(prevIndex);
  };

  // 切换到下一张
  const scrollToNext = () => {
    if (bannerHotels.length === 0) return;
    const nextIndex = (bannerIndex + 1) % bannerHotels.length;
    bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setBannerIndex(nextIndex);
  };

  // 搜索地址建议
  const handleAddressSearch = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const results = await searchAddress(keyword, selectedCity);
      setAddressSuggestions(results);
    } catch (error) {
      console.error('搜索地址失败:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [selectedCity]);

  // 地址输入变化
  const handleKeywordChange = (text: string) => {
    setSearchKeyword(text);
    // 防抖搜索
    const timeoutId = setTimeout(() => {
      handleAddressSearch(text);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  // 选择地址
  const handleAddressSelect = (address: string) => {
    setSearchKeyword(address);
    setShowAddressPicker(false);
    // 跳转到酒店列表
    navigation.navigate('HotelList', {
      city: selectedCity,
      keyword: address,
    });
  };

  // 选择城市
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setShowCityPicker(false);
  };

  // 点击Banner跳转到酒店详情
  const handleBannerPress = (hotel: Hotel) => {
    const hotelId = hotel.id;
    if (hotelId) {
      navigation.navigate('HotelDetail', { hotelId, hotel });
    }
  };

  // Banner 滚动时更新索引
  const handleBannerScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setBannerIndex(index);
  };

  // 搜索酒店
  const handleSearch = () => {
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    if (searchKeyword.trim()) {
      navigation.navigate('HotelList', {
        city: selectedCity,
        keyword: searchKeyword.trim(),
        checkInDate: formatDate(checkInDate),
        checkOutDate: formatDate(checkOutDate),
        minPrice: filterParams.minPrice,
        maxPrice: filterParams.maxPrice,
        rating: filterParams.rating,
        amenities: filterParams.amenities,
      });
    } else {
      // 如果没有关键词，只按城市搜索
      navigation.navigate('HotelList', {
        city: selectedCity,
        keyword: undefined,
        checkInDate: formatDate(checkInDate),
        checkOutDate: formatDate(checkOutDate),
        minPrice: filterParams.minPrice,
        maxPrice: filterParams.maxPrice,
        rating: filterParams.rating,
        amenities: filterParams.amenities,
      });
    }
  };

  // 定位当前城市
  const handleLocate = async () => {
    setLocating(true);
    try {
      console.log('开始定位...');
      
      // 请求定位权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('权限状态:', status);
      
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要定位权限才能获取当前位置，请在系统设置中开启定位权限');
        return;
      }

      // 获取当前位置
      console.log('正在获取位置...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('获取到坐标:', location.coords.latitude, location.coords.longitude);

      const currentLocation: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // 逆地理编码获取城市信息
      console.log('正在逆地理编码...');
      const addressInfo = await reverseGeocode(currentLocation);
      console.log('地址信息:', addressInfo);
      
      if (addressInfo) {
        // 优先使用区/县信息，如果没有则使用城市
        let targetCity = addressInfo.district || addressInfo.city;
        
        if (targetCity) {
          // 去掉"市"后缀
          if (targetCity.endsWith('市')) {
            targetCity = targetCity.slice(0, -1);
          }
          
          console.log('目标城市:', targetCity);
          
          // 直接使用定位到的城市/区域
          setSelectedCity(targetCity);
          setSearchKeyword('');
          Alert.alert('定位成功', `已切换到 ${targetCity}`);
        } else {
          Alert.alert('定位失败', '无法获取位置信息');
        }
      } else {
        Alert.alert('定位失败', '无法获取位置信息，请检查网络');
      }
    } catch (error: any) {
      console.error('定位失败:', error);
      Alert.alert('定位失败', error.message || '请检查定位权限设置');
    } finally {
      setLocating(false);
    }
  };

  const renderAddressItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.addressItem}
      onPress={() => handleAddressSelect(item)}
    >
      <MaterialIcons name="location-on" size={20} color="#999" />
      <Text style={styles.addressText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 搜索头部 */}
      <View style={styles.searchHeader}>
        {/* 城市选择 */}
        <TouchableOpacity 
          style={styles.citySelector}
          onPress={() => setShowCityPicker(!showCityPicker)}
        >
          <Text style={styles.cityText}>{selectedCity}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
        </TouchableOpacity>

        {/* 搜索框 */}
        <TouchableOpacity 
          style={styles.searchBox}
          onPress={() => setShowAddressPicker(true)}
        >
          <MaterialIcons name="search" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>
            {searchKeyword || '搜索酒店位置'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 定位按钮 */}
      <TouchableOpacity 
        style={[styles.locationButton, locating && styles.locationButtonDisabled]} 
        onPress={handleLocate}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator size="small" color="#1E90FF" />
        ) : (
          <MaterialIcons name="my-location" size={20} color="#1E90FF" />
        )}
        <Text style={[styles.locationButtonText, locating && styles.locationButtonTextDisabled]}>
          {locating ? '定位中...' : '定位当前位置'}
        </Text>
      </TouchableOpacity>

      {/* Banner 轮播图 */}
      {bannerHotels.length > 0 && (
        <View style={styles.bannerContainer}>
          {/* 左侧切换按钮 */}
          <TouchableOpacity style={styles.bannerButtonLeft} onPress={scrollToPrev}>
            <MaterialIcons name="chevron-left" size={30} color="#fff" />
          </TouchableOpacity>
          
          <FlatList
            ref={bannerRef}
            data={bannerHotels}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setBannerIndex(newIndex);
            }}
            onScrollBeginDrag={() => setAutoPlay(false)}
            onScrollEndDrag={() => setAutoPlay(true)}
            renderItem={({ item }) => (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => handleBannerPress(item)}
              >
                <Image
                  source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.bannerAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id || item._id}
          />
          {/* 右侧切换按钮 */}
          <TouchableOpacity style={styles.bannerButtonRight} onPress={scrollToNext}>
            <MaterialIcons name="chevron-right" size={30} color="#fff" />
          </TouchableOpacity>
          {/* 轮播指示器 */}
          <View style={styles.bannerPagination}>
            {bannerHotels.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerDot,
                  index === bannerIndex && styles.bannerDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* 日期选择和筛选条件 */}
      <View style={styles.dateFilterContainer}>
        {/* 日期选择 */}
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons name="date-range" size={20} color="#1E90FF" />
          <Text style={styles.dateButtonText}>
            {dateDisplayText}
          </Text>
        </TouchableOpacity>

        {/* 筛选按钮 */}
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#1E90FF" />
          <Text style={styles.filterButtonText}>筛选</Text>
        </TouchableOpacity>
      </View>

      {/* 搜索按钮 */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <MaterialIcons name="search" size={24} color="#fff" />
        <Text style={styles.searchButtonText}>搜索酒店</Text>
      </TouchableOpacity>

      {/* 底部提示 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          选择城市和位置，搜索附近酒店
        </Text>
      </View>

      {/* 城市选择弹窗 - 使用复用组件 */}
      <CityPicker
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        onSelect={handleCitySelect}
        selectedCity={selectedCity}
      />

      {/* 地址搜索弹窗 */}
      <Modal visible={showAddressPicker} transparent animationType="slide">
        <View style={styles.addressModalContainer}>
          <View style={styles.addressSearchBox}>
            <TouchableOpacity onPress={() => setShowAddressPicker(false)}>
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <TextInput
              style={styles.addressInput}
              placeholder="输入地址搜索酒店"
              placeholderTextColor="#999"
              value={searchKeyword}
              onChangeText={handleKeywordChange}
              autoFocus
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity onPress={() => setSearchKeyword('')}>
                <MaterialIcons name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          {loadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1E90FF" />
              <Text style={styles.loadingText}>搜索中...</Text>
            </View>
          ) : addressSuggestions.length > 0 ? (
            <FlatList
              data={addressSuggestions}
              renderItem={renderAddressItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              contentContainerStyle={styles.addressList}
            />
          ) : searchKeyword.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>未找到相关地址</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search" size={48} color="#ccc" />
              <Text style={styles.emptyText}>输入地址名称搜索</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* 日期选择弹窗 */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>选择日期</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              <TouchableOpacity 
                style={[styles.dateTypeButton, selectingCheckIn && styles.dateTypeButtonActive]}
                onPress={() => setSelectingCheckIn(true)}
              >
                <Text style={[styles.dateTypeText, selectingCheckIn && styles.dateTypeTextActive]}>入住</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dateTypeButton, !selectingCheckIn && styles.dateTypeButtonActive]}
                onPress={() => setSelectingCheckIn(false)}
              >
                <Text style={[styles.dateTypeText, !selectingCheckIn && styles.dateTypeTextActive]}>退房</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateScrollView}>
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + i);
                const checkIn = new Date(checkInDate);
                checkIn.setHours(0, 0, 0, 0);
                const checkOut = new Date(checkOutDate);
                checkOut.setHours(0, 0, 0, 0);
                const isSelected = selectingCheckIn
                  ? date.getTime() === checkIn.getTime()
                  : date.getTime() === checkOut.getTime();
                const isBefore = selectingCheckIn
                  ? date.getTime() < checkIn.getTime()
                  : date.getTime() <= checkIn.getTime();
                
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dateItem, isSelected && styles.dateItemSelected, isBefore && styles.dateItemDisabled]}
                    onPress={() => {
                      // 获取不带时间的日期
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDate = new Date(today);
                      selectedDate.setDate(selectedDate.getDate() + i);

                      const currentCheckIn = new Date(checkInDate);
                      currentCheckIn.setHours(0, 0, 0, 0);
                      const currentCheckOut = new Date(checkOutDate);
                      currentCheckOut.setHours(0, 0, 0, 0);

                      if (selectingCheckIn) {
                        // 设置新的入住日期（清除时间）
                        const newCheckIn = new Date(selectedDate);
                        setCheckInDate(newCheckIn);
                        // 切换到选择退房日期
                        setSelectingCheckIn(false);
                        // 如果新入住日期 >= 退房日期，自动调整退房日期
                        if (newCheckIn.getTime() >= currentCheckOut.getTime()) {
                          const newCheckOut = new Date(newCheckIn);
                          newCheckOut.setDate(newCheckOut.getDate() + 1);
                          setCheckOutDate(newCheckOut);
                        }
                      } else {
                        // 设置新的退房日期
                        const newCheckOut = new Date(selectedDate);
                        if (newCheckOut.getTime() > currentCheckIn.getTime()) {
                          setCheckOutDate(newCheckOut);
                          // 退房日期选择后自动关闭弹窗
                          setShowDatePicker(false);
                        }
                      }
                    }}
                    disabled={isBefore}
                  >
                    <Text style={[styles.dateItemText, isSelected && styles.dateItemTextSelected, isBefore && styles.dateItemTextDisabled]}>
                      {date.getMonth() + 1}月{date.getDate()}日
                    </Text>
                    <Text style={[styles.dateItemWeek, isSelected && styles.dateItemTextSelected]}>
                      {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.dateConfirmButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.dateConfirmButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 筛选弹窗 */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalContainer}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>筛选条件</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.filterModalContent}
            >
              {/* 价格区间 */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>价格区间</Text>
                <Text style={styles.priceDisplay}>¥{filterParams.minPrice} - ¥{filterParams.maxPrice}</Text>
                
                {/* 双滑块滑动条 */}
                <View 
                  style={styles.rangeSliderContainer}
                  onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                >
                  {/* 背景轨道 */}
                  <View style={styles.sliderTrackBg} />
                  {/* 已选范围 */}
                  <View 
                    style={[
                      styles.sliderRange, 
                      { 
                        left: `${(filterParams.minPrice / MAX_PRICE) * 100}%`,
                        width: `${((filterParams.maxPrice - filterParams.minPrice) / MAX_PRICE) * 100}%`
                      }
                    ]} 
                  />
                  {/* 最小值滑块 */}
                  <View
                    style={[
                      styles.sliderThumb,
                      { left: `${(filterParams.minPrice / MAX_PRICE) * 100}%` }
                    ]}
                    {...minPanResponder.panHandlers}
                  >
                    <View style={styles.sliderThumbInner} />
                  </View>
                  {/* 最大值滑块 */}
                  <View
                    style={[
                      styles.sliderThumb,
                      { left: `${(filterParams.maxPrice / MAX_PRICE) * 100}%` }
                    ]}
                    {...maxPanResponder.panHandlers}
                  >
                    <View style={styles.sliderThumbInner} />
                  </View>
                </View>
                
                <View style={styles.priceLabels}>
                  <Text style={styles.priceLabel}>¥{MIN_PRICE}</Text>
                  <Text style={styles.priceLabel}>¥{MAX_PRICE}</Text>
                </View>
                <View style={styles.priceQuickButtons}>
                  <TouchableOpacity 
                    style={styles.priceQuickButton}
                    onPress={() => setFilterParams({ ...filterParams, minPrice: 0, maxPrice: 500 })}
                  >
                    <Text style={styles.priceQuickButtonText}>不限</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.priceQuickButton}
                    onPress={() => setFilterParams({ ...filterParams, minPrice: 0, maxPrice: 500 })}
                  >
                    <Text style={styles.priceQuickButtonText}>0-500</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.priceQuickButton}
                    onPress={() => setFilterParams({ ...filterParams, minPrice: 500, maxPrice: 1000 })}
                  >
                    <Text style={styles.priceQuickButtonText}>500-1000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.priceQuickButton}
                    onPress={() => setFilterParams({ ...filterParams, minPrice: 1000, maxPrice: 2000 })}
                  >
                    <Text style={styles.priceQuickButtonText}>1000-2000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.priceQuickButton}
                    onPress={() => setFilterParams({ ...filterParams, minPrice: 2000, maxPrice: 5000 })}
                  >
                    <Text style={styles.priceQuickButtonText}>2000+</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 手动输入价格 */}
                <View style={styles.priceInputContainer}>
                  <View style={styles.priceInputWrapper}>
                    <TextInput
                      style={styles.priceInput}
                      value={filterParams.minPrice.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        const newMin = Math.max(0, Math.min(value, filterParams.maxPrice - 100));
                        setFilterParams({ ...filterParams, minPrice: newMin });
                      }}
                      keyboardType="numeric"
                      placeholder="最低价"
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.priceInputSeparator}>-</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={filterParams.maxPrice.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 5000;
                        const newMax = Math.max(filterParams.minPrice + 100, Math.min(value, 5000));
                        setFilterParams({ ...filterParams, maxPrice: newMax });
                      }}
                      keyboardType="numeric"
                      placeholder="最高价"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              {/* 酒店评分 */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>酒店评分</Text>
                <View style={styles.ratingOptions}>
                  {[0, 3, 4, 4.5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        filterParams.rating === rating && styles.ratingOptionActive
                      ]}
                      onPress={() => setFilterParams({ ...filterParams, rating })}
                    >
                      <Text style={[
                        styles.ratingOptionText,
                        filterParams.rating === rating && styles.ratingOptionTextActive
                      ]}>
                        {rating === 0 ? '不限' : `${rating}+分`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 酒店设施 */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>酒店设施</Text>
                <View style={styles.amenitiesGrid}>
                  {[
                    { id: 'wifi', name: 'WiFi' },
                    { id: 'parking', name: '停车场' },
                    { id: 'pool', name: '游泳池' },
                    { id: 'gym', name: '健身房' },
                    { id: 'restaurant', name: '餐厅' },
                    { id: 'spa', name: 'SPA' },
                  ].map((amenity) => {
                    const isSelected = filterParams.amenities.includes(amenity.id);
                    return (
                      <TouchableOpacity
                        key={amenity.id}
                        style={[
                          styles.amenityOption,
                          isSelected && styles.amenityOptionActive
                        ]}
                        onPress={() => {
                          const newAmenities = isSelected
                            ? filterParams.amenities.filter(a => a !== amenity.id)
                            : [...filterParams.amenities, amenity.id];
                          setFilterParams({ ...filterParams, amenities: newAmenities });
                        }}
                      >
                        <Text style={[
                          styles.amenityOptionText,
                          isSelected && styles.amenityOptionTextActive
                        ]}>
                          {amenity.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.filterModalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => setFilterParams({
                  minPrice: 0,
                  maxPrice: 1000,
                  rating: 0,
                  amenities: [],
                })}
              >
                <Text style={styles.resetButtonText}>重置</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>应用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Banner 轮播图样式
  bannerContainer: {
    height: BANNER_HEIGHT,
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: SCREEN_WIDTH - 32,
    height: BANNER_HEIGHT,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerAddress: {
    fontSize: 12,
    color: '#ddd',
  },
  bannerButtonLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
  },
  bannerButtonRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
  },
  bannerPagination: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  bannerDotActive: {
    backgroundColor: '#fff',
    width: 12,
  },
  // 日期选择和筛选样式
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
  // 日期选择弹窗样式
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerContent: {
    flexDirection: 'row',
    padding: 15,
  },
  dateTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  dateTypeButtonActive: {
    backgroundColor: '#1E90FF',
  },
  dateTypeText: {
    fontSize: 14,
    color: '#666',
  },
  dateTypeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateScrollView: {
    maxHeight: 300,
    paddingHorizontal: 15,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateItemSelected: {
    backgroundColor: '#E6F7FF',
    borderRadius: 8,
  },
  dateItemDisabled: {
    opacity: 0.4,
  },
  dateItemText: {
    fontSize: 16,
    color: '#333',
  },
  dateItemTextSelected: {
    color: '#1E90FF',
    fontWeight: 'bold',
  },
  dateItemTextDisabled: {
    color: '#999',
  },
  dateItemWeek: {
    fontSize: 14,
    color: '#666',
  },
  dateConfirmButton: {
    backgroundColor: '#1E90FF',
    marginHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  dateConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // 筛选弹窗样式
  filterModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterModalContent: {
    padding: 15,
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  filterSection: {
    marginBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  // 双滑块滑动条样式
  rangeSliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  sliderTrackBg: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sliderRange: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#1E90FF',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 40,
    backgroundColor: 'transparent',
    marginLeft: -12,
  },
  sliderThumbInner: {
    position: 'absolute',
    top: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E90FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  priceDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E90FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
  },
  priceQuickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  priceQuickButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    marginBottom: 10,
  },
  priceQuickButtonText: {
    fontSize: 14,
    color: '#666',
  },
  priceInputContainer: {
    marginTop: 16,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  priceInputSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#666',
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceSlider: {
    flex: 1,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginHorizontal: 10,
    position: 'relative',
  },
  priceTrack: {
    height: 4,
    backgroundColor: '#1E90FF',
    borderRadius: 2,
  },
  priceThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E90FF',
    marginLeft: -10,
  },
  priceText: {
    fontSize: 14,
    color: '#666',
    minWidth: 40,
  },
  priceInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInputButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    color: '#333',
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ratingOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
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
    fontWeight: 'bold',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    marginBottom: 10,
  },
  amenityOptionActive: {
    backgroundColor: '#1E90FF',
  },
  amenityOptionText: {
    fontSize: 14,
    color: '#666',
  },
  amenityOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#1E90FF',
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    marginRight: 10,
  },
  cityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 14,
    color: '#999',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E90FF',
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: 'bold',
  },
  locationButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  locationButtonTextDisabled: {
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  searchButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E90FF',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 25,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Modal 样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cityPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  cityPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cityPickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cityList: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cityItemActive: {
    backgroundColor: '#E6F7FF',
  },
  cityItemText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  cityItemTextActive: {
    color: '#1E90FF',
    fontWeight: 'bold',
  },
  // 城市分组样式
  citySection: {
    width: '100%',
    marginBottom: 10,
  },
  citySectionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E90FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  citySectionContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
  },
  // 地址搜索弹窗
  addressModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
  },
  addressSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    height: 44,
  },
  addressInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  addressList: {
    padding: 10,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
});

export default HomeScreen;
