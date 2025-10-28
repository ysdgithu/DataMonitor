/**
 * Token 管理工具
 * 文件位置: src/utils/tokenManager.ts
 * 
 * 功能：
 * - 存储和读取 access token 和 refresh token
 * - 检查 token 是否过期
 * - 清除 token
 */

import type { TokenPayload } from './auth.types'

const ACCESS_TOKEN_KEY = 'datamonitor_access_token'
const REFRESH_TOKEN_KEY = 'datamonitor_refresh_token'
const REMEMBER_ME_KEY = 'datamonitor_remember_me'

/**
 * Token 管理器类
 */
export class TokenManager {
  /**
   * 保存 access token
   */
  static setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }

  /**
   * 获取 access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  /**
   * 保存 refresh token
   */
  static setRefreshToken(token: string, rememberMe: boolean = false): void {
    if (rememberMe) {
      // 如果勾选"记住我"，使用 localStorage（长期存储）
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } else {
      // 否则使用 sessionStorage（会话存储）
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
    }
  }

  /**
   * 获取 refresh token
   */
  static getRefreshToken(): string | null {
    // 先从 localStorage 查找（记住我的情况）
    let token = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (token) return token

    // 再从 sessionStorage 查找（会话情况）
    token = sessionStorage.getItem(REFRESH_TOKEN_KEY)
    return token
  }

  /**
   * 保存 tokens
   */
  static setTokens(
    accessToken: string,
    refreshToken?: string,
    rememberMe: boolean = false
  ): void {
    this.setAccessToken(accessToken)
    if (refreshToken) {
      this.setRefreshToken(refreshToken, rememberMe)
    }
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true')
    }
  }

  /**
   * 清除所有 tokens
   */
  static clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(REMEMBER_ME_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  /**
   * 检查是否记住了用户
   */
  static isRemembered(): boolean {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true'
  }

  /**
   * 解析 JWT token 获取负载信息
   */
  static parseToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      // 解码 payload（第二部分）
      const payload = parts[1]
      const decoded = JSON.parse(atob(payload))
      return decoded as TokenPayload
    } catch (error) {
      console.error('Failed to parse token:', error)
      return null
    }
  }

  /**
   * 检查 token 是否过期
   * @param token JWT token
   * @param bufferSeconds 缓冲时间（秒），提前多少秒认为 token 已过期
   */
  static isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
    try {
      const payload = this.parseToken(token)
      if (!payload || !payload.exp) {
        return true
      }

      // 当前时间（秒）
      const now = Math.floor(Date.now() / 1000)
      // token 过期时间减去缓冲时间
      const expiryTime = payload.exp - bufferSeconds

      return now >= expiryTime
    } catch (error) {
      console.error('Failed to check token expiry:', error)
      return true
    }
  }

  /**
   * 获取 token 的剩余有效时间（毫秒）
   */
  static getTokenRemainingTime(token: string): number {
    try {
      const payload = this.parseToken(token)
      if (!payload || !payload.exp) {
        return 0
      }

      const now = Math.floor(Date.now() / 1000)
      const remaining = (payload.exp - now) * 1000

      return Math.max(0, remaining)
    } catch (error) {
      console.error('Failed to get token remaining time:', error)
      return 0
    }
  }

  /**
   * 检查是否有有效的 access token
   */
  static hasValidAccessToken(): boolean {
    const token = this.getAccessToken()
    if (!token) {
      return false
    }
    return !this.isTokenExpired(token)
  }

  /**
   * 检查是否有有效的 refresh token
   */
  static hasValidRefreshToken(): boolean {
    const token = this.getRefreshToken()
    if (!token) {
      return false
    }
    return !this.isTokenExpired(token)
  }

  /**
   * 获取 Authorization 头的值
   */
  static getAuthorizationHeader(): string | null {
    const token = this.getAccessToken()
    if (!token) {
      return null
    }
    return `Bearer ${token}`
  }
}

/**
 * 导出单例实例
 */
export const tokenManager = TokenManager

