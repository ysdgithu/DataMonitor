/**
 * 创建默认管理员用户脚本
 * 用法: npm run create-admin-user
 */

import DatabaseConnection from '../src/database/connection';
import { hashPassword } from '../src/utils/auth';

async function createAdminUser() {
    const db = DatabaseConnection.getInstance();

    try {
        console.log('开始创建默认管理员用户...\n');

        // 默认管理员凭证
        const adminUsername = 'admin';
        const adminPassword = 'Admin@123456';
        const adminEmail = 'admin@example.com';

        // 检查用户是否已存在
        console.log(`检查用户 "${adminUsername}" 是否已存在...`);
        const existingUser = await db.get(
            'SELECT id FROM users WHERE username = ?',
            [adminUsername]
        );

        if (existingUser) {
            console.log(`✓ 用户 "${adminUsername}" 已存在，ID: ${existingUser.id}`);
            console.log('如需重置密码，请手动更新数据库。\n');
            return;
        }

        // 对密码进行哈希加密
        console.log('对密码进行哈希加密...');
        const hashedPassword = await hashPassword(adminPassword);

        // 插入管理员用户
        console.log('插入管理员用户到数据库...');
        await db.run(
            `INSERT INTO users (username, password, email, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, 'admin', 1, NOW(), NOW())`,
            [adminUsername, hashedPassword, adminEmail]
        );

        console.log('\n✓ 管理员用户创建成功！\n');
        console.log('登录凭证：');
        console.log(`  用户名: ${adminUsername}`);
        console.log(`  密码: ${adminPassword}`);
        console.log(`  邮箱: ${adminEmail}`);
        console.log(`  角色: admin\n`);

        console.log('测试登录：');
        console.log(`curl -X POST http://localhost:3002/api/login \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{`);
        console.log(`    "username": "${adminUsername}",`);
        console.log(`    "password": "${adminPassword}"`);
        console.log(`  }'`);
        console.log();

    } catch (error) {
        console.error('创建管理员用户失败:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// 执行脚本
createAdminUser().catch(console.error);

