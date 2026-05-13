import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, roleMiddleware } from '../middleware';
import ragflowClient from '../../services/ragflow-client';
import DatabaseConnection from '../../database/connection';

const router = Router();
const db = DatabaseConnection.getInstance();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

const RAGFLOW_STATUS_TO_PARSE_STATUS: Record<string, number> = {
  UNSTART: 0,
  RUNNING: 1,
  DONE: 2,
  FAIL: 3,
  CANCEL: 3,
  '0': 0,
  '1': 1,
  '2': 3,
  '3': 2,
  '4': 3
};

function normalizeParseStatus(runStatus: unknown): number {
  if (runStatus === undefined || runStatus === null) return 0;
  const raw = String(runStatus).trim().toUpperCase();
  return RAGFLOW_STATUS_TO_PARSE_STATUS[raw] ?? 0;
}

router.post(
  '/upload',
  authMiddleware,
  roleMiddleware(['admin', 'user']),
  upload.array('file'),
  async (req: Request, res: Response) => {
    try {
      const files = (req.files || []) as Express.Multer.File[];
      if (!files.length) {
        return res.status(400).json({ success: false, message: '请至少上传一个文件(file)' });
      }

      const uploadUserId = req.user?.id;
      if (!uploadUserId) {
        return res.status(401).json({ success: false, message: '用户未认证' });
      }

      const savedRows: any[] = [];
      for (const file of files) {
        const ragDoc = await ragflowClient.uploadDatasetDocument(file.originalname, file.buffer);
        const ragflowDocId = String(ragDoc?.id || ragDoc?.document_id || ragDoc?.doc_id || '').trim();

        if (!ragflowDocId) {
          throw new Error(`RAGFlow 未返回有效文档ID: ${file.originalname}`);
        }

        await db.run(
          `INSERT INTO knowledge_doc
          (doc_name, ragflow_doc_id, upload_user_id, parse_status)
          VALUES (?, ?, ?, ?)`,
          [file.originalname, ragflowDocId, Number(uploadUserId), 0]
        );

        const inserted = await db.get(
          `SELECT id, doc_name, ragflow_doc_id, upload_user_id, upload_time, parse_status, create_time, update_time
           FROM knowledge_doc
           WHERE ragflow_doc_id = ?
           ORDER BY id DESC
           LIMIT 1`,
          [ragflowDocId]
        );

        savedRows.push(inserted);
      }

      return res.json({
        success: true,
        message: '文档上传成功',
        data: savedRows
      });
    } catch (error: any) {
      console.error('[knowledge-doc] 上传文档失败:', error);
      return res.status(500).json({ success: false, message: error.message || '上传文档失败' });
    }
  }
);

router.get('/', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(req.query.page_size || req.query.pageSize || 10)));
    const offset = (page - 1) * pageSize;

    const keywords = String(req.query.keywords || '').trim();
    const parseStatusRaw = req.query.parse_status;

    const whereSql: string[] = ['1 = 1'];
    const params: any[] = [];

    if (keywords) {
      whereSql.push('doc_name LIKE ?');
      params.push(`%${keywords}%`);
    }

    if (parseStatusRaw !== undefined && parseStatusRaw !== null && parseStatusRaw !== '') {
      whereSql.push('parse_status = ?');
      params.push(Number(parseStatusRaw));
    }

    const where = whereSql.join(' AND ');

    let total = 0;
    try {
      const totalRow = await db.get(`SELECT COUNT(*) AS total FROM knowledge_doc WHERE ${where}`, params);
      total = Number(totalRow?.total || 0);
    } catch (dbError) {
      const message = dbError instanceof Error ? dbError.message : String(dbError);
      if (!/no such table|unknown column/i.test(message)) {
        throw dbError;
      }
      total = 0;
    }

    const list = await db.all(
      `SELECT id, doc_name, ragflow_doc_id, upload_user_id, upload_time, parse_status, create_time, update_time
       FROM knowledge_doc
       WHERE ${where}
       ORDER BY id ASC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    const ragDocs = await ragflowClient.listDatasetDocuments({
      page: 1,
      page_size: 200,
      keywords: keywords || undefined
    });
    const ragDocList = Array.isArray(ragDocs?.docs)
      ? ragDocs.docs
      : Array.isArray(ragDocs?.list)
      ? ragDocs.list
      : Array.isArray(ragDocs)
      ? ragDocs
      : [];

    const ragStatusMap = new Map<string, number>();
    for (const item of ragDocList) {
      const ragflowDocId = String(item?.id || item?.document_id || item?.doc_id || '').trim();
      if (!ragflowDocId) continue;
      ragStatusMap.set(ragflowDocId, normalizeParseStatus(item?.run || item?.run_status || item?.status));
    }

    const mergedList = list.map((row: any) => {
      const ragStatus = ragStatusMap.get(String(row.ragflow_doc_id || '').trim());
      return {
        ...row,
        parse_status: typeof ragStatus === 'number' ? ragStatus : row.parse_status
      };
    });

    const updates = mergedList
      .filter((row: any) => typeof row.parse_status === 'number')
      .map((row: any) =>
        db.run(
          `UPDATE knowledge_doc
           SET parse_status = ?,
               update_time = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [row.parse_status, row.id]
        ).catch(() => undefined)
      );

    void Promise.all(updates);

    return res.json({
      success: true,
      data: mergedList,
      total,
      page,
      pageSize
    });
  } catch (error: any) {
    console.error('[knowledge-doc] 查询文档列表失败:', error);
    return res.status(500).json({ success: false, message: error.message || '查询文档列表失败' });
  }
});

