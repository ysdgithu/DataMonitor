// 历史数据API接口
import request from './request'

const API_BASE_URL = import.meta.env.VITE_API_URL

// 查询参数接口
export interface QueryParams {
    deviceId?: string;
    category?: string;
    dataType?: string;
    status?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
}

// API响应接口
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    total?: number;
    params?: QueryParams;
    error?: string;
    message?: string;
}

// 历史数据API类
export class HistoryApi {
    private static instance: HistoryApi;

    private constructor() {}

    public static getInstance(): HistoryApi {
        if (!HistoryApi.instance) {
            HistoryApi.instance = new HistoryApi();
        }
        return HistoryApi.instance;
    }

    // 健康检查
    async healthCheck(): Promise<{ status: string; timestamp: number }> {
        // request 拦截器已经返回了 response.data
        return await request.get('/health') as any;
    }

    // 查询设备状态数据（含设备列表）
    async getDeviceStatus(params: QueryParams = {}): Promise<ApiResponse<any>> {
        console.log('[getDeviceStatus] 请求参数:', params);
        const response = await request.get('/device-status', { params }) as any;
        console.log('[getDeviceStatus] 响应:', response);
        return response;
    }

    // 获取设备列表
    async getDeviceList(): Promise<Array<{ deviceId: string; deviceType: string }>> {
        const response = await this.getDeviceStatus();
        if (response.success && response.devices) {
            return response.devices;
        }
        return [];
    }

    // 查询设备历史数据
    async getDeviceHistory(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        return await request.get('/device-history', { params }) as any;
    }

    // 获取统计数据
    async getStatistics(dataType: string, hours: number = 24): Promise<ApiResponse<any[]>> {
        return await request.get(`/statistics/${dataType}`, {
            params: { hours }
        }) as any;
    }

    // 获取数据概览
    async getOverview(): Promise<ApiResponse<any>> {
        return await request.get('/overview') as any;
    }

    // 查询诊断任务列表（告警记录）
    async getDiagnosisTasks(params: {
        page?: number;
        pageSize?: number;
        status?: number;
        deviceId?: string;
        startTime?: number;
        endTime?: number;
    } = {}): Promise<{ success: boolean; data: any[]; total?: number }> {
        const queryParams: any = {
            page: params.page || 1,
            pageSize: params.pageSize || 100
        };
        if (params.status !== undefined) queryParams.status = params.status;
        if (params.deviceId) queryParams.deviceId = params.deviceId;
        if (params.startTime) queryParams.startTime = params.startTime;
        if (params.endTime) queryParams.endTime = params.endTime;
        return await request.get('/diagnosis-tasks', { params: queryParams }) as any;
    }

    // 检查API连接状态
    async checkConnection(): Promise<boolean> {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            console.log('API连接检查失败:', error);
            return false;
        }
    }
}

// 导出单例实例
export const historyApi = HistoryApi.getInstance();


// 时间范围选项
export const TIME_RANGE_OPTIONS = [

    { label: '最近1小时', value: 1 },
    { label: '最近6小时', value: 6 },
    { label: '最近12小时', value: 12 },
    { label: '最近24小时', value: 24 },
    { label: '最近3天', value: 72 },
    { label: '最近7天', value: 168 }
];

// 数据类型选项
export const DATA_TYPE_OPTIONS = {
    coreMetrics: [
        { label: 'CPU使用率', value: 'cpu' },
        { label: '内存占用', value: 'memory' },
        { label: '网络延迟', value: 'network' },
        { label: '设备在线率', value: 'online' }
    ],
    environment: [
        { label: '温度', value: 'temperature' }
    ],
    telemetry: [
        { label: '上传频率', value: 'upload_frequency' }
    ],
    deviceType  : [
        { label: '数控机床', value: '0' },
        { label: '装配线', value: '1' },
        { label: '焊接机器人', value: '2' },
        { label: '质检设备', value: '3' },
        { label: '自动货架', value: '4' },
        { label: '输送带', value: '5' },
        { label: '环境监控', value: '6' },
        { label: '服务器', value: '7' },
        { label: '检测设备', value: '8' },
        { label: '空压机', value: '9' }
    ]
};

// 设备类型映射
export const DEVICE_TYPE_NAMES = {
  0: '数控机床',
  1: '装配线',
  2: '焊接机器人',
  3: '质检设备',
  4: '自动货架',
  5: '输送带',
  6: '环境监控',
  7: '服务器',
  8: '检测设备',
  9: '空压机'
} as const

// 设备类型接口
export interface DeviceTypeData {
  deviceType: keyof typeof DEVICE_TYPE_NAMES
  count: number
  deviceIds: string[]
}

