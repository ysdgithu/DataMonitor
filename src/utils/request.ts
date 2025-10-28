/**
 * Axios 请求配置
 * 文件位置: src/utils/request.ts
 * 
 * 功能：
 * - 创建 Axios 实例
 * - 配置请求拦截器（自动添加 Authorization 头）
 * - 配置响应拦截器（处理 401 错误，自动刷新 token）
 * - 实现双 token 机制（access token + refresh token）
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { TokenManager } from './tokenManager'
import type { ApiResponse, RefreshTokenResponse } from './auth.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

// 请求队列，用于在 token 刷新期间缓存失败的请求
interface PendingRequest {
  config: InternalAxiosRequestConfig
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

/**
 * 订阅 token 刷新完成事件
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

/**
 * 通知所有订阅者 token 已刷新
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

/**
 * 创建 Axios 实例
 */
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器
 * 在每个请求中自动添加 Authorization 头
 */
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 开发环境下打印请求信息
    if (import.meta.env.DEV) {
      console.log('[Request]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * 处理各种 HTTP 状态码和错误
 */
request.interceptors.response.use(
  (response) => {
    // 开发环境下打印响应信息
    if (import.meta.env.DEV) {
      console.log('[Response]', {
        status: response.status,
        url: response.config.url,
        data: response.data
      })
    }

    return response.data
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig

    // 处理 401 Unauthorized 错误（token 过期或无效）
    if (error.response?.status === 401 && config && !config.url?.includes('/login') && !config.url?.includes('/register')) {
      if (!isRefreshing) {
        isRefreshing = true

        try {
          const refreshToken = TokenManager.getRefreshToken()
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          // 调用刷新 token 接口
          const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
            `${API_BASE_URL}/refresh`,
            { refreshToken },
            {
              timeout: 5000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data
            TokenManager.setTokens(accessToken, newRefreshToken, TokenManager.isRemembered())
            onTokenRefreshed(accessToken)
            isRefreshing = false

            // 重试原始请求
            if (config.headers) {
              config.headers.Authorization = `Bearer ${accessToken}`
            }
            return request(config)
          } else {
            throw new Error('Failed to refresh token')
          }
        } catch (refreshError) {
          console.error('[Token Refresh Error]', refreshError)
          // 刷新失败，清除 token 并跳转到登录页
          TokenManager.clearTokens()
          isRefreshing = false
          refreshSubscribers = []

          // 触发登出事件（由 auth store 监听）
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: 'Token refresh failed' }))

          return Promise.reject(refreshError)
        }
      } else {
        // 正在刷新 token，将请求加入队列
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${token}`
            }
            request(config).then(resolve).catch(reject)
          })
        })
      }
    }

    // 处理 403 Forbidden 错误（权限不足）
    if (error.response?.status === 403) {
      console.error('[Forbidden]', error.response.data)
      return Promise.reject(new Error('权限不足'))
    }

    // 处理 500 Server Error
    if (error.response?.status === 500) {
      console.error('[Server Error]', error.response.data)
      return Promise.reject(new Error('服务器错误，请稍后重试'))
    }

    // 处理网络错误
    if (!error.response) {
      console.error('[Network Error]', error.message)
      return Promise.reject(new Error('网络连接失败，请检查网络设置'))
    }

    // 其他错误
    console.error('[API Error]', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    return Promise.reject(error)
  }
)

export default request

