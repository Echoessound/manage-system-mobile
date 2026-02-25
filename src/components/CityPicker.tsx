/**
 * 城市选择器组件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAllChinaCities, CityInfo } from '../services/location';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
  selectedCity: string;
};

const POPULAR_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', 
  '重庆', '武汉', '西安', '南京', '苏州', '天津', 
  '厦门', '长沙', '郑州', '青岛', '大连', '沈阳',
  '昆明', '哈尔滨', '济南', '福州', '贵阳', '太原'
];

const CityPicker: React.FC<Props> = ({ visible, onClose, onSelect, selectedCity }) => {
  const [cityList, setCityList] = useState<CityInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadCities();
    }
  }, [visible]);

  const loadCities = async () => {
    try {
      const cities = await getAllChinaCities();
      if (cities.length > 0) {
        setCityList(cities);
      }
    } catch (error) {
      console.error('加载城市列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤城市
  const sortedCityList = [...cityList]
    .filter(city => {
      const pinyin = city.pinyin || city.name;
      return /^[A-Za-z]/.test(pinyin) || /^[\u4e00-\u9fa5]/.test(pinyin);
    })
    .sort((a, b) => 
      (a.pinyin || a.name).localeCompare(b.pinyin || b.name, 'en-US')
    );

  // 按拼音首字母分组
  const groupedCities = sortedCityList.reduce<Record<string, CityInfo[]>>((groups, city) => {
    const pinyin = city.pinyin || city.name;
    const firstLetter = /^[A-Za-z]/.test(pinyin) ? pinyin.charAt(0).toUpperCase() : '#';
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(city);
    return groups;
  }, {});

  const citySections = Object.keys(groupedCities).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  const handleCitySelect = (cityName: string) => {
    onSelect(cityName);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>选择城市</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1E90FF" />
                <Text style={styles.loadingText}>加载城市中...</Text>
              </View>
            ) : (
              <>
                {/* 热门城市 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>热门城市</Text>
                  <View style={styles.cityGrid}>
                    {POPULAR_CITIES.map((cityName) => {
                      const city = cityList.find(c => c.name === cityName);
                      return (
                        <TouchableOpacity
                          key={cityName}
                          style={[styles.cityChip, selectedCity === cityName && styles.cityChipActive]}
                          onPress={() => handleCitySelect(cityName)}
                        >
                          <Text style={[styles.cityChipText, selectedCity === cityName && styles.cityChipTextActive]}>
                            {cityName}
                          </Text>
                          {selectedCity === cityName && (
                            <MaterialIcons name="check" size={16} color="#1E90FF" style={styles.checkIcon} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 全国城市按字母排序 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>全国城市</Text>
                  {citySections.map((letter) => (
                    <View key={letter} style={styles.letterSection}>
                      <Text style={styles.letter}>{letter}</Text>
                      <View style={styles.cityGrid}>
                        {groupedCities[letter].map((city) => (
                          <TouchableOpacity
                            key={city.id}
                            style={[styles.cityChip, selectedCity === city.name && styles.cityChipActive]}
                            onPress={() => handleCitySelect(city.name)}
                          >
                            <Text style={[styles.cityChipText, selectedCity === city.name && styles.cityChipTextActive]}>
                              {city.name}
                            </Text>
                            {selectedCity === city.name && (
                              <MaterialIcons name="check" size={16} color="#1E90FF" style={styles.checkIcon} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 12,
  },
  letterSection: {
    marginBottom: 16,
  },
  letter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 8,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  cityChipActive: {
    backgroundColor: '#E6F7FF',
  },
  cityChipText: {
    fontSize: 14,
    color: '#333',
  },
  cityChipTextActive: {
    color: '#1E90FF',
    fontWeight: 'bold',
  },
  checkIcon: {
    marginLeft: 4,
  },
});

export default CityPicker;

