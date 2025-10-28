// API 中间件 - JWT 验证和错误处理
// 提供以下中间件：
// - `authMiddleware` - JWT 验证中间件（必需）
// - `optionalAuthMiddleware` - 可选的 JWT 验证中间件
// - `roleMiddleware()` - 角色检查中间件工厂函数
// - `requestLogMiddleware` - 请求日志中间件
// - `errorHandler` - 错误处理中间件
import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken, TokenPayload } from '../utils/auth';

// 扩展 Express Request 类型，添加用户信息
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

/**
 * JWT 验证中间件
 * 从 Authorization 头中提取 token，验证其有效性
 * 如果验证成功，将用户信息附加到 req.user
 * 如果验证失败，返回 401 Unauthorized
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        // 从 Authorization 头中提取 token
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            res.status(401).json({
                success: false,
                error: '未授权',
                message: '缺少或格式错误的 Authorization 头'
            });
            return;
        }

        // 验证 token
        const decoded = verifyToken(token);

        if (!decoded) {
            res.status(401).json({
                success: false,
                error: '未授权',
                message: 'Token 无效或已过期'
            });
            return;
        }

        // 将用户信息附加到请求对象
        req.user = decoded;
        next();
    } catch (error) {
        console.error('认证中间件错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误',
            message: '认证过程中发生错误'
        });
    }
}

/**
 * 可选的 JWT 验证中间件
 * 如果提供了 token，则验证；如果没有提供，则继续
 * 用于某些既可以匿名访问又可以认证访问的接口
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = decoded;
            }
        }

        next();
    } catch (error) {
        console.error('可选认证中间件错误:', error);
        next();
    }
}

/**
 * 角色检查中间件工厂函数
 * 创建一个中间件来检查用户是否具有指定的角色
 * @param allowedRoles 允许的角色列表
 * @returns 中间件函数
 */
export function roleMiddleware(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: '未授权',
                message: '用户未认证'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: '禁止访问',
                message: `需要以下角色之一: ${allowedRoles.join(', ')}`
            });
            return;
        }

        next();
    };
}

/**
 * 请求日志中间件
 * 记录所有 API 请求的信息
 */
export function requestLogMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const userId = req.user?.id || 'anonymous';
    const username = req.user?.username || 'anonymous';

    // 监听响应完成事件
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${username}(${userId}) - Status: ${res.statusCode} - Duration: ${duration}ms`);
    });

    next();
}

/**
 * 错误处理中间件
 * 捕获所有未处理的错误
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    console.error('未处理的错误:', err);

    // 如果已经发送了响应，则不再处理
    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message || '未知错误'
    });
}

