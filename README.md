# 携程酒店管理系统 — 移动端 App

基于 React Native + TypeScript + Expo 构建的酒店管理系统移动端用户端 App，为普通用户提供酒店浏览、搜索、收藏、评论及 AI 助手等核心功能。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| React Native 0.76 | 跨平台移动端框架 |
| TypeScript | 类型安全的编程语言 |
| Expo SDK 52 | React Native 开发与部署平台 |
| React Navigation 6.x | 导航管理（底部标签栏 + 堆栈导航） |
| Axios | HTTP 客户端 |
| AsyncStorage | 本地持久化存储 |
| 高德地图 API | 定位与逆地理编码 |
| OpenAI 兼容协议 | AI 智能助手对话 |

---

## 快速开始

### 1. 安装依赖

```bash
cd managesystem-mobile
npm install
```

### 2. 启动开发服务

```bash
npx expo start
```

使用 Expo Go App 扫描终端中的二维码即可在真机上预览，或在模拟器中运行。

### 3. 预构建原生工程（需添加原生模块时）

```bash
npx expo prebuild
```

生成 iOS/Android 原生工程后，使用 Xcode / Android Studio 构建。

### 4. 构建生产包

```bash
npx expo export
```

---

## 项目结构

```
managesystem-mobile/
├── App.tsx                      # 应用根组件
├── app.config.js                # Expo 全局配置（App 名称、图标、权限等）
├── babel.config.js
├── tsconfig.json
├── package.json
├── assets/                      # App 图标与启动图
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── favicon.png
│   └── splash.png
├── src/
│   ├── api/                    # API 服务层
│   │   ├── index.ts           # Axios 实例（含 Token 拦截器）
│   │   ├── ai.ts             # AI 对话接口
│   │   └── spark.ts           # 讯飞 Spark API（预留）
│   ├── screens/               # 页面组件
│   │   ├── auth/             # 认证模块
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── home/             # 首页模块
│   │   │   ├── Home.tsx
│   │   │   └── HotelList.tsx
│   │   ├── hotel/            # 酒店详情模块
│   │   │   └── HotelDetail.tsx
│   │   ├── search/           # 搜索模块
│   │   │   ├── Search.tsx
│   │   │   └── Filter.tsx
│   │   ├── favorites/        # 收藏模块
│   │   │   └── Favorites.tsx
│   │   ├── profile/          # 个人中心模块
│   │   │   ├── Profile.tsx
│   │   │   └── BrowsingHistory.tsx
│   │   ├── reviews/          # 评论模块
│   │   │   └── Reviews.tsx
│   │   └── aiassistant/      # AI 助手模块
│   │       └── AIAssistant.tsx
│   ├── components/           # 公共组件
│   │   └── CityPicker.tsx   # 城市选择器
│   ├── navigation/           # 导航配置
│   │   ├── index.ts          # 统一导出
│   │   ├── types.ts         # 路由参数类型
│   │   ├── RootNavigator.tsx    # 根导航（按登录态切换）
│   │   ├── AuthNavigator.tsx    # 认证导航栈
│   │   └── MainNavigator.tsx    # 主导航（底部标签栏）
│   ├── services/             # 业务服务层
│   │   └── location.ts     # 高德地图定位服务
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx  # 认证上下文（登录态全局管理）
│   ├── hooks/               # 自定义 Hooks
│   │   └── index.ts
│   ├── types/               # TypeScript 类型定义
│   │   ├── index.ts
│   │   └── react-native-vector-icons.d.ts
│   ├── constants/           # 常量配置
│   │   └── index.ts         # 颜色、API 地址、高德 Key、城市列表
│   └── utils/               # 工具函数
│       └── index.ts         # 价格格式化、评分显示、图片 URL 拼接、日期格式化
└── README.md
```

---

## 导航结构

```
RootNavigator（根导航器）
├── AuthNavigator（未登录）
│   ├── Login（登录页）
│   └── Register（注册页）
└── MainNavigator（已登录，底部标签栏）
    ├── HomeStack（首页）
    │   ├── Home（首页）
    │   ├── HotelList（酒店列表）
    │   └── HotelDetail（酒店详情）
    ├── FavoritesStack（收藏）
    │   └── Favorites（收藏列表）
    └── ProfileStack（个人中心）
        ├── Profile（个人中心）
        ├── BrowsingHistory（浏览历史）
        └── Reviews（评论列表）
```

---

## 核心页面

### 1. 认证模块

**登录页** `/Login`：用户名 + 密码登录，Token 持久化至 AsyncStorage，登录成功后更新 AuthContext 并跳转首页。

**注册页** `/Register`：填写用户名、密码、邮箱后通过手机/邮箱验证码完成注册。验证码 5 分钟有效，发送后按钮倒计时 60 秒。

