// 用户数据模型 - 处理用户相关的数据库操作
import DatabaseConnection from './connection';
import { hashPassword, verifyPassword } from '../utils/auth';

export interface User {
    id: number;
    username: string;
    password: string;
    email?: string;
    role: string;
    is_active: number;
    created_at: string;
    updated_at: string;
}

export interface CreateUserInput {
    username: string;
    password: string;
    email?: string;
    role?: string;
}

export interface LoginInput {
    username: string;
    password: string;
}

class UserModel {
    private db: DatabaseConnection;

    constructor() {
        this.db = DatabaseConnection.getInstance();
    }

    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @returns 用户信息，如果不存在返回 null
     */
    async getUserByUsername(username: string): Promise<User | null> {
        try {
            const sql = 'SELECT * FROM users WHERE username = ? AND is_active = 1';
            const user = await this.db.get(sql, [username]);
            return user || null;
        } catch (error) {
            console.error('查询用户失败:', error);
            throw error;
        }
    }

    /**
     * 根据用户 ID 查询用户
     * @param id 用户 ID
     * @returns 用户信息，如果不存在返回 null
     */
    async getUserById(id: number): Promise<User | null> {
        try {
            const sql = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
            const user = await this.db.get(sql, [id]);
            return user || null;
        } catch (error) {
            console.error('查询用户失败:', error);
            throw error;
        }
    }

    /**
     * 创建新用户
     * @param input 用户输入信息
     * @returns 创建的用户信息
     */
    async createUser(input: CreateUserInput): Promise<User> {
        try {
            // 检查用户名是否已存在
            const existingUser = await this.getUserByUsername(input.username);
            if (existingUser) {
                throw new Error('用户名已存在');
            }

            // 对密码进行哈希加密
            const hashedPassword = await hashPassword(input.password);

            // 插入新用户
            const sql = `
                INSERT INTO users (username, password, email, role, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;

            const role = input.role || 'user';
            await this.db.run(sql, [input.username, hashedPassword, input.email || null, role]);

            // 返回创建的用户信息
            const user = await this.getUserByUsername(input.username);
            if (!user) {
                throw new Error('创建用户后查询失败');
            }

            return user;
        } catch (error) {
            console.error('创建用户失败:', error);
            throw error;
        }
    }

    /**
     * 用户登录验证
     * @param input 登录信息
     * @returns 用户信息，如果验证失败返回 null
     */
    async login(input: LoginInput): Promise<User | null> {
        try {
            // 查询用户
            const user = await this.getUserByUsername(input.username);
            if (!user) {
                return null;
            }

            // 验证密码
            const isPasswordValid = await verifyPassword(input.password, user.password);
            if (!isPasswordValid) {
                return null;
            }

            return user;
        } catch (error) {
            console.error('登录验证失败:', error);
            throw error;
        }
    }

    /**
     * 更新用户信息
     * @param id 用户 ID
     * @param updates 要更新的字段
     */
    async updateUser(id: number, updates: Partial<User>): Promise<void> {
        try {
            const fields: string[] = [];
            const values: any[] = [];

            // 构建动态 SQL
            if (updates.email !== undefined) {
                fields.push('email = ?');
                values.push(updates.email);
            }
            if (updates.role !== undefined) {
                fields.push('role = ?');
                values.push(updates.role);
            }
            if (updates.is_active !== undefined) {
                fields.push('is_active = ?');
                values.push(updates.is_active);
            }

            if (fields.length === 0) {
                return;
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            await this.db.run(sql, values);
        } catch (error) {
            console.error('更新用户失败:', error);
            throw error;
        }
    }

    /**
     * 删除用户（软删除）
     * @param id 用户 ID
     */
    async deleteUser(id: number): Promise<void> {
        try {
            const sql = 'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            await this.db.run(sql, [id]);
        } catch (error) {
            console.error('删除用户失败:', error);
            throw error;
        }
    }

    /**
     * 获取所有活跃用户
     * @returns 用户列表
     */
    async getAllUsers(): Promise<User[]> {
        try {
            const sql = 'SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC';
            const users = await this.db.all(sql);
            return users || [];
        } catch (error) {
            console.error('查询用户列表失败:', error);
            throw error;
        }
    }
}

export default UserModel;

