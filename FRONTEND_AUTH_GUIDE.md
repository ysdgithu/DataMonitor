# 前端认证功能快速开始指南

## 🚀 5 分钟快速开始

### 第 1 步：确保后端服务运行

```bash
cd websocket-server
npm run init-db
npm run init-admin
npm start
```

后端服务应该运行在 `http://localhost:3002`

### 第 2 步：配置前端环境变量

创建 `.env.local` 文件（在项目根目录）：

```env
VITE_API_URL=http://localhost:3002/api
VITE_WS_URL=ws://localhost:8080
```

### 第 3 步：启动前端开发服务器

```bash
npm install
npm run dev
```

前端应该运行在 `http://localhost:5173`

### 第 4 步：访问应用

打开浏览器访问 `http://localhost:5173`，会自动重定向到登录页面。

---

## 🔑 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | Admin@123456 | admin |
| testuser | Test@123456 | user |

---

## 📝 功能演示

### 1. 登录

**URL**: `http://localhost:5173/login`

**步骤**:
1. 输入用户名: `admin`
2. 输入密码: `Admin@123456`
3. 可选：勾选"记住我"
4. 点击"登录"按钮

**预期结果**:
- 显示"登录成功"提示
- 自动跳转到主页面 (`/`)
- Token 保存到 localStorage

### 2. 注册

**URL**: `http://localhost:5173/register`

**步骤**:
1. 输入用户名（3-50字符，字母数字下划线）
2. 输入邮箱（可选）
3. 输入密码（至少8字符，包含大小写和数字）
4. 确认密码
5. 点击"注册"按钮

**预期结果**:
- 显示"注册成功"提示
- 自动登录并跳转到主页面
- Token 保存到 localStorage

### 3. 访问受保护的页面

**URL**: `http://localhost:5173/`

**步骤**:
1. 登录成功后自动跳转到主页面
2. 主页面会自动加载数据

**预期结果**:
- 显示仪表板数据
- 所有 API 请求都自动添加 Authorization 头

### 4. Token 自动刷新

**场景**: Access token 过期

**预期结果**:
- 自动调用 `/api/refresh` 刷新 token
- 原始请求自动重试
- 用户无感知

### 5. 登出

**步骤**:
1. 在主页面找到登出按钮（通常在右上角）
2. 点击登出

**预期结果**:
- Token 被清除
- 自动跳转到登录页面

---

## 🔍 调试技巧

### 查看 Token

在浏览器控制台执行：

```javascript
// 查看 access token
localStorage.getItem('datamonitor_access_token')

// 查看 refresh token
localStorage.getItem('datamonitor_refresh_token')

// 查看是否记住用户
localStorage.getItem('datamonitor_remember_me')
```

### 查看认证状态

在浏览器控制台执行：

```javascript
// 导入 auth store
import { useAuthStore } from './stores/auth'

// 获取 store 实例
const authStore = useAuthStore()

// 查看认证状态
console.log(authStore.authState)
```

### 查看 API 请求日志

在开发环境下，所有 API 请求和响应都会打印到控制台：

```
[Request] {method: 'POST', url: '/login', hasToken: false}
[Response] {status: 200, url: '/login', data: {...}}
```

### 清除所有数据

在浏览器控制台执行：

```javascript
// 清除 localStorage
localStorage.clear()

// 清除 sessionStorage
sessionStorage.clear()

// 刷新页面
location.reload()
```

---

## 📁 文件结构

```
src/
├── utils/
│   ├── auth.types.ts          # 认证类型定义
│   ├── tokenManager.ts        # Token 管理工具
│   ├── request.ts             # Axios 请求配置
│   └── historyApi.ts          # API 接口（已更新）
├── stores/
│   └── auth.ts                # 认证 Pinia Store
├── views/
│   ├── LoginView.vue          # 登录页面
│   ├── RegisterView.vue       # 注册页面
│   └── HomeView.vue           # 主页面（已有）
├── router/
│   └── index.ts               # 路由配置（已更新）
└── main.ts                    # 应用入口（已更新）
```

---

## 🔐 安全建议

1. **生产环境**
   - 使用 HTTPS 而不是 HTTP
   - 设置合理的 token 过期时间
   - 启用 CORS 白名单
   - 不要在代码中硬编码 API URL

2. **Token 管理**
   - 不要在 localStorage 中存储敏感信息
   - 定期检查 token 是否过期
   - 实现自动登出机制

3. **表单验证**
   - 前端验证用户输入
   - 后端也要验证（不要信任前端）
   - 实现速率限制防止暴力破解

---

## 🐛 常见问题

### Q: 登录后页面仍然显示登录页面？
A: 检查以下几点：
1. 后端服务是否正常运行
2. API URL 是否正确配置
3. 浏览器控制台是否有错误信息
4. 清除浏览器缓存并刷新页面

### Q: Token 刷新失败怎么办？
A: 这通常意味着 refresh token 也过期了，需要重新登录。

### Q: 如何修改 token 过期时间？
A: 在后端 `websocket-server/src/utils/auth.ts` 中修改 `JWT_EXPIRY` 常量。

### Q: 如何禁用"记住我"功能？
A: 在 `src/views/LoginView.vue` 中删除相关代码。

### Q: 如何添加其他登录方式（如社交登录）？
A: 在 `src/stores/auth.ts` 中添加新的登录方法。

---

## 📊 API 接口

### 登录
```
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@datamonitor.local",
      "role": "admin"
    }
  },
  "message": "登录成功"
}
```

### 注册
```
POST /api/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "NewUser@123456",
  "email": "newuser@example.com"
}

Response: 同登录
```

### 刷新 Token
```
POST /api/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 访问受保护的 API
```
GET /api/core-metrics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
{
  "success": true,
  "data": [...],
  "total": 100
}
```

---

## 🎯 下一步

1. 测试所有认证功能
2. 在生产环境中部署
3. 监控认证相关的错误
4. 收集用户反馈并改进

---

## 📞 需要帮助？

- 查看代码注释
- 查看类型定义
- 查看后端 API 文档
- 检查浏览器控制台错误信息

