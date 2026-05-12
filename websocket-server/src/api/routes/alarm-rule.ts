import { Router, Request, Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware';
import DatabaseConnection from '../../database/connection';
import { getRuleEngineInstance } from '../../services/ruleEngineManager';

const router = Router();
const db = DatabaseConnection.getInstance();

function toNumber(value: any, fallback: number | null = null): number | null {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

router.get('/', authMiddleware, roleMiddleware(['admin']), async (_req: Request, res: Response) => {
  try {
    const rules = await db.all(
      `SELECT * FROM alarm_rule WHERE is_deleted = 0 ORDER BY update_time DESC, id DESC`,
      []
    );
    res.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('[alarm-rule] 获取规则失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取规则失败' });
  }
});

router.get('/:id', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: '规则ID必须是数字' });
    }
    const rule = await db.get('SELECT * FROM alarm_rule WHERE id = ? AND is_deleted = 0', [id]);
    if (!rule) {
      return res.status(404).json({ success: false, message: '规则不存在' });
    }
    res.json({ success: true, data: rule });
  } catch (error: any) {
    console.error('[alarm-rule] 获取详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取规则失败' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: '规则ID必须是数字' });
    }

    const existing = await db.get('SELECT * FROM alarm_rule WHERE id = ? AND is_deleted = 0', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: '规则不存在' });
    }

    const updates = {
      rule_name: req.body.rule_name,
      device_type: req.body.device_type,
      params: req.body.params,
      threshold_max: toNumber(req.body.threshold_max, null),
      threshold_min: toNumber(req.body.threshold_min, null),
      duration: toNumber(req.body.duration, 0) ?? 0,
      count: toNumber(req.body.count, 0) ?? 0,
      alarm_level: toNumber(req.body.alarm_level, existing.alarm_level) ?? existing.alarm_level,
      handle_suggest: req.body.handle_suggest ?? null,
      status: toNumber(req.body.status, existing.status) ?? existing.status
    };

    if (!updates.rule_name || !updates.device_type || !updates.params) {
      return res.status(400).json({ success: false, message: '规则名称、设备类型、监控参数不能为空' });
    }

    await db.run(
      `UPDATE alarm_rule SET
        rule_name = ?,
        device_type = ?,
        params = ?,
        threshold_max = ?,
        threshold_min = ?,
        duration = ?,
        count = ?,
        alarm_level = ?,
        handle_suggest = ?,
        status = ?,
        update_time = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0`,
      [
        updates.rule_name,
        updates.device_type,
        updates.params,
        updates.threshold_max,
        updates.threshold_min,
        updates.duration,
        updates.count,
        updates.alarm_level,
        updates.handle_suggest,
        updates.status,
        id
      ]
    );

    // 规则热更新：更新数据库后立即重载内存规则，避免必须重启服务
    const engine = getRuleEngineInstance();
    if (engine) {
      await engine.reloadRules();
    } else {
      console.warn('[alarm-rule] RuleEngine 实例不存在，本次更新将在服务重启后生效');
    }

    res.json({ success: true, message: '规则更新成功，已热重载' });
  } catch (error: any) {
    console.error('[alarm-rule] 更新失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新规则失败' });
  }
});

export default router;
