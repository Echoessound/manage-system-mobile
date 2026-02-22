# 酒店管理系统移动端

基于 React Native + Expo 构建的酒店管理系统移动端应用，为用户提供酒店搜索、浏览、收藏等功能。

## 技术栈

| 技术 | 用途 |
|------|------|
| React Native | 跨平台移动应用框架 |
| Expo | React Native 开发工具链 |
| TypeScript | 类型安全的编程语言 |
| React Navigation | 导航管理 |
| Axios | HTTP 请求库 |
| AsyncStorage | 本地数据存储 |

## 项目架构

```
managesystem-mobile/
├── src/
│   ├── api/                    # API 服务层
│   │   └── index.ts           # Axios 配置和 API 接口
│   ├── components/             # 可复用组件
│   ├── constants/              # 常量定义
│   │   └── index.ts           # 颜色、API 配置等
│   ├── hooks/                  # 自定义 React Hooks
│   │   └── index.ts           # 认证、酒店、收藏等 Hooks
│   ├── navigation/            # 导航配置
│   │   ├── AuthNavigator.tsx  # 认证导航（登录/注册）
│   │   ├── MainNavigator.tsx  # 主导航（底部标签+堆栈）
│   │   ├── RootNavigator.tsx  # 根导航（根据登录状态切换）
│   │   └── types.ts           # 导航类型定义
│   ├── screens/               # 页面视图层
│   │   ├── auth/              # 认证相关
│   │   │   ├── Login.tsx      # 登录页面
│   │   │   └── Register.tsx   # 注册页面
│   │   ├── favorites/         # 收藏页面
│   │   │   └── Favorites.tsx  # 我的收藏
│   │   ├── home/              # 首页
│   │   │   ├── Home.tsx       # 搜索首页
│   │   │   └── HotelList.tsx  # 酒店列表
│   │   ├── hotel/             # 酒店详情
│   │   │   └── HotelDetail.tsx # 酒店详情页
│   │   ├── profile/           # 个人中心
│   │   │   └── Profile.tsx    # 个人中心
│   │   └── search/            # 搜索相关
│   │       ├── Search.tsx      # 搜索页面
│   │       └── Filter.tsx      # 筛选页面
│   ├── services/              # 辅助服务
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts           # 数据类型定义
│   ├── utils/                 # 工具函数
│   │   └── index.ts           # 格式化、存储等工具
│   └── App.tsx                # 应用入口
├── assets/                    # 静态资源
│   ├── icon.png               # 应用图标
│   ├── adaptive-icon.png      # 自适应图标
│   ├── splash.png             # 启动屏
│   └── favicon.png            # 网页图标
├── app.json                   # Expo 配置文件
├── babel.config.js            # Babel 配置
├── metro.config.js            # Metro 打包配置
├── package.json               # 项目依赖配置
└── tsconfig.json              # TypeScript 配置
```

## 核心功能模块

### 1. 用户认证
| 页面 | 功能说明 |
|------|----------|
| 登录页 | 用户登录，支持 token 自动登录 |
| 注册页 | 用户注册，支持邮箱验证码 |

### 2. 酒店浏览
| 页面 | 功能说明 |
|------|----------|
| 首页 | 城市选择、关键词搜索 |
| 酒店列表 | 酒店列表展示、下拉刷新、加载更多 |
| 酒店详情 | 酒店信息、图片轮播、房型查看、收藏 |

### 3. 收藏管理
| 页面 | 功能说明 |
|------|----------|
| 我的收藏 | 查看已收藏的酒店、取消收藏 |

### 4. 个人中心
| 页面 | 功能说明 |
|------|----------|
| 个人中心 | 用户信息查看、设置、退出登录 |

## 数据结构定义

### 酒店信息类型

