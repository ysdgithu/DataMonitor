import WebSocket from 'ws';
import { DeviceSimulator } from './services/deviceSimulator';
import { DataProcessor } from './services/dataProcessor';
import { initDatabase } from './database/init';
import { startApiServer } from './api/server';

// 获取启动模式参数
const mode = process.argv[2] || 'normal';

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

// 定时推送数据
function startNormalMode() {
    deviceSimulator.start(100, false);
    setInterval(async () => {
        const dataList = deviceSimulator.getLatestData();
        await dataProcessor.processAndPush(dataList);
    }, 8000);
}

function startHighConcurrencyMode() {
    // 先推送正常数据10秒
    deviceSimulator.start(100, false);
    const normalInterval = setInterval(async () => {
        const dataList = deviceSimulator.getLatestData();
        await dataProcessor.processAndPush(dataList);
    }, 8000);

    setTimeout(() => {
        clearInterval(normalInterval);
        // 开启高并发模式，持续20秒
        deviceSimulator.setHighConcurrency(true);
        const highInterval = setInterval(async () => {
            const dataList = deviceSimulator.getLatestData();
            await dataProcessor.processAndPush(dataList);
        }, 8000);

        setTimeout(() => {
            clearInterval(highInterval);
            deviceSimulator.disableHighConcurrency();
            console.log('高并发测试结束，恢复正常模式');
            startNormalMode();
        }, 20000);
    }, 10000);
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

    // 启动对应模式
    if (mode === 'high') {
        startHighConcurrencyMode();
        console.log('WebSocket server running in HIGH CONCURRENCY mode');
    } else {
        startNormalMode();
        console.log('WebSocket server running in NORMAL mode');
    }

    console.log('WebSocket server is running');
    console.log('API server is running');
    console.log('=== 系统启动完成 ===');
}

// 启动应用
main().catch(error => {
    console.error('应用启动失败:', error);
    process.exit(1);
});
