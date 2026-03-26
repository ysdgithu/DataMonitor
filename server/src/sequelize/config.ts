// 数据库配置
import { Sequelize } from 'sequelize-typescript';
import fs from 'fs';
import path from 'path';

// 默认配置
const defaultConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'industrial_iomp'
};

// 读取配置文件
function getDbConfig() {
    const configPath = path.join(__dirname, '../services/config.json');
    if (!fs.existsSync(configPath)) {
        console.log('使用默认数据库配置');
        return defaultConfig;
    }
    try {
        const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const db = content.database || content;
        return {
            host: db.host || defaultConfig.host,
            port: db.port || defaultConfig.port,
            user: db.user || db.username || defaultConfig.user,
            password: db.password || defaultConfig.password,
            database: db.database || defaultConfig.database,
        };
    } catch {
        return defaultConfig;
    }
}

const dbConfig = getDbConfig();

// 导入模型
import SysRole from './models/SysRole';
import SysUser from './models/SysUser';
import DeviceType from './models/DeviceType';
import KnowledgeBase from './models/KnowledgeBase';
import AlarmRule from './models/AlarmRule';

export const sequelize = new Sequelize({
    database: dbConfig.database,
    username: dbConfig.user,
    password: dbConfig.password,
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    dialectOptions: { charset: 'utf8mb4' },
    logging: false,
    models: [SysRole, SysUser, DeviceType, KnowledgeBase, AlarmRule],
});

// 测试连接
export async function testConnection(): Promise<boolean> {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');
        return true;
    } catch (error: any) {
        console.error('数据库连接失败:', error.message);
        return false;
    }
}
