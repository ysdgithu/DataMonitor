import WebSocket from 'ws';
import { DeviceSimulator } from './services/deviceSimulator';

const wss = new WebSocket.Server({ port: 8080 });
const deviceSimulator = new DeviceSimulator(wss);

wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');
    
    deviceSimulator.startSendingData(ws);

    ws.on('close', () => {
        console.log('Client disconnected');
        deviceSimulator.stopSendingData(ws);
    });
});

console.log('WebSocket server is running on ws://localhost:8080');