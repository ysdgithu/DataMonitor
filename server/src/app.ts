// 工业设备智能运维平台 - API 服务器
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';

import { sequelize, testConnection } from './sequelize/config';
import { initSocketService } from './services/socketService';
import routes from './routes';

const app = express();
const httpServer = createServer(app);

// 中间件
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.use('/api', routes);

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ code: 500, message: err.message || '服务器错误', data: null });
});

// 启动服务器
async function startServer() {
    const dbConnected = await testConnection();
    if (!dbConnected) {
        process.exit(1);
    }

    // 自动同步模型
    await sequelize.sync({ alter: true });
    console.log('数据库模型已同步');

    initSocketService(httpServer);

    const PORT = 3002; // 固定端口
    httpServer.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
}

startServer();

// 退出处理
process.on('SIGINT', async () => {
    await sequelize.close();
    process.exit(0);
});
