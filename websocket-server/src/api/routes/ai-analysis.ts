import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware';
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
router.post('/', authMiddleware, async (req: Request, res: Response) => {
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

        // 3. 流式调用 RAGFlow，同时收集完整结果用于存储
        let fullResult = '';
        await ragflowClient.streamChat(question, res, {
            chatId: analysisChatId,
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

export default router;
