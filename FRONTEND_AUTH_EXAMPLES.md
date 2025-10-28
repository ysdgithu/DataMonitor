# 前端认证功能代码示例

## 1. 类型定义示例

**文件**: `src/utils/auth.types.ts`

### 用户类型

```typescript
export interface User {
  id: number
  username: string
  email?: string
  role: 'admin' | 'user'
  createdAt?: string
  updatedAt?: string
}

export interface UserPayload {
  id: number
  username: string
  role: 'admin' | 'user'
}
```

### 登录/注册请求

```typescript
export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  email?: string
}
```

---

## 2. Token 管理示例

**文件**: `src/utils/tokenManager.ts`

### 保存和获取 Token

```typescript
import { TokenManager } from '@/utils/tokenManager'

// 保存 tokens
TokenManager.setTokens(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  true  // rememberMe
)

// 获取 access token
const token = TokenManager.getAccessToken()
console.log(token)  // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// 获取 refresh token
const refreshToken = TokenManager.getRefreshToken()
console.log(refreshToken)  // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 检查 Token 过期

```typescript
// 检查 token 是否过期
const isExpired = TokenManager.isTokenExpired(token)
console.log(isExpired)  // true 或 false

// 获取 token 剩余有效时间（毫秒）
const remaining = TokenManager.getTokenRemainingTime(token)
console.log(remaining)  // 3600000 (1小时)

// 检查是否有有效的 access token
const hasValid = TokenManager.hasValidAccessToken()
console.log(hasValid)  // true 或 false
```

### 解析 Token

```typescript
// 解析 token 获取负载信息
const payload = TokenManager.parseToken(token)
console.log(payload)
// {
//   id: 1,
//   username: 'admin',
//   role: 'admin',
//   iat: 1234567890,
//   exp: 1234571490
// }
```

### 清除 Token

```typescript
// 清除所有 tokens
TokenManager.clearTokens()

// 检查是否记住了用户
const remembered = TokenManager.isRemembered()
console.log(remembered)  // true 或 false
```

---

## 3. Axios 请求配置示例

**文件**: `src/utils/request.ts`

### 使用 Request 实例

```typescript
import request from '@/utils/request'

// GET 请求
const response = await request.get('/core-metrics', {
  params: { limit: 10, offset: 0 }
})

// POST 请求
const response = await request.post('/login', {
  username: 'admin',
  password: 'Admin@123456'
})

// PUT 请求
const response = await request.put('/user/profile', {
  email: 'newemail@example.com'
})

// DELETE 请求
const response = await request.delete('/user/123')
```

### 自动 Token 刷新

```typescript
// 当 API 返回 401 错误时，会自动：
// 1. 调用 /api/refresh 刷新 token
// 2. 保存新的 token
// 3. 重试原始请求
// 用户无需手动处理

const response = await request.get('/protected-api')
// 如果 token 过期，会自动刷新并重试
```

---

## 4. 认证 Store 示例

**文件**: `src/stores/auth.ts`

### 在组件中使用 Auth Store

```typescript
import { useAuthStore } from '@/stores/auth'

export default {
  setup() {
    const authStore = useAuthStore()

    // 访问认证状态
    console.log(authStore.isAuthenticated)  // true 或 false
    console.log(authStore.user)             // User 对象或 null
    console.log(authStore.loading)          // true 或 false
    console.log(authStore.error)            // 错误信息或 null

    // 检查是否是管理员
    console.log(authStore.isAdmin)          // true 或 false

    return { authStore }
  }
}
```

### 登录示例

```typescript
const authStore = useAuthStore()

try {
  await authStore.login({
    username: 'admin',
    password: 'Admin@123456',
    rememberMe: true
  })
  console.log('登录成功')
  console.log(authStore.user)
} catch (error) {
  console.error('登录失败:', error)
  console.log(authStore.error)
}
```

### 注册示例

```typescript
const authStore = useAuthStore()

try {
  await authStore.register({
    username: 'newuser',
    password: 'NewUser@123456',
    confirmPassword: 'NewUser@123456',
    email: 'newuser@example.com'
  })
  console.log('注册成功')
  console.log(authStore.user)
} catch (error) {
  console.error('注册失败:', error)
  console.log(authStore.error)
}
```

### 登出示例

```typescript
const authStore = useAuthStore()

// 登出
authStore.logout()

// 检查是否已登出
console.log(authStore.isAuthenticated)  // false
console.log(authStore.user)             // null
```

---

## 5. 登录页面示例

**文件**: `src/views/LoginView.vue`

### 表单验证

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少 8 个字符', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    // 验证通过，调用登录
  } catch (error) {
    // 验证失败
  }
}
</script>
```

---

## 6. 注册页面示例

**文件**: `src/views/RegisterView.vue`

### 密码强度验证

```typescript
function validatePasswordStrength() {
  const password = form.password
  let strength: PasswordStrength = 'weak'

  if (password.length >= 8) {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (hasUpperCase && hasLowerCase && hasNumber) {
      strength = 'strong'
    } else if ((hasUpperCase || hasLowerCase) && hasNumber) {
      strength = 'medium'
    }
  }

  passwordStrength.value = strength
}
```

### 确认密码验证

```typescript
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}
```

---

## 7. 路由守卫示例

**文件**: `src/router/index.ts`

### 路由配置

```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      title: '登录 - DataMonitor'
    }
  },
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      requiresAuth: true,
      title: 'DataMonitor - 实时数据监控平台'
    }
  }
]
```

### 路由守卫

```typescript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 初始化认证状态
  if (!authStore.isAuthenticated && !authStore.user) {
    authStore.initializeAuth()
  }

  const requiresAuth = to.meta.requiresAuth as boolean | undefined

  if (requiresAuth) {
    if (authStore.isAuthenticated) {
      next()
    } else {
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
  } else {
    if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
      next({ name: 'home' })
    } else {
      next()
    }
  }
})
```

---

## 8. 在其他组件中使用认证

### 检查用户是否已登录

```vue
<template>
  <div v-if="authStore.isAuthenticated">
    <p>欢迎, {{ authStore.user?.username }}!</p>
  </div>
  <div v-else>
    <p>请先登录</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
```

### 只显示给管理员

```vue
<template>
  <div v-if="authStore.isAdmin">
    <button>管理员功能</button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
```

### 调用受保护的 API

```typescript
import request from '@/utils/request'

// 自动添加 Authorization 头
const response = await request.get('/api/core-metrics')

// 如果 token 过期，会自动刷新并重试
```

---

## 9. 错误处理示例

### 处理登录错误

```typescript
try {
  await authStore.login(credentials)
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('用户名或密码错误')) {
      // 显示特定错误提示
    } else {
      // 显示通用错误提示
    }
  }
}
```

### 处理 API 错误

```typescript
try {
  const response = await request.get('/api/data')
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('权限不足')) {
      // 处理权限错误
    } else if (error.message.includes('网络连接失败')) {
      // 处理网络错误
    } else {
      // 处理其他错误
    }
  }
}
```

---

## 10. 环境变量配置示例

### .env.local

```env
# API 基础 URL
VITE_API_URL=http://localhost:3002/api

# WebSocket URL
VITE_WS_URL=ws://localhost:8080

# 其他配置
VITE_APP_TITLE=DataMonitor
```

### 在代码中使用

```typescript
const apiUrl = import.meta.env.VITE_API_URL
const wsUrl = import.meta.env.VITE_WS_URL

console.log(apiUrl)  // http://localhost:3002/api
console.log(wsUrl)   // ws://localhost:8080
```

