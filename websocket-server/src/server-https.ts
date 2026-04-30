import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import { DeviceSimulator } from './services/deviceSimulator';
import { DataProcessor } from './services/dataProcessor';
import { initDatabase } from './database/init';
import { startApiServer } from './api/server';

// 初始化数据库和服务
async function initializeServices() {
    try {
        console.log('正在初始化数据库...');
        await initDatabase();
        console.log('数据库初始化完成');

        console.log('正在启动API服务器...');
        startApiServer();
        console.log('API服务器启动完成');

        return true;
    } catch (error) {
        console.error('服务初始化失败:', error);
        return false;
    }
}

// HTTPS服务器配置
const serverOptions = {
    // 如果您有SSL证书，请取消注释并提供正确的路径
    // cert: fs.readFileSync('/path/to/your/certificate.crt'),
    // key: fs.readFileSync('/path/to/your/private.key')
};

// 创建HTTPS服务器
const server = https.createServer(serverOptions);

// 创建WebSocket服务器，绑定到HTTPS服务器
const wss = new WebSocket.Server({
    server,
    // 或者直接指定端口用于WSS
    // port: 8443
});

const deviceSimulator = new DeviceSimulator();
const dataProcessor = new DataProcessor();

// 设置设备模拟器的数据处理器
deviceSimulator.setDataProcessor(dataProcessor);

wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected via WSS');
    dataProcessor.addClient(ws);

    ws.on('close', () => {
        console.log('Client disconnected');
        dataProcessor.removeClient(ws);
    });
});

// 定时推送数据
function startNormalMode() {
    deviceSimulator.start();
    setInterval(async () => {
        const dataList = deviceSimulator.getLatestData();
        if (dataList.length > 0) {
            await dataProcessor.processAndPushBatch(dataList.map(item => item.data));
        }
    }, 8000);
}

// 启动服务
async function startServer() {
    const initialized = await initializeServices();
    if (!initialized) {
        console.error('服务初始化失败，退出程序');
        process.exit(1);
    }

    // 启动HTTPS服务器
    const port = process.env.WSS_PORT || 8443;
    server.listen(port, () => {
        console.log(`WSS服务器运行在端口 ${port}`);
        console.log(`WebSocket Secure URL: wss://cloudgu.xyz:${port}`);
    });

    // 启动正常模式
    console.log('启动正常模式...');
    startNormalMode();
}

// 优雅关闭
process.on('SIGINT', () => {
    console.log('正在关闭服务器...');
    deviceSimulator.stop();
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

startServer().catch(console.error);
