// 认证工具模块 - 处理 JWT 和密码加密
// 提供以下功能：
// - `generateToken()` - 生成 JWT token
// - `verifyToken()` - 验证 JWT token
// - `extractTokenFromHeader()` - 从请求头提取 token
// - `hashPassword()` - 密码哈希加密 (bcrypt)
// - `verifyPassword()` - 密码验证
// - `validatePasswordStrength()` - 密码强度验证
// - `validateUsername()` - 用户名格式验证
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// JWT 密钥 - 生产环境应该从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

// 用户信息接口
export interface UserPayload {
    id: number;
    username: string;
    role: string;
}

// JWT 令牌接口
export interface TokenPayload extends UserPayload {
    iat?: number;
    exp?: number;
}

/**
 * 生成 JWT token
 * @param user 用户信息
 * @returns JWT token 字符串
 */
export function generateToken(user: UserPayload): string {
    const payload: TokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role
    };

    const options: SignOptions = {
        expiresIn: JWT_EXPIRY,
        algorithm: 'HS256'
    };

    return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * 验证 JWT token
 * @param token JWT token 字符串
 * @returns 解析后的用户信息，如果验证失败返回 null
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256']
        }) as TokenPayload;
        return decoded;
    } catch (error) {
        console.error('Token 验证失败:', error instanceof Error ? error.message : '未知错误');
        return null;
    }
}

/**
 * 从 Authorization 头中提取 token
 * @param authHeader Authorization 头的值
 * @returns token 字符串，如果格式不正确返回 null
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
        return null;
    }

    // 期望格式: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}

/**
 * 对密码进行哈希加密
 * @param password 原始密码
 * @returns 加密后的密码哈希值
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码是否匹配
 * @param password 原始密码
 * @param hash 存储的密码哈希值
 * @returns 密码是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 是否符合强度要求
 */
export function validatePasswordStrength(password: string): boolean {
    // 至少 8 个字符，包含大小写字母、数字
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

/**
 * 验证用户名格式
 * @param username 用户名
 * @returns 是否符合格式要求
 */
export function validateUsername(username: string): boolean {
    // 3-50 个字符，只包含字母、数字、下划线
    const regex = /^[a-zA-Z0-9_]{3,50}$/;
    return regex.test(username);
}

