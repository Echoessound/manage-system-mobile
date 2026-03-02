# 携程酒店管理系统 - 移动端（用户端）

本项目是 **携程酒店管理系统** 的移动端用户端（App），基于 React Native + TypeScript + Expo 构建，为普通用户提供酒店浏览、搜索、预订、收藏、评论等核心功能。

---

## 一、技术栈

- **移动端框架**：React Native 0.76 + TypeScript
- **开发平台**：Expo SDK 52
- **导航框架**：React Navigation 6.x（底部标签栏 + 堆栈导航）
- **HTTP 客户端**：Axios
- **本地存储**：AsyncStorage
- **地图服务**：高德地图 API（定位、逆地理编码）
- **AI 服务**：OpenAI 兼容 API（`https://yinli.one/v1`）
- **UI 组件**：react-native-vector-icons（图标）

---

## 二、目录结构

```bash
src/
├── api/                    # API 服务层（HTTP 请求封装）
│   ├── index.ts               # 核心 API 客户端（Axios 拦截器、认证、酒店、评论、收藏 API）
│   ├── ai.ts                  # AI 助手对话 API
│   └── spark.ts               # 科大讯飞 Spark API（预留）
├── screens/                 # 页面组件（路由对应的页面）
│   ├── auth/                 # 认证模块
│   │   ├── Login.tsx            # 登录页
│   │   └── Register.tsx          # 注册页（含邮箱验证码）
│   ├── home/                 # 首页模块
│   │   ├── Home.tsx              # 首页（搜索栏、城市选择、轮播图、酒店推荐）
│   │   └── HotelList.tsx         # 酒店列表（分页加载、卡片展示）
│   ├── hotel/                # 酒店详情模块
│   │   └── HotelDetail.tsx       # 酒店详情（图片轮播、房型、评论、收藏）
│   ├── search/               # 搜索模块
│   │   ├── Search.tsx            # 搜索页（关键词搜索、历史记录）
│   │   └── Filter.tsx            # 筛选组件（价格、评分、设施）
│   ├── favorites/            # 收藏模块
│   │   └── Favorites.tsx         # 收藏列表
│   ├── profile/              # 个人中心模块
│   │   ├── Profile.tsx            # 个人中心
│   │   └── BrowsingHistory.tsx    # 浏览历史
│   ├── reviews/              # 评论模块
│   │   └── Reviews.tsx            # 评论列表
│   └── aiassistant/          # AI 助手模块
│       └── AIAssistant.tsx        # AI 智能助手聊天页面
├── components/               # 公共组件
│   └── CityPicker.tsx           # 城市选择器
├── services/                 # 业务服务层
│   └── location.ts               # 定位服务（高德地图 API 集成）
├── types/                    # TypeScript 类型定义
│   ├── index.ts                  # 核心类型（User、Hotel、RoomType、ApiResponse 等）
│   └── react-native-vector-icons.d.ts  # 图标库类型声明
├── utils/                    # 工具函数
│   └── index.ts                  # 工具集合（价格格式化、评分显示、图片 URL 处理、日期格式化）
├── navigation/                # 导航配置
│   ├── index.ts                   # 导航导出
│   ├── types.ts                  # 导航参数类型
│   ├── RootNavigator.tsx         # 根导航器（根据登录态切换）
│   ├── AuthNavigator.tsx         # 认证导航栈（登录、注册）
│   └── MainNavigator.tsx         # 主导航栈（底部标签栏 + 页面栈）
├── constants/                 # 常量定义
│   └── index.ts                  # 颜色、API 配置、高德地图 Key、默认图片、城市列表等
├── contexts/                  # React Context
│   └── AuthContext.tsx           # 认证上下文（登录态、用户信息）
├── hooks/                     # 自定义 Hooks
│   └── index.ts                  # Hook 导出（useAuth 等）
├── App.tsx                    # 应用根组件
└── main.tsx                   # 入口文件
```

---

## 三、核心页面（ Screens）

### 1. 认证模块（auth/）

#### 1.1 登录页（Login）

**文件**：`src/screens/auth/Login.tsx`

**功能**：

- 用户名 + 密码登录
- 登录成功后保存 JWT Token 至 AsyncStorage
- 登录成功后更新 AuthContext 状态
- 登录失败显示错误提示

**关键交互**：

- 输入用户名、密码 → 点击登录 → 调用 `POST /api/auth/login`
- 成功 → 保存 Token → 跳转至首页
- 失败 → Alert 弹窗提示错误信息

---

#### 1.2 注册页（Register）

**文件**：`src/screens/auth/Register.tsx`

**功能**：

- 用户注册（填写用户名、密码、邮箱）
- **邮箱验证码**：点击"获取验证码" → 后端发送 6 位数字验证码到用户邮箱
- 输入验证码 → 提交注册 → 调用 `POST /api/auth/register`

