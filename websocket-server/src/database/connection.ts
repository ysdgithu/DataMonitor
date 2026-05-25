// 数据库连接管理
import mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

// MySQL 连接池配置
let pool: Pool | null = null;

// 获取数据库配置
function getDbConfig() {
    const configPath = path.join(__dirname, '../../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.database;
}

class DatabaseConnection {
    private static instance: DatabaseConnection;
    private pool: Pool | null = null;

    private constructor() {}

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(): Promise<Pool> {
        if (this.pool) {
            return this.pool;
        }

        try {
            const dbConfig = getDbConfig();

            this.pool = mysql.createPool({
                host: dbConfig.host,
                port: dbConfig.port,
                user: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.database,
                waitForConnections: dbConfig.options?.waitForConnections ?? true,
                connectionLimit: dbConfig.options?.connectionLimit ?? 10,
                queueLimit: dbConfig.options?.queueLimit ?? 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            });

            console.log(`MySQL 数据库连接成功: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
            return this.pool;
        } catch (error) {
            console.error('MySQL 数据库连接失败:', error);
            throw error;
        }
    }

    public async run(sql: string, params: any[] = []): Promise<void> {
        const pool = await this.connect();
        await pool.query(sql, params);
    }

    public async get(sql: string, params: any[] = []): Promise<any> {
        const pool = await this.connect();
        const [rows] = await pool.query(sql, params);
        return (rows as any[])[0] || null;
    }

    public async all(sql: string, params: any[] = []): Promise<any[]> {
        const pool = await this.connect();
        const [rows] = await pool.query(sql, params);
        return rows as any[];
    }

    public async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }

    // 批量插入优化 - 使用真正的批量 SQL
    public async batchInsert(tableName: string, columns: string[], data: any[][]): Promise<void> {
        if (data.length === 0) return;

        const pool = await this.connect();
        const connection = await pool.getConnection();

        try {
            // 【优化】使用真正的批量插入 SQL，性能提升 10-50 倍
            // 构建批量插入的占位符：(?, ?, ?), (?, ?, ?), ...
            const singleRowPlaceholder = `(${columns.map(() => '?').join(', ')})`;
            const allPlaceholders = data.map(() => singleRowPlaceholder).join(', ');
            const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${allPlaceholders}`;

            // 【修复】将二维数组展平为一维数组
            // data = [[val1, val2, val3], [val4, val5, val6]] => [val1, val2, val3, val4, val5, val6]
            const flatParams: any[] = [];
            for (const row of data) {
                for (const value of row) {
                    flatParams.push(value);
                }
            }

            // 使用事务处理批量插入
            await connection.beginTransaction();

            try {
                await connection.execute(sql, flatParams);
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } finally {
            connection.release();
        }
    }
}

/* SQLite 连接代码已注释，迁移到 MySQL
// 数据库连接管理 (SQLite 版本)
import { Database } from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

// 数据库文件位置设置
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'monitor.db');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DatabaseConnectionSQLite {
    private static instance: DatabaseConnectionSQLite;
    private db: Database | null = null;

    private constructor() {}

    public static getInstance(): DatabaseConnectionSQLite {
        if (!DatabaseConnectionSQLite.instance) {
            DatabaseConnectionSQLite.instance = new DatabaseConnectionSQLite();
        }
        return DatabaseConnectionSQLite.instance;
    }

    public async connect(): Promise<Database> {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            this.db = new Database(DB_PATH, (err: Error | null) => {
                if (err) {
                    console.error('数据库连接失败:', err);
                    reject(err);
                } else {
                    console.log('数据库连接成功:', DB_PATH);
                    resolve(this.db!);
                }
            });
        });
    }

    public async run(sql: string, params: any[] = []): Promise<void> {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err: Error | null) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public async get(sql: string, params: any[] = []): Promise<any> {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    public async all(sql: string, params: any[] = []): Promise<any[]> {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public async close(): Promise<void> {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db!.close((err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db = null;
                        resolve();
                    }
                });
            });
        }
    }

    public async batchInsert(tableName: string, columns: string[], data: any[][]): Promise<void> {
        if (data.length === 0) return;

        const db = await this.connect();
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        return new Promise((resolve, reject) => {
            const stmt = db.prepare(sql);
            let completed = 0;
            let hasError = false;

            for (const row of data) {
                stmt.run(row, (err: Error | null) => {
                    if (err && !hasError) {
                        hasError = true;
                        stmt.finalize();
                        reject(err);
                        return;
                    }

                    completed++;
                    if (completed === data.length && !hasError) {
                        stmt.finalize();
                        resolve();
                    }
                });
            }
        });
    }
}
*/

export default DatabaseConnection;
