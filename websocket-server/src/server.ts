import WebSocket from 'ws';
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

const wss = new WebSocket.Server({ port: 8080 });
const deviceSimulator = new DeviceSimulator();
const dataProcessor = new DataProcessor();

// 设置设备模拟器的数据处理器
deviceSimulator.setDataProcessor(dataProcessor);

wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');
    dataProcessor.addClient(ws);

    // 处理客户端消息（心跳等）
    ws.on('message', (message: WebSocket.Data) => {
        try {
            const data = JSON.parse(message.toString());

            // 处理心跳 ping 消息
            if (data.type === 'ping') {
                // 回复 pong
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
        } catch (error) {
            console.error('处理客户端消息失败:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        dataProcessor.removeClient(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
    });
});

// 主启动函数
async function main() {
    console.log('=== 数据监控系统启动 ===');

    // 初始化服务
    const initialized = await initializeServices();
    if (!initialized) {
        console.error('服务初始化失败，退出程序');
        process.exit(1);
    }

    // 启动数据生成器
    deviceSimulator.start();

    console.log('WebSocket server is running on port 8080');
    console.log('API server is running');
    console.log('=== 系统启动完成 ===');
}

// 启动应用
main().catch(error => {
    console.error('应用启动失败:', error);
    process.exit(1);
});