### 2. 首页

**首页** `Home`：顶部搜索栏、城市选择器（支持 GPS 定位自动切换）、Banner 轮播图（点击跳转酒店详情）、热门酒店推荐列表（分页加载）。

**酒店列表** `HotelList`：接收城市或搜索关键词参数，支持分页加载，酒店卡片展示图片、名称、城市、评分和价格。

### 3. 酒店详情

**酒店详情** `HotelDetail`：图片轮播、基本信息、房型列表、评论展示（真实评论数）、收藏按钮。评论数据来自后端 `/api/review/hotel/:hotelId`。

### 4. 搜索

**搜索页** `Search`：关键词搜索、搜索历史（本地缓存）、热门搜索推荐。

**筛选组件** `Filter`：价格区间、评分星级、设施（停车场/WiFi/早餐等）多维筛选。

### 5. 收藏

**收藏列表** `Favorites`：展示用户收藏的酒店，支持本地缓存优先展示 + 服务端实时同步，取消收藏同步至后端。

### 6. 个人中心

**个人中心** `Profile`：展示头像、用户名、邮箱，提供浏览历史、我的评论、退出登录等入口。

**浏览历史** `BrowsingHistory`：按时间倒序展示浏览过的酒店，支持清空历史记录。

### 7. AI 助手

**AI 助手** `AIAssistant`：基于大语言模型的智能问答，支持多轮对话上下文，调用后端 `/api/ai/chat`。

---

## API 服务层

核心 API 函数（`src/api/index.ts`）：

| 分类 | 函数 | 说明 |
|------|------|------|
| 认证 | `login` | 用户登录 |
| 认证 | `register` | 用户注册 |
| 认证 | `sendVerificationCode` | 发送验证码 |
| 酒店 | `getHotelList` | 获取酒店列表（支持分页/筛选） |
| 酒店 | `getHotelDetail` | 获取酒店详情 |
| 酒店 | `searchHotels` | 关键词搜索 |
| 酒店 | `getHotelsByCity` | 按城市获取酒店 |
| 酒店 | `getPopularHotels` | 获取热门推荐 |
| 评论 | `getHotelReviews` | 获取酒店评论 |
| 评论 | `createReview` | 发表/删除评论 |
| 收藏 | `addFavorite` / `removeFavorite` | 添加/取消收藏 |
| 收藏 | `getFavorites` | 获取收藏列表 |
| 浏览历史 | `addBrowsingHistory` / `getBrowsingHistory` / `clearBrowsingHistory` | 浏览历史 CRUD |
| AI | `chatWithAI` | AI 智能对话 |

### 请求配置

- **Base URL**：`http://localhost:8080/api`
- **认证头**：`Authorization: Bearer <token>`
- **图片处理**：后端返回相对路径，通过 `getFullImageUrl()` 拼接完整 URL

---

## 状态管理

| 方式 | 说明 |
|------|------|
| `AuthContext` | 全局登录态（isLoggedIn、user 对象、login/logout 方法） |
| React `useState` / `useEffect` | 页面级状态与副作用 |
| AsyncStorage | Token、用户信息、收藏列表、搜索历史、浏览历史的持久化 |

---

## 环境配置

`src/constants/index.ts` 中包含以下可配置项：

| 配置项 | 说明 |
|--------|------|
| `API_BASE_URL` | 后端 API 地址（开发环境：`http://localhost:8080/api`） |
| `API_TIMEOUT` | 请求超时（毫秒） |
| `AMAP_KEY` | 高德地图 JS API Key |
| `AMAP_REST_KEY` | 高德地图 Web 服务 Key（用于逆地理编码） |
| `SUPPORTED_CITIES` | 支持的城市列表 |
| `AVAILABLE_AMENITIES` | 可选酒店设施 |
| `STORAGE_KEYS` | AsyncStorage 各数据项的 Key |

> 将应用发布到生产环境时，需将 `API_BASE_URL` 替换为实际的服务器地址，并确保高德地图 Key 已申请为正式版本。

---

## 常见问题

| 问题 | 排查方向 |
|------|----------|
| 图片不显示 | 确认是否使用 `getFullImageUrl()` 处理相对路径；检查 `API_BASE_URL` 是否正确 |
| GPS 定位失败 | 检查手机定位权限；确认高德地图 Key 有效；检查网络连接 |
| 登录态丢失 | 检查 Token 是否过期；AsyncStorage 是否正常读写 |
| AI 助手无响应 | 确认后端 `/api/ai/chat` 接口正常；检查 AI API Key 有效性 |

---

## 后续扩展建议

- 集成推送通知（审核结果推送）
- 增加预订与订单模块
- 完善用户积分/会员体系
- 图片懒加载与 FlatList 虚拟化优化

---

本项目仅供学习和研究使用。
