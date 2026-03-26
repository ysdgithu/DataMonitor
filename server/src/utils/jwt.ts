// JWT 工具
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'your-secret-key'; // 毕业设计用固定值即可
const JWT_EXPIRY = '24h';

export interface JwtPayload {
    id: number;
    username: string;
    role: string;
    roleId: number;
}

export function generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
}

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
