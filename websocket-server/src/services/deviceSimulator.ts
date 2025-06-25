import WebSocket from 'ws';
import { DeviceData } from '../types';

export class DeviceSimulator {
    private intervals: Map<WebSocket, NodeJS.Timeout>;
    private server: WebSocket.Server;

    constructor(server: WebSocket.Server) {
        this.server = server;
        this.intervals = new Map();
    }

    public startSendingData(ws: WebSocket): void {
        const interval = setInterval(() => {
            const data: DeviceData = {
                type: 'temperature',
                value: 20 + Math.random() * 10, // 生成20-30之间的随机温度
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(data));
        }, 1000);

        this.intervals.set(ws, interval);
    }

    public stopSendingData(ws: WebSocket): void {
        const interval = this.intervals.get(ws);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(ws);
        }
    }
}