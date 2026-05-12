import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../src/utils/auth';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDbConfig(): DbConfig {
  const configPath = path.join(__dirname, '../config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.database;
}

async function ensureNormalUser() {
  const dbConfig = getDbConfig();
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
  });

  try {
    const username = 'user';
    const password = '123456';
    const role = 'user';
    const hashedPassword = await hashPassword(password);

    const [rows] = await connection.execute<any[]>(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, role = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
        [hashedPassword, role, username]
      );
      console.log(`已更新普通用户账号: ${username}`);
    } else {
      await connection.execute(
        'INSERT INTO users (username, password, email, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [username, hashedPassword, null, role]
      );
      console.log(`已创建普通用户账号: ${username}`);
    }
  } finally {
    await connection.end();
  }
}

ensureNormalUser().catch((error) => {
  console.error('创建普通用户失败:', error);
  process.exit(1);
});
