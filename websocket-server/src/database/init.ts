// 数据库初始化脚本
// 主要实现了创建表和索引
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

// 获取数据库配置
function getDbConfig() {
    const configPath = path.join(__dirname, '../../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.database;
}

async function initDatabase() {
    let connection;
    try {
        console.log('开始初始化 MySQL 数据库...');

        const dbConfig = getDbConfig();

        // 首先连接到 MySQL 服务器（不指定数据库）
        connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // 创建数据库（如果不存在）
        console.log(`创建数据库: ${dbConfig.database}`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);

        // 切换到目标数据库
        await connection.query(`USE ${dbConfig.database}`);

        // 统一的设备数据表 - 支持所有数据类型
        // data_type: 'core_metrics' | 'environment' | 'device_status' | 'telemetry' | 'factory_devices'
        console.log('创建 device_data 表...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS device_data (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                device_id VARCHAR(50) NOT NULL,
                data_type VARCHAR(30) NOT NULL,
                timestamp BIGINT NOT NULL,
                data_status VARCHAR(10) DEFAULT 'normal',
                payload LONGTEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_device_id (device_id),
                INDEX idx_data_type (data_type),
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 数据统计表
        console.log('创建 data_statistics 表...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS data_statistics (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL,
                hour INT NOT NULL,
                data_type VARCHAR(20) NOT NULL,
                category VARCHAR(20),
                avg_value DOUBLE,
                max_value DOUBLE,
                min_value DOUBLE,
                count INT,
                error_count INT,
                warning_count INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_date_type (date, data_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('数据表创建完成，开始创建索引...');

        // 创建复合索引 - 优化查询性能
        const indexes = [
            'CREATE INDEX idx_device_data_device_type_time ON device_data(device_id, data_type, timestamp)',
            'CREATE INDEX idx_device_data_type_time ON device_data(data_type, timestamp)',
            'CREATE INDEX idx_device_data_status ON device_data(data_status)',
            'CREATE INDEX idx_statistics_date_type ON data_statistics(date, data_type)'
        ];

        for (const indexSql of indexes) {
            try {
                await connection.execute(indexSql);
                console.log(`索引创建成功: ${indexSql.substring(0, 50)}...`);
            } catch (error: any) {
                // 索引已存在时忽略错误
                if (error.code !== 'ER_DUP_KEYNAME') {
                    throw error;
                }
            }
        }

        console.log('MySQL 数据库初始化完成！');
        console.log(`数据库连接: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    } catch (error) {
        console.error('MySQL 数据库初始化失败:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
    initDatabase().catch(console.error);
}

export { initDatabase };

/* SQLite 初始化代码已注释，迁移到 MySQL
// 数据库初始化脚本 (SQLite 版本)
import { Database } from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'monitor.db');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`创建数据目录: ${DATA_DIR}`);
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 将回调函数转换为Promise
const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));

async function initDatabaseSQLite() {
    try {
        console.log('开始初始化数据库...');

        // 统一的设备数据表 - 支持所有数据类型
        // data_type: 'core_metrics' | 'environment' | 'device_status' | 'telemetry' | 'factory_devices'
        await dbRun(`
            CREATE TABLE IF NOT EXISTS device_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id VARCHAR(50) NOT NULL,
                data_type VARCHAR(30) NOT NULL,
                timestamp BIGINT NOT NULL,
                data_status VARCHAR(10) DEFAULT 'normal',
                payload TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 数据统计表
        await dbRun(`
            CREATE TABLE IF NOT EXISTS data_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                hour INTEGER NOT NULL,
                data_type VARCHAR(20) NOT NULL,
                category VARCHAR(20),
                avg_value REAL,
                max_value REAL,
                min_value REAL,
                count INTEGER,
                error_count INTEGER,
                warning_count INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 用户表 - 用于 API 鉴权
        await dbRun(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                role VARCHAR(20) DEFAULT 'user',
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('数据表创建完成，开始创建索引...');

        // 创建索引 - 优化查询性能
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_device_data_device_type_time ON device_data(device_id, data_type, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_device_data_type_time ON device_data(data_type, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_device_data_status ON device_data(data_status)',
            'CREATE INDEX IF NOT EXISTS idx_device_data_timestamp ON device_data(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_statistics_date_type ON data_statistics(date, data_type)',
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)'
        ];

        for (const indexSql of indexes) {
            await dbRun(indexSql);
        }

        console.log('数据库初始化完成！');
        console.log(`数据库文件位置: ${DB_PATH}`);

    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    } finally {
        db.close();
    }
}
*/
