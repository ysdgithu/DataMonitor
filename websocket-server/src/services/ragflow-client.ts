import axios from 'axios';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface RagflowConfig {
    baseURL: string;
    apiKey: string;
    analysisChatId: string;
    qaChatId: string;
}

function loadConfig(): RagflowConfig {
    const configPath = path.join(__dirname, '../../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.ragflow;
}

class RagflowClient {
    private client: any;
    private config: RagflowConfig;

    constructor() {
        this.config = loadConfig();
        this.client = axios.create({
            baseURL: this.config.baseURL,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            }
        });
    }

    getAnalysisChatId(): string {
        return this.config.analysisChatId;
    }

    getQaChatId(): string {
        return this.config.qaChatId;
    }

    /**
     * 流式对话：将 RAGFlow 的 SSE 流直接透传给 Express Response
     * @param question 用户问题
     * @param res Express Response 对象
     * @param options 可选配置，onChunk 用于收集完整内容
     */
    async streamChat(
        question: string,
        res: Response,
        options?: { onChunk?: (chunk: string) => void; chatId?: string }
    ): Promise<void> {
        const chatId = options?.chatId || this.config.qaChatId;
        const url = `/api/v1/chats/${chatId}/completions`;

        try {
            const response = await this.client.post(url, {
                question,
                stream: true
            }, {
                responseType: 'stream'
            });

            // 设置 SSE 响应头
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.status(200);

            // 显式发送 HTTP 响应头（防止 Express 自动处理）
            res.flushHeaders();

            const stream = response.data as NodeJS.ReadableStream;
            let buffer = '';

            // 返回 Promise，等待流真正结束
            return new Promise<void>((resolve, reject) => {
                stream.on('data', (chunk: Buffer) => {
                    buffer += chunk.toString('utf-8');
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data:')) continue;

                        const jsonStr = trimmed.slice(5).trim();
                        if (!jsonStr || jsonStr === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(jsonStr);
                            // RAGFlow 格式: { code: 0, data: { answer: '...' } }
                            const answer = parsed?.data?.answer;
                            if (answer !== undefined && answer !== null) {
                                // 将提取出的纯文本 answer 重新包装为 SSE 格式返回给前端
                                const payload = JSON.stringify({ content: answer });
                                res.write(`data: ${payload}\n\n`);
                                // 回调收集完整内容（用于后端存储）
                                options?.onChunk?.(answer);
                            }
                        } catch (e) {
                            // 忽略非 JSON 行
                        }
                    }
                });

                stream.on('end', () => {
                    res.write('data: [DONE]\n\n');
                    res.end();
                    resolve();
                });

                stream.on('error', (err: Error) => {
                    console.error('[RAGFlow] 流读取失败:', err.message);
                    res.write(`data: ${JSON.stringify({ error: '流式响应中断' })}\n\n`);
                    res.end();
                    reject(err);
                });
            });

        } catch (error: any) {
            console.error('[RAGFlow] 请求失败:', error.message);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'RAGFlow 服务调用失败',
                    message: error.message
                });
            } else {
                res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                res.end();
            }
            throw error;
        }
    }

    /**
     * 非流式对话（备用）
     * @param question 用户问题
     */
    async chat(question: string): Promise<string> {
        const url = `/api/v1/chats/${this.config.qaChatId}/completions`;

        const response = await this.client.post(url, {
            question,
            stream: false
        });

        const answer = response.data?.data?.answer;
        if (answer === undefined || answer === null) {
            throw new Error('RAGFlow 未返回有效回答');
        }
        return answer;
    }
}

export default new RagflowClient();
