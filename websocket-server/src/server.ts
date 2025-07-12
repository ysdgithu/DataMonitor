import WebSocket from 'ws';
import { DeviceSimulator } from './services/deviceSimulator';
import { DataProcessor } from './services/dataProcessor';

// 获取启动模式参数
const mode = process.argv[2] || 'normal';

const wss = new WebSocket.Server({ port: 8080 });
const deviceSimulator = new DeviceSimulator();
const dataProcessor = new DataProcessor();

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
    setInterval(() => {
        const dataList = deviceSimulator.getLatestData();
        dataProcessor.processAndPush(dataList);
    }, 1000);
}

function startHighConcurrencyMode() {
    // 先推送正常数据10秒
    deviceSimulator.start(100, false);
    const normalInterval = setInterval(() => {
        const dataList = deviceSimulator.getLatestData();
        dataProcessor.processAndPush(dataList);
    }, 1000);

    setTimeout(() => {
        clearInterval(normalInterval);
        // 开启高并发模式，持续20秒
        deviceSimulator.setHighConcurrency(true);
        const highInterval = setInterval(() => {
            const dataList = deviceSimulator.getLatestData();
            dataProcessor.processAndPush(dataList);
        }, 1000);

        setTimeout(() => {
            clearInterval(highInterval);
            deviceSimulator.disableHighConcurrency();
            console.log('高并发测试结束，恢复正常模式');
            startNormalMode();
        }, 20000);
    }, 10000);
}

// 启动对应模式
if (mode === 'high') {
    startHighConcurrencyMode();
    console.log('WebSocket server running in HIGH CONCURRENCY mode');
} else {
    startNormalMode();
    console.log('WebSocket server running in NORMAL mode');
}

console.log('WebSocket server is running on ws://localhost:8080');
