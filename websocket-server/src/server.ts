import WebSocket from 'ws';
import { DeviceSimulator } from './services/deviceSimulator';
import { DataProcessor } from './services/dataProcessor';
import { initDatabase } from './database/init';
import { startApiServer } from './api/server';
import { getCurrentMode, PerformanceMonitor } from './config/performance';

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
const performanceMonitor = new PerformanceMonitor();

// 设置设备模拟器的数据处理器
deviceSimulator.setDataProcessor(dataProcessor);

// 获取性能模式配置
const performanceMode = getCurrentMode();
console.log(`=== 性能模式: ${performanceMode.name} ===`);
console.log(`描述: ${performanceMode.description}`);
console.log(`推送间隔: ${performanceMode.pushInterval}ms`);
console.log(`理论吞吐量: ${performanceMode.throughput} 条/秒`);
console.log('================================');

wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');
    dataProcessor.addClient(ws);
    performanceMonitor.setClientCount(dataProcessor.getClientCount());

    ws.on('close', () => {
        console.log('Client disconnected');
        dataProcessor.removeClient(ws);
        performanceMonitor.setClientCount(dataProcessor.getClientCount());
    });
});

// 【优化】统一的数据推送函数 - 根据性能模式自动调整
function startDataPush() {
    deviceSimulator.start();

    console.log(`启动数据推送: ${performanceMode.name}`);
    console.log(`推送间隔: ${performanceMode.pushInterval}ms`);

    // 启动性能监控
    performanceMonitor.start();

    // 【优化】使用递归 + 精确计时，提升定时器精度
    let lastPushTime = Date.now();
    let isProcessing = false;

    async function schedulePush() {
        const now = Date.now();
        const elapsed = now - lastPushTime;

        // 如果达到推送间隔且没有正在处理
        if (elapsed >= performanceMode.pushInterval && !isProcessing) {
            isProcessing = true;
            lastPushTime = now;

            try {
                const dataList = deviceSimulator.getLatestData();
                if (dataList.length > 0) {
                    await dataProcessor.processAndPush(dataList);

                    // 更新性能监控
                    performanceMonitor.incrementMessageCount(dataList.length);
                    performanceMonitor.setDbPending(dataProcessor.getDbBufferSize());
                }
            } catch (error) {
                console.error('数据推送错误:', error);
            } finally {
                isProcessing = false;
            }
        }

        // 【优化】根据推送间隔选择调度方式
        // 高频模式（<50ms）使用 setImmediate，低频模式使用 setTimeout
        if (performanceMode.pushInterval < 50) {
            setImmediate(schedulePush);
        } else {
            const nextDelay = Math.max(1, performanceMode.pushInterval - (Date.now() - lastPushTime));
            setTimeout(schedulePush, nextDelay);
        }
    }

    // 启动调度
    schedulePush();
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

    // 启动数据推送（根据配置自动选择模式）
    startDataPush();
    console.log(`WebSocket server running in ${performanceMode.name}`);

    console.log('WebSocket server is running');
    console.log('API server is running');
    console.log('=== 系统启动完成 ===');
}

// 启动应用
main().catch(error => {
    console.error('应用启动失败:', error);
    process.exit(1);
});
