// API服务器 - 提供历史数据查询接口
import express from 'express';
import cors from 'cors';
import { DataModel, QueryParams } from '../database/models';
import UserModel from '../database/userModel';
import { authMiddleware, requestLogMiddleware, errorHandler } from './middleware';
import { generateToken, validateUsername, validatePasswordStrength } from '../utils/auth';
import { buildAIContext, BuildContextParams } from '../services/aiContextBuilder';

const app = express();
const PORT = process.env.API_PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(requestLogMiddleware);

// 数据模型实例
const dataModel = new DataModel();
const userModel = new UserModel();

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// 用户登录接口
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '用户名和密码不能为空'
            });
            return;
        }

        // 验证用户名格式
        if (!validateUsername(username)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '用户名格式不正确'
            });
            return;
        }

        // 验证用户
        const user = await userModel.login({ username, password });

        if (!user) {
            res.status(401).json({
                success: false,
                error: '认证失败',
                message: '用户名或密码错误'
            });
            return;
        }

        // 生成 JWT token
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role
        });

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            },
            message: '登录成功'
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 用户注册接口（可选）
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // 验证输入
        if (!username || !password) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '用户名和密码不能为空'
            });
            return;
        }

        // 验证用户名格式
        if (!validateUsername(username)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '用户名必须是 3-50 个字符，只包含字母、数字、下划线'
            });
            return;
        }

        // 验证密码强度
        if (!validatePasswordStrength(password)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '密码必须至少 8 个字符，包含大小写字母和数字'
            });
            return;
        }

        // 创建用户
        const user = await userModel.createUser({
            username,
            password,
            email,
            role: 'user'
        });

        // 生成 JWT token
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role
        });

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            },
            message: '注册成功'
        });
    } catch (error) {
        console.error('注册失败:', error);
        const errorMessage = error instanceof Error ? error.message : '未知错误';

        if (errorMessage.includes('已存在')) {
            res.status(409).json({
                success: false,
                error: '冲突',
                message: errorMessage
            });
        } else {
            res.status(500).json({
                success: false,
                error: '服务器内部错误',
                message: errorMessage
            });
        }
    }
});

