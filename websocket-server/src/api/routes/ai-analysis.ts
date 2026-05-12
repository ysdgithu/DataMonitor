import { Router, Request, Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware';
import DatabaseConnection from '../../database/connection';
import ragflowClient from '../../services/ragflow-client';

const router = Router();

/**
 * POST /api/ai-analysis
 * 根据诊断任务 ID，拼接提示词，流式调用 RAGFlow 获取 AI 分析
 *
 * Body: { taskId: number }
 * Response: SSE 流 (text/event-stream)
 */
router.post('/', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
    try {
        const { taskId } = req.body;

        if (!taskId || typeof taskId !== 'number') {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '缺少必填字段：taskId（数字类型）'
            });
            return;
        }

        // 1. 查询诊断任务
        const db = DatabaseConnection.getInstance();
        const sql = 'SELECT * FROM diagnosis_tasks WHERE id = ?';
        const task = await db.get(sql, [taskId]);

        if (!task) {
            res.status(404).json({
                success: false,
                error: '任务不存在',
                message: `未找到 ID 为 ${taskId} 的诊断任务`
            });
            return;
        }

        const taskName = task.name || '未知异常';
        const analysisChatId = ragflowClient.getAnalysisChatId();
        console.log(`[AI 分析] 任务ID: ${taskId}, 任务名称: ${taskName}`);
        console.log('[AI 分析] 使用的 chatId:', analysisChatId);

        // 2. 拼接提示词
        const question = `我出现了${taskName}这个异常，请尽量使用简洁精炼的语言回答，包括可能的原因和处理步骤`;
        console.log('[AI 分析] 提示词:', question);

        // 3. 先创建新会话，再流式调用 RAGFlow
        const sessionId = await ragflowClient.createSession(analysisChatId);
        console.log('[AI 分析] 创建的新 sessionId:', sessionId);

        let fullResult = '';
        await ragflowClient.streamChat(question, res, {
            chatId: analysisChatId,
            sessionId,
            onChunk: (chunk: string) => {
                fullResult += chunk;
            }
        });

        // 4. 流结束后，将完整结果存入 diagnosis_tasks.ai
        if (fullResult) {
            try {
                await db.run('UPDATE diagnosis_tasks SET ai = ? WHERE id = ?', [fullResult, taskId]);
                console.log(`[AI 分析] 结果已存入 diagnosis_tasks.ai，任务ID: ${taskId}`);
            } catch (dbErr: any) {
                console.error('[AI 分析] 存入数据库失败:', dbErr.message);
            }
        }

    } catch (error: any) {
        console.error('[AI 分析] 接口异常:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'AI 分析失败',
                message: error.message || '未知错误'
            });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message || '未知错误' })}\n\n`);
            res.end();
        }
    }
});

/**
 * GET /api/ai-analysis/history
 * 获取智能问答历史会话列表
 */
router.get('/history', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
    try {
        const chatId = String(req.query.chatId || ragflowClient.getQaChatId()).trim();
        const page = req.query.page ? Number(req.query.page) : 1;
        const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;

        if (!chatId) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '缺少 chatId'
            });
            return;
        }

        const sessions = await ragflowClient.listSessions(chatId, { page, pageSize });
        res.json({
            success: true,
            data: sessions,
            chatId,
            page,
            pageSize
        });
    } catch (error: any) {
        console.error('[AI 分析] 获取历史会话失败:', error);
        res.status(500).json({
            success: false,
            error: '获取历史会话失败',
            message: error.message || '未知错误'
        });
    }
});

export default router;
