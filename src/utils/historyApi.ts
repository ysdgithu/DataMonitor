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

    // 查询核心指标数据
    async getCoreMetrics(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        // request 拦截器已经返回了 response.data
        return await request.get('/core-metrics', { params }) as any;
    }

    // 查询环境数据
    async getEnvironmentData(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        // request 拦截器已经返回了 response.data
        return await request.get('/environment', { params }) as any;
    }

    // 查询设备类型数据
    async getDeviceStatus(params: QueryParams = {}): Promise<ApiResponse<DeviceTypeData[]>> {
        console.log('[getDeviceStatus] 请求参数:', params);
        // request 拦截器已经返回了 response.data，所以这里直接得到后端的响应体
        const response = await request.get('/device-status', { params }) as any;
        console.log('[getDeviceStatus] 响应:', response);
        return response;
    }

    // 查询通信数据
    async getTelemetryData(params: QueryParams = {}): Promise<ApiResponse<any[]>> {
        // request 拦截器已经返回了 response.data
        return await request.get('/telemetry', { params }) as any;
    }

    // 获取统计数据
    async getStatistics(dataType: string, hours: number = 24): Promise<ApiResponse<any[]>> {
        // request 拦截器已经返回了 response.data
        return await request.get(`/statistics/${dataType}`, {
            params: { hours }
        }) as any;
    }

    // 获取数据概览
    async getOverview(): Promise<ApiResponse<any>> {
        // request 拦截器已经返回了 response.data
        return await request.get('/overview') as any;
    }

    // 获取指定时间范围的核心指标趋势
    async getCoreMetricsTrend(category: string, hours: number = 24): Promise<any[]> {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);

        const response = await this.getCoreMetrics({
            category,
            startTime,
            endTime,
            limit: 100
        });

        if (response.success) {
            return response.data.map(item => ({
                timestamp: item.timestamp,
                value: item.value,
                status: item.data_status,
                time: new Date(item.timestamp).toLocaleTimeString()
            }));
        }
        return [];
    }

    // 获取环境数据趋势
    async getEnvironmentTrend(type: string = 'temperature', hours: number = 24): Promise<any[]> {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);

        const response = await this.getEnvironmentData({
            dataType: type,
            startTime,
            endTime,
            limit: 100
        });

        if (response.success) {
            return response.data.map(item => ({
                timestamp: item.timestamp,
                value: item.value,
                status: item.data_status,
                time: new Date(item.timestamp).toLocaleTimeString(),
                unit: item.unit
            }));
        }
        return [];
    }

    // 获取设备类型统计（设备类型分布）
    // 注意：getDeviceStatus 返回的是设备类型统计数据，不是设备状态数据
    // 如果需要获取设备状态统计，应该使用 getFactoryDevices 接口
    async getDeviceTypeStats(): Promise<DeviceTypeData[]> {
        const response = await this.getDeviceStatus();
        if (response.success) {
            return response.data;
        }
        return [];
    }

    // 获取通信数据趋势
    async getTelemetryTrend(dataType: string = 'upload_frequency', hours: number = 24): Promise<any[]> {
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);

        const response = await this.getTelemetryData({
            dataType,
            startTime,
            endTime,
            limit: 100
        });

        if (response.success) {
            return response.data.map(item => ({
                timestamp: item.timestamp,
                value: item.value,
                status: item.data_status,
                time: new Date(item.timestamp).toLocaleTimeString()
            }));
        }
        return [];
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

