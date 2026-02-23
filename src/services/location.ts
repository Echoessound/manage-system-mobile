/**
 * 定位服务 - 高德地图
 */

import { AMAP_REST_KEY, AMAP_GEO_URL, AMAP_DISTRICT_URL } from '../constants';

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
      key: AMAP_REST_KEY,
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
      key: AMAP_REST_KEY,  // 使用 Web 服务 API Key
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
      key: AMAP_REST_KEY,
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
      key: AMAP_REST_KEY,
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

// 城市类型定义
export interface CityInfo {
  id: string;
  name: string;
  pinyin?: string;
}

// 简单的中文转拼音映射（常用城市）
const commonCityPinyin: Record<string, string> = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '天津': 'Tianjin',
  '重庆': 'Chongqing',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '成都': 'Chengdu',
  '杭州': 'Hangzhou',
  '武汉': 'Wuhan',
  '西安': 'Xian',
  '南京': 'Nanjing',
  '长沙': 'Changsha',
  '沈阳': 'Shenyang',
  '青岛': 'Qingdao',
  '大连': 'Dalian',
  '厦门': 'Xiamen',
  '昆明': 'Kunming',
  '哈尔滨': 'Haerbin',
  '济南': 'Jinan',
  '太原': 'Taiyuan',
  '郑州': 'Zhengzhou',
  '石家庄': 'Shijiazhuang',
  '福州': 'Fuzhou',
  '南昌': 'Nanchang',
  '贵阳': 'Guiyang',
  '南宁': 'Nanning',
  '海口': 'Haikou',
  '兰州': 'Lanzhou',
  '昆明': 'Kunming',
  '乌鲁木齐': 'Wulumuqi',
  '银川': 'Yinchuan',
  '西宁': 'Xining',
  '拉萨': 'Lasa',
  '呼和浩特': 'Huhehaote',
  '长春': 'Changchun',
  '合肥': 'Hefei',
  '苏州': 'Suzhou',
  '无锡': 'Wuxi',
  '宁波': 'Ningbo',
  '温州': 'Wenzhou',
  '佛山': 'Foshan',
  '东莞': 'Dongguan',
  '珠海': 'Zhuhai',
  '中山': 'Zhongshan',
  '惠州': 'Huizhou',
  '泉州': 'Quanzhou',
  '烟台': 'Yantai',
  '潍坊': 'Weifang',
  '淄博': 'Zibo',
  '临沂': 'Linyi',
  '唐山': 'Tangshan',
  '保定': 'Baoding',
  '邯郸': 'Handan',
  '洛阳': 'Luoyang',
  '徐州': 'Xuzhou',
  '常州': 'Changzhou',
  '南通': 'Nantong',
  '扬州': 'Yangzhou',
  '盐城': 'Yancheng',
  '淮安': 'Huaian',
  '连云港': 'Lianyungang',
  '泰州': 'Taizhou',
  '镇江': 'Zhenjiang',
  '嘉兴': 'Jiaxing',
  '湖州': 'Huzhou',
  '绍兴': 'Shaoxing',
  '金华': 'Jinhua',
  '衢州': 'Quzhou',
  '舟山': 'Zhoushan',
  '台州': 'Taizhou',
  '丽水': 'Lishui',
  '芜湖': 'Wuhu',
  '蚌埠': 'Bengbu',
  '淮南': 'Huainan',
  '马鞍山': 'Maanshan',
  '淮北': 'Huaibei',
  '铜陵': 'Tongling',
  '安庆': 'Anqing',
  '黄山': 'Huangshan',
  '滁州': 'Chuzhou',
  '阜阳': 'Fuyang',
  '宿州': 'Suzhou',
  '六安': 'Liuan',
  '亳州': 'Bozhou',
  '池州': 'Chizhou',
  '宣城': 'Xuancheng',
  '莆田': 'Putian',
  '三明': 'Sanming',
  '漳州': 'Zhangzhou',
  '南平': 'Nanping',
  '龙岩': 'Longyan',
  '宁德': 'Ningde',
  '景德镇': 'Jingdezhen',
  '萍乡': 'Pingxiang',
  '九江': 'Jiujiang',
  '新余': 'Xinyu',
  '鹰潭': 'Yingtan',
  '赣州': 'Ganzhou',
  '吉安': 'Jian',
  '宜春': 'Yichun',
  '抚州': 'Fuzhou',
  '上饶': 'Shangrao',
  '襄阳': 'Xiangyang',
  '宜昌': 'Yichang',
  '黄石': 'Huangshi',
  '十堰': 'Shiyan',
  '荆州': 'Jingzhou',
  '荆门': 'Jingmen',
  '孝感': 'Xiaogan',
  '黄冈': 'Huanggang',
  '咸宁': 'Xianning',
  '随州': 'Suizhou',
  '恩施': 'Enshi',
  '仙桃': 'Xiantao',
  '潜江': 'Qianjiang',
  '天门': 'Tianmen',
  '神农架': 'Shennongjia',
  '株洲': 'Zhuzhou',
  '湘潭': 'Xiangtan',
  '衡阳': 'Hengyang',
  '邵阳': 'Shaoyang',
  '岳阳': 'Yueyang',
  '常德': 'Changde',
  '张家界': 'Zhangjiajie',
  '益阳': 'Yiyang',
  '郴州': 'Chenzhou',
  '永州': 'Yongzhou',
  '怀化': 'Huaihua',
  '娄底': 'Loudi',
  '湘西': 'Xiangxi',
  '柳州': 'Liuzhou',
  '桂林': 'Guilin',
  '梧州': 'Wuzhou',
  '北海': 'Beihai',
  '防城港': 'Fangchenggang',
  '钦州': 'Qinzhou',
  '贵港': 'Guigang',
  '玉林': 'Yulin',
  '百色': 'Baise',
  '贺州': 'Hezhou',
  '河池': 'Hechi',
  '来宾': 'Laibin',
  '崇左': 'Chongzuo',
  '三亚': 'Sanya',
  '三沙': 'Sansha',
  '儋州': 'Danzhou',
  '五指山': 'Wuzhishan',
  '琼海': 'Qionghai',
  '文昌': 'Wenchang',
  '万宁': 'Wanning',
  '东方': 'Dongfang',
  '定安': 'Dingan',
  '屯昌': 'Tunchang',
  '澄迈': 'Chengmai',
  '临高': 'Lingao',
  '白沙': 'Baisha',
  '昌江': 'Changjiang',
  '乐东': 'Ledong',
  '陵水': 'Lingshui',
  '保亭': 'Baoting',
  '琼中': 'Qiongzhong',
  '西沙': 'Xisha',
  '南沙': 'Nansha',
  '中沙': 'Zhongsha',
};

