// API服务器 - 提供历史数据查询接口
import express from 'express';
import cors from 'cors';
import { DataModel, QueryParams } from '../database/models';

const app = express();
const PORT = process.env.API_PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());

// 数据模型实例
const dataModel = new DataModel();

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// 查询核心指标数据
app.get('/api/core-metrics', async (req, res) => {
    try {
        const params: QueryParams = {
            deviceId: req.query.deviceId as string,
            category: req.query.category as string,
            startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
            endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const rawData = await dataModel.queryCoreMetrics(params);
        // 解析payload字段中的JSON数据
        const data = rawData.map(item => {
            if (typeof item.payload === 'string') {
                try {
                    return JSON.parse(item.payload);
                } catch (e) {
                    return item;
                }
            }
            return item;
        });
        res.json({
            success: true,
            data,
            total: data.length,
            params
        });
    } catch (error) {
        console.error('查询核心指标数据失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 查询环境数据
app.get('/api/environment', async (req, res) => {
    try {
        const params: QueryParams = {
            deviceId: req.query.deviceId as string,
            dataType: req.query.type as string,
            startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
            endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const rawData = await dataModel.queryEnvironmentData(params);
        // 解析payload字段中的JSON数据
        const data = rawData.map(item => {
            if (typeof item.payload === 'string') {
                try {
                    return JSON.parse(item.payload);
                } catch (e) {
                    return item;
                }
            }
            return item;
        });
        res.json({
            success: true,
            data,
            total: data.length,
            params
        });
    } catch (error) {
        console.error('查询环境数据失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 查询设备状态数据 - 按设备类型统计
app.get('/api/device-status', async (req, res) => {
    try {
        const deviceTypeFilter = req.query.deviceType ? parseInt(req.query.deviceType as string) : undefined;

        // 查询工厂设备数据 - 获取每个设备的最新记录
        const params: QueryParams = {
            limit: 10000,  // 获取足够多的记录以覆盖所有设备
            offset: 0
        };

        const factoryDevices = await dataModel.queryFactoryDevices(params);

        // 按设备ID去重，只保留最新的记录
        const uniqueDevices: { [key: string]: any } = {};
        factoryDevices.forEach((device: any) => {
            // 如果这个设备ID还没有记录，或者当前记录更新，则更新
            if (!uniqueDevices[device.deviceId] || device.timestamp > uniqueDevices[device.deviceId].timestamp) {
                uniqueDevices[device.deviceId] = device;
            }
        });

        // 转换为数组
        const uniqueDeviceArray = Object.values(uniqueDevices);

        // 按设备类型统计
        const typeStats: { [key: number]: { count: number; deviceIds: Set<string> } } = {};

        // 初始化所有设备类型（0-9）
        for (let i = 0; i < 10; i++) {
            typeStats[i] = { count: 0, deviceIds: new Set<string>() };
        }

        // 按类型分类统计（使用去重后的设备）
        uniqueDeviceArray.forEach((device: any) => {
            const typeCode = device.typeCode !== undefined ? device.typeCode : 0;
            if (typeStats[typeCode]) {
                typeStats[typeCode].count++;
                typeStats[typeCode].deviceIds.add(device.deviceId);
            }
        });

        // 构建响应数据
        let result: any[] = [];

        if (deviceTypeFilter !== undefined) {
            // 如果指定了设备类型过滤，只返回该类型的统计信息
            if (typeStats[deviceTypeFilter]) {
                result = [{
                    deviceType: deviceTypeFilter,
                    count: typeStats[deviceTypeFilter].count,
                    deviceIds: Array.from(typeStats[deviceTypeFilter].deviceIds)
                }];
            }
        } else {
            // 返回所有设备类型的统计信息
            result = Object.entries(typeStats)
                .map(([typeCode, data]) => ({
                    deviceType: parseInt(typeCode),
                    count: data.count,
                    deviceIds: Array.from(data.deviceIds)
                }))
                .filter(item => item.count > 0); // 只返回有设备的类型
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('查询设备状态数据失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 查询通信数据
app.get('/api/telemetry', async (req, res) => {
    try {
        const params: QueryParams = {
            deviceId: req.query.deviceId as string,
            dataType: req.query.dataType as string,
            startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
            endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const rawData = await dataModel.queryTelemetryData(params);
        // 解析payload字段中的JSON数据
        const data = rawData.map(item => {
            if (typeof item.payload === 'string') {
                try {
                    return JSON.parse(item.payload);
                } catch (e) {
                    return item;
                }
            }
            return item;
        });
        res.json({
            success: true,
            data,
            total: data.length,
            params
        });
    } catch (error) {
        console.error('查询通信数据失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 获取数据统计信息
app.get('/api/statistics/:dataType', async (req, res) => {
    try {
        const { dataType } = req.params;
        const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

        const data = await dataModel.getDataStatistics(dataType, hours);
        res.json({
            success: true,
            data,
            dataType,
            hours
        });
    } catch (error) {
        console.error('查询统计数据失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 查询工厂设备数据
app.get('/api/factory-devices', async (req, res) => {
    try {
        const params: QueryParams = {
            deviceId: req.query.deviceId as string,
            status: req.query.status as string,
            startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
            endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const rawData = await dataModel.queryFactoryDevices(params);
        // 解析payload字段中的JSON数据
        const data = rawData.map(item => {
            if (typeof item.payload === 'string') {
                try {
                    return JSON.parse(item.payload);
                } catch (e) {
                    return item;
                }
            }
            return item;
        });
        res.json({
            success: true,
            data,
            total: data.length,
            params
        });
    } catch (error) {
        console.error('查询工厂设备数据失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 获取最近数据概览
app.get('/api/overview', async (req, res) => {
    try {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        // 并行查询各类数据的最新记录
        const [coreMetrics, environment, deviceStatus, telemetry, factoryDevices] = await Promise.all([
            dataModel.queryCoreMetrics({ startTime: oneHourAgo, limit: 10 }),
            dataModel.queryEnvironmentData({ startTime: oneHourAgo, limit: 10 }),
            dataModel.queryDeviceStatus({ startTime: oneHourAgo, limit: 10 }),
            dataModel.queryTelemetryData({ startTime: oneHourAgo, limit: 10 }),
            dataModel.queryFactoryDevices({ startTime: oneHourAgo, limit: 10 })
        ]);

        res.json({
            success: true,
            data: {
                coreMetrics,
                environment,
                deviceStatus,
                telemetry,
                factoryDevices
            },
            timestamp: now
        });
    } catch (error) {
        console.error('查询概览数据失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.originalUrl
    });
});

// 启动服务器
function startApiServer() {
    app.listen(PORT, () => {
        console.log(`API服务器运行在 http://localhost:${PORT}`);
        console.log('可用接口:');
        console.log('  GET /health - 健康检查');
        console.log('  GET /api/core-metrics - 核心指标数据');
        console.log('  GET /api/environment - 环境数据');
        console.log('  GET /api/device-status - 设备状态数据');
        console.log('  GET /api/telemetry - 通信数据');
        console.log('  GET /api/factory-devices - 工厂设备数据');
        console.log('  GET /api/statistics/:dataType - 统计数据');
        console.log('  GET /api/overview - 数据概览');
    });
}

export { startApiServer, app };
