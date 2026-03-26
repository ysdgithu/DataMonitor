// JWT 认证中间件
import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import { unauthorized } from '../utils/response';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
        res.status(401).json(unauthorized('请先登录'));
        return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(401).json(unauthorized('登录已过期'));
        return;
    }

    req.user = decoded;
    next();
}