```typescript
interface Hotel {
  _id: string;              // 酒店 ID
  name: string;             // 酒店名称
  description: string;      // 酒店描述
  address: string;          // 详细地址
  city: string;             // 所在城市
  
  // 价格与评分
  price: number;            // 基础价格（元）
  rating: number;          // 用户评分（0-5分）
  
  // 图片与设施
  images: string[];        // 酒店图片 URL 数组
  amenities: string[];      // 设施配置列表
  
  // 房型信息
  roomTypes: RoomType[];   // 房型信息数组
  
  // 联系信息
  contactPhone: string;     // 联系电话
  checkInTime: string;     // 最早入住时间
  checkOutTime: string;    // 最晚退房时间
  
  // 审核相关
  status: 'pending' | 'approved' | 'rejected'; // 审核状态
  publishStatus: 'published' | 'unpublished';  // 发布状态
  rejectReason?: string;   // 审核拒绝原因
}

interface RoomType {
  name: string;           // 房型名称
  description: string;    // 房型描述
  images: string[];       // 房型图片
  price: number;          // 房型价格
  capacity: number;       // 容纳人数
  count: number;          // 房间数量
  amenities: string[];    // 设施配置
}
```

## API 接口对接

后端服务地址：`http://localhost:8080`

### 认证接口

| 接口路径 | 请求方法 | 功能描述 |
|----------|----------|----------|
| `/api/auth/sendCode` | POST | 发送邮箱验证码 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/current` | GET | 获取当前用户信息 |

### 酒店管理接口

| 接口路径 | 请求方法 | 功能描述 |
|----------|----------|----------|
| `/api/hotel/list` | GET | 获取酒店列表 |
| `/api/hotel/search` | GET | 搜索酒店 |
| `/api/hotel/:id` | GET | 获取酒店详情 |
| `/api/hotel/city/:city` | GET | 获取指定城市酒店 |

## 支持城市

| 序号 | 城市 | 序号 | 城市 |
|------|------|------|------|
| 1 | 北京 | 11 | 苏州 |
| 2 | 上海 | 12 | 天津 |
| 3 | 广州 | 13 | 长沙 |
| 4 | 深圳 | 14 | 青岛 |
| 5 | 杭州 | 15 | 厦门 |
| 6 | 成都 | 16 | 昆明 |
| 7 | 武汉 | 17 | 大连 |
| 8 | 西安 | 18 | 沈阳 |
| 9 | 南京 | 19 | 哈尔滨 |
| 10 | 重庆 | 20 | 济南 |

## 设施配置

| 分类 | 支持的设施 |
|------|-----------|
| 网络设施 | WiFi |
| 休闲设施 | 游泳池、健身房、SPA、江景 |
| 餐饮服务 | 餐厅、早餐 |
| 交通服务 | 停车场、接机服务 |
| 客房服务 | 空调、电视、浴缸、阳台、24小时前台、行李寄存 |
| 建筑设施 | 电梯 |
| 商务设施 | 会议室、商务中心 |
| 其他服务 | 儿童游乐场、宠物友好 |

## 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- Expo Go App（移动端）或 Android Studio / Xcode（原生构建）

### 1. 安装依赖

```bash
cd managesystem-mobile
npm install
```

### 2. 启动开发服务器

```bash
npx expo start
```

或者使用 web 模式：

```bash
npx expo start --web
```

### 3. 在移动设备上运行

1. 安装 Expo Go App（iOS/Android）
2. 扫描终端显示的二维码
3. 应用将自动加载

### 4. 构建原生应用（可选）

```bash
# Android
npx expo prebuild
npx expo run:android

# iOS
npx expo prebuild
npx expo run:ios
```

## 后端服务配置

确保后端服务已启动（默认端口：8080）。

如需修改 API 地址，编辑 `src/constants/index.ts`：

```typescript
export const API_BASE_URL = 'http://localhost:8080';
```

## 项目截图

（待添加）

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2026-02-21 | 初始版本，包含登录注册、酒店搜索、列表、详情、收藏功能 |

## 许可证

本项目仅供学习和研究使用。

