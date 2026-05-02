import WebSocket from 'ws';
import { DataModel } from '../database/models';
import { RuleEngine, AlarmEvent } from './ruleEngine';

// 设备数据类型
interface DeviceData {
    deviceId: string;
    deviceType: string;
    timestamp: number;
    payload: Record<string, any>;
}

// 数据处理器类
export class DataProcessor {
    private wsClients: Set<WebSocket> = new Set();
    private dataModel: DataModel;
    private ruleEngine: RuleEngine;

    constructor() {
        this.dataModel = new DataModel();

        // 初始化规则引擎
        this.ruleEngine = new RuleEngine({
            checkInterval: 5000,     // 5秒检查一次
            historyBuffer: 600000    // 10分钟历史数据
        });

        // 设置告警回调
        this.ruleEngine.onAlarm((event: AlarmEvent) => {
            this.handleRuleAlarm(event);
        });

        // 延迟启动（等待数据库连接）
        setTimeout(() => {
            this.startServices();
        }, 3000);
    }

    // 启动服务
    private async startServices() {
        console.log('[DataProcessor] 启动服务...');

        // 启动规则引擎（定时轮询检测）
        await this.ruleEngine.start();

        console.log('[DataProcessor] 服务已启动');
    }

    // 注册客户端
    public addClient(ws: WebSocket) {
        this.wsClients.add(ws);
    }

    // 移除客户端
    public removeClient(ws: WebSocket) {
        this.wsClients.delete(ws);
    }

    // 获取客户端数量
    public getClientCount(): number {
        return this.wsClients.size;
    }

    // 广播消息给所有客户端
    public broadcastToClients(message: any) {
        const data = JSON.stringify(message);
        for (const ws of this.wsClients) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(data);
                } catch (error) {
                    console.error('WebSocket发送失败:', error);
                }
            }
        }
    }

    // 批量处理并推送数据（来自DeviceSimulator）
    public async processAndPushBatch(deviceDataList: DeviceData[]) {
        const timestamp = Date.now();

        // 1. 批量写入数据库
        try {
            await this.dataModel.batchInsertDeviceData(deviceDataList);
        } catch (error) {
            console.error('[DataProcessor] 批量写入数据库失败:', error);
            return; // 写入失败则不继续
        }

        // 2. 实时触发规则评估（事件驱动）
        for (const deviceData of deviceDataList) {
            try {
                await this.ruleEngine.evaluateDeviceRealtime(
                    deviceData.deviceId,
                    deviceData.timestamp
                );
            } catch (error) {
                console.error(`[DataProcessor] 规则评估失败，设备 ${deviceData.deviceId}:`, error);
            }
        }

        // 3. 批量推送给所有WebSocket客户端
        const message = JSON.stringify({
            type: 'DEVICE_BATCH_UPDATE',
            data: deviceDataList,
            timestamp,
            count: deviceDataList.length
        });

        const clientCount = this.wsClients.size;
        console.log(`[DataProcessor] 推送数据到 ${clientCount} 个客户端, 数据量: ${deviceDataList.length}`);

        for (const ws of this.wsClients) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(message);
                } catch (error) {
                    console.error('WebSocket发送失败:', error);
                }
            }
        }
    }

    // 处理规则引擎告警
    private handleRuleAlarm(event: AlarmEvent) {
        console.log(`\n📢 [DataProcessor] 收到告警事件:`);
        console.log(`   设备: ${event.deviceId} (${event.deviceType})`);
        console.log(`   参数: ${event.parameterName} = ${event.currentValue}`);
        console.log(`   阈值: ${event.threshold}`);
        console.log(`   规则: ${event.ruleName}`);
        console.log(`   等级: ${event.severity}`);

        // 广播告警事件给所有WebSocket客户端
        const message = {
            type: 'ALARM_EVENT',
            data: event,
            timestamp: Date.now()
        };

        const messageStr = JSON.stringify(message);
        let successCount = 0;

        for (const ws of this.wsClients) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(messageStr);
                    successCount++;
                } catch (error) {
                    console.error('[DataProcessor] 告警推送失败:', error);
                }
            }
        }

        console.log(`   ✅ 已推送给 ${successCount}/${this.wsClients.size} 个客户端\n`);
    }
}