// 简单的拼音获取函数
const getPinyin = (cityName: string): string => {
  // 先检查常见城市映射
  if (commonCityPinyin[cityName]) {
    return commonCityPinyin[cityName];
  }
  // 如果没有映射，返回城市名称作为备选
  return cityName;
};

// 缓存城市数据
let cachedCities: CityInfo[] | null = null;
const CITY_CACHE_KEY = 'china_cities_cache';
const CITY_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天过期

// 从本地存储加载缓存
const loadCityCacheFromStorage = async (): Promise<CityInfo[] | null> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const cached = await AsyncStorage.getItem(CITY_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // 检查是否过期
      if (Date.now() - timestamp < CITY_CACHE_EXPIRY) {
        console.log('从本地存储加载城市缓存成功');
        return data;
      }
    }
  } catch (error) {
    console.error('加载城市缓存失败:', error);
  }
  return null;
};

// 保存缓存到本地存储
const saveCityCacheToStorage = async (cities: CityInfo[]): Promise<void> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(CITY_CACHE_KEY, JSON.stringify({
      data: cities,
      timestamp: Date.now(),
    }));
    console.log('城市缓存已保存到本地存储');
  } catch (error) {
    console.error('保存城市缓存失败:', error);
  }
};

/**
 * 获取所有中国城市列表（从高德地图API）
 */
export const getAllChinaCities = async (): Promise<CityInfo[]> => {
  // 如果有内存缓存，直接返回
  if (cachedCities && cachedCities.length > 0) {
    return cachedCities;
  }

  // 尝试从本地存储加载缓存
  try {
    const storageCache = await loadCityCacheFromStorage();
    if (storageCache && storageCache.length > 0) {
      cachedCities = storageCache;
      return cachedCities;
    }
  } catch (error) {
    console.error('从存储加载缓存失败，继续请求API:', error);
  }

  try {
    const params = new URLSearchParams({
      key: AMAP_REST_KEY,
      keywords: '中国',
      subdistrict: '2', // 获取省份和城市
      extensions: 'base',
    });

    const response = await fetch(`${AMAP_DISTRICT_URL}?${params}`);
    const data = await response.json();

    console.log('获取城市列表响应:', JSON.stringify(data));

    if (data.status === '1' && data.districts && data.districts.length > 0) {
      const provinces = data.districts[0].districts;
      const cities: CityInfo[] = [];

      // 遍历所有省份
      for (const province of provinces) {
        if (province.districts) {
          // 如果有城市数据
          for (const city of province.districts) {
            // 去除"市"后缀
            let cityName = city.name;
            if (cityName.endsWith('市')) {
              cityName = cityName.slice(0, -1);
            }
            cities.push({
              id: city.adcode,
              name: cityName,
              pinyin: getPinyin(cityName),
            });
          }
        }
      }

      // 按城市名称排序
      cities.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

      // 缓存结果到内存
      cachedCities = cities;

      // 保存到本地存储
      saveCityCacheToStorage(cities);

      console.log('获取到城市数量:', cities.length);

      return cities;
    }

    return [];
  } catch (error) {
    console.error('获取城市列表失败:', error);
    return [];
  }
};

/**
 * 根据城市名称获取城市信息
 */
export const getCityInfo = (cityName: string, cities: CityInfo[]): CityInfo | undefined => {
  // 去除"市"后缀进行比较
  const normalizedName = cityName.endsWith('市') ? cityName.slice(0, -1) : cityName;
  
  return cities.find(city => 
    city.name === normalizedName || 
    city.name === cityName
  );
};

/**
 * 清除城市缓存（用于强制刷新）
 */
export const clearCityCache = (): void => {
  cachedCities = null;
  // 清除本地存储的缓存
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.removeItem(CITY_CACHE_KEY).catch(() => {});
  } catch (error) {
    // 忽略错误
  }
};

