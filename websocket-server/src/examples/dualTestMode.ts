// 双重测试模式 - 同时测试CPU和温度异常检测
// 使用两个独立的数据模拟器，一个生成CPU超限数据，一个生成温度突变数据

import WebSocket from 'ws';
import { DeviceSimulator } from '../services/deviceSimulator';
import { DataProcessor } from '../services/dataProcessor';

console.log('=== CPU和温度同时测试模式 ===\n');

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: 8081 });
const dataProcessor = new DataProcessor();

// 创建两个设备模拟器
const cpuSimulator = new DeviceSimulator();
const tempSimulator = new DeviceSimulator();

// 设置数据处理器
cpuSimulator.setDataProcessor(dataProcessor);
tempSimulator.setDataProcessor(dataProcessor);

// 模拟客户端连接
wss.on('connection', (ws: WebSocket) => {
    console.log('客户端已连接');
    dataProcessor.addClient(ws);

    ws.on('close', () => {
        console.log('客户端已断开');
        dataProcessor.removeClient(ws);
    });
});

// 创建一个模拟客户端来接收消息
const mockClient = new WebSocket('ws://localhost:8081');

// 统计异常告警
let cpuAlertCount = 0;
let tempAlertCount = 0;

mockClient.on('open', () => {
    console.log('模拟客户端已连接\n');
    startDualTest();
});

mockClient.on('message', (data: WebSocket.Data) => {
    const message = JSON.parse(data.toString());
    
    // 只显示异常告警消息
    if (message.type === 'anomaly_alert') {
        if (message.alertType === 'cpu_sustained_exceed') {
            cpuAlertCount++;
            console.log(`\n[CPU告警 #${cpuAlertCount}] ===== CPU持续超限异常 =====`);
            console.log('设备ID:', message.data.deviceId);
            console.log('超限次数:', message.data.breaches?.length || 0);
            console.log('最新CPU值:', message.data.breaches?.[message.data.breaches.length - 1]?.value || 'N/A');
            console.log('时间:', new Date(message.timestamp).toLocaleTimeString());
            console.log('==========================================\n');
        } else if (message.alertType === 'temperature_sudden_change') {
            tempAlertCount++;
            console.log(`\n[温度告警 #${tempAlertCount}] ===== 温度突变异常 =====`);
            console.log('设备ID:', message.data.deviceId);
            console.log('当前温度:', message.data.current_value?.toFixed(1) + '°C');
            console.log('基线温度:', message.data.baseline?.toFixed(1) + '°C');
            console.log('变化量:', message.data.change?.toFixed(1) + '°C');
            console.log('时间:', new Date(message.timestamp).toLocaleTimeString());
            console.log('==========================================\n');
        }
    }
});

// 双重测试流程
async function startDualTest() {
    console.log('>>> 启动双重测试模式\n');
    console.log('策略说明：');
    console.log('  - CPU模拟器：立即开始生成CPU超限数据（91-96%）');
    console.log('  - 温度模拟器：立即开始生成温度突变数据（25°C → 38°C）');
    console.log('  - 两个模拟器独立运行，互不干扰\n');
    
    console.log('预计结果：');
    console.log('  - 约60秒后：开始触发CPU持续超限异常');
    console.log('  - 约5分钟后：开始触发温度突变异常\n');
    
    console.log('开始测试...\n');
    console.log('----------------------------------------\n');

    // 启动CPU超限测试
    console.log('[CPU模拟器] 设置为CPU超限模式');
    cpuSimulator.setTestMode('cpu_exceed');
    cpuSimulator.start();

    // 启动温度突变测试
    console.log('[温度模拟器] 设置为温度突变模式');
    tempSimulator.setTestMode('temp_sudden');
    tempSimulator.start();

    console.log('\n两个模拟器已启动！\n');

    // CPU数据推送（每12秒，确保有足够的数据点）
    setInterval(async () => {
        const cpuDataList = cpuSimulator.getLatestData();
        if (cpuDataList.length > 0) {
            await dataProcessor.processAndPush(cpuDataList);
        }
    }, 12000);

    // 温度数据推送（每10秒）
    setInterval(async () => {
        const tempDataList = tempSimulator.getLatestData();
        if (tempDataList.length > 0) {
            await dataProcessor.processAndPush(tempDataList);
        }
    }, 10000);

    // 定时显示统计信息
    setInterval(() => {
        console.log(`[统计] CPU告警次数: ${cpuAlertCount}, 温度告警次数: ${tempAlertCount}`);
    }, 30000);

    console.log('测试运行中... (按Ctrl+C停止)\n');
}

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n\n正在关闭服务器...');
    console.log(`\n最终统计：`);
    console.log(`  - CPU告警总数: ${cpuAlertCount}`);
    console.log(`  - 温度告警总数: ${tempAlertCount}`);
    
    cpuSimulator.stop();
    tempSimulator.stop();
    wss.close();
    mockClient.close();
    process.exit(0);
});

console.log('WebSocket服务器运行在 ws://localhost:8081');
console.log('等待客户端连接...\n');

