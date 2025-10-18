// 数据库连接管理
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

class DatabaseConnection {
    private static instance: DatabaseConnection;
    private db: Database | null = null;

    private constructor() {}

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
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

    // 批量插入优化
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

export default DatabaseConnection;
