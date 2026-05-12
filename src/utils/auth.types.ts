/**
 * 认证相关的类型定义
 * 文件位置: src/utils/auth.types.ts
 */

// ============ 用户相关类型 ============

/** 用户信息接口 */
export interface User {
  id: number
  username: string
  email?: string
  role: 'admin' | 'user'
  createdAt?: string
  updatedAt?: string
}

/** 用户负载（JWT 中包含的用户信息） */
export interface UserPayload {
  id: number
  username: string
  role: 'admin' | 'user'
}

// ============ Token 相关类型 ============

/** JWT Token 负载 */
export interface TokenPayload extends UserPayload {
  iat?: number  // 签发时间
  exp?: number  // 过期时间
}

/** Token 响应 */
export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

/** Token 刷新请求 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/** Token 刷新响应 */
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

// ============ 登录相关类型 ============

/** 登录请求 */
export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
}

/** 登录响应 */
export interface LoginResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  message?: string
  error?: string
}

// ============ 注册相关类型 ============

/** 注册请求 */
export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  email?: string
}

/** 注册响应 */
export interface RegisterResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  message?: string
  error?: string
}

// ============ API 响应类型 ============

/** 通用 API 响应 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

/** 认证错误类型 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_EXISTS = 'USER_EXISTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/** 认证错误 */
export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// ============ 认证状态类型 ============

/** 认证状态 */
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}

// ============ 表单验证类型 ============

/** 表单验证规则 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  message?: string
  validator?: (value: string) => boolean | string
}

/** 表单验证结果 */
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// ============ 密码验证类型 ============

/** 密码强度等级 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong'
}

/** 密码验证结果 */
export interface PasswordValidationResult {
  isValid: boolean
  strength: PasswordStrength
  message: string
  requirements: {
    minLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
    hasSpecialChar?: boolean
  }
}