**验证码流程**：

- 填写邮箱 → 点击获取验证码 → 按钮倒计时（60 秒后可重新发送）
- 验证码有效期：5 分钟

---

### 2. 首页模块（home/）

#### 2.1 首页（Home）

**文件**：`src/screens/home/Home.tsx`

**功能**：

- **顶部搜索栏**：点击跳转至搜索页
- **城市选择**：点击城市名弹出城市选择器
- **定位功能**：获取用户当前位置，自动切换到所在城市
- **轮播图 Banner**：展示推荐酒店图片，**点击可跳转至酒店详情页**
- **酒店推荐列表**：展示热门酒店、支持分页加载

**关键交互**：

- 点击 Banner 图片 → 跳转 `HotelDetail`（使用 `hotel.id || hotel._id` 兼容不同 ID 字段）
- 点击定位按钮 → 调用 `expo-location` 获取经纬度 → 调用高德地图逆地理编码 → 切换城市
- 定位成功后在顶部弹出通知：`Alert.alert('定位成功', '已切换到 XX')`

---

#### 2.2 酒店列表（HotelList）

**文件**：`src/screens/home/HotelList.tsx`

**功能**：

- 展示某一城市或搜索关键词下的酒店列表
- 分页加载（每次加载 10 条）
- 酒店卡片展示：图片、名称、城市、评分、价格

**关键交互**：

- 滑动到底部自动加载下一页
- 点击酒店卡片 → 跳转 `HotelDetail`

---

### 3. 酒店详情模块（hotel/）

#### 3.1 酒店详情（HotelDetail）

**文件**：`src/screens/hotel/HotelDetail.tsx`

**功能**：

- **图片轮播**：展示酒店外观图片
- **基本信息**：名称、地址、评分、好评率
- **房型列表**：每种房型的价格、人容量、房间数量、图片
- **评论列表**：展示真实评论（从后端 `GET /api/review/hotel/:hotelId` 获取）
- **真实评价数**：使用 `getHotelReviews` API 获取真实评论数量并展示
- **收藏按钮**：点击收藏/取消收藏

**关键交互**：

- 图片使用 `getFullImageUrl` 处理，确保从相对路径加载完整 URL
- 页面加载时同时获取酒店详情和评论数据

---

### 4. 搜索模块（search/）

#### 4.1 搜索页（Search）

**文件**：`src/screens/search/Search.tsx`

**功能**：

- 关键词输入搜索
- 搜索历史记录（本地存储）
- 热门搜索推荐

**关键交互**：

- 输入关键词 → 点击搜索 → 跳转至 `HotelList`（带搜索参数）
- 点击搜索历史 → 直接填充关键词并搜索

---

#### 4.2 筛选组件（Filter）

**文件**：`src/screens/search/Filter.tsx`

**功能**：

- 价格区间筛选（最低价、最高价）
- 评分筛选（1-5 星）
- 设施筛选（停车场、WiFi、早餐等）

**关键交互**：

- 选择筛选条件 → 回调父组件更新搜索参数 → 重新请求酒店列表

---

### 5. 收藏模块（favorites/）

#### 5.1 收藏列表（Favorites）

**文件**：`src/screens/favorites/Favorites.tsx`

**功能**：

- 展示用户收藏的酒店列表
- 支持本地缓存 + 服务端同步
- 点击取消收藏 → 同步至服务端

**数据来源**：

- 优先从本地 AsyncStorage 读取（离线可用）
- 同时从服务端 `GET /api/favorite/list` 同步

---

### 6. 个人中心模块（profile/）

#### 6.1 个人中心（Profile）

**文件**：`src/screens/profile/Profile.tsx`

**功能**：

- 展示用户头像、用户名、邮箱
- 入口：浏览历史、我的评论、设置
- 退出登录

**关键交互**：

- 点击退出登录 → 清除 Token 和用户信息 → 跳转登录页

---

#### 6.2 浏览历史（BrowsingHistory）

**文件**：`src/screens/profile/BrowsingHistory.tsx`

**功能**：

- 记录用户浏览过的酒店
- 按时间倒序排列
- 支持清空历史记录

**数据来源**：

- 本地 AsyncStorage 缓存
- 服务端 `GET /api/browsingHistory/list` 同步

---

### 7. 评论模块（reviews/）

#### 7.1 评论列表（Reviews）

**文件**：`src/screens/reviews/Reviews.tsx`

**功能**：

- 展示某一酒店的所有评论
- 显示评论时间、用户、评分、内容
- 统计好评率

---

### 8. AI 助手模块（aiassistant/）

#### 8.1 AI 助手（AIAssistant）

