import axios from 'axios';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface RagflowConfig {
    baseURL: string;
    apiKey: string;
    analysisChatId: string;
    qaChatId: string;
    datasetId?: string;
}

interface OpenAIChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface StreamOptions {
    onChunk?: (chunk: string) => void;
    chatId?: string;
    sessionId?: string;
    messages?: OpenAIChatMessage[];
    reference?: boolean;
    referenceMetadata?: boolean;
}

function loadConfig(): RagflowConfig {
    const configPath = path.join(__dirname, '../../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.ragflow;
}

class RagflowClient {
    private client: any;
    private config: RagflowConfig;

    private getDatasetId(): string {
        const datasetId = this.config.datasetId;
        if (!datasetId || !String(datasetId).trim()) {
            throw new Error('RAGFlow datasetId 未配置，请在 websocket-server/config.json 的 ragflow.datasetId 中设置');
        }
        return String(datasetId).trim();
    }

    constructor() {
        this.config = loadConfig();
        this.client = axios.create({
            baseURL: this.config.baseURL,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`
            }
        });
    }

    getAnalysisChatId(): string {
        return this.config.analysisChatId;
    }

    getQaChatId(): string {
        return this.config.qaChatId;
    }

    async createSession(chatId: string, name = 'new session', userId?: string): Promise<any> {
        const url = `/api/v1/chats/${chatId}/sessions`;
        const payload: Record<string, any> = { name };
        if (userId) payload.user_id = userId;
        const response = await this.client.post(url, payload);
        const data = response.data?.data ?? response.data;
        const sessionId = data?.id || data?.session_id || response.data?.session_id;
        if (!sessionId) {
            throw new Error('RAGFlow 未返回有效 sessionId');
        }
        return {
            sessionId: String(sessionId),
            data
        };
    }

    async listSessions(chatId: string, params?: { page?: number; pageSize?: number }): Promise<any[]> {
        const url = `/api/v1/chats/${chatId}/sessions`;
        const response = await this.client.get(url, {
            params: {
                page: params?.page,
                page_size: params?.pageSize
            }
        });

        const rawData = response.data?.data ?? response.data;
        if (Array.isArray(rawData)) return rawData;
        if (Array.isArray(rawData?.list)) return rawData.list;
        if (Array.isArray(rawData?.items)) return rawData.items;
        return [];
    }

    async getSession(chatId: string, sessionId: string): Promise<any> {
        const cleanChatId = String(chatId).trim();
        const cleanSessionId = String(sessionId).trim();
        const url = '/v1/conversation/get';

        console.log('[RAGFlow getSession] request', {
            chatId: cleanChatId,
            sessionId: cleanSessionId,
            url,
            conversation_id: cleanSessionId
        });

        const response = await this.client.get(url, {
            params: {
                conversation_id: cleanSessionId
            }
        });
        console.log('[RAGFlow getSession] raw response', response.data);

        const data = response.data?.data ?? response.data;

        if (data?.code === 100 && String(data?.message || '').includes('405')) {
            throw new Error(`RAGFlow 会话详情接口不支持当前请求方式: ${data.message}`);
        }

        if (data?.message && String(data.message).includes('405')) {
            throw new Error(`RAGFlow 会话详情接口返回错误: ${data.message}`);
        }

        return data;
    }

    async streamChat(question: string, res: Response, options?: StreamOptions): Promise<void> {
        const chatId = options?.chatId || this.config.qaChatId;
        const url = `/api/v1/chats_openai/${chatId}/chat/completions`;

        try {
            const messages: OpenAIChatMessage[] = options?.messages?.length
                ? options.messages
                : [{ role: 'user', content: question }];

            const cleanQuestion = String(question || '').trim();
            console.log('[RAGFlow streamChat] request', {
                chatId,
                sessionId: options?.sessionId,
                question: cleanQuestion,
                messageCount: messages.length,
                messages
            });

            const requestBody: Record<string, any> = {
                model: 'model',
                messages,
                stream: true,
                extra_body: {
                    reference: options?.reference ?? true,
                    reference_metadata: {
                        include: options?.referenceMetadata ?? true
                    }
                }
            };

            if (options?.sessionId) {
                requestBody.extra_body.session_id = options.sessionId;
            }

            const response = await this.client.post(url, requestBody, {
                responseType: 'stream'
            });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.status(200);
            res.flushHeaders();

            const stream = response.data as NodeJS.ReadableStream;
            let buffer = '';
            let lastReferences: any = null;

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
                            console.log('[RAGFlow stream raw]', JSON.stringify(parsed, null, 2));

                            const choice = parsed?.choices?.[0] ?? {};
                            const delta = choice?.delta;
                            const message = choice?.message;
                            const content = delta?.content ?? message?.content;
                            const reasoningContent = delta?.reasoning_content ?? message?.reasoning_content;
                            const references =
                                delta?.reference ?? delta?.references ??
                                message?.reference ?? message?.references ??
                                parsed?.references ?? parsed?.data?.references ?? parsed?.data?.reference;
                            const finalContent = delta?.final_content ?? message?.final_content ?? parsed?.final_content ?? parsed?.data?.final_content;
                            const usage = parsed?.usage;

                            if (references || finalContent) {
                                console.log('[RAGFlow stream refs/final]', JSON.stringify({
                                    hasReferences: Boolean(references),
                                    hasFinalContent: Boolean(finalContent),
                                    finalContent,
                                    references,
                                }, null, 2));
                            }

                            const payload: Record<string, any> = {};

                            if (content !== undefined && content !== null) {
                                payload.content = content;
                                options?.onChunk?.(String(content));
                            }

                            if (finalContent !== undefined && finalContent !== null) {
                                payload.final_content = finalContent;
                            }

                            if (reasoningContent) {
                                payload.reasoningContent = reasoningContent;
                            }

                            if (references) {
                                lastReferences = references;
                                payload.references = references;
                            }

                            if (usage) {
                                payload.usage = usage;
                            }

                            if (Object.keys(payload).length > 0) {
                                res.write(`data: ${JSON.stringify(payload)}\n\n`);
                            }
                        } catch {
                            // 忽略非 JSON 行
                        }
                    }
                });

                stream.on('end', () => {
                    if (lastReferences) {
                        res.write(`data: ${JSON.stringify({ references: lastReferences })}\n\n`);
                    }
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

    async chat(question: string): Promise<string> {
        const url = `/api/v1/chats_openai/${this.config.qaChatId}/chat/completions`;

        const response = await this.client.post(url, {
            model: 'model',
            messages: [{ role: 'user', content: question }],
            stream: false,
            extra_body: {
                reference: true,
                reference_metadata: {
                    include: true
                }
            }
        });

        const answer = response.data?.choices?.[0]?.message?.content;
        if (answer === undefined || answer === null) {
            throw new Error('RAGFlow 未返回有效回答');
        }
        return answer;
    }

    async uploadDatasetDocument(filename: string, fileBuffer: Buffer): Promise<any> {
        const datasetId = this.getDatasetId();
        const form = new (require('form-data'))();
        form.append('file', fileBuffer, { filename });

        const response = await this.client.post(
            `/api/v1/datasets/${datasetId}/documents`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${this.config.apiKey}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const data = response.data?.data;
        if (Array.isArray(data) && data.length > 0) return data[0];
        if (data && typeof data === 'object') return data;
        return response.data;
    }

    async listDatasetDocuments(params: Record<string, any> = {}): Promise<any> {
        const datasetId = this.getDatasetId();
        const response = await this.client.get(`/api/v1/datasets/${datasetId}/documents`, {
            params
        });
        return response.data?.data ?? response.data;
    }

    async parseDatasetDocuments(documentIds: string[]): Promise<any> {
        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            throw new Error('document_ids 不能为空');
        }
        const datasetId = this.getDatasetId();
        const response = await this.client.post(`/api/v1/datasets/${datasetId}/chunks`, {
            document_ids: documentIds
        });
        return response.data?.data ?? response.data;
    }

    async deleteDatasetDocuments(documentIds: string[]): Promise<any> {
        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            throw new Error('ids 不能为空');
        }
        const datasetId = this.getDatasetId();
        const response = await this.client.delete(`/api/v1/datasets/${datasetId}/documents`, {
            data: {
                ids: documentIds
            }
        });
        return response.data?.data ?? response.data;
    }

    async deleteSessions(chatId: string, sessionIds: string[]): Promise<any> {
        if (!chatId || !String(chatId).trim()) {
            throw new Error('chatId 不能为空');
        }
        if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
            throw new Error('ids 不能为空');
        }
        const response = await this.client.delete(`/api/v1/chats/${String(chatId).trim()}/sessions`, {
            data: {
                ids: sessionIds
            }
        });
        return response.data?.data ?? response.data;
    }
}

export default new RagflowClient();