// 查询核心指标数据 - 需要认证
app.get('/api/core-metrics', authMiddleware, async (req, res) => {
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

// 查询环境数据 - 需要认证
app.get('/api/environment', authMiddleware, async (req, res) => {
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

// 查询设备状态数据 - 按设备类型统计 - 需要认证
app.get('/api/device-status', authMiddleware, async (req, res) => {
    try {
        const deviceTypeFilter = req.query.deviceType ? parseInt(req.query.deviceType as string) : undefined;

        // 查询工厂设备数据 - 获取每个设备的最新记录
        const params: QueryParams = {
            limit: 10000  // 获取足够多的记录以覆盖所有设备
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

// 查询通信数据 - 需要认证
app.get('/api/telemetry', authMiddleware, async (req, res) => {
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

// 获取数据统计信息 - 需要认证
app.get('/api/statistics/:dataType', authMiddleware, async (req, res) => {
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

// 查询工厂设备数据 - 需要认证
app.get('/api/factory-devices', authMiddleware, async (req, res) => {
    try {
        const params: QueryParams = {
            deviceId: req.query.deviceId as string,
            status: req.query.status as string,
            startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
            endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
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

// 获取最近数据概览 - 需要认证
app.get('/api/overview', authMiddleware, async (req, res) => {
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

// ==================== 诊断任务管理接口 ====================

// 获取诊断任务列表（分页）
app.get('/api/diagnosis-tasks', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 5;
        const status = req.query.status ? parseInt(req.query.status as string) : undefined;
        const deviceId = req.query.deviceId as string;
        const assignee = req.query.assignee as string;
        const priority = req.query.priority ? parseInt(req.query.priority as string) : undefined;

        const result = await dataModel.queryDiagnosisTasks({
            page,
            pageSize,
            status,
            deviceId,
            assignee,
            priority
        });

        res.json({
            success: true,
            data: result.tasks,
            total: result.total,
            page,
            pageSize
        });
    } catch (error) {
        console.error('查询诊断任务列表失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 获取诊断任务详情
app.get('/api/diagnosis-tasks/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '任务ID必须是数字'
            });
            return;
        }

        const task = await dataModel.getDiagnosisTaskById(id);
        if (!task) {
            res.status(404).json({
                success: false,
                error: '任务不存在',
                message: `未找到ID为 ${id} 的任务`
            });
            return;
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('查询诊断任务详情失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 创建诊断任务
app.post('/api/diagnosis-tasks', authMiddleware, async (req, res) => {
    try {
        const { name, deviceId, priority, assignee, detail, status } = req.body;

        // 验证必填字段
        if (!name || !deviceId || priority === undefined || !assignee) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '缺少必填字段: name, deviceId, priority, assignee'
            });
            return;
        }

        // 验证优先级范围
        if (priority < 0 || priority > 2) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '优先级必须是 0(低), 1(中), 2(高)'
            });
            return;
        }

        // 验证状态范围（如果提供）
        if (status !== undefined && (status < 0 || status > 4)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '状态必须是 0-4 之间的数字'
            });
            return;
        }

        const taskId = await dataModel.createDiagnosisTask({
            name,
            deviceId,
            priority,
            assignee,
            detail,
            status
        });

        res.json({
            success: true,
            data: { id: taskId },
            message: '任务创建成功'
        });
    } catch (error) {
        console.error('创建诊断任务失败:', error);
        res.status(500).json({
            success: false,
            error: '创建失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 更新诊断任务
app.put('/api/diagnosis-tasks/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '任务ID必须是数字'
            });
            return;
        }

        // 检查任务是否存在
        const existingTask = await dataModel.getDiagnosisTaskById(id);
        if (!existingTask) {
            res.status(404).json({
                success: false,
                error: '任务不存在',
                message: `未找到ID为 ${id} 的任务`
            });
            return;
        }

        const { name, deviceId, status, priority, detail, assignee } = req.body;

        // 验证优先级范围（如果提供）
        if (priority !== undefined && (priority < 0 || priority > 2)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '优先级必须是 0(低), 1(中), 2(高)'
            });
            return;
        }

        // 验证状态范围（如果提供）
        if (status !== undefined && (status < 0 || status > 4)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '状态必须是 0-4 之间的数字'
            });
            return;
        }

        await dataModel.updateDiagnosisTask(id, {
            name,
            deviceId,
            status,
            priority,
            detail,
            assignee
        });

        res.json({
            success: true,
            message: '任务更新成功'
        });
    } catch (error) {
        console.error('更新诊断任务失败:', error);
        res.status(500).json({
            success: false,
            error: '更新失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 删除诊断任务
app.delete('/api/diagnosis-tasks/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '任务ID必须是数字'
            });
            return;
        }

        // 检查任务是否存在
        const existingTask = await dataModel.getDiagnosisTaskById(id);
        if (!existingTask) {
            res.status(404).json({
                success: false,
                error: '任务不存在',
                message: `未找到ID为 ${id} 的任务`
            });
            return;
        }

        await dataModel.deleteDiagnosisTask(id);

        res.json({
            success: true,
            message: '任务删除成功'
        });
    } catch (error) {
        console.error('删除诊断任务失败:', error);
        res.status(500).json({
            success: false,
            error: '删除失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 获取诊断任务统计信息
app.get('/api/diagnosis-tasks-stats', authMiddleware, async (req, res) => {
    try {
        const stats = await dataModel.getDiagnosisTaskStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('查询诊断任务统计失败:', error);
        res.status(500).json({
            success: false,
            error: '查询失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// ==================== AI 相关接口 ====================

// 触发 AI 诊断接口
app.post('/api/trigger-diagnosis', authMiddleware, async (req, res) => {
    try {
        const { timestamp, deviceId, diagnosisTaskId, anomalyInfo } = req.body;

        // 基本校验
        if (!timestamp || !deviceId) {
            res.status(400).json({
                success: false,
                error: '参数错误',
                message: '缺少必填字段：timestamp, deviceId'
            });
            return;
        }

        console.log('[AI 诊断] 收到请求:', { timestamp, deviceId, diagnosisTaskId, anomalyInfo });

        // 1. 构建 AI 上下文（收集异常前后5分钟的所有数据）
        const buildParams: BuildContextParams = {
            timestamp: Number(timestamp),
            deviceId: String(deviceId)
        };

        // 如果提供了诊断任务ID，添加到参数中
        if (diagnosisTaskId) {
            buildParams.diagnosisTaskId = Number(diagnosisTaskId);
        }

        // 如果提供了异常信息，添加到参数中
        if (anomalyInfo) {
            buildParams.anomalyInfo = anomalyInfo;
        }

        console.log('[AI 诊断] 开始构建上下文...');
        const context = await buildAIContext(buildParams);
        console.log('[AI 诊断] 上下文构建完成，数据统计:', context.statistics);

        // 2. 准备传给 AI 服务的数据结构
        // ai-client.js 期望的格式：{ metrics, device, context }
        const anomalyEvent = {
            metrics: {
                coreMetrics: context.coreMetrics,
                environment: context.environmentData,
                telemetry: context.telemetryData,
                factory: context.factoryDeviceData,
                statistics: context.statistics,
                anomaly: context.anomaly
            },
            device: context.deviceInfo,
            context: context  // 完整上下文
        };

        // 3. 调用 AI 客户端生成诊断
        // ai-client.js 导出的是单例实例，直接使用
        const aiClient = require('../services/ai-client');

        console.log('[AI 诊断] 调用 AI 服务...');
        const diagnosis = await aiClient.generateDiagnosis(anomalyEvent);

        if (!diagnosis) {
            throw new Error('AI 服务未返回诊断结果');
        }

        console.log('[AI 诊断] AI 服务返回成功');

        // 4. 返回上下文与诊断结果给前端
        res.json({
            success: true,
            data: {
                context,
                diagnosis
            }
        });
    } catch (error) {
        console.error('[AI 诊断] 失败:', error);
        res.status(500).json({
            success: false,
            error: 'AI 诊断失败',
            message: error instanceof Error ? error.message : '未知错误'
        });
    }
});

// 错误处理中间件
app.use(errorHandler);

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
        console.log('  POST /api/login - 用户登录 (获取 JWT token)');
        console.log('  POST /api/register - 用户注册');
        console.log('  GET /api/core-metrics - 核心指标数据 (需要认证)');
        console.log('  GET /api/environment - 环境数据 (需要认证)');
        console.log('  GET /api/device-status - 设备状态数据 (需要认证)');
        console.log('  GET /api/telemetry - 通信数据 (需要认证)');
        console.log('  GET /api/factory-devices - 工厂设备数据 (需要认证)');
        console.log('  GET /api/statistics/:dataType - 统计数据 (需要认证)');
        console.log('  GET /api/overview - 数据概览 (需要认证)');
        console.log('  GET /api/diagnosis-tasks - 诊断任务列表 (需要认证)');
        console.log('  GET /api/diagnosis-tasks/:id - 诊断任务详情 (需要认证)');
        console.log('  POST /api/diagnosis-tasks - 创建诊断任务 (需要认证)');
        console.log('  PUT /api/diagnosis-tasks/:id - 更新诊断任务 (需要认证)');
        console.log('  DELETE /api/diagnosis-tasks/:id - 删除诊断任务 (需要认证)');
        console.log('  GET /api/diagnosis-tasks-stats - 诊断任务统计 (需要认证)');
    });
}

export { startApiServer, app };
