// 历史数据报表导出路由 - 基于 device_data 表的实现
import { Router, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import DatabaseConnection from '../../database/connection';
import { authMiddleware, roleMiddleware } from '../middleware';

const router = Router();

const METRIC_LABELS: Record<string, string> = {
    temp: '温度(℃)',
    level: '液位(L)',
    current: '电流(A)',
    ph: 'pH值',
    fill_volume: '灌装量(ml)',
    pressure: '压力(MPa)',
    speed: '速度(瓶/分)'
};

function parseTimeRange(body: any): { startTime: number; endTime: number } | null {
    const { timeRange } = body;
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let startTime = nowMs;
    let endTime = nowMs;

    switch (timeRange) {
        case '1h':
            startTime = nowMs - 1 * 60 * 60 * 1000;
            endTime = nowMs;
            break;
        case '24h':
            startTime = nowMs - 24 * 60 * 60 * 1000;
            endTime = nowMs;
            break;
        case '48h':
            startTime = nowMs - 48 * 60 * 60 * 1000;
            endTime = nowMs;
            break;
        case 'today': {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            startTime = todayStart.getTime();
            endTime = nowMs;
            break;
        }
        case '7days':
            startTime = nowMs - 7 * oneDayMs;
            endTime = nowMs;
            break;
        case '30days':
            startTime = nowMs - 30 * oneDayMs;
            endTime = nowMs;
            break;
        case 'custom':
            if (Array.isArray(body.customRange) && body.customRange.length === 2) {
                const s = new Date(body.customRange[0]);
                s.setHours(0, 0, 0, 0);
                const e = new Date(body.customRange[1]);
                e.setHours(23, 59, 59, 999);
                startTime = s.getTime();
                endTime = e.getTime();
            } else {
                return null;
            }
            break;
        default:
            return null;
    }

    return { startTime, endTime };
}

function formatDate(time: number): string {
    return new Date(time).toLocaleString('zh-CN', { hour12: false });
}

function translateTimeRange(timeRange: string): string {
    const map: Record<string, string> = { today: '今日', '7days': '近7天', '30days': '近30天', custom: '自定义' };
    return map[timeRange] || timeRange;
}

function toMetricList(raw: any): string[] {
    if (Array.isArray(raw) && raw.length > 0) return raw.map(String).filter(Boolean);
    if (typeof raw === 'string' && raw.trim()) return raw.split(',').map(s => s.trim()).filter(Boolean);
    return ['fill_volume'];
}

function safeNumber(value: any): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function calcStats(values: number[]) {
    if (values.length === 0) return { avg: null, max: null, min: null, std: null };
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
    return { avg, max, min, std: Math.sqrt(variance) };
}

async function fetchHistoryData(params: {
    deviceId?: string;
    startTime: number;
    endTime: number;
    metrics: string[];
    page: number;
    pageSize: number;
}) {
    const db = DatabaseConnection.getInstance();
    const pool = await db.connect();
    const where: string[] = ['timestamp BETWEEN ? AND ?'];
    const values: any[] = [params.startTime, params.endTime];

    if (params.deviceId) {
        where.push('device_id = ?');
        values.push(params.deviceId);
    }

    const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM device_data WHERE ${where.join(' AND ')}`,
        values
    ) as any[];

    const total = Number(countRows?.[0]?.total || 0);
    const offset = (params.page - 1) * params.pageSize;

    const [rows] = await pool.query(
        `SELECT device_id, data_type, data_status, timestamp, payload FROM device_data WHERE ${where.join(' AND ')} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
        [...values, params.pageSize, offset]
    ) as any[];

    const list = (rows || []).map((row: any) => {
        let parsedPayload: any = row.payload;
        if (typeof row.payload === 'string') {
            try {
                parsedPayload = JSON.parse(row.payload);
            } catch {
                parsedPayload = {};
            }
        }

        return {
            deviceId: row.device_id,
            dataType: row.data_type,
            dataStatus: row.data_status,
            timestamp: row.timestamp,
            payload: parsedPayload
        };
    });

    return { total, list };
}

