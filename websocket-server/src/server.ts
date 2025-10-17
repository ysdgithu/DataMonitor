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

    ws.on('close', () => {
        console.log('Client disconnected');
        dataProcessor.removeClient(ws);
    });
});

// 定时推送数据 - 每8秒推送一次所有数据（包括10个工厂设备实例）
function startNormalMode() {
    deviceSimulator.start();
    console.log('启动正常模式：每8秒推送一次数据（包括10个工厂设备实例）');
    setInterval(async () => {
        const dataList = deviceSimulator.getLatestData();
        if (dataList.length > 0) {
            await dataProcessor.processAndPush(dataList);
        }
    }, 8000);
}

// 主启动函数
async function main() {
    console.log('=== 数据监控系统启动 ===');

    // 初始化服务
    const initialized = await initializeServices();
    if (!initialized) {
        console.error('服务初始化失败，退出程序');
        process.exit(1);
    }

    // 启动正常模式
    startNormalMode();
    console.log('WebSocket server running in NORMAL mode');

    console.log('WebSocket server is running');
    console.log('API server is running');
    console.log('=== 系统启动完成 ===');
}

// 启动应用
main().catch(error => {
    console.error('应用启动失败:', error);
    process.exit(1);
});
