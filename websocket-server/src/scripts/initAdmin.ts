// 初始化脚本 - 创建默认管理员账号
import UserModel from '../database/userModel';
import DatabaseConnection from '../database/connection';

/**
 * 初始化默认管理员账号
 * 使用方式: npm run init-admin
 */
async function initializeAdmin() {
    try {
        console.log('开始初始化管理员账号...');

        // 连接数据库
        const db = DatabaseConnection.getInstance();
        await db.connect();

        const userModel = new UserModel();

        // 检查是否已存在管理员账号
        const existingAdmin = await userModel.getUserByUsername('admin');
        if (existingAdmin) {
            console.log('✓ 管理员账号已存在');
            console.log(`  用户名: admin`);
            console.log(`  创建时间: ${existingAdmin.created_at}`);
            await db.close();
            return;
        }

        // 创建默认管理员账号
        const adminUser = await userModel.createUser({
            username: 'admin',
            password: 'Admin@123456',  // 默认密码，建议首次登录后修改
            email: 'admin@datamonitor.local',
            role: 'admin'
        });

        console.log('✓ 管理员账号创建成功！');
        console.log(`\n账号信息:`);
        console.log(`  用户名: admin`);
        console.log(`  密码: Admin@123456`);
        console.log(`  邮箱: admin@datamonitor.local`);
        console.log(`  角色: admin`);
        console.log(`\n⚠️  重要提示:`);
        console.log(`  1. 请妥善保管管理员账号和密码`);
        console.log(`  2. 建议首次登录后修改默认密码`);
        console.log(`  3. 不要在生产环境中使用默认密码`);

        // 创建测试用户账号
        console.log(`\n创建测试用户账号...`);
        const testUser = await userModel.createUser({
            username: 'testuser',
            password: 'Test@123456',
            email: 'test@datamonitor.local',
            role: 'user'
        });

        console.log('✓ 测试用户账号创建成功！');
        console.log(`\n账号信息:`);
        console.log(`  用户名: testuser`);
        console.log(`  密码: Test@123456`);
        console.log(`  邮箱: test@datamonitor.local`);
        console.log(`  角色: user`);

        console.log(`\n✓ 初始化完成！`);
        console.log(`\n接下来可以尝试登录:`);
        console.log(`  curl -X POST http://localhost:3002/api/login \\`);
        console.log(`    -H "Content-Type: application/json" \\`);
        console.log(`    -d '{"username":"admin","password":"Admin@123456"}'`);

        await db.close();
    } catch (error) {
        console.error('初始化失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
    initializeAdmin().catch(console.error);
}

export { initializeAdmin };