async function buildReportData(body: any) {
    const range = parseTimeRange(body);
    if (!range) throw new Error('时间范围参数错误');

    const metrics = toMetricList(body.metrics);
    const deviceId = body.deviceId ? String(body.deviceId).trim() : '';
    const page = Math.max(1, Number(body.page || 1));
    const pageSize = Math.max(1, Math.min(200, Number(body.pageSize || 10)));

    const { total, list } = await fetchHistoryData({ deviceId, startTime: range.startTime, endTime: range.endTime, metrics, page, pageSize });

    const metricValues: Record<string, number[]> = {};
    metrics.forEach(m => { metricValues[m] = []; });

    let anomalyCount = 0;

    // 只返回当前页明细，避免前端一次性加载全量数据导致卡死
    const detailRows = list.map((item: any) => {
        const payload = item.payload || {};
        const row: any = {
            time: formatDate(item.timestamp),
            deviceId: item.deviceId,
            dataType: item.dataType || '-',
            dataStatus: item.dataStatus || 'normal'
        };

        metrics.forEach(metric => {
            const val = safeNumber(payload?.[metric]?.value ?? payload?.[metric]);
            row[metric] = val === null ? '-' : val;
            if (val !== null) metricValues[metric].push(val);
        });

        const hasAnomaly = item.dataStatus === 'warning' || item.dataStatus === 'alarm';
        if (hasAnomaly) anomalyCount += 1;
        row.anomaly = hasAnomaly ? '异常' : '正常';
        return row;
    });

    const summary = metrics.map(metric => {
        const stats = calcStats(metricValues[metric] || []);
        return {
            metric,
            metricLabel: METRIC_LABELS[metric] || metric,
            avg: stats.avg,
            max: stats.max,
            min: stats.min,
            std: stats.std,
            anomalyCount
        };
    });

    return {
        queryCondition: {
            deviceId: deviceId || '全部设备',
            timeRange: translateTimeRange(body.timeRange),
            customRange: body.customRange || [],
            metrics,
            startTime: formatDate(range.startTime),
            endTime: formatDate(range.endTime)
        },
        summary,
        total,
        page,
        pageSize,
        details: detailRows
    };
}

router.post('/generate', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
    try {
        const data = await buildReportData(req.body);
        res.json({ success: true, data, message: '报表生成成功' });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message || '报表生成失败' });
    }
});

router.post('/export', authMiddleware, roleMiddleware(['admin', 'user']), async (req: Request, res: Response) => {
    try {
        const data = await buildReportData(req.body);
        const workbook = new ExcelJS.Workbook();
        workbook.creator = '工业设备智能运维平台';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('历史数据分析报表');
        let currentRow = 1;

        sheet.getCell(currentRow, 1).value = '查询条件';
        sheet.getCell(currentRow, 1).font = { bold: true, size: 14 };
        currentRow++;
        sheet.getCell(currentRow, 1).value = '项目';
        sheet.getCell(currentRow, 2).value = '值';
        sheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        Object.entries(data.queryCondition).forEach(([key, value]) => {
            sheet.getCell(currentRow, 1).value = key;
            sheet.getCell(currentRow, 2).value = Array.isArray(value) ? value.join(', ') : String(value);
            currentRow++;
        });

        currentRow++;

        sheet.getCell(currentRow, 1).value = '统计摘要';
        sheet.getCell(currentRow, 1).font = { bold: true, size: 14 };
        currentRow++;
        const summaryHeaders = ['指标', '平均值', '最大值', '最小值', '标准差', '异常次数'];
        summaryHeaders.forEach((header, index) => {
            sheet.getCell(currentRow, index + 1).value = header;
        });
        sheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        data.summary.forEach((item: any) => {
            sheet.getCell(currentRow, 1).value = item.metricLabel;
            sheet.getCell(currentRow, 2).value = item.avg === null ? '-' : Number(item.avg.toFixed(2));
            sheet.getCell(currentRow, 3).value = item.max === null ? '-' : Number(item.max.toFixed(2));
            sheet.getCell(currentRow, 4).value = item.min === null ? '-' : Number(item.min.toFixed(2));
            sheet.getCell(currentRow, 5).value = item.std === null ? '-' : Number(item.std.toFixed(2));
            sheet.getCell(currentRow, 6).value = item.anomalyCount;
            currentRow++;
        });

        currentRow++;

        sheet.getCell(currentRow, 1).value = '原始数据明细';
        sheet.getCell(currentRow, 1).font = { bold: true, size: 14 };
        currentRow++;
        const detailHeaders = ['采集时间', '设备ID', '数据类型', '数据状态', ...toMetricList(req.body.metrics).map(m => METRIC_LABELS[m] || m), '状态'];
        detailHeaders.forEach((header, index) => {
            sheet.getCell(currentRow, index + 1).value = header;
        });
        sheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        data.details.forEach((row: any) => {
            const rowValues = [
                row.time,
                row.deviceId,
                row.dataType,
                row.dataStatus,
                ...toMetricList(req.body.metrics).map(m => row[m]),
                row.anomaly
            ];
            rowValues.forEach((val, index) => {
                sheet.getCell(currentRow, index + 1).value = val as any;
            });
            currentRow++;
        });

        sheet.columns = [
            { width: 22 },
            { width: 16 },
            { width: 14 },
            { width: 14 },
            ...toMetricList(req.body.metrics).map(() => ({ width: 14 })),
            { width: 12 }
        ];

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `历史数据分析报表_${dateStr}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message || '导出报表失败' });
    }
});

export default router;
