/**
 * 酒店管理系统 - 移动端用户端
 * ==========================================
 */

// ==================== 颜色配置 ====================

export const colors = {
  primary: '#1E90FF',
  secondary: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#999999',
  lightGray: '#E0E0E0',
  darkGray: '#666666',
  text: '#333333',
  textSecondary: '#666666',
  border: '#DDDDDD',
  disabled: '#CCCCCC',
};

// ==================== API 配置 ====================

/** 后端 API 基础 URL */
export const API_BASE_URL = 'http://localhost:8080';

/** API 超时时间（毫秒） */
export const API_TIMEOUT = 30000;

/** 高德地图 Web API Key */
export const AMAP_KEY = 'ec60beb00a8047166085fd4e9395b0fa';

/** 高德地图服务地址 */
export const AMAP_GEO_URL = 'https://restapi.amap.com/v3/geocode/geo';

// ==================== 图片配置 ====================

/** 默认酒店图片 */
export const DEFAULT_HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

/** 默认房型图片 */
export const DEFAULT_ROOM_IMAGE = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800';

/** 图片域名配置 - 用于处理相对路径图片 */
export const IMAGE_DOMAIN = API_BASE_URL;

// ==================== 支持的城市列表 ====================

export const SUPPORTED_CITIES = [
  { id: 'beijing', name: '北京' },
  { id: 'shanghai', name: '上海' },
  { id: 'guangzhou', name: '广州' },
  { id: 'shenzhen', name: '深圳' },
  { id: 'hangzhou', name: '杭州' },
  { id: 'chengdu', name: '成都' },
  { id: 'wuhan', name: '武汉' },
  { id: 'xian', name: '西安' },
  { id: 'nanjing', name: '南京' },
  { id: 'chongqing', name: '重庆' },
  { id: 'suzhou', name: '苏州' },
  { id: 'tianjin', name: '天津' },
  { id: 'changsha', name: '长沙' },
  { id: 'qingdao', name: '青岛' },
  { id: 'xiamen', name: '厦门' },
  { id: 'kunming', name: '昆明' },
  { id: 'dalian', name: '大连' },
  { id: 'shenyang', name: '沈阳' },
  { id: 'haerbin', name: '哈尔滨' },
  { id: 'jinan', name: '济南' },
] as const;

// ==================== 酒店设施列表 ====================

export const AVAILABLE_AMENITIES = [
  { id: 'wifi', name: 'WiFi', icon: 'wifi' },
  { id: 'pool', name: '游泳池', icon: 'water' },
  { id: 'gym', name: '健身房', icon: 'fitness-center' },
  { id: 'restaurant', name: '餐厅', icon: 'restaurant' },
  { id: 'parking', name: '停车场', icon: 'local-parking' },
  { id: 'spa', name: 'SPA', icon: 'spa' },
  { id: 'river-view', name: '江景', icon: 'water' },
  { id: 'breakfast', name: '早餐', icon: 'free-breakfast' },
  { id: 'airport-pickup', name: '接机服务', icon: 'flight-takeoff' },
  { id: 'luggage', name: '行李寄存', icon: 'luggage' },
  { id: '24h-frontdesk', name: '24小时前台', icon: 'access-time' },
  { id: 'ac', name: '空调', icon: 'ac-unit' },
  { id: 'tv', name: '电视', icon: 'tv' },
  { id: 'bathtub', name: '浴缸', icon: 'bathtub' },
  { id: 'balcony', name: '阳台', icon: 'balcony' },
  { id: 'elevator', name: '电梯', icon: 'elevator' },
  { id: 'meeting-room', name: '会议室', icon: 'meeting-room' },
  { id: 'business-center', name: '商务中心', icon: 'business' },
  { id: 'kids-playground', name: '儿童游乐场', icon: 'child-care' },
  { id: 'pet-friendly', name: '宠物友好', icon: 'pets' },
] as const;

// ==================== 存储 Keys ====================

/** Token 存储 Key */
export const STORAGE_KEYS = {
  TOKEN: '@hotel_app_token',
  USER: '@hotel_app_user',
  FAVORITES: '@hotel_app_favorites',
  SEARCH_HISTORY: '@hotel_app_search_history',
} as const;

// ==================== 分页配置 ====================

/** 默认分页大小 */
export const DEFAULT_PAGE_SIZE = 10;

/** 酒店列表每页数量 */
export const HOTEL_PAGE_SIZE = 10;

// ==================== 图片限制 ====================

/** 酒店图片最多 */
export const HOTEL_IMAGES_MAX = 9;

/** 房型图片最多 */
export const ROOM_IMAGES_MAX = 3;