**文件**：`src/screens/aiassistant/AIAssistant.tsx`

**功能**：

- 基于大语言模型的智能问答
- 支持多轮对话上下文
- 输入框 + 发送按钮

**实现**：

- 调用后端 `POST /api/ai/chat`
- 后端调用 `https://yinli.one/v1/chat/completions`
- UI 优化：输入框带阴影、发送按钮居中

---

## 四、核心组件（Components）

### 1. 城市选择器（CityPicker）

**文件**：`src/components/CityPicker.tsx`

**功能**：

- 弹出式城市选择面板
- 支持城市搜索
- 常用城市快捷入口

---

## 五、API 服务层（API）

### 1. 核心 API 客户端

**文件**：`src/api/index.ts`

**功能**：

- Axios 实例创建（Base URL、超时时间）
- 请求拦截器：自动携带 JWT Token
- 响应拦截器：统一错误处理

**核心 API 函数**：

| 模块 | 函数 | 说明 |
|------|------|------|
| 认证 | `login` | 用户登录 |
| 认证 | `register` | 用户注册 |
| 认证 | `sendVerificationCode` | 发送邮箱验证码 |
| 酒店 | `getHotelList` | 获取酒店列表（支持分页、筛选） |
| 酒店 | `getHotelDetail` | 获取酒店详情 |
| 酒店 | `searchHotels` | 关键词搜索 |
| 酒店 | `getHotelsByCity` | 按城市获取酒店 |
| 酒店 | `getPopularHotels` | 获取热门推荐 |
| 评论 | `getHotelReviews` | 获取酒店评论（**真实评论数**） |
| 评论 | `createReview` | 发表评论 |
| 评论 | `deleteReview` | 删除评论 |
| 收藏 | `addFavorite` | 添加收藏 |
| 收藏 | `removeFavorite` | 取消收藏 |
| 收藏 | `getFavorites` | 获取收藏列表 |
| 浏览历史 | `addBrowsingHistory` | 添加浏览记录 |
| 浏览历史 | `getBrowsingHistory` | 获取浏览历史 |
| 浏览历史 | `clearBrowsingHistory` | 清空浏览历史 |

---

### 2. AI API

**文件**：`src/api/ai.ts`

**功能**：

- AI 智能对话
- 支持两种后端响应格式兼容：
  - 新格式：`{ success: true, message: "..." }`
  - 旧格式：`{ code: 200, data: { message: { content: "..." } } }

---

## 六、服务层（Services）

### 1. 定位服务

**文件**：`src/services/location.ts`

**功能**：

- 请求定位权限
- 获取当前经纬度
- 调用高德地图逆地理编码 API 获取城市信息

**实现**：

- 使用 `expo-location` 获取位置
- 使用高德地图 Web API 进行逆地理编码

---

## 七、类型定义（Types）

**文件**：`src/types/index.ts`

**核心类型**：

```typescript
// 用户
interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'merchant' | 'admin';
  avatar?: string;
}

// 酒店
interface Hotel {
  _id: string;
  name: string;
  description: string;
  city: string;
  address: string;
  price: number;
  rating: number;
  images: string[];
  amenities: string[];
  ownerId: string;
  status: string;
  publishStatus: string;
  roomTypes: RoomType[];
  createdAt: string;
  updatedAt: string;
}

// 房型
interface RoomType {
  name: string;
  description: string;
  price: number;
  capacity: number;
  count: number;
  bedType?: string;
  area?: number;
  images: string[];
  amenities?: string[];
}

// 评论
interface Review {
  _id: string;
  hotelId: string;
  userId: string;
  username?: string;
  rating: number;
  content: string;
  images?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: string;
}

// API 响应
interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
  success?: boolean;
}

// 分页数据
interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 八、工具函数（Utils）

**文件**：`src/utils/index.ts`

| 函数 | 说明 |
|------|------|
| `formatPrice` | 价格格式化（如 ¥520） |
| `getRatingDisplay` | 评分显示（如 4.8 分、非常好） |
| `getFullImageUrl` | **获取完整图片 URL**：相对路径拼接 API Base URL，解决移动端图片不显示问题 |
| `formatDate` | 日期格式化 |

---

## 九、导航配置（Navigation）

### 1. 导航结构

```
RootNavigator（根导航器）
├── AuthNavigator（未登录状态）
│   ├── Login（登录页）
│   └── Register（注册页）
└── MainNavigator（已登录状态）
    ├── HomeStack（首页栈）
    │   ├── Home（首页）
    │   ├── HotelDetail（酒店详情）
    │   └── Search（搜索页）
    ├── FavoritesStack（收藏栈）
    │   └── Favorites（收藏列表）
    └── ProfileStack（个人中心栈）
        ├── Profile（个人中心）
        ├── BrowsingHistory（浏览历史）
        └── Reviews（评论列表）
```

