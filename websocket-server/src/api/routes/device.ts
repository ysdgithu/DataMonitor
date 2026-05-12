import { Router, Request, Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware';
import DatabaseConnection from '../../database/connection';

const router = Router();
const db = DatabaseConnection.getInstance();

const ALLOWED_DEVICE_TYPES = ['灌装机', '调配罐'];

function isValidDeviceCode(code: string): boolean {
  if (!/^100\d$/.test(code)) return false;
  const num = Number(code);
  return Number.isFinite(num) && num > 1003;
}

router.get('/', authMiddleware, roleMiddleware(['admin', 'user']), async (_req: Request, res: Response) => {
  try {
    const rows = await db.all(
      `SELECT id, device_code, device_name, device_type, create_time, update_time
       FROM device
       WHERE is_deleted = 0
       ORDER BY id ASC`,
      []
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('[device] 获取设备列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取设备列表失败' });
  }
});

router.get('/:id', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: '设备ID必须是数字' });

    const row = await db.get(
      `SELECT id, device_code, device_name, device_type, create_time, update_time
       FROM device
       WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: '设备不存在' });
    res.json({ success: true, data: row });
  } catch (error: any) {
    console.error('[device] 获取设备详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取设备详情失败' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const { device_code, device_name, device_type } = req.body;

    if (!device_code || !device_name || !device_type) {
      return res.status(400).json({ success: false, message: '设备编号、设备名称、设备类型不能为空' });
    }

    if (!ALLOWED_DEVICE_TYPES.includes(device_type)) {
      return res.status(400).json({ success: false, message: '设备类型仅支持：灌装机、调配罐' });
    }

    if (!isValidDeviceCode(String(device_code))) {
      return res.status(400).json({ success: false, message: '设备编号格式必须为100x且大于1003（如1004）' });
    }

    const exists = await db.get('SELECT id FROM device WHERE device_code = ? AND is_deleted = 0', [device_code]);
    if (exists) {
      return res.status(409).json({ success: false, message: '设备编号已存在' });
    }

    await db.run(
      `INSERT INTO device (device_code, device_name, device_type)
       VALUES (?, ?, ?)`,
      [device_code, device_name, device_type]
    );

    res.json({ success: true, message: '设备新增成功' });
  } catch (error: any) {
    console.error('[device] 新增设备失败:', error);
    res.status(500).json({ success: false, message: error.message || '新增设备失败' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: '设备ID必须是数字' });

    const { device_code, device_name, device_type } = req.body;

    if (!device_code || !device_name || !device_type) {
      return res.status(400).json({ success: false, message: '设备编号、设备名称、设备类型不能为空' });
    }

    if (!ALLOWED_DEVICE_TYPES.includes(device_type)) {
      return res.status(400).json({ success: false, message: '设备类型仅支持：灌装机、调配罐' });
    }

    if (!isValidDeviceCode(String(device_code))) {
      return res.status(400).json({ success: false, message: '设备编号格式必须为100x且大于1003（如1004）' });
    }

    const existing = await db.get('SELECT id FROM device WHERE id = ? AND is_deleted = 0', [id]);
    if (!existing) return res.status(404).json({ success: false, message: '设备不存在' });

    const duplicated = await db.get('SELECT id FROM device WHERE device_code = ? AND id <> ? AND is_deleted = 0', [device_code, id]);
    if (duplicated) {
      return res.status(409).json({ success: false, message: '设备编号已存在' });
    }

    await db.run(
      `UPDATE device SET
        device_code = ?,
        device_name = ?,
        device_type = ?,
        update_time = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0`,
      [device_code, device_name, device_type, id]
    );

    res.json({ success: true, message: '设备更新成功' });
  } catch (error: any) {
    console.error('[device] 更新设备失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新设备失败' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: '设备ID必须是数字' });

    const existing = await db.get('SELECT id FROM device WHERE id = ? AND is_deleted = 0', [id]);
    if (!existing) return res.status(404).json({ success: false, message: '设备不存在' });

    await db.run('UPDATE device SET is_deleted = 1, update_time = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ success: true, message: '设备删除成功' });
  } catch (error: any) {
    console.error('[device] 删除设备失败:', error);
    res.status(500).json({ success: false, message: error.message || '删除设备失败' });
  }
});

export default router;
