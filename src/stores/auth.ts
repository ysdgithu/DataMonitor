/**
 * 认证 Pinia Store
 * 文件位置: src/stores/auth.ts
 *
 * 功能：
 * - 管理认证状态（是否登录、用户信息、token）
 * - 提供登录、注册、登出等操作
 * - 监听登出事件
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'
import { TokenManager } from '../utils/tokenManager'
import type {
  User,
  AuthState,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiResponse
} from '../utils/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // ============ 状态 ============

  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============ 计算属性 ============

  const authState = computed<AuthState>(() => ({
    isAuthenticated: isAuthenticated.value,
    user: user.value,
    accessToken: accessToken.value,
    loading: loading.value,
    error: error.value,
    refreshToken: refreshToken.value
  }))

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')

  // ============ 方法 ============

  /**
   * 初始化认证状态（从 localStorage 恢复）
   */
  function initializeAuth() {
    const token = TokenManager.getAccessToken()
    const refreshTok = TokenManager.getRefreshToken()

    if (token && !TokenManager.isTokenExpired(token)) {
      accessToken.value = token
      refreshToken.value = refreshTok
      isAuthenticated.value = true

      // 从 token 中解析用户信息
      const payload = TokenManager.parseToken(token)
      if (payload) {
        user.value = {
          id: payload.id,
          username: payload.username,
          role: payload.role
        }
      }
    } else {
      // Token 已过期或不存在，清除
      TokenManager.clearTokens()
      isAuthenticated.value = false
    }
  }

  /**
   * 用户登录
   */
  async function login(credentials: LoginRequest): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await request.post<ApiResponse<{ token: string; user: User }>>(
        '/login',
        {
          username: credentials.username,
          password: credentials.password
        }
      )

      // 注意：request 拦截器已经返回了 response.data，所以这里直接使用 response
      if (response.success && response.data) {
        const { token, user: userData } = response.data

        // 保存 token 和用户信息
        TokenManager.setTokens(token, undefined, credentials.rememberMe)
        accessToken.value = token
        user.value = userData
        isAuthenticated.value = true
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请检查用户名和密码'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   */
  async function register(data: RegisterRequest): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await request.post<ApiResponse<{ token: string; user: User }>>(
        '/register',
        {
          username: data.username,
          password: data.password,
          email: data.email
        }
      )

      // 注意：request 拦截器已经返回了 response.data，所以这里直接使用 response
      if (response.success && response.data) {
        const { token, user: userData } = response.data

        // 保存 token 和用户信息
        TokenManager.setTokens(token, undefined, false)
        accessToken.value = token
        user.value = userData
        isAuthenticated.value = true
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   */
  function logout(): void {
    TokenManager.clearTokens()
    isAuthenticated.value = false
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    error.value = null
  }

  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * 监听登出事件（来自 request 拦截器）
   */
  function setupLogoutListener(): void {
    window.addEventListener('auth:logout', () => {
      logout()
    })
  }

  // 初始化时设置监听器
  setupLogoutListener()

  return {
    // 状态
    isAuthenticated,
    user,
    accessToken,
    refreshToken,
    loading,
    error,

    // 计算属性
    authState,
    isAdmin,
    isUser,

    // 方法
    initializeAuth,
    login,
    register,
    logout,
    clearError
  }
})

