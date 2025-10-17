// 数据库初始化脚本
// 主要实现了创建表和索引
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

async function initDatabase() {
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

        console.log('数据表创建完成，开始创建索引...');

        // 创建索引 - 优化查询性能
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_device_data_device_type_time ON device_data(device_id, data_type, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_device_data_type_time ON device_data(data_type, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_device_data_status ON device_data(data_status)',
            'CREATE INDEX IF NOT EXISTS idx_device_data_timestamp ON device_data(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_statistics_date_type ON data_statistics(date, data_type)'
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

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
    initDatabase().catch(console.error);
}

export { initDatabase };
