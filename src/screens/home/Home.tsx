/**
 * 首页 - 搜索界面
 */

import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../../navigation/types';
import { searchAddress, geocodeAddress, reverseGeocode, getAllChinaCities, Location as LocationType, CityInfo } from '../../services/location';

type Props = MainTabScreenProps<'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCity, setSelectedCity] = useState('北京');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [cityList, setCityList] = useState<CityInfo[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // 加载城市列表
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = await getAllChinaCities();
        if (cities.length > 0) {
          setCityList(cities);
        } else {
          // 如果API失败，使用备用城市列表
          console.log('使用备用城市列表');
        }
      } catch (error) {
        console.error('加载城市列表失败:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  // 热门城市（取前8个城市）
  const hotCities = cityList.slice(0, 8);

  // 过滤有有效拼音首字母的城市，并按拼音首字母排序
  const sortedCityList = [...cityList]
    .filter(city => {
      const pinyin = city.pinyin || city.name;
      return /^[A-Za-z]/.test(pinyin);
    })
    .sort((a, b) => 
      (a.pinyin || a.name).localeCompare(b.pinyin || b.name, 'en-US')
    );

  // 按拼音首字母分组的城市列表
  const groupedCities = sortedCityList.reduce((groups, city) => {
    const pinyin = city.pinyin || city.name;
    const firstLetter = pinyin.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(city);
    return groups;
  }, {} as Record<string, typeof cityList>);

  const citySections = Object.keys(groupedCities).sort();

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

  // 搜索酒店
  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigation.navigate('HotelList', {
        city: selectedCity,
        keyword: searchKeyword.trim(),
      });
    } else {
      // 如果没有关键词，只按城市搜索
      navigation.navigate('HotelList', {
        city: selectedCity,
        keyword: undefined,
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

      {/* 热门城市 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>热门城市</Text>
        <View style={styles.cityGrid}>
          {hotCities.map((city) => (
            <TouchableOpacity
              key={city.id}
              style={[styles.hotCityItem, selectedCity === city.name && styles.hotCityItemActive]}
              onPress={() => {
                setSelectedCity(city.name);
                setSearchKeyword('');
              }}
            >
              <Text style={[styles.hotCityText, selectedCity === city.name && styles.hotCityTextActive]}>
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

      {/* 城市选择弹窗 */}
      <Modal visible={showCityPicker} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowCityPicker(false)}
        >
          <View style={styles.cityPickerContainer}>
            <View style={styles.cityPickerHeader}>
              <Text style={styles.cityPickerTitle}>选择城市</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.cityList}>
              {loadingCities ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1E90FF" />
                  <Text style={styles.loadingText}>加载城市中...</Text>
                </View>
              ) : cityList.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>暂无城市数据</Text>
                </View>
              ) : (
                <>
                  {citySections.map((letter) => (
                    <View key={letter} style={styles.citySection}>
                      <Text style={styles.citySectionLetter}>{letter}</Text>
                      <View style={styles.citySectionContent}>
                        {groupedCities[letter].map((city) => (
                          <TouchableOpacity
                            key={city.id}
                            style={[styles.cityItem, selectedCity === city.name && styles.cityItemActive]}
                            onPress={() => handleCitySelect(city.name)}
                          >
                            <Text style={[styles.cityItemText, selectedCity === city.name && styles.cityItemTextActive]}>
                              {city.name}
                            </Text>
                            {selectedCity === city.name && (
                              <MaterialIcons name="check" size={18} color="#1E90FF" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hotCityItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  hotCityItemActive: {
    backgroundColor: '#1E90FF',
  },
  hotCityText: {
    fontSize: 14,
    color: '#666',
  },
  hotCityTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