router.post('/:id/process', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: '文档ID必须是数字' });
    }

    const row = await db.get(
      `SELECT id, doc_name, ragflow_doc_id, parse_status
       FROM knowledge_doc
       WHERE id = ?`,
      [id]
    );

    if (!row) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    await ragflowClient.parseDatasetDocuments([String(row.ragflow_doc_id)]);

    await db.run(
      `UPDATE knowledge_doc
       SET parse_status = 1,
           update_time = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: '已触发文档解析',
      data: { id, ragflow_doc_id: row.ragflow_doc_id, parse_status: 1 }
    });
  } catch (error: any) {
    console.error('[knowledge-doc] 触发解析失败:', error);
    return res.status(500).json({ success: false, message: error.message || '触发解析失败' });
  }
});

router.post('/sync-status', authMiddleware, roleMiddleware(['admin', 'user']), async (_req: Request, res: Response) => {
  try {
    const ragResult = await ragflowClient.listDatasetDocuments({ page: 1, page_size: 200 });
    const rows = Array.isArray(ragResult?.docs)
      ? ragResult.docs
      : Array.isArray(ragResult)
      ? ragResult
      : Array.isArray(ragResult?.list)
      ? ragResult.list
      : [];

    let updated = 0;

    for (const item of rows) {
      const ragflowDocId = String(item?.id || item?.document_id || item?.doc_id || '').trim();
      if (!ragflowDocId) continue;

      const parseStatus = normalizeParseStatus(item?.run || item?.run_status || item?.status);

      await db.run(
        `UPDATE knowledge_doc
         SET parse_status = ?,
             update_time = CURRENT_TIMESTAMP
         WHERE ragflow_doc_id = ?`,
        [parseStatus, ragflowDocId]
      );

      updated++;
    }

    return res.json({ success: true, message: '状态同步完成', data: { updated } });
  } catch (error: any) {
    console.error('[knowledge-doc] 同步状态失败:', error);
    return res.status(500).json({ success: false, message: error.message || '同步状态失败' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: '文档ID必须是数字' });
    }

    const row = await db.get(
      `SELECT id, doc_name, ragflow_doc_id
       FROM knowledge_doc
       WHERE id = ?`,
      [id]
    );

    if (!row) {
      return res.status(404).json({ success: false, message: '文档不存在' });
    }

    if (row.ragflow_doc_id) {
      await ragflowClient.deleteDatasetDocuments([String(row.ragflow_doc_id)]);
    }

    await db.run(
      `DELETE FROM knowledge_doc
       WHERE id = ?`,
      [id]
    );

    return res.json({ success: true, message: '文档删除成功' });
  } catch (error: any) {
    console.error('[knowledge-doc] 删除文档失败:', error);
    return res.status(500).json({ success: false, message: error.message || '删除文档失败' });
  }
});

export default router;