### 2. 导航文件说明

| 文件 | 说明 |
|------|------|
| `RootNavigator.tsx` | 根据 AuthContext 中的登录态切换导航栈 |
| `AuthNavigator.tsx` | 登录、注册页的堆栈导航 |
| `MainNavigator.tsx` | 底部标签栏 + 各模块堆栈导航 |
| `types.ts` | 所有路由的参数类型定义 |

---

## 十、常量定义（Constants）

**文件**：`src/constants/index.ts`

| 常量 | 说明 |
|------|------|
| `colors` | 应用颜色配置（主色、背景色、文字色等） |
| `API_BASE_URL` | API 基础路径 `http://localhost:8080/api` |
| `API_TIMEOUT` | 请求超时时间（毫秒） |
| `AMAP_KEY` | 高德地图 JS API Key |
| `AMAP_REST_KEY` | 高德地图 Web 服务 Key |
| `DEFAULT_HOTEL_IMAGE` | 默认酒店图片 |
| `DEFAULT_ROOM_IMAGE` | 默认房型图片 |
| `SUPPORTED_CITIES` | 支持的城市列表 |
| `AVAILABLE_AMENITIES` | 酒店可选设施列表 |
| `STORAGE_KEYS` | AsyncStorage 存储 Key 列表 |

---

## 十一、状态管理

### 1. 全局状态（AuthContext）

**文件**：`src/contexts/AuthContext.tsx`

- 登录状态（isLoggedIn）
- 用户信息（user）
- 登录方法（login）
- 注册方法（register）
- 登出方法（logout）

### 2. 本地状态

- React `useState`：页面级状态
- React `useEffect`：副作用处理（数据请求、订阅）

### 3. 持久化存储

- **AsyncStorage**：
  - Token 存储
  - 用户信息缓存
  - 收藏列表缓存
  - 搜索历史
  - 浏览历史

---

## 十二、接口调用规范

### 1. 基础配置

- **Base URL**：`http://localhost:8080/api`
- **请求头**：
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

### 2. 图片加载规范

- 后端返回相对路径（如 `/uploads/hotel/xxx.jpg`）
- 使用 `getFullImageUrl` 拼接完整 URL：
  ```typescript
  const imageUrl = getFullImageUrl(relativePath);
  // 传入相对路径，返回完整 URL
  ```

---

## 十三、页面截图与功能对应（演示建议）

| 功能模块 | 页面 | 演示要点 | 建议截图位置 |
|----------|------|----------|-------------|
| 登录/注册 | Login/Register | 邮箱验证码流程 | 登录页、注册页 |
| 首页 | Home | 定位功能、Banner 点击跳转、推荐列表 | 首页 |
| 酒店列表 | HotelList | 分页加载、酒店卡片展示 | 酒店列表页 |
| 酒店详情 | HotelDetail | 真实评论数、图片轮播、房型展示 | 详情页 |
| 搜索 | Search | 关键词搜索、历史记录 | 搜索页 |
| 筛选 | Filter | 价格、评分、设施筛选 | 筛选弹窗 |
| 收藏 | Favorites | 收藏列表、取消收藏 | 收藏页 |
| 浏览历史 | BrowsingHistory | 历史记录、清空历史 | 历史页 |
| AI 助手 | AIAssistant | 智能问答、多轮对话 | AI 助手页 |
| 个人中心 | Profile | 用户信息、退出登录 | 个人中心页 |

---

## 十四、常见问题与排查

1. **图片不显示**：
   - 检查图片路径是否为相对路径
   - 确认是否使用 `getFullImageUrl` 处理
   - 检查 Base URL 配置是否正确

2. **定位失败**：
   - 检查手机定位权限是否开启
   - 检查高德地图 Key 是否配置正确
   - 检查网络连接

3. **登录态丢失**：
   - 检查 Token 是否过期
   - 检查 AsyncStorage 是否正常写入

4. **AI 助手无响应**：
   - 检查后端 AI 模块是否正常（`/api/ai/chat`）
   - 检查 API Key 是否有效
   - 查看后端日志

5. **评论数为 0**：
   - 确认是否使用 `getHotelReviews` 获取真实评论数
   - 检查后端评论接口是否正常

---

## 十五、后续扩展建议

- ✅ 集成_push 通知（审核结果推送）
- ✅ 增加酒店预订功能（订单模块）
- ✅ 增加地图选点（创建酒店时选择位置）
- ✅ 增加消息中心（系统通知）
- ✅ 增加用户积分/会员体系
- ✅ 性能优化（FlatList 虚拟化、图片懒加载）

---

**维护人**：携程大作业项目组  
**更新时间**：2026-03
