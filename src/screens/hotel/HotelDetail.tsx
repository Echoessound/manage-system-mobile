/**
 * 酒店详情屏幕
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MainStackScreenProps } from '../../navigation/types';
import { useHotelDetail, useFavorite } from '../../hooks';
import { formatPrice, getRatingDisplay, isValidEmail } from '../../utils';
import { colors, DEFAULT_HOTEL_IMAGE, DEFAULT_ROOM_IMAGE, AVAILABLE_AMENITIES } from '../../constants';
import { RoomType, Hotel } from '../../types';

const { width } = Dimensions.get('window');

type Props = MainStackScreenProps<'HotelDetail'>;

const HotelDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { hotelId, hotel: initialHotel } = route.params;
  const { hotel, loading, error, refresh } = useHotelDetail(hotelId);
  const { isFavorite, toggleFavorite } = useFavorite(hotelId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const currentHotel = hotel || initialHotel;

  useEffect(() => {
    if (currentHotel) {
      navigation.setOptions({
        title: currentHotel.name,
        headerRight: () => (
          <TouchableOpacity onPress={handleToggleFavorite}>
            <MaterialIcons
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={24}
              color={isFavorite ? colors.secondary : colors.white}
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [currentHotel, isFavorite]);

  const handleToggleFavorite = () => {
    toggleFavorite();
  };

  if (loading && !currentHotel) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error && !currentHotel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentHotel) return null;

  const images = currentHotel.images?.length > 0 
    ? currentHotel.images 
    : [DEFAULT_HOTEL_IMAGE];

  const getAmenityName = (id: string) => {
    const amenity = AVAILABLE_AMENITIES.find(a => a.id === id);
    return amenity?.name || id;
  };

  const renderImage = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.galleryImage} />
  );

  const renderRoomType = ({ item }: { item: RoomType }) => (
    <View style={styles.roomTypeCard}>
      <Image
        source={{ uri: item.images?.[0] || DEFAULT_ROOM_IMAGE }}
        style={styles.roomImage}
      />
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomDesc} numberOfLines={2}>
          {item.description || '暂无描述'}
        </Text>
        <View style={styles.roomDetails}>
          <Text style={styles.roomCapacity}>
            <MaterialIcons name="person" size={14} color={colors.textSecondary} /> 
            {' '}{item.capacity}人
          </Text>
          <Text style={styles.roomBed}>
            {item.bedType || '大床/双床'}
          </Text>
          {item.area && (
            <Text style={styles.roomArea}>{item.area}m²</Text>
          )}
        </View>
        <View style={styles.roomPriceRow}>
          <Text style={styles.roomPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.roomUnit}>/晚</Text>
          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>预订</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 图片轮播 */}
      <View style={styles.imageContainer}>
        <FlatList
          data={images}
          renderItem={renderImage}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
          scrollEventThrottle={16}
        />
        <View style={styles.imageIndicator}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === selectedImageIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>

      {/* 酒店基本信息 */}
      <View style={styles.infoSection}>
        <Text style={styles.hotelName}>{currentHotel.name}</Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingNumber}>
              {getRatingDisplay(currentHotel.rating)}
            </Text>
          </View>
          <Text style={styles.reviewCount}>{currentHotel.reviewCount}条评价</Text>
        </View>

        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={18} color={colors.primary} />
          <Text style={styles.addressText}>{currentHotel.address}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>均价</Text>
          <Text style={styles.priceValue}>
            {formatPrice(currentHotel.price)}
          </Text>
          <Text style={styles.priceUnit}>/晚</Text>
        </View>
      </View>

      {/* 酒店描述 */}
      {currentHotel.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>酒店介绍</Text>
          <Text style={styles.description}>{currentHotel.description}</Text>
        </View>
      )}

      {/* 酒店设施 */}
      {currentHotel.amenities && currentHotel.amenities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>酒店设施</Text>
          <View style={styles.amenitiesGrid}>
            {currentHotel.amenities.map((amenityId) => (
              <View key={amenityId} style={styles.amenityItem}>
                <MaterialIcons name="check-circle" size={16} color={colors.success} />
                <Text style={styles.amenityText}>
                  {getAmenityName(amenityId)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 房型列表 */}
      {hotel?.roomTypes && hotel.roomTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>房型列表</Text>
          <FlatList
            data={hotel.roomTypes}
            renderItem={renderRoomType}
            keyExtractor={(item) => item._id || item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* 底部预订按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <MaterialIcons
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={24}
            color={isFavorite ? colors.secondary : colors.gray}
          />
          <Text style={styles.favoriteText}>收藏</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookNowButton}>
          <Text style={styles.bookNowText}>立即预订</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  retryText: {
    color: colors.white,
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  galleryImage: {
    width: width,
    height: 250,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.white,
  },
  infoSection: {
    backgroundColor: colors.white,
    padding: 15,
  },
  hotelName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingNumber: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewCount: {
    marginLeft: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressText: {
    marginLeft: 5,
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  priceValue: {
    marginLeft: 8,
    color: colors.secondary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceUnit: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  amenityText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text,
  },
  roomTypeCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  roomImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  roomInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  roomDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  roomDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCapacity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 10,
  },
  roomBed: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 10,
  },
  roomArea: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  roomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  roomPrice: {
    fontSize: 18,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  roomUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  bookButton: {
    marginLeft: 'auto',
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 4,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  favoriteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  favoriteText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.gray,
  },
  bookNowButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 20,
  },
  bookNowText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HotelDetailScreen;


