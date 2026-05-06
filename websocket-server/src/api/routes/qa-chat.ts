import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware';
import ragflowClient from '../../services/ragflow-client';

const router = Router();

/**
 * POST /api/qa/chat
 * AI 智能问答：接收用户问题并流式转发给 RAGFlow
 *
 * Body: { question: string }
 * Response: SSE 流 (text/event-stream)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { question } = req.body;

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
        console.log('[QA 问答] 收到请求:', { question: cleanQuestion });
        console.log('[QA 问答] 使用的 chatId:', qaChatId);

        let fullAnswer = '';

        await ragflowClient.streamChat(cleanQuestion, res, {
            chatId: qaChatId,
            onChunk: (chunk: string) => {
                fullAnswer += chunk;
            }
        });

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
