/**
 * 筛选屏幕
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MainStackScreenProps } from '../../navigation/types';
import { colors, AVAILABLE_AMENITIES, SUPPORTED_CITIES } from '../../constants';

type Props = MainStackScreenProps<'Filter'>;

const FilterScreen: React.FC<Props> = ({ route, navigation }) => {
  const { currentParams, onApply } = route.params;

  const [city, setCity] = useState(currentParams?.city || '');
  const [minPrice, setMinPrice] = useState(currentParams?.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(currentParams?.maxPrice?.toString() || '');
  const [rating, setRating] = useState(currentParams?.rating || 0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    currentParams?.amenities || []
  );

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId);
      } else {
        return [...prev, amenityId];
      }
    });
  };

  const handleRatingSelect = (value: number) => {
    setRating(value);
  };

  const handleReset = () => {
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setRating(0);
    setSelectedAmenities([]);
  };

  const handleApply = () => {
    const minPriceNum = minPrice ? parseInt(minPrice) : undefined;
    const maxPriceNum = maxPrice ? parseInt(maxPrice) : undefined;

    if (minPriceNum && maxPriceNum && minPriceNum > maxPriceNum) {
      Alert.alert('提示', '最低价不能大于最高价');
      return;
    }

    const params = {
      city: city || undefined,
      minPrice: minPriceNum,
      maxPrice: maxPriceNum,
      rating: rating || undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    };

    onApply(params);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 城市选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>城市</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入城市名称"
            value={city}
            onChangeText={setCity}
          />
          <View style={styles.cityTags}>
            {SUPPORTED_CITIES.slice(0, 10).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.cityTag,
                  city === item.name && styles.cityTagActive,
                ]}
                onPress={() => setCity(item.name)}
              >
                <Text
                  style={[
                    styles.cityTagText,
                    city === item.name && styles.cityTagTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 价格区间 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>价格区间（元）</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="最低价"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={styles.priceDivider}>-</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="最高价"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </View>

        {/* 星级评分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>星级评分</Text>
          <View style={styles.ratingRow}>
            {[0, 3, 4, 4.5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.ratingTag,
                  rating === value && styles.ratingTagActive,
                ]}
                onPress={() => handleRatingSelect(value)}
              >
                <Text
                  style={[
                    styles.ratingTagText,
                    rating === value && styles.ratingTagTextActive,
                  ]}
                >
                  {value === 0 ? '不限' : `${value}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 酒店设施 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>酒店设施</Text>
          <View style={styles.amenitiesGrid}>
            {AVAILABLE_AMENITIES.map((amenity) => (
              <TouchableOpacity
                key={amenity.id}
                style={[
                  styles.amenityTag,
                  selectedAmenities.includes(amenity.id) && styles.amenityTagActive,
                ]}
                onPress={() => handleAmenityToggle(amenity.id)}
              >
                <MaterialIcons
                  name={selectedAmenities.includes(amenity.id) ? 'check-box' : 'check-box-outline-blank'}
                  size={18}
                  color={selectedAmenities.includes(amenity.id) ? colors.primary : colors.gray}
                />
                <Text
                  style={[
                    styles.amenityTagText,
                    selectedAmenities.includes(amenity.id) && styles.amenityTagTextActive,
                  ]}
                >
                  {amenity.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>重置</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>应用</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  cityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  cityTag: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 10,
    marginBottom: 10,
  },
  cityTagActive: {
    backgroundColor: colors.primary,
  },
  cityTagText: {
    fontSize: 14,
    color: colors.text,
  },
  cityTagTextActive: {
    color: colors.white,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  priceDivider: {
    marginHorizontal: 15,
    color: colors.gray,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ratingTag: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 10,
    marginBottom: 10,
  },
  ratingTagActive: {
    backgroundColor: colors.primary,
  },
  ratingTagText: {
    fontSize: 14,
    color: colors.text,
  },
  ratingTagTextActive: {
    color: colors.white,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: 10,
    marginBottom: 10,
  },
  amenityTagActive: {
    backgroundColor: '#E3F2FD',
  },
  amenityTagText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
  amenityTagTextActive: {
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterScreen;


