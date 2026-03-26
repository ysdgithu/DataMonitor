// WebSocket 服务（简化版）
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

let io: SocketIOServer | null = null;

export function initSocketService(httpServer: HttpServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: { origin: '*' },
    });

    // 认证中间件
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                (socket as any).user = decoded;
            }
        }
        next();
    });

    io.on('connection', (socket: Socket) => {
        const user = (socket as any).user;
        if (user) {
            console.log(`用户连接: ${user.username}`);
            socket.join(`user:${user.id}`);
        } else {
            console.log('访客连接');
        }

        socket.emit('connected', { success: true });

        socket.on('disconnect', () => {
            console.log(user ? `用户断开: ${user.username}` : '访客断开');
        });
    });

    console.log('WebSocket 服务已启动');
    return io;
}

export function getIO(): SocketIOServer {
    if (!io) throw new Error('Socket.io 未初始化');
    return io;
}

export function emitToUser(userId: number | string, event: string, data: any): void {
    io?.to(`user:${userId}`).emit(event, data);
}

export function broadcast(event: string, data: any): void {
    io?.emit(event, data);
}

export default { initSocketService, getIO, emitToUser, broadcast };
