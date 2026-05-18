import { Router, Request, Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware';
import ragflowClient from '../../services/ragflow-client';

const router = Router();

/**
 * POST /api/qa/chat
 * AI 智能问答：接收用户问题并流式转发给 RAGFlow
 *
 * Body: { question: string }
 * Response: SSE 流 (text/event-stream)
 */
router.post('/', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
    try {
        const { question, sessionId: incomingSessionId } = req.body;

        if (!question || typeof question !== 'string' || !question.trim()) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '缺少必填字段：question（非空字符串）'
            });
            return;
        }

        const cleanQuestion = question.trim();
        const qaChatId = ragflowClient.getQaChatId();
        const providedSessionId = typeof incomingSessionId === 'string' ? incomingSessionId.trim() : '';
        console.log('[QA 问答] 收到请求:', { question: cleanQuestion, sessionId: providedSessionId || undefined, rawBody: req.body });
        console.log('[QA 问答] 使用的 chatId:', qaChatId);

        const createdSession = providedSessionId
            ? { sessionId: providedSessionId, data: null }
            : await ragflowClient.createSession(qaChatId, cleanQuestion.slice(0, 30) || 'new session');
        const sessionId = createdSession.sessionId;
        if (providedSessionId) {
            console.log('[QA 问答] 复用 sessionId:', sessionId);
        } else {
            console.log('[QA 问答] 创建的新 sessionId:', sessionId, createdSession.data);
        }

        let fullAnswer = '';
        let sessionSent = false;

        const sendSessionId = () => {
            if (sessionSent || res.writableEnded) return;
            sessionSent = true;
            res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);
        };

        await ragflowClient.streamChat(cleanQuestion, res, {
            chatId: qaChatId,
            sessionId,
            messages: [{ role: 'user', content: cleanQuestion }],
            reference: true,
            referenceMetadata: true,
            onChunk: (chunk: string) => {
                sendSessionId();
                fullAnswer += chunk;
            }
        });

        sendSessionId();

        // 流结束后补发结束标记，前端兼容现有 SSE 解析
        if (!res.writableEnded) {
            res.write('data: [DONE]\n\n');
            res.end();
        }

        console.log('[QA 问答] 完成:', {
            hasAnswer: !!fullAnswer,
            answerLength: fullAnswer.length
        });
    } catch (error: any) {
        console.error('[QA 问答] 接口异常:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'AI 问答失败',
                message: error.message || '未知错误'
            });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message || '未知错误' })}\n\n`);
            res.end();
        }
    }
});

export default router;
