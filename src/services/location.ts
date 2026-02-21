/**
 * 定位服务 - 高德地图
 */

import { AMAP_KEY, AMAP_GEO_URL } from '../constants';

// 类型定义
export interface Location {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  formattedAddress: string;
  province: string;
  city: string;
  district: string;
  township: string;
  street: string;
  number: string;
}

/**
 * 地址转坐标 (地理编码)
 */
export const geocodeAddress = async (address: string, city?: string): Promise<Location | null> => {
  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      address: address,
      ...(city && { city: city }),
    });

    const response = await fetch(`${AMAP_GEO_URL}?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const geocode = data.geocodes[0];
      return {
        longitude: parseFloat(geocode.location.split(',')[0]),
        latitude: parseFloat(geocode.location.split(',')[1]),
      };
    }
    return null;
  } catch (error) {
    console.error('地理编码失败:', error);
    return null;
  }
};

/**
 * 坐标转地址 (逆地理编码)
 */
export const reverseGeocode = async (location: Location): Promise<GeocodingResult | null> => {
  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      location: `${location.longitude},${location.latitude}`,
    });

    const url = `https://restapi.amap.com/v3/geocode/regeo?${params}`;
    console.log('逆地理编码请求:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('逆地理编码响应:', JSON.stringify(data));

    if (data.status === '1' && data.regeocode) {
      const regeocode = data.regeocode;
      const addressComponent = regeocode.addressComponent;
      return {
        formattedAddress: regeocode.formatted_address,
        province: addressComponent.province || '',
        city: addressComponent.city || '',
        district: addressComponent.district || '',
        township: addressComponent.township?.[0] || '',
        street: addressComponent.street || '',
        number: addressComponent.streetNumber?.number || '',
      };
    }
    console.log('逆地理编码失败: status =', data.status);
    return null;
  } catch (error) {
    console.error('逆地理编码失败:', error);
    return null;
  }
};

/**
 * 获取城市中心坐标
 */
export const getCityCenter = async (cityName: string): Promise<Location | null> => {
  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      city: cityName,
      citylimit: 'true',
    });

    const response = await fetch(`${AMAP_GEO_URL}?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const geocode = data.geocodes[0];
      return {
        longitude: parseFloat(geocode.location.split(',')[0]),
        latitude: parseFloat(geocode.location.split(',')[1]),
      };
    }
    return null;
  } catch (error) {
    console.error('获取城市中心失败:', error);
    return null;
  }
};

/**
 * 搜索建议 - 获取地址列表
 */
export const searchAddress = async (keyword: string, city?: string): Promise<string[]> => {
  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      keywords: keyword,
      types: '商务住宅|风景名胜|科教文化|交通设施',
      city: city || '',
      citylimit: city ? 'true' : 'false',
      output: 'json',
    });

    const response = await fetch(`https://restapi.amap.com/v3/assistant/inputtips?${params}`);
    const data = await response.json();

    if (data.status === '1' && data.tips) {
      return data.tips
        .filter((tip: any) => tip.location)
        .map((tip: any) => tip.name);
    }
    return [];
  } catch (error) {
    console.error('搜索地址失败:', error);
    return [];
  }
};

