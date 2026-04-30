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
        }

        // 2. 批量推送给所有WebSocket客户端
        const message = JSON.stringify({
            type: 'DEVICE_BATCH_UPDATE',
            data: deviceDataList,
            timestamp,
            count: deviceDataList.length
        });

        for (const ws of this.wsClients) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(message);
                } catch (error) {
                    console.error('WebSocket发送失败:', error);
                }
            }
        }

        // 3. 规则引擎定时自动检测异常（在RuleEngine内部定时执行）
    }

    // 处理规则引擎告警
    private handleRuleAlarm(event: AlarmEvent) {
        // 转发给所有WebSocket客户端
        this.broadcastToClients({
            type: 'RULE_ALARM',
            ...event
        });
    }
}
